from sqlalchemy import Column, String, Integer, Float
from backend.database import Base

class Trip(Base):
    __tablename__ = "trips"

    trip_id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, index=True)
    driver_id = Column(String, index=True)
    origin = Column(String)
    destination = Column(String)
    distance_km = Column(Float)
    estimated_duration = Column(Float)  # in minutes
    actual_duration = Column(Float, nullable=True)  # in minutes
    number_of_stops = Column(Integer, default=1)
    departure_time = Column(String)
    arrival_time = Column(String, nullable=True)
    weather_condition = Column(String, default="Clear")  # Clear, Rain, Snow, Fog, Storm
    traffic_level = Column(String, default="Medium")  # Low, Medium, High, Severe
    delivery_status = Column(String, default="On Time")  # On Time, Delayed, Cancelled
    is_delayed = Column(Integer, default=0)
