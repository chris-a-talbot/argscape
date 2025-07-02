"""
Spatial location generation utilities for tree sequences.
Generates spatial coordinates based on genealogical relationships.
"""

import logging
import numpy as np
import tskit
from sklearn.manifold import MDS
from typing import Optional, List
from itertools import combinations
from argscape.backend.constants import (
    MDS_MAX_ITERATIONS,
    MDS_N_INIT,
    SPATIAL_GRID_SIZE,
    MINIMUM_SAMPLES_REQUIRED
)
from argscape.backend.geo_utils import (
    generate_wgs84_coordinates,
    generate_web_mercator_coordinates,
    generate_unit_grid_coordinates
)

logger = logging.getLogger(__name__)


def calculate_genealogical_distances(sample_nodes: List[int], ts: tskit.TreeSequence) -> np.ndarray:
    """
    Calculate symmetric pairwise genealogical distances between given sample nodes using tskit's divergence.
    
    Args:
        sample_nodes: List of sample node IDs.
        ts: A TreeSequence object.
    
    Returns:
        A NumPy 2D array (n x n) of pairwise distances.
    """
    n = len(sample_nodes)
    dist_matrix = np.zeros((n, n), dtype=float)

    # Generate all unique index pairs (i < j)
    index_pairs = np.array(list(combinations(range(n), 2)), dtype=np.int32)

    # Create single-node sample sets for divergence
    sample_sets = [[node] for node in sample_nodes]

    # Compute pairwise divergences (upper triangle only)
    divergences = np.array(ts.divergence(sample_sets, indexes=index_pairs, mode="branch", span_normalise=True))

    # Efficiently fill the symmetric matrix using vectorized NumPy indexing
    i_idx, j_idx = index_pairs[:, 0], index_pairs[:, 1]
    dist_matrix[i_idx, j_idx] = divergences
    dist_matrix[j_idx, i_idx] = divergences  # Symmetric

    return dist_matrix


def embed_distances_in_2d(distances: np.ndarray, random_seed: Optional[int] = None) -> np.ndarray:
    """
    Embed genealogical distances in 2D space using multidimensional scaling (MDS).
    
    Args:
        distances: Symmetric distance matrix.
        random_seed: Random seed for reproducibility.
        
    Returns:
        2D NumPy array of coordinates for each sample.
    """
    try:
        # Initialize a Multidimensional Scaling (MDS) model.
        # MDS finds a set of 2D coordinates such that the pairwise Euclidean distances
        # between them match the input distance matrix as closely as possible.
        mds = MDS(
            n_components=2,              # We want a 2D embedding
            dissimilarity='precomputed', # We're providing a distance matrix, not raw data
            random_state=random_seed,    # For reproducibility across runs
            max_iter=MDS_MAX_ITERATIONS, # Max number of optimization steps
            n_init=MDS_N_INIT,           # Try multiple random initializations; keep the best
            normalized_stress='auto'     # Normalize stress (error metric); improves stability (sklearn >= 1.2)
        )

        # Compute the 2D coordinates from the distance matrix.
        # This returns an (n_samples x 2) NumPy array where each row is a 2D position.
        return mds.fit_transform(distances)

    except Exception as e:
        # If MDS fails (e.g., due to bad input or convergence issues), log the error
        logger.warning("MDS failed, falling back to random 2D coordinates: %s", e)

        # Fall back to uniformly random 2D positions (e.g., for plotting or continuity)
        num_samples = distances.shape[0]
        rng = np.random.default_rng(seed=random_seed)
        return rng.uniform(0, SPATIAL_GRID_SIZE, size=(num_samples, 2))


def normalize_coordinates(spatial_coords: np.ndarray) -> np.ndarray:
    """
    Normalize 2D coordinates to the [0, 1] range along each axis.

    Args:
        spatial_coords: (n_samples, 2) array of raw 2D coordinates.

    Returns:
        (n_samples, 2) array of normalized coordinates in [0, 1] range.
    """
    min_coords = np.min(spatial_coords, axis=0)
    max_coords = np.max(spatial_coords, axis=0)
    coord_range = max_coords - min_coords

    # Avoid division by zero for degenerate dimensions (e.g., flat axis)
    with np.errstate(invalid='ignore', divide='ignore'):
        coord_range = np.where(coord_range == 0, 1.0, coord_range)

    return (spatial_coords - min_coords) / coord_range


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

    if ts.num_samples < MINIMUM_SAMPLES_REQUIRED:
        logger.warning(f"Need at least {MINIMUM_SAMPLES_REQUIRED} samples to generate meaningful spatial locations")
        return ts

    sample_nodes = ts.samples()
    from collections import defaultdict
    
    # Determine individual groupings (same logic as create_tree_sequence_with_spatial_data)
    individual_to_nodes = defaultdict(list)
    node_to_individual = {}

    # First, check existing individual assignments
    for node_id in sample_nodes:
        node = ts.node(node_id)
        if node.individual != -1:
            individual_to_nodes[node.individual].append(node_id)
            node_to_individual[node_id] = node.individual

    # If no existing individuals, assume diploid pairing
    if not individual_to_nodes:
        logger.info("No existing individual assignments found, assuming diploid pairing")
        for i, node_id in enumerate(sample_nodes):
            individual_id = node_id // 2  # Integer division: 0,1→0; 2,3→1; 4,5→2; etc.
            individual_to_nodes[individual_id].append(node_id)
            node_to_individual[node_id] = individual_id

    # Create representative nodes list (consistent with create_tree_sequence_with_spatial_data)
    representative_nodes = []
    for individual_id in sorted(individual_to_nodes.keys()):
        nodes_for_individual = individual_to_nodes[individual_id]
        representative_node = min(nodes_for_individual)  # Use lowest node ID as representative
        representative_nodes.append(representative_node)
    
    logger.info(f"Using {len(representative_nodes)} representatives for {len(individual_to_nodes)} individuals")

    # Distance matrix and 2D embedding based on representatives
    distances = calculate_genealogical_distances(representative_nodes, ts)
    coords_2d = embed_distances_in_2d(distances, random_seed)
    normalized_coords = normalize_coordinates(coords_2d)

    # CRS-based coordinate generation
    crs_generators = {
        "unit_grid": generate_unit_grid_coordinates,
        "EPSG:4326": generate_wgs84_coordinates,
        "EPSG:3857": generate_web_mercator_coordinates,
    }
    coord_func = crs_generators.get(crs, generate_unit_grid_coordinates)

    if crs not in crs_generators:
        logger.warning(f"Unknown CRS '{crs}', defaulting to unit_grid")

    final_coords = coord_func(normalized_coords)

    logger.info(
        f"Generated spatial coordinates from "
        f"({np.min(final_coords[:, 0]):.2f}, {np.min(final_coords[:, 1]):.2f}) "
        f"to ({np.max(final_coords[:, 0]):.2f}, {np.max(final_coords[:, 1]):.2f})"
    )

    # Pass coordinates to create_tree_sequence_with_spatial_data
    return create_tree_sequence_with_spatial_data(ts, sample_nodes, final_coords)


