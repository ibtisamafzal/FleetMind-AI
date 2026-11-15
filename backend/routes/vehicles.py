from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Vehicle, Trip, FuelRecord, Maintenance
from backend.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleDetailResponse
from backend.services.ml_service import ml_service
from backend.services.recommendation_service import recommendation_engine

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleResponse])
def get_vehicles(
    search: Optional[str] = Query(None, description="Search by ID, plate, make, model"),
    status: Optional[str] = Query(None, description="Filter by status (Active, In Maintenance, Idle)"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    risk_level: Optional[str] = Query(None, description="Filter by risk (HIGH, MEDIUM, LOW)"),
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Vehicle.vehicle_id.ilike(s)) |
            (Vehicle.registration_number.ilike(s)) |
            (Vehicle.make.ilike(s)) |
            (Vehicle.model.ilike(s))
        )
    
    if status and status != "All":
        query = query.filter(Vehicle.current_status == status)

    if fuel_type and fuel_type != "All":
        query = query.filter(Vehicle.fuel_type == fuel_type)

    vehicles = query.all()

    # Enrich with ML risk scores
    results = []
    for v in vehicles:
        risk = ml_service.predict_vehicle_risk(v.vehicle_id)
        if risk_level and risk_level != "All" and risk["risk_level"] != risk_level:
            continue

        resp = VehicleResponse(
            vehicle_id=v.vehicle_id,
            registration_number=v.registration_number,
            vehicle_type=v.vehicle_type,
            make=v.make,
            model=v.model,
            manufacturing_year=v.manufacturing_year,
            fuel_type=v.fuel_type,
            mileage=v.mileage,
            last_service_date=v.last_service_date,
            service_mileage=v.service_mileage,
            current_status=v.current_status,
            risk_score=risk["risk_score"],
            risk_level=risk["risk_level"],
            maintenance_risk=risk["maintenance_risk"],
            fuel_risk=risk["fuel_risk"],
            delay_risk=risk["delay_risk"]
        )
        results.append(resp)

    # Sort high-risk vehicles first
    results.sort(key=lambda x: x.risk_score or 0, reverse=True)
    return results

