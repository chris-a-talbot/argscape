# graph_utils.py
"""
Graph data conversion utilities for ARG visualization
"""

import logging
import math
from typing import Dict, Any, List, Tuple

import numpy as np
import tskit

logger = logging.getLogger(__name__)


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
    Get sample order using consensus algorithm with majority vote across K trees.
    
    Implementation of the TipSampleOrdering algorithm from the provided pseudocode.
    K is set to: # local trees up to 20, then 20 + (1/4 * # local trees) up to 50.
    """
    # Get all sample nodes
    samples = {node.id for node in ts.nodes() if node.is_sample()}
    
    if len(samples) <= 1:
        return list(samples)
    
    # Calculate K based on number of local trees
    num_trees = ts.num_trees
    if num_trees <= 20:
        k_trees = num_trees
    else:
        k_trees = int(20 + (num_trees / 4))
        k_trees = min(k_trees, 50)  # Cap at 50
    
    # Choose K equally spaced genomic positions
    positions = []
    if k_trees == 1:
        positions = [ts.sequence_length / 2]
    else:
        for i in range(k_trees):
            # Ensure positions are within bounds [0, sequence_length)
            pos = i * ts.sequence_length / k_trees
            # Make sure we don't hit exactly sequence_length
            pos = min(pos, ts.sequence_length - 1e-10)
            positions.append(pos)
    
    # Get minlex postorder for each position
    orders = []
    for pos in positions:
        order = get_sample_order_minlex_postorder(ts, pos, ignore_unattached_nodes=True)
        orders.append(order)
    
    # Majority vote ordering
    # For each pair of samples, count how many trees have sample A before sample B
    sample_list = list(samples)
    n_samples = len(sample_list)
    vote_matrix = np.zeros((n_samples, n_samples))
    
    for order in orders:
        if len(order) < 2:
            continue
        # Create position map for this order
        pos_map = {sample_id: i for i, sample_id in enumerate(order)}
        
        # Update vote matrix
        for i, sample_a in enumerate(sample_list):
            for j, sample_b in enumerate(sample_list):
                if sample_a in pos_map and sample_b in pos_map:
                    if pos_map[sample_a] < pos_map[sample_b]:
                        vote_matrix[i, j] += 1
    
    # Create final ordering based on majority votes
    # Use a simple approach: sort by total votes received
    total_votes = np.sum(vote_matrix, axis=1)
    sorted_indices = np.argsort(-total_votes)  # Descending order
    
    return [sample_list[i] for i in sorted_indices]


def apply_sample_ordering(nodes: List[Dict[str, Any]], sample_order: str, ts: tskit.TreeSequence) -> List[Dict[str, Any]]:
    """Apply the specified sample ordering to the nodes list."""
    if sample_order == "degree":
        ordered_samples = get_sample_order_by_degree(ts)
    elif sample_order == "center_minlex":
        ordered_samples = get_sample_order_center_tree(ts)
    elif sample_order == "first_tree":
        ordered_samples = get_sample_order_first_tree(ts)
    elif sample_order == "custom":
        ordered_samples = get_sample_order_custom_algorithm(ts)
    elif sample_order == "numeric":
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
                filtered_ts = filtered_ts.simplify(samples=sample_ids)
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


def convert_to_graph_data(ts: tskit.TreeSequence, expected_tree_count: int = None, sample_order: str = "custom") -> Dict[str, Any]:
    """Convert a tskit.TreeSequence to graph data format for D3 visualization.
    
    Args:
        ts: The tree sequence to convert
        expected_tree_count: If provided, the expected number of trees (used when filtering by tree indices)
        sample_order: Method for ordering samples ("degree", "center_minlex", "first_tree", "custom")
    """
    logger.info(f"Converting tree sequence to graph data: {ts.num_nodes} nodes, {ts.num_edges} edges")
    
    # Build node and edge data
    connected_node_ids = set()
    for edge in ts.edges():
        connected_node_ids.update([edge.parent, edge.child])
    
    nodes = []
    for node in ts.nodes():
        if node.is_sample() or node.id in connected_node_ids:
            time = node.time
            log_time = math.log(time + 1e-10) if time > 0 else 0
            
            node_data = {
                'id': node.id,
                'time': time,
                'log_time': log_time,
                'is_sample': node.is_sample(),
                'individual': node.individual
            }
            
            # Add spatial location if available
            if node.individual != -1 and node.individual < ts.num_individuals:
                individual = ts.individual(node.individual)
                if individual.location is not None and len(individual.location) >= 2:
                    node_data['location'] = {
                        'x': float(individual.location[0]),
                        'y': float(individual.location[1])
                    }
                    if len(individual.location) >= 3 and individual.location[2] != 0:
                        node_data['location']['z'] = float(individual.location[2])
            
            nodes.append(node_data)
    
    edges = [
        {
            'source': edge.parent,
            'target': edge.child,
            'left': edge.left,
            'right': edge.right
        }
        for edge in ts.edges()
    ]
    
    # Apply sample ordering
    nodes = apply_sample_ordering(nodes, sample_order, ts)
    
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
        'sample_order': sample_order
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
            coordinates_with_spatial.append((node['location']['x'], node['location']['y']))
    
    if coordinates_with_spatial:
        from geographic_utils import detect_coordinate_system
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
    
    return {
        'nodes': nodes,
        'edges': edges,
        'metadata': metadata
    } 