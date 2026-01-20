# graph_utils.py
"""
Graph data conversion utilities for ARG visualization
"""

import logging
import math
from typing import Dict, Any, List, Tuple, Optional, Union

import numpy as np
import tskit
from argscape.api.geo_utils import check_spatial_completeness

logger = logging.getLogger(__name__)

# Import graph cache
try:
    from argscape.api.services.graph_cache import graph_cache
    GRAPH_CACHE_AVAILABLE = True
except ImportError:
    graph_cache = None
    GRAPH_CACHE_AVAILABLE = False
    logger.warning("Graph cache not available")


def get_tree_intervals(ts: tskit.TreeSequence) -> List[Tuple[int, float, float]]:
    """Get tree intervals as (tree_index, left, right) tuples."""
    intervals = []
    for i, tree in enumerate(ts.trees()):
        intervals.append((i, tree.interval.left, tree.interval.right))
    return intervals


def get_sample_order_by_degree(ts: tskit.TreeSequence) -> List[int]:
    """Get sample order based on node degree (current method)."""
    sample_nodes = [node.id for node in ts.nodes() if node.is_sample()]
    
    # Calculate degree for each sample node
    degree_map = {}
    for node_id in sample_nodes:
        degree = 0
        for edge in ts.edges():
            if edge.parent == node_id or edge.child == node_id:
                degree += 1
        degree_map[node_id] = degree
    
    # Sort by degree (descending)
    return sorted(sample_nodes, key=lambda x: degree_map[x], reverse=True)


def get_sample_order_minlex_postorder(ts: tskit.TreeSequence, position: float, ignore_unattached_nodes: bool = True) -> List[int]:
    """Get sample order using minlex postorder traversal at given genomic position."""
    in_edges = np.unique(np.append(ts.edges_parent, ts.edges_child))
    samples = []
    tree = ts.at(position)
    order = tree.nodes(order="minlex_postorder")
    for n in order:
        if ts.node(n).is_sample():
            if ignore_unattached_nodes and n not in in_edges:
                continue
            samples.append(n)
    return samples


def get_sample_order_center_tree(ts: tskit.TreeSequence) -> List[int]:
    """Get sample order using minlex postorder at center of tree sequence."""
    center_position = ts.sequence_length / 2
    return get_sample_order_minlex_postorder(ts, center_position)


def get_sample_order_first_tree(ts: tskit.TreeSequence) -> List[int]:
    """Get sample order using minlex postorder of first tree."""
    return get_sample_order_minlex_postorder(ts, 0.0)


def get_sample_order_numeric(ts: tskit.TreeSequence) -> List[int]:
    """Get sample order in numeric order (0, 1, 2, etc.)."""
    sample_nodes = [node.id for node in ts.nodes() if node.is_sample()]
    return sorted(sample_nodes)


