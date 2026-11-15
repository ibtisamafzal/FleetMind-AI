from pydantic import BaseModel
from typing import Optional, Dict

class PredictDelayRequest(BaseModel):
    distance_km: float
    estimated_duration: float
    number_of_stops: int = 2
    traffic_level: str = "Medium"  # Low, Medium, High, Severe
    weather_condition: str = "Clear"  # Clear, Rain, Snow, Fog, Storm
    hour_of_day: Optional[int] = 10
    day_of_week: Optional[int] = 2
    driver_id: Optional[str] = None
    vehicle_id: Optional[str] = None

class PredictDelayResponse(BaseModel):
    delay_probability: float
    risk_level: str  # LOW, MEDIUM, HIGH
    prediction: str  # ON_TIME, DELAYED

class PredictRiskRequest(BaseModel):
    vehicle_id: str
    custom_weights: Optional[Dict[str, float]] = None

class PredictRiskResponse(BaseModel):
    vehicle_id: str
    risk_score: int
    risk_level: str
    maintenance_risk: int
    fuel_risk: int
    delay_risk: int
