from sqlalchemy import Column, String, Integer, Float
from backend.database import Base

class Driver(Base):
    __tablename__ = "drivers"

    driver_id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    experience_years = Column(Integer, default=1)
    total_trips = Column(Integer, default=0)
    late_deliveries = Column(Integer, default=0)
    accidents = Column(Integer, default=0)
    average_speed = Column(Float, default=50.0)
    rating = Column(Float, default=4.8)
    status = Column(String, default="Active")  # Active, On Leave, Suspended
