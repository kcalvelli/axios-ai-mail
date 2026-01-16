"""FastAPI application for axios-ai-mail web UI."""

import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from ..config.loader import ConfigLoader
from ..db.database import Database
from .routes import accounts, messages, stats, sync
from .websocket import router as websocket_router

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="axios-ai-mail API",
    description="REST API for AI-enhanced email workflow",
    version="2.0.0",
)

# CORS middleware - Allow localhost origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:8080",  # Production
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database (shared with CLI)
db_path = Path.home() / ".local/share/axios-ai-mail/mail.db"
db = Database(db_path)
logger.info(f"Database initialized at {db_path}")

# Store database in app state for access in routes
app.state.db = db

# Include routers
app.include_router(messages.router, prefix="/api", tags=["messages"])
app.include_router(accounts.router, prefix="/api", tags=["accounts"])
app.include_router(stats.router, prefix="/api", tags=["stats"])
app.include_router(sync.router, prefix="/api", tags=["sync"])
app.include_router(websocket_router, tags=["websocket"])

# Serve static files (frontend build) if they exist
# Try installed package location first, then development location
static_dir = Path(__file__).parent / "web_assets"
if not static_dir.exists():
    static_dir = Path(__file__).parent.parent.parent.parent / "web" / "dist"

if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
    logger.info(f"Serving static files from {static_dir}")
else:
    logger.warning("Static files not found. Web UI will not be available.")


@app.on_event("startup")
async def startup_event():
    """Load configuration and sync to database on startup."""
    logger.info("Loading configuration on API startup")
    config = ConfigLoader.load_config()
    if config:
        ConfigLoader.sync_to_database(app.state.db, config)
        logger.info("Configuration synced to database")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": str(db_path),
        "database_exists": db_path.exists(),
    }


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    logger.info("Shutting down API server")
    db.close()
