"""
RAG Service for FleetMind AI
Bridges the RAG engine and retrieval queries.
"""

from typing import List, Dict, Any
from rag.rag_engine import rag_engine

class RAGService:
    @staticmethod
    def get_relevant_context(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        return rag_engine.retrieve(query, top_k=top_k)

rag_service = RAGService()
