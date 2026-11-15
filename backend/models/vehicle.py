from sqlalchemy import Column, String, Integer, Float, DateTime
from backend.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    vehicle_id = Column(String, primary_key=True, index=True)
    registration_number = Column(String, index=True)
    vehicle_type = Column(String)  # Box Truck, Cargo Van, Light Delivery, etc.
    make = Column(String)
    model = Column(String)
    manufacturing_year = Column(Integer)
    fuel_type = Column(String)  # Electric, Diesel, Hybrid
    mileage = Column(Float, default=0.0)
    last_service_date = Column(String)
    service_mileage = Column(Float, default=0.0)
    current_status = Column(String, default="Active")  # Active, In Maintenance, Idle, Out of Service