def create_tree_sequence_with_spatial_data(
    ts: tskit.TreeSequence, 
    sample_nodes: List[int], 
    final_coords: np.ndarray
) -> tskit.TreeSequence:
    """
    Create a new tree sequence with spatial locations for sample nodes.
    
    Preserves the original individual-to-node relationships while adding spatial
    coordinates. For diploid individuals, both sample nodes will have the same
    spatial location.
    
    Args:
        ts: Original tree sequence.
        sample_nodes: List of sample node IDs.
        final_coords: 2D array of spatial coordinates (n_representatives, 2).
    
    Returns:
        A new tree sequence with spatial locations added to individuals.
    """
    tables = ts.dump_tables()
    
    # Group sample nodes by their existing individual assignments
    from collections import defaultdict
    individual_to_nodes = defaultdict(list)
    node_to_individual = {}
    
    # First, check existing individual assignments
    for node_id in sample_nodes:
        node = ts.node(node_id)
        if node.individual != -1:
            individual_to_nodes[node.individual].append(node_id)
            node_to_individual[node_id] = node.individual
    
    # If no existing individuals, assume diploid pairing (nodes 0,1 → individual 0; nodes 2,3 → individual 1; etc.)
    if not individual_to_nodes:
        logger.info("No existing individual assignments found, assuming diploid pairing")
        for i, node_id in enumerate(sample_nodes):
            individual_id = node_id // 2  # Integer division: 0,1→0; 2,3→1; 4,5→2; etc.
            individual_to_nodes[individual_id].append(node_id)
            node_to_individual[node_id] = individual_id
    
    # Create mapping from individual to representative node (for coordinate lookup)
    representative_nodes = []
    individual_to_rep_index = {}
    
    for individual_id in sorted(individual_to_nodes.keys()):
        nodes_for_individual = individual_to_nodes[individual_id]
        representative_node = min(nodes_for_individual)  # Use lowest node ID as representative
        representative_nodes.append(representative_node)
        individual_to_rep_index[individual_id] = len(representative_nodes) - 1
    
    logger.info(f"Found {len(individual_to_nodes)} individuals with representatives: {representative_nodes}")
    
    # Ensure final_coords matches the number of representatives
    if len(final_coords) != len(representative_nodes):
        logger.error(f"Coordinate array length ({len(final_coords)}) doesn't match representatives ({len(representative_nodes)})")
        raise ValueError(f"Expected {len(representative_nodes)} coordinate pairs, got {len(final_coords)}")
    
    # Clear and rebuild individuals table with spatial data
    tables.individuals.clear()
    old_to_new_individual_id = {}
    
    for individual_id in sorted(individual_to_nodes.keys()):
        rep_index = individual_to_rep_index[individual_id]
        lon, lat = final_coords[rep_index]
        
        new_individual_id = tables.individuals.add_row(
            location=[lon, lat, 0.0],  # z = 0 for 2D spatial data
        )
        old_to_new_individual_id[individual_id] = new_individual_id
        
        logger.debug(f"Individual {individual_id} → {new_individual_id}: nodes {individual_to_nodes[individual_id]} at ({lon:.3f}, {lat:.3f})")
    
    # Rebuild nodes table with corrected individual assignments
    new_nodes = tskit.NodeTable()
    for node in ts.nodes():
        if node.id in node_to_individual:
            # This is a sample node - assign to its individual
            old_individual_id = node_to_individual[node.id]
            new_individual_id = old_to_new_individual_id[old_individual_id]
        else:
            # Non-sample node - no individual assignment
            new_individual_id = tskit.NULL
            
        new_nodes.add_row(
            time=node.time,
            flags=node.flags,
            population=node.population,
            individual=new_individual_id,
            metadata=node.metadata,
        )
    tables.nodes.replace_with(new_nodes)

    result_ts = tables.tree_sequence()
    logger.info(f"Added spatial locations to {len(individual_to_nodes)} individuals covering {len(sample_nodes)} sample nodes")

    return result_ts
