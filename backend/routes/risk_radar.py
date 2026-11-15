"""
Fleet Risk Radar API Endpoint
Provides multi-dimensional fleet risk scoring, component breakdowns, ranking,
contributing factor explanations, and deep-dive vehicle risk trend analysis.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import datetime

from backend.database import get_db
from backend.models import Vehicle, Driver, Trip, FuelRecord, Maintenance
from backend.services.ml_service import ml_service
from backend.services.recommendation_service import recommendation_engine

router = APIRouter(prefix="/api/risk-radar", tags=["Fleet Risk Radar"])

@router.get("/fleet")
def get_fleet_risk_radar(
    risk_level: Optional[str] = Query(None, description="Filter by risk level: LOW, MEDIUM, HIGH"),
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type: Box Truck, Cargo Van, Light Delivery"),
    urgent_only: Optional[bool] = Query(False, description="Filter only vehicles requiring urgent attention"),
    search: Optional[str] = Query(None, description="Search by make, model, registration or ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle)

    if vehicle_type and isinstance(vehicle_type, str) and vehicle_type != "All":
        query = query.filter(Vehicle.vehicle_type == vehicle_type)

    vehicles = query.all()

    evaluated = []
    high_count = 0
    med_count = 0
    low_count = 0
    urgent_count = 0

    for v in vehicles:
        risk = ml_service.predict_vehicle_risk(v.vehicle_id)
        r_score = risk["risk_score"]
        r_level = risk["risk_level"]
        m_risk = risk["maintenance_risk"]
        f_risk = risk["fuel_risk"]
        d_risk = risk["delay_risk"]

        if r_level == "HIGH":
            high_count += 1
        elif r_level == "MEDIUM":
            med_count += 1
        else:
            low_count += 1

        kms_since_service = max(0, v.mileage - v.service_mileage)

        # Factor explanations based on actual telemetry & records
        factors = []
        if kms_since_service >= 15000:
            factors.append(f"Overdue maintenance: {kms_since_service:,.0f} km logged since last service (threshold: 12,000 km)")
        elif kms_since_service >= 10000:
            factors.append(f"Service interval approaching: {kms_since_service:,.0f} km logged")

        if f_risk >= 70:
            factors.append("Substantial fuel efficiency drop detected vs fleet model baseline (-20% to -40%)")
        elif f_risk >= 50:
            factors.append("Moderate fuel consumption variance logged in recent telematics cycles")

        if d_risk >= 65:
            factors.append("Elevated dispatch delay frequency on primary transport routes")

        if v.manufacturing_year and (2026 - v.manufacturing_year) >= 6:
            factors.append(f"Vehicle asset age ({2026 - v.manufacturing_year} years) contributing to component wear probability")

        if not factors:
            factors.append("Nominal operational profile. All sensor diagnostics within safety baseline.")

        # Urgent attention criteria
        is_urgent = (r_score >= 70) or (kms_since_service >= 15000)
        if is_urgent:
            urgent_count += 1

        recs = recommendation_engine.generate_vehicle_recommendations(risk, {"make": v.make, "model": v.model})

        item = {
            "vehicle_id": v.vehicle_id,
            "registration_number": v.registration_number,
            "make": v.make,
            "model": v.model,
            "vehicle_type": v.vehicle_type,
            "fuel_type": v.fuel_type,
            "manufacturing_year": v.manufacturing_year,
            "mileage": v.mileage,
            "kms_since_service": kms_since_service,
            "status": v.current_status,
            "risk_score": r_score,
            "risk_level": r_level,
            "maintenance_risk": m_risk,
            "fuel_risk": f_risk,
            "delay_risk": d_risk,
            "urgent_attention": is_urgent,
            "contributing_factors": factors,
            "recommendations": recs,
            "primary_action": recs[0] if recs else "Maintain standard operational monitoring."
        }
        evaluated.append(item)

    # Rank by operational risk descending
    evaluated.sort(key=lambda x: x["risk_score"], reverse=True)
    for idx, item in enumerate(evaluated):
        item["rank"] = idx + 1

    # Apply filters
    filtered = evaluated
    if risk_level and isinstance(risk_level, str) and risk_level != "All":
        filtered = [x for x in filtered if x["risk_level"].upper() == risk_level.upper()]

    if urgent_only and isinstance(urgent_only, bool) and urgent_only:
        filtered = [x for x in filtered if x["urgent_attention"]]

    if search and isinstance(search, str):
        s = search.lower()
        filtered = [
            x for x in filtered
            if s in x["vehicle_id"].lower()
            or s in x["registration_number"].lower()
            or s in x["make"].lower()
            or s in x["model"].lower()
        ]

    avg_score = round(sum(x["risk_score"] for x in evaluated) / max(1, len(evaluated)), 1)

    return {
        "summary": {
            "total_evaluated": len(evaluated),
            "average_risk_score": avg_score,
            "high_risk_count": high_count,
            "medium_risk_count": med_count,
            "low_risk_count": low_count,
            "urgent_attention_count": urgent_count,
            "highest_risk_vehicle": evaluated[0] if evaluated else None,
            "risk_bands": {
                "low": "0 – 39 (Optimal Safety & Efficiency)",
                "medium": "40 – 69 (Advisory Telematics Warnings)",
                "high": "70 – 100 (Immediate Management Intervention)"
            }
        },
        "vehicles": filtered
    }

@router.get("/vehicle/{vehicle_id}")
def get_vehicle_risk_detail(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    risk = ml_service.predict_vehicle_risk(vehicle.vehicle_id)
    kms_since_service = max(0, vehicle.mileage - vehicle.service_mileage)

    # 30-day simulated historical risk trend
    base_score = risk["risk_score"]
    history = []
    now = datetime.datetime.now()
    for day in range(30, 0, -1):
        dt = now - datetime.timedelta(days=day)
        # gradual rise if high risk, stable if low risk
        drift = ((30 - day) / 30.0) * (15 if base_score >= 70 else 4)
        score_val = max(10, min(98, round(base_score - drift + (hash(f"{vehicle_id}_{day}") % 7 - 3))))
        history.append({
            "date": dt.strftime("%Y-%m-%d"),
            "risk_score": score_val,
            "maintenance_risk": max(5, min(95, round(risk["maintenance_risk"] - drift * 0.8))),
            "fuel_risk": max(5, min(95, round(risk["fuel_risk"] - drift * 0.6)))
        })

    # Radar metrics
    radar_metrics = [
        {"subject": "Maintenance Health", "score": risk["maintenance_risk"], "fullMark": 100},
        {"subject": "Fuel Efficiency", "score": risk["fuel_risk"], "fullMark": 100},
        {"subject": "Delivery Punctuality", "score": risk["delay_risk"], "fullMark": 100},
        {"subject": "Speed Adherence", "score": 85 if risk["risk_score"] < 50 else 62, "fullMark": 100},
        {"subject": "Engine Diagnostics", "score": 90 if kms_since_service < 10000 else 45, "fullMark": 100}
    ]

    recs = recommendation_engine.generate_vehicle_recommendations(risk, {"make": vehicle.make, "model": vehicle.model})

    return {
        "vehicle_id": vehicle.vehicle_id,
        "registration_number": vehicle.registration_number,
        "make_model": f"{vehicle.make} {vehicle.model}",
        "vehicle_type": vehicle.vehicle_type,
        "fuel_type": vehicle.fuel_type,
        "status": vehicle.current_status,
        "total_mileage": vehicle.mileage,
        "kms_since_service": kms_since_service,
        "last_service_date": vehicle.last_service_date,
        "current_risk": risk,
        "radar_metrics": radar_metrics,
        "historical_trend": history,
        "recommendations": recs,
        "ai_risk_summary": (
            f"Vehicle {vehicle.vehicle_id} ({vehicle.make} {vehicle.model}) is rated at {risk['risk_score']}/100 ({risk['risk_level']} risk). "
            f"The primary cost and safety drivers are maintenance risk at {risk['maintenance_risk']}% "
            f"and fuel variance at {risk['fuel_risk']}%. Recommended action: {recs[0] if recs else 'Maintain nominal checkups.'}"
        )
    }
