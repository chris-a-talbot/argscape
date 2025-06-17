from typing import Tuple
import numpy as np
import logging
from argscape.backend.constants import (
    MAX_LAND_PLACEMENT_ATTEMPTS,
    LOCAL_SEARCH_STRATEGIES,
    LAND_SEARCH_RADIUS_BASE,
    LAND_SEARCH_RADIUS_INCREMENT,
    WGS84_LONGITUDE_MIN,
    WGS84_LONGITUDE_MAX,
    WGS84_LATITUDE_MIN,
    WGS84_LATITUDE_MAX
)

from .land_detect import (
    get_nearest_land_center,
)

logger = logging.getLogger(__name__)


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