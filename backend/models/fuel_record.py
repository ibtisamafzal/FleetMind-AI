from sqlalchemy import Column, String, Integer, Float
from backend.database import Base

class FuelRecord(Base):
    __tablename__ = "fuel_records"

    record_id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, index=True)
    date = Column(String)
    fuel_amount_liters = Column(Float)
    cost_usd = Column(Float)
    odometer_km = Column(Float)
    efficiency_kml = Column(Float)
