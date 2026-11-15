from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DashboardAnalyticsResponse(BaseModel):
    total_vehicles: int
    active_vehicles: int
    high_risk_vehicles: int
    medium_risk_vehicles: int
    low_risk_vehicles: int
    total_deliveries: int
    delayed_deliveries: int
    orders_in_transit: int
    on_time_rate: float
    avg_delivery_time_display: str
    avg_fuel_efficiency: float
    fuel_cost_month: float
    fuel_cost_month_display: Optional[str] = None
    currency: Optional[str] = "PKR"
    vehicles_requiring_attention: List[Dict[str, Any]]
    delivery_volume_chart: Dict[str, Any]
    risk_distribution_chart: Dict[str, Any]
    sales_overview_chart: Dict[str, Any]
    recent_order_preview: Dict[str, Any]

class FleetAnalyticsResponse(BaseModel):
    delivery_analytics: Dict[str, Any]
    fuel_analytics: Dict[str, Any]
    maintenance_analytics: Dict[str, Any]
