from pydantic import BaseModel
from fastapi import APIRouter
from backend.config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class SettingsPayload(BaseModel):
    ollama_base_url: str
    ollama_model: str
    weight_maintenance: float
    weight_fuel: float
    weight_delay: float

@router.get("")
def get_settings():
    return {
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "ollama_model": settings.OLLAMA_MODEL,
        "vector_db_path": settings.VECTOR_DB_PATH,
        "weights": {
            "maintenance": settings.WEIGHT_MAINTENANCE,
            "fuel": settings.WEIGHT_FUEL,
            "delay": settings.WEIGHT_DELAY
        }
    }

@router.post("")
def update_settings(payload: SettingsPayload):
    settings.OLLAMA_BASE_URL = payload.ollama_base_url
    settings.OLLAMA_MODEL = payload.ollama_model
    settings.WEIGHT_MAINTENANCE = payload.weight_maintenance
    settings.WEIGHT_FUEL = payload.weight_fuel
    settings.WEIGHT_DELAY = payload.weight_delay

    return {
        "status": "success",
        "message": "Settings updated successfully",
        "weights": {
            "maintenance": settings.WEIGHT_MAINTENANCE,
            "fuel": settings.WEIGHT_FUEL,
            "delay": settings.WEIGHT_DELAY
        }
    }
