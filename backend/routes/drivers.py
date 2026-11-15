from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Driver
from backend.schemas.driver import DriverCreate, DriverUpdate, DriverResponse

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

@router.get("", response_model=List[DriverResponse])
def get_drivers(
    search: Optional[str] = Query(None, description="Search by name or driver ID"),
    status: Optional[str] = Query(None, description="Filter by status (Active, On Leave, Suspended)"),
    db: Session = Depends(get_db)
):
    query = db.query(Driver)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Driver.name.ilike(s)) | (Driver.driver_id.ilike(s)))

    if status and status != "All":
        query = query.filter(Driver.status == status)

    drivers = query.all()

    results = []
    for d in drivers:
        rate = round((d.late_deliveries / max(1, d.total_trips)) * 100, 1)
        resp = DriverResponse(
            driver_id=d.driver_id,
            name=d.name,
            experience_years=d.experience_years,
            total_trips=d.total_trips,
            late_deliveries=d.late_deliveries,
            accidents=d.accidents,
            average_speed=d.average_speed,
            rating=d.rating,
            status=d.status,
            delay_rate=rate
        )
        results.append(resp)

    return results

@router.post("", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(payload: DriverCreate, db: Session = Depends(get_db)):
    d_id = payload.driver_id
    if not d_id or not d_id.strip():
        # Auto-generate next sequential driver ID
        count = db.query(Driver).count() + 1
        d_id = f"DRV-{count:03d}"
        while db.query(Driver).filter(Driver.driver_id == d_id).first():
            count += 1
            d_id = f"DRV-{count:03d}"
    else:
        existing = db.query(Driver).filter(Driver.driver_id == d_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Driver ID already exists")

    driver_data = payload.dict()
    driver_data["driver_id"] = d_id
    new_d = Driver(**driver_data)
    db.add(new_d)
    db.commit()
    db.refresh(new_d)

    rate = round((new_d.late_deliveries / max(1, new_d.total_trips)) * 100, 1)
    return DriverResponse(
        driver_id=new_d.driver_id,
        name=new_d.name,
        experience_years=new_d.experience_years,
        total_trips=new_d.total_trips,
        late_deliveries=new_d.late_deliveries,
        accidents=new_d.accidents,
        average_speed=new_d.average_speed,
        rating=new_d.rating,
        status=new_d.status,
        delay_rate=rate
    )

@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: str, db: Session = Depends(get_db)):
    d = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    rate = round((d.late_deliveries / max(1, d.total_trips)) * 100, 1)
    return DriverResponse(
        driver_id=d.driver_id,
        name=d.name,
        experience_years=d.experience_years,
        total_trips=d.total_trips,
        late_deliveries=d.late_deliveries,
        accidents=d.accidents,
        average_speed=d.average_speed,
        rating=d.rating,
        status=d.status,
        delay_rate=rate
    )

@router.put("/{driver_id}", response_model=DriverResponse)
def update_driver(driver_id: str, payload: DriverUpdate, db: Session = Depends(get_db)):
    d = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(d, field, val)

    db.commit()
    db.refresh(d)
    rate = round((d.late_deliveries / max(1, d.total_trips)) * 100, 1)
    return DriverResponse(
        driver_id=d.driver_id,
        name=d.name,
        experience_years=d.experience_years,
        total_trips=d.total_trips,
        late_deliveries=d.late_deliveries,
        accidents=d.accidents,
        average_speed=d.average_speed,
        rating=d.rating,
        status=d.status,
        delay_rate=rate
    )

@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(driver_id: str, db: Session = Depends(get_db)):
    d = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(d)
    db.commit()
    return None
