from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from backend.database import Base
import datetime

class ActionItem(Base):
    __tablename__ = "action_items"

    action_id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="General")  # Maintenance, Fuel Anomaly, Delivery Delay, Driver Training, Safety
    priority = Column(String, default="Medium")   # Critical, High, Medium, Low
    status = Column(String, default="Pending")     # Pending, In Progress, Completed
    vehicle_id = Column(String, nullable=True, index=True)
    driver_id = Column(String, nullable=True, index=True)
    assigned_to = Column(String, default="Fleet Operations Team")
    created_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))
    updated_at = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))
    resolution_notes = Column(Text, nullable=True)