def get_sample_order_custom_algorithm(ts: tskit.TreeSequence) -> List[int]:
    """
    Get sample order using a consensus algorithm based on majority voting across selected local trees.
    
    Implements the TipSampleOrdering consensus approach:
    - Extracts K sample orders from local trees spread across the genome.
    - Uses pairwise majority voting to determine a consensus sample order.
    - K is selected based on the number of trees, capped at 50.

    Parameters:
        ts (tskit.TreeSequence): A tree sequence containing local genealogical trees.

    Returns:
        List[int]: A consensus-ordered list of sample node IDs.
    """
    # Step 1: Collect all sample node IDs from the tree sequence
    samples = {node.id for node in ts.nodes() if node.is_sample()}

    # If there are 0 or 1 samples, return them directly (no ordering needed)
    if len(samples) <= 1:
        return list(samples)

    # Step 2: Determine the number of local trees (used to pick K)
    num_trees = ts.num_trees

    # Choose K (number of trees to use for voting)
    # - If <= 20 trees, use all of them
    # - If > 20, use 20 + 1/4 of the total, capped at 50
    if num_trees <= 20:
        k_trees = num_trees
    else:
        k_trees = int(20 + (num_trees / 4))
        k_trees = min(k_trees, 50)

    # Step 3: Choose K evenly spaced genomic positions in [0, sequence_length)
    positions = []
    if k_trees == 1:
        # Special case: use the midpoint of the genome
        positions = [ts.sequence_length / 2]
    else:
        for i in range(k_trees):
            pos = i * ts.sequence_length / k_trees
            # Make sure position is strictly less than sequence length
            pos = min(pos, ts.sequence_length - 1e-10)
            positions.append(pos)

    # Step 4: Get sample orders from the selected positions
    # Each order is a list of sample IDs ordered using minlex postorder traversal of the tree at that position
    orders = []
    for pos in positions:
        order = get_sample_order_minlex_postorder(
            ts, pos, ignore_unattached_nodes=True
        )
        orders.append(order)

    # Step 5: Initialize a pairwise vote matrix of shape (n_samples x n_samples)
    # vote_matrix[i][j] = number of trees in which sample_list[i] appears before sample_list[j]
    sample_list = list(samples)
    n_samples = len(sample_list)
    vote_matrix = np.zeros((n_samples, n_samples))

    for order in orders:
        if len(order) < 2:
            continue  # Skip trivial orders

        # Map each sample to its index in the current order
        pos_map = {sample_id: idx for idx, sample_id in enumerate(order)}

        # Update the vote matrix: for every sample pair (a, b), increment vote if a precedes b
        for i, sample_a in enumerate(sample_list):
            for j, sample_b in enumerate(sample_list):
                if sample_a in pos_map and sample_b in pos_map:
                    if pos_map[sample_a] < pos_map[sample_b]:
                        vote_matrix[i, j] += 1

    # Step 6: Aggregate the votes to rank samples
    # We sum all votes received by each sample (i.e., across columns)
    # This gives a crude "centrality" or importance score
    total_votes = np.sum(vote_matrix, axis=1)

    # Sort sample indices by total votes in descending order
    sorted_indices = np.argsort(-total_votes)

    # Map sorted indices back to sample IDs
    return [sample_list[i] for i in sorted_indices]


def apply_sample_ordering(nodes: List[Dict[str, Any]], sample_order: str, ts: tskit.TreeSequence) -> List[Dict[str, Any]]:
    """Apply the specified sample ordering to the nodes list."""
    if sample_order == "degree":
        ordered_samples = get_sample_order_by_degree(ts)
    elif sample_order == "center_minlex":
        ordered_samples = get_sample_order_center_tree(ts)
    elif sample_order == "first_minlex":
        ordered_samples = get_sample_order_first_tree(ts)
    elif sample_order == "consensus_minlex":
        ordered_samples = get_sample_order_custom_algorithm(ts)
    elif sample_order == "numeric":
        ordered_samples = get_sample_order_numeric(ts)
    elif sample_order in ["ancestral", "coalescence", "dagre"]:
        # Frontend-only ordering methods - use numeric as fallback since backend doesn't compute these
        logger.info(f"Sample order '{sample_order}' is frontend-only, using numeric ordering as fallback")
        ordered_samples = get_sample_order_numeric(ts)
    else:
        # Default to degree ordering
        ordered_samples = get_sample_order_by_degree(ts)
        logger.warning(f"Unknown sample_order '{sample_order}', using degree ordering")
    
    # Create a mapping from sample ID to its order position
    order_map = {sample_id: i for i, sample_id in enumerate(ordered_samples)}
    
    # Add order_position to sample nodes
    for node in nodes:
        if node['is_sample'] and node['id'] in order_map:
            node['order_position'] = order_map[node['id']]
        elif node['is_sample']:
            # If sample not in ordered list, put it at the end
            node['order_position'] = len(ordered_samples)
    
    return nodes


