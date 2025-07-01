"""
Sparg location inference functionality.
"""

import logging
from typing import Dict, Tuple

import numpy as np
import pandas as pd
import tskit

# Configure logging
logger = logging.getLogger(__name__)

# Import sparg
try:
    import argscape.backend.sparg as sparg
    logger.info("sparg successfully imported")
    SPARG_AVAILABLE = True
except ImportError:
    sparg = None
    SPARG_AVAILABLE = False
    logger.warning("sparg not available - sparg location inference disabled")

def ensure_3d_location(location: np.ndarray) -> np.ndarray:
    """Ensure location array has 3 coordinates by appending 0.0 for z if needed."""
    if len(location) == 2:
        return np.array([location[0], location[1], 0.0])
    return location

def extract_sample_locations_dict(ts: tskit.TreeSequence) -> Dict[int, np.ndarray]:
    """Extract sample locations from tree sequence into a dictionary format.
    
    Args:
        ts: Input tree sequence
        
    Returns:
        Dictionary mapping node IDs to location arrays
    """
    sample_locations = {}
    
    # Get sample node IDs
    sample_node_ids = ts.samples()
    logger.info(f"Found {len(sample_node_ids)} sample nodes")
    
    # Extract locations from individuals table
    for node_id in sample_node_ids:
        node = ts.node(node_id)
        if node.individual != -1:  # Node has an individual
            individual = ts.individual(node.individual)
            if len(individual.location) >= 2:  # Has x, y coordinates
                # Always create 3D location with z=0
                sample_locations[node_id] = np.array([
                    individual.location[0],  # x coordinate
                    individual.location[1],  # y coordinate
                    0.0  # z coordinate
                ])
    
    if not sample_locations:
        raise ValueError("No sample locations found in tree sequence metadata")
        
    # Verify we have locations for all samples
    missing_samples = set(sample_node_ids) - set(sample_locations.keys())
    if missing_samples:
        raise ValueError(f"Missing locations for sample nodes: {sorted(missing_samples)}")
    
    return sample_locations

def create_full_ancestors_dataframe(ts: tskit.TreeSequence) -> pd.DataFrame:
    """Creates a dataframe containing all non-sample nodes in the tree sequence.
    
    Args:
        ts: Input tree sequence
        
    Returns:
        DataFrame with all non-sample nodes and their positions
    """
    # Get all non-sample nodes
    non_sample_nodes = []
    times = []
    positions = []
    
    # For each non-sample node, we'll use the midpoint of its span
    for node_id in range(ts.num_nodes):
        node = ts.node(node_id)
        if not node.is_sample():
            # Find the node's span by looking at edges where it's a parent
            # Filter edges where this node is a parent
            parent_edges = [edge for edge in ts.edges() if edge.parent == node_id]
            
            if parent_edges:
                # Use the midpoint of the node's total span
                left = min(edge.left for edge in parent_edges)
                right = max(edge.right for edge in parent_edges)
                pos = (left + right) / 2
                
                non_sample_nodes.append(node_id)
                times.append(node.time)
                positions.append(pos)
    
    # Create dataframe
    df = pd.DataFrame({
        'sample': non_sample_nodes,  # Using 'sample' to match sparg's expected format
        'genome_position': positions,
        'time': times
    })
    
    return df

