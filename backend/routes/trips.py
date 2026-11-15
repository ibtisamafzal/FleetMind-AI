import io
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Trip
from backend.schemas.trip import TripCreate, TripResponse

router = APIRouter(prefix="/api/trips", tags=["Trips"])

@router.get("", response_model=List[TripResponse])
def get_trips(
    status: Optional[str] = Query(None, description="Filter by status (On Time, Delayed, Cancelled)"),
    vehicle_id: Optional[str] = Query(None, description="Filter by vehicle"),
    driver_id: Optional[str] = Query(None, description="Filter by driver"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Trip)

    if status and status != "All":
        query = query.filter(Trip.delivery_status == status)

    if vehicle_id:
        query = query.filter(Trip.vehicle_id == vehicle_id)

    if driver_id:
        query = query.filter(Trip.driver_id == driver_id)

    trips = query.order_by(Trip.departure_time.desc()).limit(limit).all()
    return trips

@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, db: Session = Depends(get_db)):
    existing = db.query(Trip).filter(Trip.trip_id == payload.trip_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Trip ID already exists")

    new_t = Trip(**payload.dict())
    db.add(new_t)
    db.commit()
    db.refresh(new_t)
    return new_t

@router.post("/upload-csv")
async def upload_trips_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Allows CSV upload for bulk historical data."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        required_cols = ["trip_id", "vehicle_id", "driver_id", "origin", "destination", "distance_km", "estimated_duration"]
        for col in required_cols:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Missing required column '{col}' in CSV")

        # Clean NaNs
        df["actual_duration"] = df.get("actual_duration", pd.Series([0]*len(df))).fillna(0)
        df["delivery_status"] = df.get("delivery_status", pd.Series(["On Time"]*len(df))).fillna("On Time")
        df["is_delayed"] = (df["delivery_status"] == "Delayed").astype(int)

        count = 0
        for _, row in df.iterrows():
            t_id = str(row["trip_id"])
            if not db.query(Trip).filter(Trip.trip_id == t_id).first():
                new_trip = Trip(
                    trip_id=t_id,
                    vehicle_id=str(row["vehicle_id"]),
                    driver_id=str(row["driver_id"]),
                    origin=str(row["origin"]),
                    destination=str(row["destination"]),
                    distance_km=float(row["distance_km"]),
                    estimated_duration=float(row["estimated_duration"]),
                    actual_duration=float(row.get("actual_duration", 0)),
                    number_of_stops=int(row.get("number_of_stops", 1)),
                    departure_time=str(row.get("departure_time", "2026-01-01T08:00:00")),
                    arrival_time=str(row.get("arrival_time", "")),
                    weather_condition=str(row.get("weather_condition", "Clear")),
                    traffic_level=str(row.get("traffic_level", "Medium")),
                    delivery_status=str(row.get("delivery_status", "On Time")),
                    is_delayed=int(row.get("is_delayed", 0))
                )
                db.add(new_trip)
                count += 1

        db.commit()
        return {"message": f"Successfully imported {count} trips from CSV", "imported_count": count}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")
