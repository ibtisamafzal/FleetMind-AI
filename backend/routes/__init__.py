from backend.routes.auth import router as auth_router
from backend.routes.vehicles import router as vehicles_router
from backend.routes.drivers import router as drivers_router
from backend.routes.trips import router as trips_router
from backend.routes.ml import router as ml_router
from backend.routes.analytics import router as analytics_router
from backend.routes.ai import router as ai_router
from backend.routes.settings import router as settings_router
from backend.routes.risk_radar import router as risk_radar_router
from backend.routes.simulator import router as simulator_router
from backend.routes.action_center import router as action_center_router

__all__ = [
    "auth_router",
    "vehicles_router",
    "drivers_router",
    "trips_router",
    "ml_router",
    "analytics_router",
    "ai_router",
    "settings_router",
    "risk_radar_router",
    "simulator_router",
    "action_center_router"
]