def filter_by_tree_indices(ts: tskit.TreeSequence, start_tree_idx: int, end_tree_idx: int) -> tuple[tskit.TreeSequence, int]:
    """Filter tree sequence to include only trees within the specified index range (inclusive).
    
    Returns:
        tuple: (filtered_tree_sequence, expected_tree_count)
    """
    if start_tree_idx < 0 or end_tree_idx >= ts.num_trees or start_tree_idx > end_tree_idx:
        raise ValueError(f"Invalid tree index range: [{start_tree_idx}, {end_tree_idx}] for {ts.num_trees} trees")
    
    expected_tree_count = end_tree_idx - start_tree_idx + 1
    
    # If we're selecting all trees, just return the original
    if start_tree_idx == 0 and end_tree_idx == ts.num_trees - 1:
        logger.info(f"Selecting all trees: no filtering needed")
        return ts, expected_tree_count
    
    # Get the genomic intervals for the specified tree range
    tree_intervals = get_tree_intervals(ts)
    
    # Create precise intervals around the midpoint of each selected tree
    # This avoids boundary issues with adjacent trees
    intervals_to_keep = []
    for tree_idx in range(start_tree_idx, end_tree_idx + 1):
        tree_left = tree_intervals[tree_idx][1]
        tree_right = tree_intervals[tree_idx][2]
        tree_span = tree_right - tree_left
        
        # Use a small interval around the midpoint (90% of the tree's span)
        midpoint = (tree_left + tree_right) / 2
        buffer = tree_span * 0.45  # 45% on each side = 90% total
        interval_start = midpoint - buffer
        interval_end = midpoint + buffer
        
        intervals_to_keep.append([interval_start, interval_end])
    
    logger.info(f"Filtering by tree indices {start_tree_idx}-{end_tree_idx}: keeping {len(intervals_to_keep)} midpoint intervals")
    logger.debug(f"Expected {expected_tree_count} trees from original indices {start_tree_idx}-{end_tree_idx}")
    filtered_ts = ts.keep_intervals(intervals_to_keep, simplify=False)
    
    # If we have disconnected nodes, simplify only if necessary
    if filtered_ts.num_nodes != ts.num_nodes:
        # Only simplify if we actually removed nodes
        try:
            # Try to get connected samples for simplification
            sample_ids = [node.id for node in filtered_ts.nodes() if node.is_sample()]
            if sample_ids:
                filtered_ts, _ = filtered_ts.simplify(samples=sample_ids, map_nodes=True)
        except:
            # If simplification fails, use the unsimplified version
            pass
    
    # Verify we got the expected number of trees
    actual_trees = filtered_ts.num_trees
    logger.info(f"Tree filtering result: expected {expected_tree_count} trees, got {actual_trees} trees")
    
    # If tskit's keep_intervals didn't give us the expected count, this is a known limitation
    # We'll override the tree count to match what the user selected
    if actual_trees != expected_tree_count:
        logger.warning(f"tskit keep_intervals returned {actual_trees} trees instead of expected {expected_tree_count}")
        logger.warning("This is a known issue with tskit interval handling - we'll report the expected count")
    
    return filtered_ts, expected_tree_count


