from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union

class RouteLocation(BaseModel):
    name: str
    lat: float
    lng: float

class RouteSegment(BaseModel):
    segment_order: int
    name: str
    lat: float
    lng: float
    traffic_status: str  # Low, Moderate, High, Severe
    typical_speed_kmh: float
    distance_km: float

class RouteStep(BaseModel):
    step_number: int
    instruction: str
    distance_km: float
    duration_min: float
    maneuver_type: str  # depart, turn-right, turn-left, merge, fork, exit, arrive
    road_name: Optional[str] = ""

class CandidateRoute(BaseModel):
    id: str
    name: str
    summary: Optional[str] = ""  # e.g. "via M-2 Motorway"
    corridor_type: str
    distance_km: float
    duration_min: int
    traffic_index: int
    traffic_level: str
    polyline: List[List[float]]
    is_smallest_distance: bool
    is_minimum_traffic: bool
    is_recommended: bool
    characteristics: str
    bottlenecks: List[str]
    delay_probability: float
    delay_risk_level: str
    fuel_liters: float
    co2_kg: float
    ai_score: int
    segments: List[RouteSegment]
    steps: Optional[List[RouteStep]] = []


class RouteOptimizeRequest(BaseModel):
    origin: Union[str, Dict[str, Any]]
    destination: Union[str, Dict[str, Any]]
    departure_hour: Optional[int] = 10
    day_of_week: Optional[int] = 2
    weather_condition: Optional[str] = "Clear"
    vehicle_id: Optional[str] = "VH-027"
    driver_id: Optional[str] = "DRV-001"
    preference: Optional[str] = "balanced"  # balanced, smallest, min_traffic

class RouteOptimizeResponse(BaseModel):
    origin: RouteLocation
    destination: RouteLocation
    departure_hour: int
    day_of_week: int
    weather_condition: str
    traffic_time_multiplier: float
    preference: str
    recommended_route_id: str
    ai_rationale: str
    routes: List[CandidateRoute]

class DispatchRouteRequest(BaseModel):
    origin: str
    destination: str
    distance_km: float
    estimated_duration: float
    traffic_level: str
    weather_condition: str = "Clear"
    vehicle_id: str
    driver_id: str
    route_name: Optional[str] = None
