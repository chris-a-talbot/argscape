"""
Midpoint-based spatial inference for ARGscape.
Infers ancestral node locations using weighted midpoints of child locations.
"""

import logging
from typing import Dict, Tuple, List
import numpy as np
import tskit

logger = logging.getLogger(__name__)

def get_child_edges(ts: tskit.TreeSequence, parent_id: int) -> List[tskit.Edge]:
    """Get all edges where the given node is a parent.
    
    Args:
        ts: Tree sequence
        parent_id: ID of the parent node
        
    Returns:
        List of edges where parent_id is the parent
    """
    return [edge for edge in ts.edges() if edge.parent == parent_id]

def get_node_location(ts: tskit.TreeSequence, node_id: int) -> Tuple[float, float]:
    """Get the x,y location of a node from its individual's location.
    
    Args:
        ts: Tree sequence
        node_id: ID of the node
        
    Returns:
        Tuple of (x, y) coordinates or None if no location found
    """
    node = ts.node(node_id)
    if node.individual != -1:
        individual = ts.individual(node.individual)
        if individual.location is not None and len(individual.location) >= 2:
            return (individual.location[0], individual.location[1])
    return None

def weighted_midpoint(
    child_locations: List[Tuple[float, float]], 
    weights: np.ndarray
) -> Tuple[float, float]:
    """Calculate the weighted midpoint of a set of locations.
    
    Args:
        child_locations: List of (x,y) tuples for child locations
        weights: Array of weights (e.g. branch lengths)
        
    Returns:
        Tuple of (x,y) coordinates for the weighted midpoint
    """
    if len(child_locations) == 0:
        raise ValueError("No child locations provided")
    if len(child_locations) == 1:
        return child_locations[0]
    
    # Convert to numpy arrays for vectorized operations
    locations = np.array(child_locations)
    weights = np.array(weights)
    
    # Normalize weights
    weights = weights / np.sum(weights)
    
    # Calculate weighted average for x and y separately
    x = np.sum(weights * locations[:, 0])
    y = np.sum(weights * locations[:, 1])
    
    return (float(x), float(y))

def run_midpoint_inference(ts: tskit.TreeSequence) -> Tuple[tskit.TreeSequence, Dict]:
    """Run midpoint-based location inference on a tree sequence.
    
    This algorithm:
    1. Starts with sample nodes (which must have locations)
    2. Moves through nodes in order of increasing time
    3. For each non-sample node, calculates its location as the weighted midpoint
       of its child nodes' locations, with weights based on branch lengths
    
    Args:
        ts: Input tree sequence with sample locations
        
    Returns:
        Tuple of (tree sequence with inferred locations, inference info dict)
    """
    logger.info(f"Starting midpoint inference for {ts.num_nodes} nodes")
    
    # Initialize location storage
    locations: Dict[int, Tuple[float, float]] = {}
    
    # First, get all sample locations
    for node in ts.nodes():
        if node.flags & tskit.NODE_IS_SAMPLE:
            loc = get_node_location(ts, node.id)
            if loc is None:
                raise ValueError(f"Sample node {node.id} has no location")
            locations[node.id] = loc
    
    logger.info(f"Loaded {len(locations)} sample locations")
    
    # Get nodes sorted by time, excluding samples
    sorted_nodes = sorted(
        [node for node in ts.nodes() if not node.flags & tskit.NODE_IS_SAMPLE],
        key=lambda x: x.time
    )
    
    # Process nodes in order of increasing time
    inferred_count = 0
    for node in sorted_nodes:
        # Get all edges where this node is a parent
        child_edges = get_child_edges(ts, node.id)
        
        if not child_edges:
            logger.warning(f"Node {node.id} has no child edges, skipping")
            continue
        
        # Get child locations and branch lengths
        child_locations = []
        branch_lengths = []
        
        for edge in child_edges:
            if edge.child not in locations:
                logger.warning(f"Child node {edge.child} has no location, skipping parent {node.id}")
                continue
            
            child_locations.append(locations[edge.child])
            # Branch length is difference in time between parent and child
            branch_length = node.time - ts.node(edge.child).time
            branch_lengths.append(branch_length if branch_length > 0 else 1.0)
        
        if child_locations:
            # Calculate weighted midpoint
            try:
                locations[node.id] = weighted_midpoint(child_locations, np.array(branch_lengths))
                inferred_count += 1
            except Exception as e:
                logger.error(f"Error calculating midpoint for node {node.id}: {e}")
                continue
    
    logger.info(f"Inferred {inferred_count} node locations")
    
    # Create new tree sequence with inferred locations
    tables = ts.dump_tables()
    
    # Update individual locations
    new_individuals = tables.individuals.copy()
    new_individuals.clear()
    
    for individual in ts.individuals():
        if any(node_id in locations for node_id in individual.nodes):
            # Use the first available node's location
            for node_id in individual.nodes:
                if node_id in locations:
                    x, y = locations[node_id]
                    new_location = np.array([x, y] + list(individual.location[2:]) if individual.location is not None else [x, y])
                    break
        else:
            new_location = individual.location
        
        new_individuals.add_row(
            flags=individual.flags,
            location=new_location,
            parents=individual.parents,
            metadata=individual.metadata
        )
    
    tables.individuals.replace_with(new_individuals)
    ts_with_locations = tables.tree_sequence()
    
    inference_info = {
        "num_inferred_locations": inferred_count,
        "total_nodes": ts.num_nodes,
        "inference_method": "weighted_midpoint"
    }
    
    return ts_with_locations, inference_info 