"""
FleetMind AI — Application Runner
Launches the FastAPI backend and serves the complete ArgoLogics-themed web application.
"""

import os
import sys
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if __name__ == "__main__":
    print("=================================================================")
    print("       Starting FleetMind AI - Fleet Intelligence MVP            ")
    print("=================================================================")
    print(" Web Dashboard:     http://127.0.0.1:8000")
    print(" API Documentation: http://127.0.0.1:8000/docs")
    print(" Swagger UI:        http://127.0.0.1:8000/docs")
    print(" RAG Knowledge:     5 Documents Indexed")
    print(" ML Models:         Delay Prediction & Risk Scoring Active")
    print(" Theme:             ArgoLogics Modern Emerald & Slate")
    print("=================================================================\n")

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
