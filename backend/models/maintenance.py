from sqlalchemy import Column, String, Integer, Float
from backend.database import Base

class Maintenance(Base):
    __tablename__ = "maintenance"

    maintenance_id = Column(String, primary_key=True, index=True)
    vehicle_id = Column(String, index=True)
    service_date = Column(String)
    service_type = Column(String)
    cost_usd = Column(Float)
    mileage_at_service = Column(Float)
    notes = Column(String, nullable=True)
