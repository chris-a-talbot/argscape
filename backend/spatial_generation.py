"""
Spatial location generation utilities for tree sequences.
Generates spatial coordinates based on genealogical relationships.
"""

import logging
import numpy as np
import tskit
from sklearn.manifold import MDS
from typing import Optional, List, Tuple
from constants import (
    GENEALOGICAL_DISTANCE_FALLBACK,
    MDS_MAX_ITERATIONS,
    MDS_N_INIT,
    SPATIAL_GRID_SIZE,
    UNIT_GRID_MARGIN,
    UNIT_GRID_NOISE_SCALE,
    COORDINATE_BOUNDARY_EPSILON,
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
    MAX_LAND_PLACEMENT_ATTEMPTS,
    LOCAL_SEARCH_STRATEGIES,
    LAND_SEARCH_RADIUS_BASE,
    LAND_SEARCH_RADIUS_INCREMENT,
    GEOGRAPHIC_LAND_REGIONS,
    MINIMUM_SAMPLES_REQUIRED
)

logger = logging.getLogger(__name__)


def calculate_genealogical_distances(sample_nodes: List[int], ts: tskit.TreeSequence) -> np.ndarray:
    """
    Calculate pairwise genealogical distances between sample nodes.
    
    Args:
        sample_nodes: List of sample node IDs
        ts: Tree sequence to analyze
        
    Returns:
        Symmetric distance matrix between samples
    """
    num_samples = len(sample_nodes)
    genealogical_distances = np.zeros((num_samples, num_samples))
    
    for i, node_i in enumerate(sample_nodes):
        for j, node_j in enumerate(sample_nodes):
            if i == j:
                continue
            
            total_distance = 0.0
            total_span = 0.0
            
            for tree in ts.trees():
                if tree.span == 0:
                    continue
                    
                try:
                    mrca = tree.mrca(node_i, node_j)
                    if mrca != tskit.NULL:
                        # Distance is sum of branch lengths from both nodes to MRCA
                        distance = (tree.time(mrca) - tree.time(node_i)) + (tree.time(mrca) - tree.time(node_j))
                        total_distance += distance * tree.span
                        total_span += tree.span
                except Exception:
                    # If MRCA calculation fails, use a large distance
                    total_distance += GENEALOGICAL_DISTANCE_FALLBACK * tree.span
                    total_span += tree.span
            
            if total_span > 0:
                genealogical_distances[i, j] = total_distance / total_span
            else:
                genealogical_distances[i, j] = GENEALOGICAL_DISTANCE_FALLBACK
    
    # Ensure the distance matrix is symmetric
    return (genealogical_distances + genealogical_distances.T) / 2


def embed_distances_in_2d(distances: np.ndarray, random_seed: Optional[int] = None) -> np.ndarray:
    """
    Embed genealogical distances in 2D space using multidimensional scaling.
    
    Args:
        distances: Symmetric distance matrix
        random_seed: Random seed for reproducible results
        
    Returns:
        2D coordinates for each sample
    """
    try:
        mds = MDS(
            n_components=2, 
            dissimilarity='precomputed', 
            random_state=random_seed,
            max_iter=MDS_MAX_ITERATIONS, 
            n_init=MDS_N_INIT
        )
        return mds.fit_transform(distances)
    except Exception as e:
        logger.warning(f"MDS failed, using random locations: {e}")
        # Fallback to random locations if MDS fails
        num_samples = distances.shape[0]
        return np.random.uniform(0, SPATIAL_GRID_SIZE, size=(num_samples, 2))


def normalize_coordinates(spatial_coords: np.ndarray) -> np.ndarray:
    """
    Normalize coordinates to [0,1] range.
    
    Args:
        spatial_coords: Raw 2D coordinates
        
    Returns:
        Normalized coordinates in [0,1] range
    """
    min_coords = np.min(spatial_coords, axis=0)
    max_coords = np.max(spatial_coords, axis=0)
    coord_range = max_coords - min_coords
    
    # Handle case where all points are identical
    coord_range[coord_range == 0] = 1.0
    
    return (spatial_coords - min_coords) / coord_range


