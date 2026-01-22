"""Spatial dependency availability detection.

This module provides functions to check if spatial dependencies (geopandas,
shapely, pyproj) are available, and helpful error messages when they're not.
"""

from __future__ import annotations

_SPATIAL_AVAILABLE: bool | None = None
_SPATIAL_IMPORT_ERROR: str | None = None


def is_spatial_available() -> bool:
    """Check if spatial dependencies are installed.

    Returns:
        True if geopandas, shapely, and pyproj are available.
    """
    global _SPATIAL_AVAILABLE, _SPATIAL_IMPORT_ERROR

    if _SPATIAL_AVAILABLE is not None:
        return _SPATIAL_AVAILABLE

    try:
        import geopandas
        import shapely
        import pyproj
        _SPATIAL_AVAILABLE = True
        return True
    except ImportError as e:
        _SPATIAL_AVAILABLE = False
        _SPATIAL_IMPORT_ERROR = str(e)
        return False


def get_spatial_import_error() -> str | None:
    """Get the import error message if spatial is not available."""
    is_spatial_available()  # Ensure we've checked
    return _SPATIAL_IMPORT_ERROR


def require_spatial(feature_name: str = "This feature") -> None:
    """Raise ImportError if spatial dependencies are not available.

    Args:
        feature_name: Name of the feature requiring spatial deps, for error message.

    Raises:
        ImportError: If spatial dependencies are not installed.
    """
    if not is_spatial_available():
        raise ImportError(
            f"{feature_name} requires spatial dependencies.\n"
            f"Install with: pip install argscape[spatial]\n"
            f"Original error: {get_spatial_import_error()}"
        )


def is_web_available() -> bool:
    """Check if web application dependencies are installed.

    The web app requires both spatial deps and FastAPI/uvicorn.

    Returns:
        True if all web app dependencies are available.
    """
    if not is_spatial_available():
        return False

    try:
        import fastapi
        import uvicorn
        return True
    except ImportError:
        return False


def require_web(feature_name: str = "The web application") -> None:
    """Raise ImportError if web app dependencies are not available.

    Args:
        feature_name: Name of the feature requiring web deps, for error message.

    Raises:
        ImportError: If web app dependencies are not installed.
    """
    if not is_web_available():
        raise ImportError(
            f"{feature_name} requires the full ARGscape installation.\n"
            f"Install with: pip install argscape[spatial]"
        )


def is_playwright_available() -> bool:
    """Check if playwright is installed for static export."""
    try:
        from playwright.sync_api import sync_playwright
        return True
    except ImportError:
        return False


def require_playwright(feature_name: str = "Static export") -> None:
    """Raise ImportError if playwright is not available.

    Args:
        feature_name: Name of the feature requiring playwright, for error message.

    Raises:
        ImportError: If playwright is not installed.
    """
    if not is_playwright_available():
        raise ImportError(
            f"{feature_name} requires playwright.\n"
            f"Install with: pip install playwright && playwright install chromium"
        )
