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
    is_point_on_land_eastern_hemisphere,
    get_nearest_land_center,
    generate_search_candidate
)

logger = logging.getLogger(__name__)


def attempt_land_placement(
    longitude: float, 
    latitude: float,
    original_normalized_x: float,
    original_normalized_y: float
) -> Tuple[float, float]:
    """
    Attempt to place coordinates on land using a prioritized strategy sequence.

    Strategies:
        1. Keep original if already on land.
        2. Local search around current position.
        3. Region-based fallback based on normalized location.

    Args:
        longitude: Initial longitude
        latitude: Initial latitude
        original_normalized_x: Normalized X coordinate [0,1]
        original_normalized_y: Normalized Y coordinate [0,1]

    Returns:
        Tuple of (final_longitude, final_latitude)
    """
    try:
        if is_point_on_land_eastern_hemisphere(longitude, latitude):
            return longitude, latitude
    except Exception as e:
        logger.warning(f"Land check failed for initial point ({longitude}, {latitude}): {e}")

    # Strategy 1: Try local refinement near initial point
    try:
        found_land, local_lon, local_lat = attempt_local_land_search(longitude, latitude)
        if found_land:
            return local_lon, local_lat
    except Exception as e:
        logger.warning(f"Local land search failed: {e}")

    # Strategy 2: Regional fallback based on normalized space
    try:
        return attempt_regional_land_placement(original_normalized_x, original_normalized_y)
    except Exception as e:
        logger.error(f"Regional land placement failed, falling back to original: {e}")
        return longitude, latitude


def attempt_regional_land_placement(
    original_normalized_x: float, 
    original_normalized_y: float
) -> Tuple[float, float]:
    """
    Place coordinate in a reliable land area based on original normalized position.
    
    Args:
        original_normalized_x: Original x coordinate in [0,1]
        original_normalized_y: Original y coordinate in [0,1]
        
    Returns:
        Tuple of (longitude, latitude) on land
    """
    # Fallback to most reliable land coordinates based on original position
    if original_normalized_x < 0.25:  # Western quarter -> Western Africa/Europe
        if original_normalized_y > 0.6:  # Northern -> Europe
            return np.random.uniform(5, 25), np.random.uniform(45, 65)
        else:  # Southern -> Africa
            return np.random.uniform(0, 20), np.random.uniform(-10, 20)
    elif original_normalized_x < 0.5:  # Second quarter -> Central Africa/Eastern Europe
        if original_normalized_y > 0.6:  # Northern -> Eastern Europe/Western Asia
            return np.random.uniform(25, 50), np.random.uniform(45, 65)
        else:  # Southern -> Central Africa
            return np.random.uniform(15, 35), np.random.uniform(-20, 10)
    elif original_normalized_x < 0.75:  # Third quarter -> Asia/Middle East
        if original_normalized_y > 0.6:  # Northern -> Northern Asia
            return np.random.uniform(60, 120), np.random.uniform(35, 55)
        else:  # Southern -> India/Middle East
            return np.random.uniform(50, 90), np.random.uniform(10, 35)
    else:  # Eastern quarter -> East Asia/Australia
        if original_normalized_y > 0.4:  # Northern -> East Asia
            return np.random.uniform(100, 140), np.random.uniform(25, 45)
        else:  # Southern -> Australia
            return np.random.uniform(120, 150), np.random.uniform(-35, -15)


def attempt_local_land_search(
    longitude: float,
    latitude: float,
    *,
    max_attempts: int = MAX_LAND_PLACEMENT_ATTEMPTS // 2,
    strategies: int = LOCAL_SEARCH_STRATEGIES
) -> Tuple[bool, float, float]:
    """
    Search locally for a nearby land coordinate.

    Args:
        longitude: Starting longitude.
        latitude: Starting latitude.
        max_attempts: Number of search iterations.
        strategies: Number of spatial search strategies to try.

    Returns:
        (found_land, longitude, latitude): True if land found, with final coordinates.
    """
    for attempt in range(max_attempts):
        search_radius = LAND_SEARCH_RADIUS_BASE + attempt * LAND_SEARCH_RADIUS_INCREMENT

        for strategy in range(strategies):
            new_lon, new_lat = generate_search_candidate(longitude, latitude, search_radius, strategy, attempt)

            # Clip to geographic bounds to avoid invalid coordinates
            new_lon = np.clip(new_lon, WGS84_LONGITUDE_MIN + 1.0, WGS84_LONGITUDE_MAX - 1.0)
            new_lat = np.clip(new_lat, WGS84_LATITUDE_MIN + 1.0, WGS84_LATITUDE_MAX - 1.0)

            if is_point_on_land_eastern_hemisphere(new_lon, new_lat):
                return True, new_lon, new_lat

    return False, longitude, latitude


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