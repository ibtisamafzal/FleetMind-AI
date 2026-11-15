"""
ML Service for FleetMind AI
Integrates trained ML models and real-time inference.
"""

from ml.predict import predictor
from ml.route_optimizer import route_optimizer
from backend.config import settings
from typing import Dict, Any, Optional, List

class MLService:
    @staticmethod
    def predict_delay(delivery_data: Dict[str, Any]) -> Dict[str, Any]:
        return predictor.predict_delay(delivery_data)

    @staticmethod
    def predict_vehicle_risk(vehicle_id: str, custom_weights: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        weights = custom_weights or {
            "maintenance": settings.WEIGHT_MAINTENANCE,
            "fuel": settings.WEIGHT_FUEL,
            "delay": settings.WEIGHT_DELAY
        }
        return predictor.predict_vehicle_risk(vehicle_id, custom_weights=weights)

    @staticmethod
    def optimize_route(payload: Dict[str, Any]) -> Dict[str, Any]:
        return route_optimizer.evaluate_routes(
            origin=payload.get("origin"),
            destination=payload.get("destination"),
            departure_hour=payload.get("departure_hour", 10),
            day_of_week=payload.get("day_of_week", 2),
            weather_condition=payload.get("weather_condition", "Clear"),
            vehicle_id=payload.get("vehicle_id", "VH-027"),
            driver_id=payload.get("driver_id", "DRV-001"),
            preference=payload.get("preference", "balanced")
        )

    @staticmethod
    def get_route_locations() -> List[Dict[str, Any]]:
        return route_optimizer.get_locations()

ml_service = MLService()