def run_sparg_inference(ts: tskit.TreeSequence) -> Tuple[tskit.TreeSequence, Dict]:
    """Run sparg inference on a tree sequence.
    
    Args:
        ts: Input tree sequence
        
    Returns:
        Tuple of (tree sequence with inferred locations, inference info dict)
    """
    if not SPARG_AVAILABLE:
        raise RuntimeError("sparg package not available")
    
    try:
        logger.info(f"Running sparg inference for ts with {ts.num_nodes} nodes, "
                    f"{ts.num_samples} samples, {ts.num_edges} edges.")
        
        # Extract sample locations as dictionary for later use
        sample_locations = extract_sample_locations_dict(ts)
        logger.info(f"Extracted locations for {len(sample_locations)} samples")
        
        # Create SpatialARG object
        spatial_arg = sparg.SpatialARG(ts=ts, verbose=True)
        
        # Get all non-sample nodes that need locations
        non_sample_nodes = []
        
        # Create a dataframe for all non-sample nodes
        all_nodes_df = []
        
        # First identify all non-sample nodes
        for node_id in range(ts.num_nodes):
            node = ts.node(node_id)
            if not node.is_sample():
                non_sample_nodes.append(node_id)
        
        logger.debug(f"Found {len(non_sample_nodes)} non-sample nodes to locate.")

        # For each non-sample node, find all trees where it appears and all its samples
        for node_id in non_sample_nodes:
            node = ts.node(node_id)
            node_entries = []
            
            # Look through all trees to find where this node appears
            for tree in ts.trees():
                # Check if node exists in this tree
                if tree.parent(node_id) != -1 or len(list(tree.children(node_id))) > 0:  # Node exists in this tree
                    # Get all samples under this node in this tree
                    samples = list(tree.samples(node_id))
                    if samples:
                        # Use the midpoint of the tree's interval for position
                        pos = (tree.interval.left + tree.interval.right) / 2
                        
                        # Create an entry for each sample-position combination
                        for sample_id in samples:
                            entry = {
                                'sample': sample_id,
                                'genome_position': pos,
                                'time': node.time,
                                'original_node_id': node_id  # Add original node ID
                            }
                            node_entries.append(entry)
            
            # If we found any valid entries for this node, add them
            if node_entries:
                all_nodes_df.extend(node_entries)
            else:
                # If no valid entries found, try to find any position where this node appears
                parent_edges = [edge for edge in ts.edges() if edge.parent == node_id]
                if parent_edges:
                    # Use the midpoint of the node's total span
                    left = min(edge.left for edge in parent_edges)
                    right = max(edge.right for edge in parent_edges)
                    pos = (left + right) / 2
                    
                    # Try to find any samples at this position
                    tree = ts.at(pos)
                    samples = list(tree.samples(node_id))
                    if samples:
                        sample_id = samples[0]  # Take the first sample
                        entry = {
                            'sample': sample_id,
                            'genome_position': pos,
                            'time': node.time,
                            'original_node_id': node_id  # Add original node ID
                        }
                        all_nodes_df.append(entry)
        
        if not all_nodes_df:
            raise ValueError("No non-sample nodes found in tree sequence")
            
        # Create dataframe for sparg
        ancestors_df = pd.DataFrame(all_nodes_df)
        logger.debug(f"Created ancestors dataframe with {len(ancestors_df)} rows before dropping duplicates.")
        # Remove duplicates while preserving the first occurrence
        ancestors_df = ancestors_df.drop_duplicates(['sample', 'genome_position', 'time'])
        logger.info(f"Created ancestors dataframe with {len(ancestors_df)} unique rows for sparg.")
        logger.debug(f"Ancestors dataframe columns: {ancestors_df.columns.tolist()}")
        logger.debug(f"Ancestors dataframe head:\n{ancestors_df.head().to_string()}")
        
        # Estimate locations using ARG method
        logger.info("Estimating locations with sparg...")
        ancestor_locations = sparg.estimate_locations_of_ancestors_in_dataframe_using_arg(
            df=ancestors_df,
            spatial_arg=spatial_arg,
            verbose=True
        )
        logger.info("sparg location estimation complete.")
        logger.debug(f"Ancestor locations dataframe shape: {ancestor_locations.shape}")
        logger.debug(f"Ancestor locations dataframe columns: {ancestor_locations.columns.tolist()}")
        logger.debug(f"Ancestor locations dataframe head:\n{ancestor_locations.head().to_string()}")
        
        # Convert locations to format for tree sequence
        node_locations = {}
        
        # First add all sample locations (already 3D)
        node_locations.update(sample_locations)
        
        # Then add inferred locations for non-sample nodes
        for _, row in ancestor_locations.iterrows():
            # Get the original node ID from the results
            if 'arg_original_node_id' in row:
                node_id = int(row['arg_original_node_id'])
                # Always store as 3D coordinates
                location = [
                    row['arg_estimated_location_0'],
                    row['arg_estimated_location_1'],
                    0.0  # Always add z=0
                ]
                node_locations[node_id] = location
        
        # If we're still missing nodes, try to get them from the original dataframe
        missing_nodes = set(non_sample_nodes) - set(node_locations.keys())
        if missing_nodes:
            logger.warning(f"{len(missing_nodes)} nodes missing after ARG inference, "
                           f"trying to recover from original entries: {sorted(list(missing_nodes))[:10]}...")
            for node_id in missing_nodes:
                # Find entries in the original dataframe for this node
                node_entries = ancestors_df[ancestors_df['original_node_id'] == node_id]
                if not node_entries.empty:
                    # Take the first entry's sample and position
                    entry = node_entries.iloc[0]
                    # Find this entry in the results
                    matching_results = ancestor_locations[
                        (ancestor_locations['sample'] == entry['sample']) & 
                        (ancestor_locations['genome_position'] == entry['genome_position']) &
                        (ancestor_locations['time'] == entry['time'])
                    ]
                    if not matching_results.empty:
                        result = matching_results.iloc[0]
                        location = [
                            result['arg_estimated_location_0'],
                            result['arg_estimated_location_1'],
                            0.0
                        ]
                        node_locations[node_id] = location
        
        # Final check for missing nodes
        missing_nodes_final = set(non_sample_nodes) - set(node_locations.keys())
        if missing_nodes_final:
            raise ValueError(f"Missing non-sample node IDs in node locations: "
                             f"{len(missing_nodes_final)} nodes missing. "
                             f"Examples: {sorted(list(missing_nodes_final))[:10]}")
        
        logger.info(f"Successfully inferred locations for {len(node_locations) - len(sample_locations)} non-sample nodes.")

        # Apply locations to tree sequence
        from argscape.backend.geo_utils import apply_custom_locations_to_tree_sequence
        ts_with_locations = apply_custom_locations_to_tree_sequence(
            ts,
            sample_locations=sample_locations,  # Pass sample locations explicitly
            node_locations=node_locations
        )
        
        inference_info = {
            "num_inferred_locations": len(node_locations) - len(sample_locations),  # Don't count samples
            "dispersal_rate": float(spatial_arg.dispersal_rate_matrix[0][0]),  # Convert to float for JSON serialization
            "inference_parameters": {
                "num_samples": len(sample_locations),
                "sequence_length": ts.sequence_length
            }
        }
        
        return ts_with_locations, inference_info
        
    
    except Exception as e:
        logger.error("Error during sparg inference", exc_info=True)
        # Check for the specific "more than 2 parents" error
        if "Nodes has more than 2 parents" in str(e):
            raise RuntimeError(
                "This ARG contains nodes with more than 2 parents. "
                "Please try a different location inference method."
            )
        # For all other errors, pass through the original error message
        raise RuntimeError(f"Sparg inference failed: {str(e)}") 