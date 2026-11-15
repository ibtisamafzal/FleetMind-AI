"""
Unit and integration tests for ML prediction models
"""

import pytest
from ml.predict import predictor

def test_delay_prediction():
    sample_trip = {
        "distance_km": 35.0,
        "estimated_duration": 45.0,
        "number_of_stops": 3,
        "traffic_level": "High",
        "weather_condition": "Rain",
        "hour_of_day": 17,
        "day_of_week": 4,
        "driver_id": "DRV-001",
        "vehicle_id": "VH-027"
    }
    result = predictor.predict_delay(sample_trip)
    assert "delay_probability" in result
    assert 0.0 <= result["delay_probability"] <= 1.0
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert result["prediction"] in ["ON_TIME", "DELAYED"]

def test_vehicle_risk_scoring():
    result = predictor.predict_vehicle_risk("VH-027")
    assert result["vehicle_id"] == "VH-027"
    assert "risk_score" in result
    assert 0 <= result["risk_score"] <= 100
    assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert "maintenance_risk" in result
    assert "fuel_risk" in result
    assert "delay_risk" in result

def test_route_optimization_engine():
    from ml.route_optimizer import route_optimizer
    res = route_optimizer.evaluate_routes(
        origin="Sundar Industrial Estate, Lahore",
        destination="I-9 Industrial Area, Islamabad",
        departure_hour=9,
        preference="balanced"
    )
    assert "routes" in res
    assert len(res["routes"]) == 3
    assert res["recommended_route_id"] is not None
    assert "ai_rationale" in res
    
    # Check that one route is marked as smallest distance
    smallest = [r for r in res["routes"] if r["is_smallest_distance"]]
    assert len(smallest) == 1
    
    # Check that one route is marked as minimum traffic
    min_traffic = [r for r in res["routes"] if r["is_minimum_traffic"]]
    assert len(min_traffic) == 1
    
    # Ensure traffic levels and delay predictions are present
    for r in res["routes"]:
        assert "distance_km" in r
        assert "duration_min" in r
        assert "traffic_index" in r
        assert "traffic_level" in r
        assert "delay_probability" in r
        assert "polyline" in r
        assert len(r["polyline"]) > 0

def test_route_api_endpoints():
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    # Test route locations list
    loc_res = client.get("/api/ml/route-locations")
    assert loc_res.status_code == 200
    locs = loc_res.json()
    assert len(locs) > 5

    # Test optimize-route endpoint
    opt_res = client.post("/api/ml/optimize-route", json={
        "origin": "Sundar Industrial Estate, Lahore",
        "destination": "Thokar Niaz Baig Hub, Lahore",
        "departure_hour": 18,
        "preference": "smallest"
    })
    assert opt_res.status_code == 200
    data = opt_res.json()
    assert len(data["routes"]) == 3
    assert data["origin"]["name"] is not None
    assert data["destination"]["name"] is not None