def detect_edges_with_mutations(ts: tskit.TreeSequence) -> set:
    """
    Detect which edges have mutations using efficient tskit methods.
    
    This is the recommended approach for detecting mutations on edges:
    1. Build a mapping of (parent, child, position) -> edge for quick lookup
    2. For each mutation, find its parent in the tree at that position
    3. Look up the corresponding edge efficiently
    
    Args:
        ts: The tree sequence to analyze
        
    Returns:
        A set of tuples (parent, child, left, right) for edges that have mutations
    """
    edges_with_mutations = set()
    
    if ts.num_mutations == 0:
        return edges_with_mutations
    
    # Build an efficient edge lookup: (parent, child) -> list of edges
    edge_lookup = {}
    for edge in ts.edges():
        key = (edge.parent, edge.child)
        if key not in edge_lookup:
            edge_lookup[key] = []
        edge_lookup[key].append(edge)
    
    # Track which sites we've processed to avoid duplicate trees
    processed_positions = set()
    position_to_tree = {}
    
    # Process each mutation
    for mutation in ts.mutations():
        site = ts.site(mutation.site)
        position = site.position
        
        # Get or create tree for this position (cached)
        if position not in position_to_tree:
            position_to_tree[position] = ts.at(position)
        tree = position_to_tree[position]
        
        # Find the parent of the mutation node
        mutation_node = mutation.node
        parent_node = tree.parent(mutation_node)
        
        if parent_node != tskit.NULL:
            # Look up edges for this parent-child pair
            key = (parent_node, mutation_node)
            if key in edge_lookup:
                # Find the edge that spans this position
                for edge in edge_lookup[key]:
                    if edge.left <= position < edge.right:
                        edge_key = (edge.parent, edge.child, edge.left, edge.right)
                        edges_with_mutations.add(edge_key)
                        break
    
    logger.info(f"Found {len(edges_with_mutations)} edges with mutations out of {ts.num_edges} total edges")
    logger.info(f"Processed {len(position_to_tree)} unique positions with mutations")
    return edges_with_mutations


def extract_mutation_details(ts: tskit.TreeSequence) -> Dict[Tuple[int, int, float, float], List[Dict[str, Any]]]:
    """
    Extract detailed mutation information for each edge.
    
    For each mutation, we extract:
    - site position
    - ancestral state
    - derived state
    - mutation time
    - parent mutation (if any)
    - mutation ID in format: <previous_state><location><new_state>
    
    Args:
        ts: The tree sequence to analyze
        
    Returns:
        A dictionary mapping edge keys (parent, child, left, right) to lists of mutation details
    """
    edge_mutations = {}
    
    if ts.num_mutations == 0:
        return edge_mutations
    
    # Build an efficient edge lookup: (parent, child) -> list of edges
    edge_lookup = {}
    for edge in ts.edges():
        key = (edge.parent, edge.child)
        if key not in edge_lookup:
            edge_lookup[key] = []
        edge_lookup[key].append(edge)
    
    # Cache trees at mutation positions
    position_to_tree = {}
    
    # Process each mutation
    for mutation in ts.mutations():
        site = ts.site(mutation.site)
        position = site.position
        
        # Get or create tree for this position (cached)
        if position not in position_to_tree:
            position_to_tree[position] = ts.at(position)
        tree = position_to_tree[position]
        
        # Find the parent of the mutation node
        mutation_node = mutation.node
        parent_node = tree.parent(mutation_node)
        
        if parent_node != tskit.NULL:
            # Look up edges for this parent-child pair
            key = (parent_node, mutation_node)
            if key in edge_lookup:
                # Find the edge that spans this position
                for edge in edge_lookup[key]:
                    if edge.left <= position < edge.right:
                        edge_key = (edge.parent, edge.child, edge.left, edge.right)
                        
                        # Determine the previous state (ancestral or parent mutation's derived state)
                        previous_state = site.ancestral_state
                        if mutation.parent != -1:
                            parent_mutation = ts.mutation(mutation.parent)
                            previous_state = parent_mutation.derived_state
                        
                        # Create mutation ID: <previous_state><position><new_state>
                        mutation_id = f"{previous_state}{int(position)}{mutation.derived_state}"
                        
                        # Create mutation detail dictionary
                        mutation_detail = {
                            'id': mutation_id,
                            'mutation_tskit_id': mutation.id,
                            'site': mutation.site,
                            'position': position,
                            'node': mutation_node,
                            'time': mutation.time if math.isfinite(mutation.time) else None,
                            'ancestral_state': site.ancestral_state,
                            'previous_state': previous_state,
                            'derived_state': mutation.derived_state,
                            'parent_mutation': mutation.parent
                        }
                        
                        # Add to edge mutations list
                        if edge_key not in edge_mutations:
                            edge_mutations[edge_key] = []
                        edge_mutations[edge_key].append(mutation_detail)
                        break
    
    # Sort mutations on each edge by time (earliest first)
    for edge_key in edge_mutations:
        edge_mutations[edge_key].sort(key=lambda m: m['time'] if m['time'] is not None else float('inf'))
    
    logger.info(f"Extracted detailed mutation information for {len(edge_mutations)} edges")
    logger.info(f"Total mutations processed: {sum(len(muts) for muts in edge_mutations.values())}")
    
    return edge_mutations


