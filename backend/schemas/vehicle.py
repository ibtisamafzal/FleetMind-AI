from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class VehicleBase(BaseModel):
    vehicle_id: Optional[str] = None
    registration_number: str
    vehicle_type: str = "Box Truck"
    make: str = "Hino"
    model: str = "300 Series Euro-IV"
    manufacturing_year: int = Field(default_factory=lambda: datetime.date.today().year)
    fuel_type: str = "Diesel"
    mileage: float = 0.0
    last_service_date: str = Field(default_factory=lambda: datetime.date.today().isoformat())
    service_mileage: float = 0.0
    current_status: str = "Active"

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    manufacturing_year: Optional[int] = None
    fuel_type: Optional[str] = None
    mileage: Optional[float] = None
    last_service_date: Optional[str] = None
    service_mileage: Optional[float] = None
    current_status: Optional[str] = None

class VehicleResponse(VehicleBase):
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    maintenance_risk: Optional[int] = None
    fuel_risk: Optional[int] = None
    delay_risk: Optional[int] = None

    class Config:
        from_attributes = True

class VehicleDetailResponse(VehicleResponse):
    ai_explanation: Optional[str] = None
    recommended_actions: Optional[List[str]] = None
    trip_count: Optional[int] = None
    avg_efficiency: Optional[float] = None
    kms_since_service: Optional[float] = None
