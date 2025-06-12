from shapely.geometry import Point
from .shapes import get_land_geometry_eastern_hemisphere, fallback_land_heuristic
import logging
from typing import Tuple
import numpy as np
from argscape.backend.constants import GEOGRAPHIC_LAND_REGIONS

logger = logging.getLogger(__name__)


def is_point_on_land_eastern_hemisphere(lon: float, lat: float) -> bool:
    """
    Determine if a point is on land in the Eastern Hemisphere using Natural Earth data.
    Falls back to heuristic region matching if shapefile is not available or fails.
    
    Excludes Antarctica (lat < -60).
    """
    if lat < -60:
        return False  # Exclude Antarctica

    land_geometry = get_land_geometry_eastern_hemisphere()
    if land_geometry is not None:
        try:
            point = Point(lon, lat)
            return land_geometry.covers(point)  # includes borders
        except Exception as e:
            logger.debug(f"Geometry check failed, falling back: {e}")

    return fallback_land_heuristic(lon, lat)


def get_nearest_land_center(longitude: float, latitude: float) -> Tuple[float, float, float, float, str]:
    """
    Find the closest land region to given coordinates using vectorized NumPy operations.
    
    Args:
        longitude: Longitude coordinate
        latitude: Latitude coordinate
        
    Returns:
        Tuple of (center_lon, center_lat, radius_lon, radius_lat, name)
    """
    # Extract centers from GEOGRAPHIC_LAND_REGIONS
    centers = np.array([(region[0], region[1]) for region in GEOGRAPHIC_LAND_REGIONS])
    input_point = np.array([longitude, latitude])
    
    # Compute vectorized Euclidean distances
    dists = np.linalg.norm(centers - input_point, axis=1)
    
    # Get index of closest region
    closest_index = np.argmin(dists)
    
    return GEOGRAPHIC_LAND_REGIONS[closest_index]


def generate_search_candidate(
    longitude: float, 
    latitude: float, 
    search_radius: float, 
    strategy: int, 
    attempt: int
) -> Tuple[float, float]:
    """
    Generate a search candidate coordinate based on strategy.
    
    Args:
        longitude: Base longitude
        latitude: Base latitude
        search_radius: Search radius
        strategy: Search strategy (0-3)
        attempt: Attempt number
        
    Returns:
        Tuple of (new_longitude, new_latitude)
    """
    if strategy == 0:  # Random walk
        noise_x = np.random.normal(0, search_radius)
        noise_y = np.random.normal(0, search_radius)
    elif strategy == 1:  # Directional bias toward land centers
        closest_region = get_nearest_land_center(longitude, latitude)
        center_lon, center_lat = closest_region[0], closest_region[1]
        direction_x = (center_lon - longitude) * 0.3
        direction_y = (center_lat - latitude) * 0.3
        noise_x = direction_x + np.random.normal(0, search_radius * 0.7)
        noise_y = direction_y + np.random.normal(0, search_radius * 0.7)
    elif strategy == 2:  # Coastal search - stay roughly same latitude
        noise_x = np.random.normal(0, search_radius * 2)  # Wider longitude search
        noise_y = np.random.normal(0, search_radius * 0.5)  # Narrower latitude search
    else:  # Grid search
        angle = (attempt + strategy) * np.pi / 4  # Different angles
        noise_x = search_radius * np.cos(angle)
        noise_y = search_radius * np.sin(angle)
    
    return longitude + noise_x, latitude + noise_y