from pydantic import BaseModel
from typing import Optional

class TripBase(BaseModel):
    trip_id: str
    vehicle_id: str
    driver_id: str
    origin: str
    destination: str
    distance_km: float
    estimated_duration: float
    actual_duration: Optional[float] = None
    number_of_stops: int = 1
    departure_time: str
    arrival_time: Optional[str] = None
    weather_condition: str = "Clear"
    traffic_level: str = "Medium"
    delivery_status: str = "On Time"
    is_delayed: int = 0

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    class Config:
        from_attributes = True
