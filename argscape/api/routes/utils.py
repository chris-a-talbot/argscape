"""
Utility endpoints (health, debug, environment).
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse, RedirectResponse

logger = logging.getLogger(__name__)

router = APIRouter()

# Import availability flags from main (will be passed as dependencies)
from argscape.api.constants import DEFAULT_API_VERSION

# These will be set when the router is included
FASTGAIA_AVAILABLE = False
GEOANCESTRY_AVAILABLE = False
MIDPOINT_AVAILABLE = False
SPARG_AVAILABLE = False
gp = None


def set_availability_flags(fastgaia, geoancestry, midpoint, sparg, gp_module):
    """Set availability flags from main app initialization."""
    global FASTGAIA_AVAILABLE, GEOANCESTRY_AVAILABLE, MIDPOINT_AVAILABLE, SPARG_AVAILABLE, gp
    FASTGAIA_AVAILABLE = fastgaia
    GEOANCESTRY_AVAILABLE = geoancestry
    MIDPOINT_AVAILABLE = midpoint
    SPARG_AVAILABLE = sparg
    gp = gp_module


@router.get("/")
async def api_root():
    """API root endpoint."""
    return {
        "status": "ok",
        "version": DEFAULT_API_VERSION,
        "endpoints": {
            "session_storage": "ok",
            "location_inference": {
                "fastgaia": FASTGAIA_AVAILABLE,
                "geoancestry": GEOANCESTRY_AVAILABLE,
                "midpoint": MIDPOINT_AVAILABLE,
                "sparg": SPARG_AVAILABLE
            }
        }
    }


@router.get("/health")
async def health_check():
    """Basic health check to verify backend is running."""
    return {
        "status": "healthy",
        "message": "Backend is running"
    }


@router.get("/download-environment")
async def download_environment_file():
    """Download the environment.yml file for local installation"""
    try:
        # Try multiple locations for the environment.yml file
        current_dir = Path(__file__).parent.parent
        possible_paths = [
            current_dir / "environment.yml",
            current_dir.parent / "api" / "environment.yml",
            Path.cwd() / "argscape" / "api" / "environment.yml",
        ]
        
        logger.info(f"Looking for environment.yml file. Current dir: {current_dir}")
        logger.info(f"Checking paths: {[str(p) for p in possible_paths]}")
        
        environment_file = None
        for path in possible_paths:
            logger.info(f"Checking path: {path}, exists: {path.exists()}")
            if path.exists():
                environment_file = path
                logger.info(f"Found environment.yml at: {environment_file}")
                break
        
        if environment_file is None:
            logger.warning(f"Environment file not found in any of the expected locations: {[str(p) for p in possible_paths]}")
            github_url = "https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/argscape/api/environment.yml"
            logger.info(f"Redirecting to GitHub: {github_url}")
            return RedirectResponse(url=github_url)
        
        logger.info(f"Serving environment.yml from: {environment_file}")
        
        return FileResponse(
            path=str(environment_file),
            filename="environment.yml",
            media_type="text/yaml"
        )
    except Exception as e:
        logger.error(f"Failed to serve environment.yml: {str(e)}", exc_info=True)
        github_url = "https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/argscape/api/environment.yml"
        logger.info(f"Falling back to GitHub redirect: {github_url}")
        return RedirectResponse(url=github_url)


@router.get("/debug/geoancestry-status")
async def debug_geoancestry_status():
    """Debug endpoint to check geoancestry availability."""
    try:
        import gaiapy as gp_debug
        geoancestry_info = {
            "gaiapy_available": True,
            "GEOANCESTRY_AVAILABLE": GEOANCESTRY_AVAILABLE,
            "gp_is_none": gp is None,
            "gaiapy_version": getattr(gp_debug, '__version__', 'unknown'),
            "available_functions": [func for func in dir(gp_debug) if not func.startswith('_')],
        }
    except ImportError as e:
        geoancestry_info = {
            "gaiapy_available": False,
            "GEOANCESTRY_AVAILABLE": GEOANCESTRY_AVAILABLE,
            "gp_is_none": gp is None,
            "import_error": str(e),
        }
    
    # Get pip list to see if geoancestry is installed
    try:
        pip_result = subprocess.run([sys.executable, "-m", "pip", "list"], 
                                  capture_output=True, text=True, timeout=10)
        pip_packages = pip_result.stdout if pip_result.returncode == 0 else "Error getting pip list"
    except Exception as e:
        pip_packages = f"Error running pip list: {str(e)}"
    
    return {
        **geoancestry_info,
        "python_executable": sys.executable,
        "python_version": sys.version,
        "python_path": sys.path[:5],
        "pip_packages_geoancestry": [line for line in pip_packages.split('\n') if 'geoancestry' in line.lower()] if isinstance(pip_packages, str) else [],
        "current_working_directory": os.getcwd(),
    }

