"""
Tests for AI Assistant and RAG retrieval
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_ai_chat_vehicle_vh027():
    response = client.post("/api/ai/chat", json={
        "message": "Why is vehicle VH-027 high risk?",
        "vehicle_id": "VH-027"
    })
    assert response.status_code == 200
    data = response.json()
    assert "VH-027" in data["response"]
    assert data["ml_prediction"] is not None
    assert data["ml_prediction"]["risk_level"] == "HIGH"
    assert len(data["sources"]) > 0

def test_ai_chat_general_high_risk():
    response = client.post("/api/ai/chat", json={
        "message": "Which vehicles are high risk?"
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["response"]) > 0
