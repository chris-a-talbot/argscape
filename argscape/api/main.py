"""
ARGscape API - FastAPI Backend
Main application bootstrap
"""

import logging
import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Development storage setup
try:
    from argscape.api.dev_storage_override import ensure_dev_storage_dir
    ensure_dev_storage_dir()
except ImportError:
    pass

# Import availability checks
try:
    from fastgaia import infer_locations
    FASTGAIA_AVAILABLE = True
except ImportError:
    FASTGAIA_AVAILABLE = False

try:
    from argscape.api.inference import SPARG_AVAILABLE
except ImportError:
    SPARG_AVAILABLE = False

try:
    import gaiapy as gp
    GEOANCESTRY_AVAILABLE = True
except ImportError:
    gp = None
    GEOANCESTRY_AVAILABLE = False

try:
    from argscape.api.inference import MIDPOINT_AVAILABLE
except ImportError:
    MIDPOINT_AVAILABLE = False

# Temporal inference
DISABLE_TSDATE = os.getenv("DISABLE_TSDATE", "0").lower() in ("1", "true", "yes")
if not DISABLE_TSDATE:
    try:
        from argscape.api.inference import TSDATE_AVAILABLE
    except ImportError:
        TSDATE_AVAILABLE = False
else:
    TSDATE_AVAILABLE = False

# Import constants
from argscape.api.constants import DEFAULT_API_VERSION

# Import routes
from argscape.api.routes import (
    utils_router,
    sessions_router,
    tree_sequences_router,
    inference_router,
    geographic_router,
)

# Set availability flags in route modules that need them
from argscape.api.routes import utils, inference
utils.set_availability_flags(
    FASTGAIA_AVAILABLE,
    GEOANCESTRY_AVAILABLE,
    MIDPOINT_AVAILABLE,
    SPARG_AVAILABLE,
    gp
)
inference.set_availability_flags(
    FASTGAIA_AVAILABLE,
    GEOANCESTRY_AVAILABLE,
    MIDPOINT_AVAILABLE,
    SPARG_AVAILABLE,
    TSDATE_AVAILABLE,
    DISABLE_TSDATE
)

# FastAPI app instance
app = FastAPI(
    title="ARGscape API",
    description="API for interactive ARG visualization and analysis",
    version=DEFAULT_API_VERSION
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to handle double slashes
@app.middleware("http")
async def remove_double_slash_middleware(request: Request, call_next):
    scope = request.scope
    if "//" in scope["path"]:
        scope["path"] = scope["path"].replace("//", "/")
    return await call_next(request)

# Cache control middleware for frontend assets
@app.middleware("http")
async def add_cache_control_headers(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    
    # Don't cache index.html - force revalidation on every request
    if path == "/" or path.endswith("index.html"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    # Long-term cache for hashed assets (JS, CSS with content hashes in filename)
    elif any(path.endswith(ext) for ext in [".js", ".css"]) and "-" in path:
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    # Moderate cache for other assets
    elif any(path.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf"]):
        response.headers["Cache-Control"] = "public, max-age=86400"
    
    return response

# Include API routers
app.include_router(utils_router, prefix="/api", tags=["utils"])
app.include_router(sessions_router, prefix="/api", tags=["sessions"])
app.include_router(tree_sequences_router, prefix="/api", tags=["tree_sequences"])
app.include_router(inference_router, prefix="/api", tags=["inference"])
app.include_router(geographic_router, prefix="/api", tags=["geographic"])

# Mount static files for frontend
# Use Railway frontend if on Railway, otherwise use Python package frontend
# Check for Railway environment or explicit frontend selection
is_railway = (
    os.getenv("RAILWAY_ENVIRONMENT") is not None or 
    os.getenv("RAILWAY_PROJECT_ID") is not None or
    os.getenv("USE_RAILWAY_FRONTEND", "").lower() in ("true", "1", "yes")
)

if is_railway:
    frontend_dist = Path(__file__).resolve().parent.parent / "frontend_dist_railway"
    if not frontend_dist.exists():
        # Fallback to regular frontend_dist for backwards compatibility
        frontend_dist = Path(__file__).resolve().parent.parent / "frontend_dist"
else:
    frontend_dist = Path(__file__).resolve().parent.parent / "frontend_dist_python"
    if not frontend_dist.exists():
        # Fallback to regular frontend_dist for backwards compatibility
        frontend_dist = Path(__file__).resolve().parent.parent / "frontend_dist"

if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
    logger.info(f"Serving frontend from {frontend_dist} (Railway: {is_railway})")
else:
    logger.warning(f"Frontend build directory not found: {frontend_dist}")

# SPA fallback route
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve index.html for client-side routing with no-cache headers."""
    index_path = frontend_dist / "index.html"
    if index_path.exists():
        return FileResponse(
            index_path,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    return {"detail": "index.html not found"}, 404

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

logger.info("🚀 ARGscape API initialized")
logger.info(f"   FastGAIA: {'✓' if FASTGAIA_AVAILABLE else '✗'}")
logger.info(f"   Geoancestry: {'✓' if GEOANCESTRY_AVAILABLE else '✗'}")
logger.info(f"   Midpoint: {'✓' if MIDPOINT_AVAILABLE else '✗'}")
logger.info(f"   SPARG: {'✓' if SPARG_AVAILABLE else '✗'}")
logger.info(f"   Tsdate: {'✓' if TSDATE_AVAILABLE else '✗'}")
