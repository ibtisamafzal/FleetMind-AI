"""
Tests for AI Assistant and RAG retrieval
"""

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.llm_service import llm_service

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


def test_ai_chat_uses_ollama_as_primary_response(monkeypatch):
    monkeypatch.setattr(
        llm_service,
        "query_ollama_sync",
        lambda prompt, system_prompt: "Llama recommends reviewing the verified maintenance indicators before dispatch.",
    )

    response = client.post("/api/ai/chat", json={
        "message": "Why is vehicle VH-027 high risk?",
        "vehicle_id": "VH-027",
    })

    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "Llama recommends reviewing the verified maintenance indicators before dispatch."
    assert data["response_source"] == "llama3.2"
    assert data["ml_prediction"]["vehicle_id"] == "VH-027"


def test_ai_chat_reports_sqlite_fallback(monkeypatch):
    monkeypatch.setattr(llm_service, "query_ollama_sync", lambda prompt, system_prompt: None)

    response = client.post("/api/ai/chat", json={
        "message": "Why is vehicle VH-027 high risk?",
        "vehicle_id": "VH-027",
    })

    assert response.status_code == 200
    data = response.json()
    assert data["response_source"] == "sqlite_fallback"
    assert "Overall Composite Risk Score" in data["response"]