@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    v_id = payload.vehicle_id
    if not v_id or not v_id.strip():
        # Auto-generate next sequential vehicle ID
        count = db.query(Vehicle).count() + 1
        v_id = f"VH-{count:03d}"
        while db.query(Vehicle).filter(Vehicle.vehicle_id == v_id).first():
            count += 1
            v_id = f"VH-{count:03d}"
    else:
        existing = db.query(Vehicle).filter(Vehicle.vehicle_id == v_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Vehicle ID already exists")

    vehicle_data = payload.dict()
    vehicle_data["vehicle_id"] = v_id
    new_v = Vehicle(**vehicle_data)
    db.add(new_v)
    db.commit()
    db.refresh(new_v)

    risk = ml_service.predict_vehicle_risk(new_v.vehicle_id)
    return VehicleResponse(
        vehicle_id=new_v.vehicle_id,
        registration_number=new_v.registration_number,
        vehicle_type=new_v.vehicle_type,
        make=new_v.make,
        model=new_v.model,
        manufacturing_year=new_v.manufacturing_year,
        fuel_type=new_v.fuel_type,
        mileage=new_v.mileage,
        last_service_date=new_v.last_service_date,
        service_mileage=new_v.service_mileage,
        current_status=new_v.current_status,
        risk_score=risk["risk_score"],
        risk_level=risk["risk_level"],
        maintenance_risk=risk["maintenance_risk"],
        fuel_risk=risk["fuel_risk"],
        delay_risk=risk["delay_risk"]
    )

@router.get("/{vehicle_id}", response_model=VehicleDetailResponse)
def get_vehicle_detail(vehicle_id: str, db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found")

    risk = ml_service.predict_vehicle_risk(v.vehicle_id)
    recs = recommendation_engine.generate_vehicle_recommendations(risk)

    trips = db.query(Trip).filter(Trip.vehicle_id == vehicle_id).all()
    fuels = db.query(FuelRecord).filter(FuelRecord.vehicle_id == vehicle_id).all()
    
    avg_eff = round(sum(f.efficiency_kml for f in fuels) / max(1, len(fuels)), 1) if fuels else 8.5
    kms_since_service = max(0.0, v.mileage - v.service_mileage)

    # Specific explanation text for high-risk / VH-027
    if risk["risk_level"] == "HIGH":
        explanation = (
            f"The major contributing factors are high mileage since the last service ({kms_since_service:,.0f} km) "
            f"and declining fuel efficiency ({avg_eff} km/L)."
        )
    else:
        explanation = "Operational telemetry shows normal sensor ranges with steady fuel consumption and timely service compliance."

    return VehicleDetailResponse(
        vehicle_id=v.vehicle_id,
        registration_number=v.registration_number,
        vehicle_type=v.vehicle_type,
        make=v.make,
        model=v.model,
        manufacturing_year=v.manufacturing_year,
        fuel_type=v.fuel_type,
        mileage=v.mileage,
        last_service_date=v.last_service_date,
        service_mileage=v.service_mileage,
        current_status=v.current_status,
        risk_score=risk["risk_score"],
        risk_level=risk["risk_level"],
        maintenance_risk=risk["maintenance_risk"],
        fuel_risk=risk["fuel_risk"],
        delay_risk=risk["delay_risk"],
        ai_explanation=explanation,
        recommended_actions=recs,
        trip_count=len(trips),
        avg_efficiency=avg_eff,
        kms_since_service=kms_since_service
    )

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: str, payload: VehicleUpdate, db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(v, field, val)

    db.commit()
    db.refresh(v)
    risk = ml_service.predict_vehicle_risk(v.vehicle_id)

    return VehicleResponse(
        vehicle_id=v.vehicle_id,
        registration_number=v.registration_number,
        vehicle_type=v.vehicle_type,
        make=v.make,
        model=v.model,
        manufacturing_year=v.manufacturing_year,
        fuel_type=v.fuel_type,
        mileage=v.mileage,
        last_service_date=v.last_service_date,
        service_mileage=v.service_mileage,
        current_status=v.current_status,
        risk_score=risk["risk_score"],
        risk_level=risk["risk_level"],
        maintenance_risk=risk["maintenance_risk"],
        fuel_risk=risk["fuel_risk"],
        delay_risk=risk["delay_risk"]
    )

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    v = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(v)
    db.commit()
    return None

@router.get("/{vehicle_id}/history")
def get_vehicle_history(vehicle_id: str, db: Session = Depends(get_db)):
    """Returns trip, fuel, and maintenance history records for vehicle details page."""
    trips = db.query(Trip).filter(Trip.vehicle_id == vehicle_id).order_by(Trip.departure_time.desc()).limit(15).all()
    fuels = db.query(FuelRecord).filter(FuelRecord.vehicle_id == vehicle_id).order_by(FuelRecord.date.desc()).limit(15).all()
    maints = db.query(Maintenance).filter(Maintenance.vehicle_id == vehicle_id).order_by(Maintenance.service_date.desc()).limit(10).all()

    return {
        "trips": [
            {
                "trip_id": t.trip_id,
                "origin": t.origin,
                "destination": t.destination,
                "distance_km": t.distance_km,
                "departure_time": t.departure_time,
                "delivery_status": t.delivery_status
            }
            for t in trips
        ],
        "fuel_records": [
            {
                "record_id": f.record_id,
                "date": f.date,
                "fuel_amount_liters": f.fuel_amount_liters,
                "cost_usd": f.cost_usd,
                "efficiency_kml": f.efficiency_kml
            }
            for f in fuels
        ],
        "maintenance_records": [
            {
                "maintenance_id": m.maintenance_id,
                "service_date": m.service_date,
                "service_type": m.service_type,
                "cost_usd": m.cost_usd,
                "mileage_at_service": m.mileage_at_service,
                "notes": m.notes
            }
            for m in maints
        ]
    }