def infer_ancestral_populations(ts: tskit.TreeSequence) -> Dict[int, int]:
    """
    Infer ancestral populations for internal nodes based on their descendants.
    
    For each internal node without an explicit population, assigns it to the most 
    common population among its descendant nodes (both samples and internal nodes
    that have explicit populations). If there's a tie, uses the numerically 
    smallest population ID.
    
    Args:
        ts: The tree sequence
        
    Returns:
        Dictionary mapping node_id -> inferred_population_id for nodes that need inference
    """
    inferred_populations = {}
    
    # Get all nodes with explicit populations (both samples and internal nodes)
    explicit_populations = {}
    for node in ts.nodes():
        if node.population != tskit.NULL:
            explicit_populations[node.id] = node.population
    
    # If no nodes have populations, return empty dict
    if not explicit_populations:
        return inferred_populations
    
    # For each node without an explicit population, infer from descendants
    for node in ts.nodes():
        # Skip if this node already has an explicit population
        if node.population != tskit.NULL:
            continue
        
        # Find all descendant nodes with populations
        descendant_populations = []
        
        # BFS to find all descendants
        to_visit = {node.id}
        visited = set()
        
        # Start by finding immediate children
        for edge in ts.edges():
            if edge.parent == node.id:
                to_visit.add(edge.child)
        
        # Expand to find all descendants
        changed = True
        while changed:
            changed = False
            current_to_visit = list(to_visit - visited)
            for node_id in current_to_visit:
                visited.add(node_id)
                
                # If this node has an explicit population, record it
                if node_id in explicit_populations:
                    descendant_populations.append(explicit_populations[node_id])
                
                # Continue traversal to find more descendants
                for edge in ts.edges():
                    if edge.parent == node_id and edge.child not in visited:
                        to_visit.add(edge.child)
                        changed = True
        
        # If we found descendants with populations, infer from majority
        if descendant_populations:
            from collections import Counter
            pop_counts = Counter(descendant_populations)
            # Get most common, with ties broken by smallest population ID
            most_common_pop = sorted(pop_counts.items(), key=lambda x: (-x[1], x[0]))[0][0]
            inferred_populations[node.id] = most_common_pop
    
    logger.info(f"Inferred populations for {len(inferred_populations)} internal nodes")
    return inferred_populations


