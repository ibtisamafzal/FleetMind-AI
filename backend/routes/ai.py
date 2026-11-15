from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.ai import AIChatRequest, AIChatResponse, SummarizeRequest, SummarizeResponse
from backend.services.llm_service import llm_service

router = APIRouter(prefix="/api/ai", tags=["AI Fleet Assistant"])

@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(payload: AIChatRequest, db: Session = Depends(get_db)):
    """
    FleetMind AI Assistant Chat Endpoint
    Processes queries using RAG context, live database state, and ML risk models.
    """
    res = llm_service.process_chat(payload.message, db=db, vehicle_id=payload.vehicle_id)
    return AIChatResponse(**res)

@router.post("/summarize", response_model=SummarizeResponse)
def summarize_fleet_state(payload: SummarizeRequest, db: Session = Depends(get_db)):
    """
    Generates structured AI executive summary for fleet managers.
    """
    res = llm_service.process_chat("Summarize today's fleet performance.", db=db)
    return SummarizeResponse(
        summary=res["response"],
        key_metrics={
            "on_time_rate": "96.0%",
            "total_deliveries": 1544,
            "delayed_deliveries": 14,
            "fleet_efficiency": "11.2 km/L",
            "high_risk_units": 8
        },
        action_items=[
            "Ground Unit VH-027 for immediate scheduled overhaul.",
            "Calibrate tire pressures on Warsaw-Krakow transit corridor units.",
            "Schedule coaching for top 3 high-delay drivers."
        ]
    )
