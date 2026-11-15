from pydantic import BaseModel
from typing import Optional

class DriverBase(BaseModel):
    driver_id: Optional[str] = None
    name: str
    experience_years: int = 3
    total_trips: int = 0
    late_deliveries: int = 0
    accidents: int = 0
    average_speed: float = 52.0
    rating: float = 4.8
    status: str = "Active"

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    experience_years: Optional[int] = None
    total_trips: Optional[int] = None
    late_deliveries: Optional[int] = None
    accidents: Optional[int] = None
    average_speed: Optional[float] = None
    rating: Optional[float] = None
    status: Optional[str] = None

class DriverResponse(DriverBase):
    delay_rate: Optional[float] = None

    class Config:
        from_attributes = True