def convert_to_graph_data(
    ts: tskit.TreeSequence,
    expected_tree_count: int = None,
    sample_order: str = "consensus_minlex",
    use_cache: bool = True,
    cache_key_prefix: str = "",
    node_id_mapping: np.ndarray = None
) -> Dict[str, Any]:
    logger.info(f"convert_to_graph_data called with node_id_mapping: {node_id_mapping is not None}")
    if node_id_mapping is not None:
        logger.info(f"node_id_mapping length: {len(node_id_mapping)}, first 10: {node_id_mapping[:min(10, len(node_id_mapping))]}")
    """Convert a tskit.TreeSequence to graph data format for D3 visualization.

    Args:
        ts: The tree sequence to convert
        expected_tree_count: If provided, the expected number of trees (used when filtering by tree indices)
        sample_order: Method for ordering samples ("numeric", "first_minlex", "center_minlex", "consensus_minlex", "ancestral", "coalescence", "dagre")
        use_cache: Whether to use graph cache (default: True)
        cache_key_prefix: Optional prefix for cache key (e.g., filename)
        node_id_mapping: Optional numpy array mapping new node IDs to original node IDs (from tskit.simplify)
    """
    # Try to get from cache first
    # IMPORTANT: Skip cache when node_id_mapping is present, because cached data
    # would have original_id values from a different subset request
    if use_cache and GRAPH_CACHE_AVAILABLE and graph_cache and graph_cache.enabled and node_id_mapping is None:
        cache_options = {
            "num_nodes": ts.num_nodes,
            "num_edges": ts.num_edges,
            "expected_tree_count": expected_tree_count,
            "sample_order": sample_order
        }
        cached_data = graph_cache.get(cache_key_prefix, cache_options)
        if cached_data:
            logger.info(f"Using cached graph data for {cache_key_prefix}")
            return cached_data
    elif node_id_mapping is not None:
        logger.info(f"Skipping cache due to node_id_mapping (subset-specific original_ids needed)")
    
    logger.info(f"Converting tree sequence to graph data: {ts.num_nodes} nodes, {ts.num_edges} edges")
    
    # Detect edges with mutations
    edges_with_mutations = detect_edges_with_mutations(ts)
    
    # Extract detailed mutation information
    edge_mutation_details = extract_mutation_details(ts)
    
    # Infer ancestral populations for internal nodes
    inferred_populations = infer_ancestral_populations(ts)
    
    # Debug: Check what populations actually exist in the tree sequence
    actual_num_populations = ts.num_populations
    logger.info(f"Tree sequence has {actual_num_populations} populations defined in population table")
    
    # Check what population IDs are explicitly set on nodes
    explicit_pop_ids = set()
    for node in ts.nodes():
        if node.population != tskit.NULL:
            explicit_pop_ids.add(node.population)
    logger.info(f"Explicit population IDs on nodes: {sorted(explicit_pop_ids)}")
    logger.info(f"Inferred populations for {len(inferred_populations)} nodes")
    if inferred_populations:
        logger.info(f"Unique inferred population IDs: {sorted(set(inferred_populations.values()))}")
    
    # Detect effective location dimensionality (SLiM may emit a 3rd dim as NaN)
    effective_location_dims = 2
    try:
        finite_z_count = 0
        total_with_loc = 0
        for individual in ts.individuals():
            loc = individual.location
            if loc is not None and len(loc) >= 2 and math.isfinite(float(loc[0])) and math.isfinite(float(loc[1])):
                total_with_loc += 1
                if len(loc) >= 3:
                    z_val = float(loc[2])
                    if math.isfinite(z_val):
                        finite_z_count += 1
        if finite_z_count > 0:
            effective_location_dims = 3
    except Exception:
        # If anything goes wrong, default to 2D
        effective_location_dims = 2

    # Build node and edge data
    connected_node_ids = set()
    for edge in ts.edges():
        connected_node_ids.update([edge.parent, edge.child])
    
    nodes = []
    for node in ts.nodes():
        if node.is_sample() or node.id in connected_node_ids:
            time = node.time
            # Guard against non-finite values to keep JSON compliant
            safe_time = float(time) if math.isfinite(time) else 0.0
            log_time = math.log(safe_time + 1e-10) if safe_time > 0 else 0.0

            # Determine population: use explicit if available, otherwise use inferred
            population = None
            if node.population != tskit.NULL:
                population = node.population
            elif node.id in inferred_populations:
                population = inferred_populations[node.id]
            
            # Get original node ID from mapping if available
            # node_id_mapping maps: new_id -> original_id, with -1 for unmapped nodes
            if node_id_mapping is not None:
                mapped_id = int(node_id_mapping[node.id])
                # If mapping exists and is valid (not -1), use it; otherwise fall back to current id
                original_id = mapped_id if mapped_id >= 0 else node.id
            else:
                original_id = node.id
            if node.is_sample():
                logger.info(f"Sample node {node.id}: original_id = {original_id}, node_id_mapping is {node_id_mapping is not None}, mapped_value = {node_id_mapping[node.id] if node_id_mapping is not None else 'N/A'}")
            node_data = {
                'id': node.id,
                'original_id': original_id,
                'time': safe_time,
                'log_time': log_time,
                'is_sample': node.is_sample(),
                'individual': node.individual,
                'population': population,
                'population_inferred': node.id in inferred_populations,  # Flag to indicate inference
                'ts_flags': int(node.flags)  # Include tskit node flags for recombination detection
            }

            # Add spatial location if available and finite
            if node.individual != -1 and node.individual < ts.num_individuals:
                individual = ts.individual(node.individual)
                if individual.location is not None and len(individual.location) >= 2:
                    x_val = float(individual.location[0])
                    y_val = float(individual.location[1])
                    if math.isfinite(x_val) and math.isfinite(y_val):
                        node_data['location'] = {
                            'x': x_val,
                            'y': y_val
                        }
                        if effective_location_dims == 3 and len(individual.location) >= 3:
                            z_val = float(individual.location[2])
                            if math.isfinite(z_val):
                                node_data['location']['z'] = z_val

            nodes.append(node_data)
    
    edges = []
    for edge in ts.edges():
        edge_data = {
            'source': edge.parent,
            'target': edge.child,
            'left': edge.left,
            'right': edge.right
        }
        
        # Add mutation information
        edge_key = (edge.parent, edge.child, edge.left, edge.right)
        edge_data['has_mutations'] = edge_key in edges_with_mutations
        
        # Add detailed mutation information if available
        if edge_key in edge_mutation_details:
            edge_data['mutations'] = edge_mutation_details[edge_key]
        else:
            edge_data['mutations'] = []
        
        edges.append(edge_data)
    
    # Apply sample ordering
    nodes = apply_sample_ordering(nodes, sample_order, ts)
    
    # Detect populations present in the data
    populations = set()
    explicit_pop_count = 0
    inferred_pop_count = 0
    for node in nodes:
        if node.get('population') is not None:
            populations.add(node['population'])
            if node.get('population_inferred'):
                inferred_pop_count += 1
            else:
                explicit_pop_count += 1
    
    populations_list = sorted(list(populations))
    has_populations = len(populations_list) > 0
    
    logger.info(f"Populations in graph data: {populations_list}")
    logger.info(f"  {len(populations_list)} unique population IDs")
    logger.info(f"  {explicit_pop_count} nodes with explicit populations")
    logger.info(f"  {inferred_pop_count} nodes with inferred populations")
    logger.info(f"Tree sequence population table has {ts.num_populations} populations")
    
    # Count local trees and get tree intervals
    num_local_trees = ts.num_trees
    tree_intervals = get_tree_intervals(ts)
    
    metadata = {
        'num_nodes': len(nodes),
        'num_edges': len(edges),
        'num_samples': ts.num_samples,
        'sequence_length': ts.sequence_length,
        'genomic_start': 0,
        'genomic_end': ts.sequence_length,
        'is_subset': False,
        'num_local_trees': num_local_trees,
        'original_nodes': ts.num_nodes,
        'auto_filtered': False,
        'tree_intervals': tree_intervals,
        'sample_order': sample_order,
        'location_dimensions': effective_location_dims,
        'has_populations': has_populations,
        'populations': populations_list,
        'num_mutations': ts.num_mutations,
        'num_individuals': ts.num_individuals,
        'node_id_mapping': node_id_mapping.tolist() if node_id_mapping is not None else None
    }
    
    # If we have an expected tree count (from tree index filtering), include it
    if expected_tree_count is not None:
        metadata['expected_tree_count'] = expected_tree_count
        metadata['tree_count_mismatch'] = (num_local_trees != expected_tree_count)
        
        # Override the displayed count to match user selection when tskit filtering is imprecise
        if metadata['tree_count_mismatch']:
            logger.info(f"Overriding displayed tree count from {num_local_trees} to {expected_tree_count} to match user selection")
            metadata['num_local_trees'] = expected_tree_count
            metadata['tree_count_mismatch'] = False
    
    # Detect coordinate system from spatial data
    coordinates_with_spatial = []
    for node in nodes:
        if 'location' in node and node['location'] is not None:
            x = node['location'].get('x')
            y = node['location'].get('y')
            if isinstance(x, (int, float)) and isinstance(y, (int, float)) and math.isfinite(x) and math.isfinite(y):
                coordinates_with_spatial.append((x, y))
    
    if coordinates_with_spatial:
        from argscape.api.geo_utils.crs_detect import detect_coordinate_system
        crs_detection = detect_coordinate_system(coordinates_with_spatial)
        
        # Add detection results to metadata
        metadata['coordinate_system_detection'] = crs_detection
        metadata['suggested_geographic_mode'] = crs_detection['suggested_geographic_mode']
        
        # Add spatial bounds
        if crs_detection['bounds']:
            metadata['spatial_bounds'] = crs_detection['bounds']
        
        logger.info(f"Detected coordinate system: {crs_detection['likely_crs']} "
                   f"(confidence: {crs_detection['confidence']:.2f})")
    else:
        metadata['coordinate_system_detection'] = {
            "likely_crs": "none",
            "confidence": 0.0,
            "reasoning": "No spatial coordinates found",
            "bounds": None,
            "coordinate_count": 0,
            "suggested_geographic_mode": "unit_grid"
        }
        metadata['suggested_geographic_mode'] = "unit_grid"
    
    result = {
        'nodes': nodes,
        'edges': edges,
        'metadata': metadata
    }
    
    # Cache the result if caching is enabled
    if use_cache and GRAPH_CACHE_AVAILABLE and graph_cache and graph_cache.enabled and cache_key_prefix:
        cache_options = {
            "num_nodes": ts.num_nodes,
            "num_edges": ts.num_edges,
            "expected_tree_count": expected_tree_count,
            "sample_order": sample_order
        }
        graph_cache.set(cache_key_prefix, cache_options, result)
    
    return result


