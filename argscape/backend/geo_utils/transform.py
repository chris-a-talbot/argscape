import numpy as np
import logging
from typing import Sequence, Tuple, List, Union
from argscape.backend.constants import (
    WGS84_LONGITUDE_MIN,
    WGS84_LONGITUDE_MAX,
    WGS84_LATITUDE_MIN,
    WGS84_LATITUDE_MAX,
    WGS84_LONGITUDE_RANGE,
    WGS84_LATITUDE_RANGE,
    WGS84_GEOGRAPHIC_NOISE_SCALE,
    WEB_MERCATOR_X_RANGE,
    WEB_MERCATOR_Y_RANGE,
    WEB_MERCATOR_NOISE_SCALE,
    WEB_MERCATOR_BOUNDS_X,
    WEB_MERCATOR_BOUNDS_Y,
    UNIT_GRID_MARGIN,
    UNIT_GRID_NOISE_SCALE,
    COORDINATE_BOUNDARY_EPSILON
)

logger = logging.getLogger(__name__)


def normalize_coordinates_to_unit_space(
    points: Sequence[Tuple[float, float]], 
    bounds: Tuple[float, float, float, float]
) -> List[Tuple[float, float]]:
    """
    Normalize a list of coordinates to the unit square [0, 1] x [0, 1].

    Args:
        points: List or array-like of (x, y) tuples.
        bounds: (min_x, min_y, max_x, max_y) bounding box.

    Returns:
        Normalized list of (x, y) tuples.
    """
    min_x, min_y, max_x, max_y = bounds
    width = max_x - min_x
    height = max_y - min_y

    if width == 0 or height == 0:
        logger.warning("Zero width or height in bounds – cannot normalize coordinates.")
        return list(points)

    arr = np.array(points, dtype=np.float64)
    arr[:, 0] = (arr[:, 0] - min_x) / width
    arr[:, 1] = (arr[:, 1] - min_y) / height

    return [tuple(pt) for pt in arr]


def generate_wgs84_coordinates(normalized_coords: np.ndarray) -> np.ndarray:
    """
    Generate WGS84 geographic coordinates with land placement.
    
    Args:
        normalized_coords: Normalized coordinates in [0,1]
        
    Returns:
        Final coordinates in WGS84 (longitude, latitude)
    """
    # Import here to avoid circular import
    from .placement import attempt_land_placement

    # Initialize final_coords with proper shape
    final_coords = np.zeros_like(normalized_coords)
    
    # Scale normalized coordinates to geographic ranges
    final_coords[:, 0] = normalized_coords[:, 0] * WGS84_LONGITUDE_RANGE + WGS84_LONGITUDE_MIN  # Longitude
    final_coords[:, 1] = normalized_coords[:, 1] * WGS84_LATITUDE_RANGE + WGS84_LATITUDE_MIN  # Latitude
    
    # Add geographic noise
    noise = np.random.normal(0, WGS84_GEOGRAPHIC_NOISE_SCALE, final_coords.shape)
    final_coords += noise
    
    # Ensure coordinates stay within geographic bounds
    final_coords[:, 0] = np.clip(final_coords[:, 0], WGS84_LONGITUDE_MIN + 1.0, WGS84_LONGITUDE_MAX - 1.0)
    final_coords[:, 1] = np.clip(final_coords[:, 1], WGS84_LATITUDE_MIN + 1.0, WGS84_LATITUDE_MAX - 1.0)
    
    # Enhanced land placement for Eastern Hemisphere
    for i in range(len(final_coords)):
        final_coords[i, 0], final_coords[i, 1] = attempt_land_placement(
            final_coords[i, 0], 
            final_coords[i, 1],
            normalized_coords[i, 0],
            normalized_coords[i, 1]
        )
    
    return final_coords


