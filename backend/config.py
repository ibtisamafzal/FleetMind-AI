"""
Configuration settings for FleetMind AI
Uses standard os.getenv with robust defaults.
"""

import os
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

class Settings:
    APP_NAME: str = "FleetMind AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fleetmind.db")
    
    # Ollama / GenAI configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    OLLAMA_ENABLED: bool = os.getenv("OLLAMA_ENABLED", "true").lower() in ("true", "1")
    VECTOR_DB_PATH: str = os.getenv("VECTOR_DB_PATH", "./rag/chroma_db")
    RAG_USE_CHROMA: bool = os.getenv("RAG_USE_CHROMA", "true").lower() in ("true", "1")
    
    # JWT Auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "fleetmind-super-secret-key-production-mvp")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Default risk weights
    WEIGHT_MAINTENANCE: float = float(os.getenv("WEIGHT_MAINTENANCE", "0.40"))
    WEIGHT_FUEL: float = float(os.getenv("WEIGHT_FUEL", "0.30"))
    WEIGHT_DELAY: float = float(os.getenv("WEIGHT_DELAY", "0.30"))

settings = Settings()
