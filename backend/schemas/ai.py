from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AIChatRequest(BaseModel):
    message: str
    vehicle_id: Optional[str] = None
    session_id: Optional[str] = "default"

class RAGSource(BaseModel):
    doc_title: str
    section: str
    source_file: str
    relevance_score: float

class AIChatResponse(BaseModel):
    response: str
    response_source: str = "sqlite_fallback"
    ml_prediction: Optional[Dict[str, Any]] = None
    deterministic_stats: Optional[Dict[str, Any]] = None
    ai_explanation: Optional[str] = None
    sources: List[RAGSource] = []
    recommended_actions: Optional[List[str]] = None
    action_cards: Optional[List[Dict[str, Any]]] = None

class SummarizeRequest(BaseModel):
    scope: Optional[str] = "today"  # today, fleet, high_risk

class SummarizeResponse(BaseModel):
    summary: str
    key_metrics: Dict[str, Any]
    action_items: List[str]