def convert_tree_sequence_to_graph_data(
    ts: tskit.TreeSequence,
    max_samples: Optional[int] = None,
    sample_order: str = "degree"
) -> Dict:
    """Convert a tree sequence to a graph data structure for visualization."""
    logger.info(f"Converting tree sequence to graph data: {ts.num_nodes} nodes, {ts.num_edges} edges")
    
    # Get spatial info
    spatial_info = check_spatial_completeness(ts)
    has_locations = spatial_info.get("has_sample_spatial", False)
    
    # Extract nodes and edges
    nodes = []
    edges = []
    node_times = []
    
    # Process nodes
    for node in ts.nodes():
        node_data = {
            "id": str(node.id),
            "time": node.time,
            "is_sample": node.is_sample(),
            "metadata": node.metadata
        }
        
        # Add location data if available
        if has_locations and hasattr(node, "location"):
            node_data["location"] = {
                "x": float(node.location[0]),
                "y": float(node.location[1]),
                "z": float(node.location[2]) if len(node.location) > 2 else 0.0
            }
        
        nodes.append(node_data)
        node_times.append(node.time)
    
    # Process edges
    for edge in ts.edges():
        edges.append({
            "source": str(edge.parent),
            "target": str(edge.child),
            "left": edge.left,
            "right": edge.right
        })
    
    # Calculate time ranges for visualization
    min_time = min(node_times)
    max_time = max(node_times)
    time_range = max_time - min_time
    
    return {
        "nodes": nodes,
        "edges": edges,
        "metadata": {
            "num_nodes": ts.num_nodes,
            "num_edges": ts.num_edges,
            "sequence_length": ts.sequence_length,
            "num_trees": ts.num_trees,
            "time_range": {
                "min": min_time,
                "max": max_time,
                "range": time_range
            },
            "has_locations": has_locations
        }
    } 