"""
Tree sequence utility functions for handling spatial data.
"""

import logging
import numpy as np
import tskit
from typing import Dict, List

logger = logging.getLogger(__name__)

def check_spatial_completeness(ts: tskit.TreeSequence) -> Dict[str, bool]:
    """Check spatial information completeness in tree sequence."""
    logger.info(f"Checking spatial info for {ts.num_individuals} individuals, {ts.num_nodes} nodes")
    
    # Fast path: if no individuals, then no spatial data
    if ts.num_individuals == 0:
        return {
            "has_sample_spatial": False,
            "has_all_spatial": False,
            "spatial_status": "none"
        }
    
    # Check individuals directly instead of iterating through all nodes
    sample_nodes_with_individuals = 0
    sample_nodes_total = 0
    all_nodes_with_individuals = 0
    all_nodes_total = ts.num_nodes
    
    # First pass: count nodes with individuals
    for node in ts.nodes():
        if node.individual != -1:
            all_nodes_with_individuals += 1
            if node.flags & tskit.NODE_IS_SAMPLE:
                sample_nodes_with_individuals += 1
        
        if node.flags & tskit.NODE_IS_SAMPLE:
            sample_nodes_total += 1
    
    # Quick check: if no nodes have individuals, no spatial data
    if all_nodes_with_individuals == 0:
        return {
            "has_sample_spatial": False,
            "has_all_spatial": False,
            "spatial_status": "none"
        }
    
    # Check if individuals actually have valid locations
    sample_has_spatial = True
    all_has_spatial = True
    
    # Only check individuals that actually exist, and do it efficiently
    for individual in ts.individuals():
        has_valid_location = (individual.location is not None and len(individual.location) >= 2)
        
        if not has_valid_location:
            all_has_spatial = False
            # Check if this individual belongs to a sample node
            for node in ts.nodes():
                if node.individual == individual.id and (node.flags & tskit.NODE_IS_SAMPLE):
                    sample_has_spatial = False
                    break
    
    # Final check: if not all sample nodes have individuals, samples don't have spatial
    if sample_nodes_with_individuals < sample_nodes_total:
        sample_has_spatial = False
    
    # If not all nodes have individuals, not all have spatial
    if all_nodes_with_individuals < all_nodes_total:
        all_has_spatial = False
    
    spatial_status = "all" if all_has_spatial else ("sample_only" if sample_has_spatial else "none")
    
    logger.info(f"Spatial check completed: {spatial_status}")
    
    return {
        "has_sample_spatial": sample_has_spatial,
        "has_all_spatial": all_has_spatial,
        "spatial_status": spatial_status
    }


def apply_inferred_locations_to_tree_sequence(ts: tskit.TreeSequence, locations_df) -> tskit.TreeSequence:
    """Apply inferred locations from fastgaia to a tree sequence."""
    logger.info("Applying inferred locations to tree sequence...")
    
    tables = ts.dump_tables()
    
    # Clear the individuals table and any metadata schema that might cause validation issues
    tables.individuals.clear()
    # Clear the individual metadata schema to avoid validation errors
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    dim_columns = [col for col in locations_df.columns if col != 'node_id']
    num_dims = len(dim_columns)
    
    logger.info(f"Found {num_dims} spatial dimensions in inferred locations")
    
    node_to_location = {}
    for _, row in locations_df.iterrows():
        node_id = int(row['node_id'])
        location_3d = np.zeros(3)
        for i, dim_col in enumerate(dim_columns):
            if i < 3:
                location_3d[i] = float(row[dim_col])
        node_to_location[node_id] = location_3d
    
    node_to_individual = {}
    for node_id, location in node_to_location.items():
        # Add individual with empty metadata (schema is now cleared)
        individual_id = tables.individuals.add_row(
            flags=0,
            location=location,
            parents=[],
            metadata=b''
        )
        node_to_individual[node_id] = individual_id
    
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
    logger.info(f"Applied inferred locations to {len(node_to_location)} nodes")
    
    return result_ts


def apply_gaia_quadratic_locations_to_tree_sequence(ts: tskit.TreeSequence, locations: np.ndarray) -> tskit.TreeSequence:
    """Apply inferred locations from GAIA quadratic algorithm to a tree sequence.
    
    Args:
        ts: Tree sequence to modify
        locations: numpy array of shape (n_nodes, 2) with x, y coordinates for all nodes
    
    Returns:
        Tree sequence with locations applied to all nodes, preserving original sample locations
    """
    logger.info("Applying GAIA quadratic locations to tree sequence...")
    
    if locations.shape[1] != 2:
        raise ValueError(f"Expected locations with 2 dimensions (x, y), got {locations.shape[1]}")
    
    if locations.shape[0] != ts.num_nodes:
        raise ValueError(f"Expected locations for {ts.num_nodes} nodes, got {locations.shape[0]}")
    
    tables = ts.dump_tables()
    
    # Clear the individuals table and metadata schema
    tables.individuals.clear()
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    # Create individuals for all nodes with their locations
    node_to_individual = {}
    
    # First, preserve original sample locations
    sample_node_ids = set(node.id for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE)
    for node_id in sample_node_ids:
        node = ts.node(node_id)
        if node.individual != -1:  # Node has an individual
            individual = ts.individual(node.individual)
            if len(individual.location) >= 2:  # Has x, y coordinates
                # Create individual with original location
                individual_id = tables.individuals.add_row(
                    flags=0,
                    location=individual.location,  # Keep original location including z if present
                    parents=[],
                    metadata=b''
                )
                node_to_individual[node_id] = individual_id
    
    # Then, apply GAIA inferred locations only for non-sample nodes
    for node_id in range(ts.num_nodes):
        if node_id not in sample_node_ids:  # Only apply GAIA locations to non-sample nodes
            # Create 3D location array (x, y, z=0)
            x_coord = float(locations[node_id, 0])
            y_coord = float(locations[node_id, 1])
            location_3d = np.array([x_coord, y_coord, 0.0])
            
            # Add individual with location
            individual_id = tables.individuals.add_row(
                flags=0,
                location=location_3d,
                parents=[],
                metadata=b''
            )
            node_to_individual[node_id] = individual_id
    
    # Update nodes to reference their corresponding individuals
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
    logger.info(f"Applied GAIA quadratic locations to {len(node_to_individual)} nodes (preserved {len(sample_node_ids)} sample locations)")
    
    return result_ts


