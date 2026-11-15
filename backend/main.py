"""
FleetMind AI — Backend Application Server
FastAPI production-quality MVP backend.
"""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure root directory is on python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.config import settings
from backend.database import Base, engine, SessionLocal
from backend.models import Vehicle
from backend.seed_data import seed_database
from backend.routes import (
    auth_router,
    vehicles_router,
    drivers_router,
    trips_router,
    ml_router,
    analytics_router,
    ai_router,
    settings_router,
    risk_radar_router,
    simulator_router,
    action_center_router
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Auto seed if empty
try:
    with SessionLocal() as db:
        if db.query(Vehicle).count() == 0:
            print("Database empty. Auto-seeding initial dataset...")
            seed_database(force=False)
except Exception as e:
    print(f"Warning during startup database check: {e}")

app = FastAPI(
    title="FleetMind AI — API",
    description="Production-quality MVP backend for AI-powered fleet intelligence, ML delay prediction, vehicle risk scoring, and RAG assistant.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth_router)
app.include_router(vehicles_router)
app.include_router(drivers_router)
app.include_router(trips_router)
app.include_router(ml_router)
app.include_router(analytics_router)
app.include_router(ai_router)
app.include_router(settings_router)
app.include_router(risk_radar_router)
app.include_router(simulator_router)
app.include_router(action_center_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "connected"
    }

# Mount frontend static directories (React build in frontend/dist or frontend-react/dist)
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
REACT_DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend-react", "dist"))

DIST_DIR = FRONTEND_DIST_DIR if os.path.exists(os.path.join(FRONTEND_DIST_DIR, "index.html")) else REACT_DIST_DIR

if os.path.exists(DIST_DIR) and os.path.exists(os.path.join(DIST_DIR, "index.html")):
    FRONTEND_DIR = DIST_DIR
    assets_dir = os.path.join(FRONTEND_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    images_dir = os.path.join(FRONTEND_DIR, "images")
    if os.path.exists(images_dir):
        app.mount("/images", StaticFiles(directory=images_dir), name="images")
    elif os.path.exists(os.path.join(FRONTEND_DIR, "assets", "images")):
        app.mount("/images", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets", "images")), name="images")

    @app.get("/favicon.ico")
    def serve_favicon():
        fav_path = os.path.join(FRONTEND_DIR, "favicon.ico")
        if os.path.exists(fav_path):
            return FileResponse(fav_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "favicon.svg"))

    @app.get("/")
    def serve_index():
        response = FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    @app.get("/{catchall:path}")
    def serve_frontend_spa(catchall: str):
        candidate = os.path.join(FRONTEND_DIR, catchall)
        if os.path.exists(candidate) and os.path.isfile(candidate):
            return FileResponse(candidate)
        assets_candidate = os.path.join(FRONTEND_DIR, "assets", catchall)
        if os.path.exists(assets_candidate) and os.path.isfile(assets_candidate):
            return FileResponse(assets_candidate)
        response = FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
elif os.path.exists(VANILLA_FRONTEND_DIR):
    FRONTEND_DIR = VANILLA_FRONTEND_DIR
    css_dir = os.path.join(FRONTEND_DIR, "css")
    js_dir = os.path.join(FRONTEND_DIR, "js")
    assets_dir = os.path.join(FRONTEND_DIR, "assets")

    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/favicon.ico")
    def serve_favicon():
        fav_path = os.path.join(FRONTEND_DIR, "favicon.ico")
        if os.path.exists(fav_path):
            return FileResponse(fav_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "favicon.svg"))

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    # SPA catch-all for frontend routes
    @app.get("/{catchall:path}")
    def serve_frontend_spa(catchall: str):
        candidate = os.path.join(FRONTEND_DIR, catchall)
        if os.path.exists(candidate) and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
