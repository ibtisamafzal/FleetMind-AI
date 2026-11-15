"""
Integration tests for Vehicle API endpoints
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_get_vehicles():
    response = client.get("/api/vehicles")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # Verify VH-027 exists
    v_ids = [v["vehicle_id"] for v in data]
    assert "VH-027" in v_ids

def test_get_vehicle_detail_vh027():
    response = client.get("/api/vehicles/VH-027")
    assert response.status_code == 200
    data = response.json()
    assert data["vehicle_id"] == "VH-027"
    assert data["risk_score"] >= 70
    assert data["risk_level"] == "HIGH"
    assert len(data["recommended_actions"]) > 0
    assert "ai_explanation" in data
