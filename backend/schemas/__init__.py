from backend.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleDetailResponse
from backend.schemas.driver import DriverCreate, DriverUpdate, DriverResponse
from backend.schemas.trip import TripCreate, TripResponse
from backend.schemas.ml import PredictDelayRequest, PredictDelayResponse, PredictRiskRequest, PredictRiskResponse
from backend.schemas.analytics import DashboardAnalyticsResponse, FleetAnalyticsResponse
from backend.schemas.ai import AIChatRequest, AIChatResponse, SummarizeRequest, SummarizeResponse
from backend.schemas.auth import LoginRequest, TokenResponse, UserResponse

from backend.schemas.route import RouteOptimizeRequest, RouteOptimizeResponse, DispatchRouteRequest

__all__ = [
    "VehicleCreate", "VehicleUpdate", "VehicleResponse", "VehicleDetailResponse",
    "DriverCreate", "DriverUpdate", "DriverResponse",
    "TripCreate", "TripResponse",
    "PredictDelayRequest", "PredictDelayResponse", "PredictRiskRequest", "PredictRiskResponse",
    "DashboardAnalyticsResponse", "FleetAnalyticsResponse",
    "AIChatRequest", "AIChatResponse", "SummarizeRequest", "SummarizeResponse",
    "LoginRequest", "TokenResponse", "UserResponse",
    "RouteOptimizeRequest", "RouteOptimizeResponse", "DispatchRouteRequest"
]

