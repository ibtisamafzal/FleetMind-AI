"""Tests for persistent RAG retrieval and its TF-IDF fallback."""

from backend.config import settings
from rag.rag_engine import FleetRAGEngine


def test_rag_tfidf_fallback(monkeypatch):
    monkeypatch.setattr(settings, "RAG_USE_CHROMA", False)

    engine = FleetRAGEngine()

    assert engine.backend == "tfidf"
    results = engine.retrieve("What should I check if fuel efficiency drops?")
    assert results
    assert results[0]["source"] == "fuel_efficiency_guidelines.md"


def test_rag_query_failure_falls_back_to_tfidf(monkeypatch):
    monkeypatch.setattr(settings, "RAG_USE_CHROMA", False)
    engine = FleetRAGEngine()

    class BrokenCollection:
        def query(self, **kwargs):
            raise RuntimeError("simulated Chroma failure")

    engine.chroma_collection = BrokenCollection()

    results = engine.retrieve("What should I check if fuel efficiency drops?")

    assert results
    assert results[0]["source"] == "fuel_efficiency_guidelines.md"