def apply_gaia_linear_locations_to_tree_sequence(ts: tskit.TreeSequence, locations: np.ndarray) -> tskit.TreeSequence:
    """Apply inferred locations from GAIA linear algorithm to a tree sequence.
    
    Args:
        ts: Tree sequence to modify
        locations: numpy array of shape (n_nodes, 2) with x, y coordinates for all nodes
    
    Returns:
        Tree sequence with locations applied to all nodes, preserving original sample locations
    """
    logger.info("Applying GAIA linear locations to tree sequence...")
    
    if locations.shape[1] != 2:
        raise ValueError(f"Expected locations with 2 dimensions (x, y), got {locations.shape[1]}")
    
    if locations.shape[0] != ts.num_nodes:
        raise ValueError(f"Expected locations for {ts.num_nodes} nodes, got {locations.shape[0]}")
    
    tables = ts.dump_tables()
    
    # Clear the individuals table and metadata schema
    tables.individuals.clear()
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    # Create individuals for all nodes with their locations
    node_to_individual = {}
    
    # First, preserve original sample locations
    sample_node_ids = set(node.id for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE)
    for node_id in sample_node_ids:
        node = ts.node(node_id)
        if node.individual != -1:  # Node has an individual
            individual = ts.individual(node.individual)
            if len(individual.location) >= 2:  # Has x, y coordinates
                # Create individual with original location
                individual_id = tables.individuals.add_row(
                    flags=0,
                    location=individual.location,  # Keep original location including z if present
                    parents=[],
                    metadata=b''
                )
                node_to_individual[node_id] = individual_id
    
    # Then, apply GAIA inferred locations only for non-sample nodes
    for node_id in range(ts.num_nodes):
        if node_id not in sample_node_ids:  # Only apply GAIA locations to non-sample nodes
            # Create 3D location array (x, y, z=0)
            x_coord = float(locations[node_id, 0])
            y_coord = float(locations[node_id, 1])
            location_3d = np.array([x_coord, y_coord, 0.0])
            
            # Add individual with location
            individual_id = tables.individuals.add_row(
                flags=0,
                location=location_3d,
                parents=[],
                metadata=b''
            )
            node_to_individual[node_id] = individual_id
    
    # Update nodes to reference their corresponding individuals
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
    logger.info(f"Applied GAIA linear locations to {len(node_to_individual)} nodes (preserved {len(sample_node_ids)} sample locations)")
    
    return result_ts


def apply_custom_locations_to_tree_sequence(
    ts: tskit.TreeSequence, 
    sample_locations: Dict[int, tuple], 
    node_locations: Dict[int, tuple]
) -> tskit.TreeSequence:
    """Apply custom locations from CSV files to a tree sequence."""
    logger.info("Applying custom locations to tree sequence...")
    
    # Get sample and non-sample node IDs
    sample_node_ids = set(node.id for node in ts.nodes() if node.is_sample())
    non_sample_node_ids = set(node.id for node in ts.nodes() if not node.is_sample())
    
    # Validate sample locations
    sample_location_node_ids = set(sample_locations.keys())
    if sample_location_node_ids != sample_node_ids:
        missing_samples = sample_node_ids - sample_location_node_ids
        extra_samples = sample_location_node_ids - sample_node_ids
        error_msg = []
        if missing_samples:
            error_msg.append(f"Missing sample node IDs in sample locations: {sorted(missing_samples)}")
        if extra_samples:
            error_msg.append(f"Extra node IDs in sample locations (not samples): {sorted(extra_samples)}")
        raise ValueError("; ".join(error_msg))
    
    # Validate node locations (ignore any sample node IDs if present)
    node_location_node_ids = set(node_locations.keys())
    valid_node_location_ids = node_location_node_ids & non_sample_node_ids
    ignored_sample_ids = node_location_node_ids & sample_node_ids
    
    if ignored_sample_ids:
        logger.info(f"Ignoring {len(ignored_sample_ids)} sample node IDs in node locations file")
    
    missing_nodes = non_sample_node_ids - valid_node_location_ids
    if missing_nodes:
        raise ValueError(f"Missing non-sample node IDs in node locations: {sorted(missing_nodes)}")
    
    # Create new tree sequence with custom locations
    tables = ts.dump_tables()
    
    # Clear individuals table
    tables.individuals.clear()
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    # Create individuals for all nodes with locations
    node_to_individual = {}
    
    # Add individuals for sample nodes
    for node_id in sample_node_ids:
        x, y, z = sample_locations[node_id]
        location_3d = np.array([x, y, z])
        individual_id = tables.individuals.add_row(
            flags=0,
            location=location_3d,
            parents=[],
            metadata=b''
        )
        node_to_individual[node_id] = individual_id
    
    # Add individuals for non-sample nodes
    for node_id in valid_node_location_ids:
        x, y, z = node_locations[node_id]
        location_3d = np.array([x, y, z])
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
    logger.info(f"Applied custom locations to {len(node_to_individual)} nodes")
    
    return result_ts 