def generate_unit_grid_coordinates(normalized_coords: np.ndarray) -> np.ndarray:
    """
    Generate coordinates for unit grid [0,1] with margins and noise.
    
    Args:
        normalized_coords: Normalized coordinates in [0,1]
        
    Returns:
        Final coordinates for unit grid
    """
    grid_size = 1.0 - 2 * UNIT_GRID_MARGIN
    final_coords = normalized_coords * grid_size + UNIT_GRID_MARGIN
    
    # Add minimal noise for unit grid
    noise = np.random.normal(0, UNIT_GRID_NOISE_SCALE, final_coords.shape)
    final_coords += noise
    
    # Ensure coordinates stay within [0,1] bounds
    return np.clip(final_coords, COORDINATE_BOUNDARY_EPSILON, 1 - COORDINATE_BOUNDARY_EPSILON)


def find_closest_land_region(longitude: float, latitude: float) -> Tuple[float, float, float, float, str]:
    """
    Find the closest land region to given coordinates.
    
    Args:
        longitude: Longitude coordinate
        latitude: Latitude coordinate
        
    Returns:
        Tuple of (center_lon, center_lat, radius_lon, radius_lat, name)
    """
    min_dist = float('inf')
    closest_region = GEOGRAPHIC_LAND_REGIONS[0]
    
    for region in GEOGRAPHIC_LAND_REGIONS:
        center_lon, center_lat = region[0], region[1]
        dist = ((longitude - center_lon) ** 2 + (latitude - center_lat) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest_region = region
    
    return closest_region


def attempt_land_placement(
    longitude: float, 
    latitude: float,
    original_normalized_x: float,
    original_normalized_y: float
) -> Tuple[float, float]:
    """
    Attempt to place coordinates on land using multiple strategies.
    
    Args:
        longitude: Initial longitude
        latitude: Initial latitude
        original_normalized_x: Original normalized x coordinate [0,1]
        original_normalized_y: Original normalized y coordinate [0,1]
        
    Returns:
        Tuple of (final_longitude, final_latitude)
    """
    try:
        from geographic_utils import is_point_on_land_eastern_hemisphere
    except ImportError:
        # If geographic utils not available, return original coordinates
        return longitude, latitude
    
    # If already on land, keep it
    if is_point_on_land_eastern_hemisphere(longitude, latitude):
        return longitude, latitude
    
    # Strategy 1: Local search around current position
    found_land, final_lon, final_lat = attempt_local_land_search(longitude, latitude)
    if found_land:
        return final_lon, final_lat
    
    # Strategy 2: Regional placement based on original position
    return attempt_regional_land_placement(original_normalized_x, original_normalized_y)


def attempt_local_land_search(longitude: float, latitude: float) -> Tuple[bool, float, float]:
    """
    Attempt to find land near the current position using local search.
    
    Args:
        longitude: Current longitude
        latitude: Current latitude
        
    Returns:
        Tuple of (found_land, final_longitude, final_latitude)
    """
    try:
        from geographic_utils import is_point_on_land_eastern_hemisphere
    except ImportError:
        return False, longitude, latitude
    
    local_attempts = MAX_LAND_PLACEMENT_ATTEMPTS // 2
    
    for attempt in range(local_attempts):
        search_radius = LAND_SEARCH_RADIUS_BASE + attempt * LAND_SEARCH_RADIUS_INCREMENT
        
        for strategy in range(LOCAL_SEARCH_STRATEGIES):
            new_lon, new_lat = generate_search_candidate(
                longitude, latitude, search_radius, strategy, attempt
            )
            
            # Ensure bounds
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
        closest_region = find_closest_land_region(longitude, latitude)
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


def generate_wgs84_coordinates(normalized_coords: np.ndarray) -> np.ndarray:
    """
    Generate WGS84 geographic coordinates with land placement.
    
    Args:
        normalized_coords: Normalized coordinates in [0,1]
        
    Returns:
        Final coordinates in WGS84 (longitude, latitude)
    """
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


def generate_spatial_locations_for_samples(
    ts: tskit.TreeSequence, 
    random_seed: Optional[int] = None, 
    crs: str = "unit_grid"
) -> tskit.TreeSequence:
    """
    Generate 2D spatial locations for sample nodes based on genealogical relationships.
    
    More closely related samples will be placed closer together in space.
    Uses multidimensional scaling to embed genealogical distances in 2D space.
    
    Args:
        ts: Tree sequence to add spatial locations to
        random_seed: Random seed for reproducible results
        crs: Coordinate reference system ("unit_grid", "EPSG:4326", "EPSG:3857")
        
    Returns:
        Tree sequence with spatial locations added to sample individuals
    """
    logger.info(f"Generating spatial locations for {ts.num_samples} samples")
    
    if random_seed is not None:
        np.random.seed(random_seed)
    
    # Get sample node IDs
    sample_nodes = [node.id for node in ts.nodes() if node.is_sample()]
    
    if len(sample_nodes) < MINIMUM_SAMPLES_REQUIRED:
        logger.warning(f"Need at least {MINIMUM_SAMPLES_REQUIRED} samples to generate meaningful spatial locations")
        return ts
    
    # Calculate genealogical distances
    genealogical_distances = calculate_genealogical_distances(sample_nodes, ts)
    
    # Embed distances in 2D space
    spatial_coords = embed_distances_in_2d(genealogical_distances, random_seed)
    
    # Normalize coordinates to [0,1] range
    normalized_coords = normalize_coordinates(spatial_coords)
    
    # Generate coordinates based on the specified CRS
    if crs == "unit_grid":
        final_coords = generate_unit_grid_coordinates(normalized_coords)
    elif crs == "EPSG:4326":  # WGS84 Geographic coordinates
        final_coords = generate_wgs84_coordinates(normalized_coords)
    elif crs == "EPSG:3857":  # Web Mercator
        final_coords = generate_web_mercator_coordinates(normalized_coords)
    else:
        # Default to unit grid for unknown CRS
        logger.warning(f"Unknown CRS '{crs}', defaulting to unit_grid")
        final_coords = generate_unit_grid_coordinates(normalized_coords)
    
    logger.info(f"Generated spatial coordinates ranging from "
                f"({np.min(final_coords[:, 0]):.2f}, {np.min(final_coords[:, 1]):.2f}) to "
                f"({np.max(final_coords[:, 0]):.2f}, {np.max(final_coords[:, 1]):.2f})")
    
    # Create a new tree sequence with individuals and spatial locations
    return create_tree_sequence_with_spatial_data(ts, sample_nodes, final_coords)


def create_tree_sequence_with_spatial_data(
    ts: tskit.TreeSequence, 
    sample_nodes: List[int], 
    final_coords: np.ndarray
) -> tskit.TreeSequence:
    """
    Create a new tree sequence with spatial locations for sample nodes.
    
    Args:
        ts: Original tree sequence
        sample_nodes: List of sample node IDs
        final_coords: Final 2D coordinates for each sample
        
    Returns:
        Tree sequence with spatial locations added
    """
    tables = ts.dump_tables()
    
    # Clear existing individuals table
    tables.individuals.clear()
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    # Create individuals for sample nodes with spatial locations
    node_to_individual = {}
    for i, node_id in enumerate(sample_nodes):
        # Create 3D location (z=0 for 2D locations)
        location_3d = np.array([final_coords[i, 0], final_coords[i, 1], 0.0])
        
        individual_id = tables.individuals.add_row(
            flags=0,
            location=location_3d,
            parents=[],
            metadata=b''
        )
        node_to_individual[node_id] = individual_id
    
    # Update nodes to reference individuals
    new_nodes = tables.nodes.copy()
    new_nodes.clear()
    
    for node in ts.nodes():
        individual_id = node_to_individual.get(node.id, -1)
        new_nodes.add_row(
            time=node.time,
            flags=node.flags,
            population=node.population,
            individual=individual_id,
            metadata=node.metadata
        )
    
    tables.nodes.replace_with(new_nodes)
    
    result_ts = tables.tree_sequence()
    logger.info(f"Added spatial locations to {len(sample_nodes)} sample individuals")
    
    return result_ts 