def generate_web_mercator_coordinates(normalized_coords: np.ndarray) -> np.ndarray:
    """
    Generate Web Mercator coordinates.
    
    Args:
        normalized_coords: Normalized coordinates in [0,1]
        
    Returns:
        Final coordinates in Web Mercator (X, Y)
    """
    # Scale to Web Mercator bounds
    final_coords = (normalized_coords - 0.5) * 2  # Scale to [-1, 1]
    final_coords[:, 0] *= WEB_MERCATOR_X_RANGE  # X coordinates
    final_coords[:, 1] *= WEB_MERCATOR_Y_RANGE  # Y coordinates
    
    # Add Web Mercator noise
    noise = np.random.normal(0, WEB_MERCATOR_NOISE_SCALE, final_coords.shape)
    final_coords += noise
    
    # Ensure coordinates stay within reasonable Web Mercator bounds
    final_coords[:, 0] = np.clip(final_coords[:, 0], -WEB_MERCATOR_BOUNDS_X, WEB_MERCATOR_BOUNDS_X)
    final_coords[:, 1] = np.clip(final_coords[:, 1], -WEB_MERCATOR_BOUNDS_Y, WEB_MERCATOR_BOUNDS_Y)
    
    return final_coords


def generate_unit_grid_coordinates(normalized_coords: np.ndarray) -> np.ndarray:
    """
    Scale normalized [0,1] coordinates to fit inside a unit grid with margins,
    add small noise, and clip to remain within bounds.

    Args:
        normalized_coords: (n_samples, 2) array of normalized coordinates in [0, 1].

    Returns:
        (n_samples, 2) array of adjusted coordinates within [0, 1].
    """
    grid_size = 1.0 - 2 * UNIT_GRID_MARGIN
    coords = normalized_coords * grid_size + UNIT_GRID_MARGIN

    noise = np.random.normal(loc=0.0, scale=UNIT_GRID_NOISE_SCALE, size=coords.shape)
    noisy_coords = coords + noise

    # Only clip values that exceed boundaries due to noise
    lower_bound = COORDINATE_BOUNDARY_EPSILON
    upper_bound = 1.0 - COORDINATE_BOUNDARY_EPSILON
    needs_clipping = (noisy_coords < lower_bound) | (noisy_coords > upper_bound)
    noisy_coords[needs_clipping] = np.clip(noisy_coords[needs_clipping], lower_bound, upper_bound)

    return noisy_coords


def transform_coordinates(
    coordinates: List[Tuple[float, float]], 
    source_crs: str, 
    target_crs: str
) -> List[Tuple[float, float]]:
    """
    Transform coordinates from one CRS to another.
    
    Args:
        coordinates: List of (x, y) coordinate tuples
        source_crs: Source coordinate reference system (e.g., "EPSG:4326")
        target_crs: Target coordinate reference system (e.g., "EPSG:3857")
        
    Returns:
        List of transformed (x, y) coordinate tuples
        
    Raises:
        ValueError: If CRS transformation fails or if CRS is not supported
    """
    try:
        import pyproj
        from pyproj import Transformer
        
        # Handle special cases for unit grid
        if source_crs == "unit_grid" or target_crs == "unit_grid":
            raise ValueError("Cannot transform to/from unit_grid CRS - it's a special case")
        
        # Create transformer
        transformer = Transformer.from_crs(source_crs, target_crs, always_xy=True)
        
        # Convert coordinates to arrays for vectorized transformation
        coords_array = np.array(coordinates)
        x = coords_array[:, 0]
        y = coords_array[:, 1]
        
        # Transform coordinates
        x_trans, y_trans = transformer.transform(x, y)
        
        # Convert back to list of tuples
        return list(zip(x_trans, y_trans))
        
    except ImportError:
        logger.error("pyproj not available for coordinate transformation")
        raise ValueError("Coordinate transformation requires pyproj")
    except Exception as e:
        logger.error(f"Error transforming coordinates: {str(e)}")
        raise ValueError(f"Failed to transform coordinates: {str(e)}")