"""
Tree sequence utility functions for handling spatial data.
"""

import logging
import numpy as np
import tskit
from typing import Dict, List

logger = logging.getLogger(__name__)

def check_spatial_completeness(ts: tskit.TreeSequence) -> Dict[str, bool]:
    """Check spatial information completeness in tree sequence using spatial index."""
    logger.info(f"Checking spatial info for {ts.num_individuals} individuals, {ts.num_nodes} nodes")
    
    # Use spatial index for efficient checking
    try:
        from argscape.api.geo_utils.spatial_index import get_spatial_index
        
        # Get or build spatial index (cached)
        spatial_index = get_spatial_index(ts, use_cache=True)
        
        # Get metadata from index
        metadata = spatial_index.get_metadata()
        
        result = {
            "has_sample_spatial": metadata.has_sample_spatial,
            "has_all_spatial": metadata.has_all_spatial,
            "spatial_status": metadata.spatial_status
        }
        
        logger.info(f"Spatial check completed (indexed): {metadata.spatial_status}")
        return result
        
    except Exception as e:
        logger.warning(f"Spatial index failed, falling back to direct check: {e}")
        # Fallback to direct check if spatial index fails
        return _check_spatial_completeness_direct(ts)


def _check_spatial_completeness_direct(ts: tskit.TreeSequence) -> Dict[str, bool]:
    """Direct spatial completeness check without index (fallback)."""
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
    
    logger.info(f"Spatial check completed (direct): {spatial_status}")
    
    return {
        "has_sample_spatial": sample_has_spatial,
        "has_all_spatial": all_has_spatial,
        "spatial_status": spatial_status
    }


def apply_inferred_locations_to_tree_sequence(ts: tskit.TreeSequence, locations_df) -> tskit.TreeSequence:
    """Apply inferred locations from fastgaia to a tree sequence, preserving existing individual assignments for samples only."""
    logger.info("Applying inferred locations to tree sequence...")
    
    from collections import defaultdict
    
    tables = ts.dump_tables()
    
    # Parse location data
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
    
    # Get sample and non-sample node IDs
    sample_node_ids = set(node.id for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE)
    non_sample_node_ids = set(node.id for node in ts.nodes() if not (node.flags & tskit.NODE_IS_SAMPLE))
    
    # Group ONLY SAMPLE NODES by their existing individual assignments
    individual_to_sample_nodes = defaultdict(list)
    sample_node_to_individual = {}
    
    # First, collect existing individual assignments for sample nodes only
    for node in ts.nodes():
        if node.flags & tskit.NODE_IS_SAMPLE and node.individual != -1:
            individual_to_sample_nodes[node.individual].append(node.id)
            sample_node_to_individual[node.id] = node.individual
    
    # If no existing individuals for samples, assume diploid pairing
    if not individual_to_sample_nodes and sample_node_ids:
        logger.info("No existing individual assignments found for samples, assuming diploid pairing")
        sorted_sample_nodes = sorted(sample_node_ids)
        for i, node_id in enumerate(sorted_sample_nodes):
            individual_id = node_id // 2  # Integer division: 0,1→0; 2,3→1; 4,5→2; etc.
            individual_to_sample_nodes[individual_id].append(node_id)
            sample_node_to_individual[node_id] = individual_id
    
    # Clear and rebuild individuals table
    tables.individuals.clear()
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    node_to_new_individual = {}
    
    # Create individuals for sample nodes (grouped by original individual assignments)
    for old_individual_id in sorted(individual_to_sample_nodes.keys()):
        sample_nodes_for_individual = individual_to_sample_nodes[old_individual_id]
        
        # Find a representative sample node with location data (prefer lowest ID)
        representative_node = None
        for node_id in sorted(sample_nodes_for_individual):
            if node_id in node_to_location:
                representative_node = node_id
                break
        
        if representative_node is not None:
            # Use inferred location for this individual
            location = node_to_location[representative_node]
        else:
            # Fallback to original location if available
            original_individual = ts.individual(old_individual_id)
            if original_individual.location is not None and len(original_individual.location) >= 2:
                location = np.array([
                    original_individual.location[0],
                    original_individual.location[1],
                    original_individual.location[2] if len(original_individual.location) > 2 else 0.0
                ])
            else:
                location = np.array([0.0, 0.0, 0.0])
        
        new_individual_id = tables.individuals.add_row(
            flags=0,
            location=location,
            parents=[],
            metadata=b''
        )
        
        # Assign this individual to all sample nodes in the group
        for sample_node_id in sample_nodes_for_individual:
            node_to_new_individual[sample_node_id] = new_individual_id
    
    # Create separate individuals for each internal node with its own unique location
    for node_id in non_sample_node_ids:
        if node_id in node_to_location:
            location = node_to_location[node_id]
            new_individual_id = tables.individuals.add_row(
                flags=0,
                location=location,
                parents=[],
                metadata=b''
            )
            node_to_new_individual[node_id] = new_individual_id
    
    # Handle sample nodes that don't have individual assignments but have locations
    for node_id in sample_node_ids:
        if node_id not in node_to_new_individual and node_id in node_to_location:
            location = node_to_location[node_id]
            new_individual_id = tables.individuals.add_row(
                flags=0,
                location=location,
                parents=[],
                metadata=b''
            )
            node_to_new_individual[node_id] = new_individual_id
    
    # Rebuild nodes table with corrected individual assignments
    new_nodes = tables.nodes.copy()
    new_nodes.clear()
    
    for node in ts.nodes():
        new_individual_id = node_to_new_individual.get(node.id, -1)
        
        new_nodes.add_row(
            time=node.time,
            flags=node.flags,
            population=node.population,
            individual=new_individual_id,
            metadata=node.metadata
        )
    
    tables.nodes.replace_with(new_nodes)
    
    result_ts = tables.tree_sequence()
    logger.info(f"Applied inferred locations: {len(individual_to_sample_nodes)} sample individuals, {len([n for n in non_sample_node_ids if n in node_to_location])} internal nodes")
    
    return result_ts


def apply_gaia_quadratic_locations_to_tree_sequence(ts: tskit.TreeSequence, locations: np.ndarray) -> tskit.TreeSequence:
    """Apply inferred locations from GAIA quadratic algorithm to a tree sequence, preserving individual assignments for samples only.
    
    Args:
        ts: Tree sequence to modify
        locations: numpy array of shape (n_nodes, 2) with x, y coordinates for all nodes
    
    Returns:
        Tree sequence with locations applied to all nodes, preserving original sample locations
    """
    logger.info("Applying GAIA quadratic locations to tree sequence...")
    
    from collections import defaultdict
    
    if locations.shape[1] != 2:
        raise ValueError(f"Expected locations with 2 dimensions (x, y), got {locations.shape[1]}")
    
    if locations.shape[0] != ts.num_nodes:
        raise ValueError(f"Expected locations for {ts.num_nodes} nodes, got {locations.shape[0]}")
    
    tables = ts.dump_tables()
    
    # Get sample and non-sample node IDs
    sample_node_ids = set(node.id for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE)
    non_sample_node_ids = set(node.id for node in ts.nodes() if not (node.flags & tskit.NODE_IS_SAMPLE))
    
    # Group ONLY SAMPLE NODES by their existing individual assignments
    individual_to_sample_nodes = defaultdict(list)
    sample_node_to_individual = {}
    
    # First, collect existing individual assignments for sample nodes only
    for node in ts.nodes():
        if node.flags & tskit.NODE_IS_SAMPLE and node.individual != -1:
            individual_to_sample_nodes[node.individual].append(node.id)
            sample_node_to_individual[node.id] = node.individual
    
    # If no existing individuals for samples, assume diploid pairing
    if not individual_to_sample_nodes and sample_node_ids:
        logger.info("No existing individual assignments found for samples, assuming diploid pairing")
        sorted_sample_nodes = sorted(sample_node_ids)
        for i, node_id in enumerate(sorted_sample_nodes):
            individual_id = node_id // 2  # Integer division: 0,1→0; 2,3→1; 4,5→2; etc.
            individual_to_sample_nodes[individual_id].append(node_id)
            sample_node_to_individual[node_id] = individual_id
    
    # Clear and rebuild individuals table
    tables.individuals.clear()
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    node_to_new_individual = {}
    
    # Create individuals for sample nodes (grouped by original individual assignments)
    for old_individual_id in sorted(individual_to_sample_nodes.keys()):
        sample_nodes_for_individual = individual_to_sample_nodes[old_individual_id]
        
        # Check if original individual had a location to preserve
        original_individual = ts.individual(old_individual_id)
        if original_individual.location is not None and len(original_individual.location) >= 2:
            # Preserve original sample location
            location = original_individual.location  # Keep original location including z if present
        else:
            # Fallback to GAIA location from first sample node if original not available
            sample_node = min(sample_nodes_for_individual)  # Use lowest ID
            x_coord = float(locations[sample_node, 0])
            y_coord = float(locations[sample_node, 1])
            location = np.array([x_coord, y_coord, 0.0])
        
        new_individual_id = tables.individuals.add_row(
            flags=0,
            location=location,
            parents=[],
            metadata=b''
        )
        
        # Assign this individual to all sample nodes in the group
        for sample_node_id in sample_nodes_for_individual:
            node_to_new_individual[sample_node_id] = new_individual_id
    
    # Create separate individuals for each internal node with its own unique GAIA location
    for node_id in non_sample_node_ids:
        x_coord = float(locations[node_id, 0])
        y_coord = float(locations[node_id, 1])
        location = np.array([x_coord, y_coord, 0.0])
        
        new_individual_id = tables.individuals.add_row(
            flags=0,
            location=location,
            parents=[],
            metadata=b''
        )
        node_to_new_individual[node_id] = new_individual_id
    
    # Handle sample nodes that don't have individual assignments
    for node_id in sample_node_ids:
        if node_id not in node_to_new_individual:
            x_coord = float(locations[node_id, 0])
            y_coord = float(locations[node_id, 1])
            location = np.array([x_coord, y_coord, 0.0])
            
            new_individual_id = tables.individuals.add_row(
                flags=0,
                location=location,
                parents=[],
                metadata=b''
            )
            node_to_new_individual[node_id] = new_individual_id
    
    # Rebuild nodes table with corrected individual assignments
    new_nodes = tables.nodes.copy()
    new_nodes.clear()
    
    for node in ts.nodes():
        new_individual_id = node_to_new_individual.get(node.id, -1)
        
        new_nodes.add_row(
            time=node.time,
            flags=node.flags,
            population=node.population,
            individual=new_individual_id,
            metadata=node.metadata
        )
    
    tables.nodes.replace_with(new_nodes)
    
    result_ts = tables.tree_sequence()
    logger.info(f"Applied GAIA quadratic locations: {len(individual_to_sample_nodes)} sample individuals, {len(non_sample_node_ids)} internal nodes")
    
    return result_ts


def apply_gaia_linear_locations_to_tree_sequence(ts: tskit.TreeSequence, locations: np.ndarray) -> tskit.TreeSequence:
    """Apply inferred locations from GAIA linear algorithm to a tree sequence, preserving individual assignments for samples only.
    
    Args:
        ts: Tree sequence to modify
        locations: numpy array of shape (n_nodes, 2) with x, y coordinates for all nodes
    
    Returns:
        Tree sequence with locations applied to all nodes, preserving original sample locations
    """
    logger.info("Applying GAIA linear locations to tree sequence...")
    
    from collections import defaultdict
    
    if locations.shape[1] != 2:
        raise ValueError(f"Expected locations with 2 dimensions (x, y), got {locations.shape[1]}")
    
    if locations.shape[0] != ts.num_nodes:
        raise ValueError(f"Expected locations for {ts.num_nodes} nodes, got {locations.shape[0]}")
    
    tables = ts.dump_tables()
    
    # Get sample and non-sample node IDs
    sample_node_ids = set(node.id for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE)
    non_sample_node_ids = set(node.id for node in ts.nodes() if not (node.flags & tskit.NODE_IS_SAMPLE))
    
    # Group ONLY SAMPLE NODES by their existing individual assignments
    individual_to_sample_nodes = defaultdict(list)
    sample_node_to_individual = {}
    
    # First, collect existing individual assignments for sample nodes only
    for node in ts.nodes():
        if node.flags & tskit.NODE_IS_SAMPLE and node.individual != -1:
            individual_to_sample_nodes[node.individual].append(node.id)
            sample_node_to_individual[node.id] = node.individual
    
    # If no existing individuals for samples, assume diploid pairing
    if not individual_to_sample_nodes and sample_node_ids:
        logger.info("No existing individual assignments found for samples, assuming diploid pairing")
        sorted_sample_nodes = sorted(sample_node_ids)
        for i, node_id in enumerate(sorted_sample_nodes):
            individual_id = node_id // 2  # Integer division: 0,1→0; 2,3→1; 4,5→2; etc.
            individual_to_sample_nodes[individual_id].append(node_id)
            sample_node_to_individual[node_id] = individual_id
    
    # Clear and rebuild individuals table
    tables.individuals.clear()
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    node_to_new_individual = {}
    
    # Create individuals for sample nodes (grouped by original individual assignments)
    for old_individual_id in sorted(individual_to_sample_nodes.keys()):
        sample_nodes_for_individual = individual_to_sample_nodes[old_individual_id]
        
        # Check if original individual had a location to preserve
        original_individual = ts.individual(old_individual_id)
        if original_individual.location is not None and len(original_individual.location) >= 2:
            # Preserve original sample location
            location = original_individual.location  # Keep original location including z if present
        else:
            # Fallback to GAIA location from first sample node if original not available
            sample_node = min(sample_nodes_for_individual)  # Use lowest ID
            x_coord = float(locations[sample_node, 0])
            y_coord = float(locations[sample_node, 1])
            location = np.array([x_coord, y_coord, 0.0])
        
        new_individual_id = tables.individuals.add_row(
            flags=0,
            location=location,
            parents=[],
            metadata=b''
        )
        
        # Assign this individual to all sample nodes in the group
        for sample_node_id in sample_nodes_for_individual:
            node_to_new_individual[sample_node_id] = new_individual_id
    
    # Create separate individuals for each internal node with its own unique GAIA location
    for node_id in non_sample_node_ids:
        x_coord = float(locations[node_id, 0])
        y_coord = float(locations[node_id, 1])
        location = np.array([x_coord, y_coord, 0.0])
        
        new_individual_id = tables.individuals.add_row(
            flags=0,
            location=location,
            parents=[],
            metadata=b''
        )
        node_to_new_individual[node_id] = new_individual_id
    
    # Handle sample nodes that don't have individual assignments
    for node_id in sample_node_ids:
        if node_id not in node_to_new_individual:
            x_coord = float(locations[node_id, 0])
            y_coord = float(locations[node_id, 1])
            location = np.array([x_coord, y_coord, 0.0])
            
            new_individual_id = tables.individuals.add_row(
                flags=0,
                location=location,
                parents=[],
                metadata=b''
            )
            node_to_new_individual[node_id] = new_individual_id
    
    # Rebuild nodes table with corrected individual assignments
    new_nodes = tables.nodes.copy()
    new_nodes.clear()
    
    for node in ts.nodes():
        new_individual_id = node_to_new_individual.get(node.id, -1)
        
        new_nodes.add_row(
            time=node.time,
            flags=node.flags,
            population=node.population,
            individual=new_individual_id,
            metadata=node.metadata
        )
    
    tables.nodes.replace_with(new_nodes)
    
    result_ts = tables.tree_sequence()
    logger.info(f"Applied GAIA linear locations: {len(individual_to_sample_nodes)} sample individuals, {len(non_sample_node_ids)} internal nodes")
    
    return result_ts


def apply_custom_locations_to_tree_sequence(
    ts: tskit.TreeSequence, 
    sample_locations: Dict[int, tuple], 
    node_locations: Dict[int, tuple]
) -> tskit.TreeSequence:
    """Apply custom locations from CSV files to a tree sequence, preserving individual assignments for samples only."""
    logger.info("Applying custom locations to tree sequence...")
    
    from collections import defaultdict
    
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
    
    # Group ONLY SAMPLE NODES by their existing individual assignments
    individual_to_sample_nodes = defaultdict(list)
    sample_node_to_individual = {}
    
    # First, collect existing individual assignments for sample nodes only
    for node in ts.nodes():
        if node.flags & tskit.NODE_IS_SAMPLE and node.individual != -1:
            individual_to_sample_nodes[node.individual].append(node.id)
            sample_node_to_individual[node.id] = node.individual
    
    # If no existing individuals for samples, assume diploid pairing
    if not individual_to_sample_nodes and sample_node_ids:
        logger.info("No existing individual assignments found for samples, assuming diploid pairing")
        sorted_sample_nodes = sorted(sample_node_ids)
        for i, node_id in enumerate(sorted_sample_nodes):
            individual_id = node_id // 2  # Integer division: 0,1→0; 2,3→1; 4,5→2; etc.
            individual_to_sample_nodes[individual_id].append(node_id)
            sample_node_to_individual[node_id] = individual_id
    
    # Create new tree sequence with custom locations
    tables = ts.dump_tables()
    
    # Clear and rebuild individuals table
    tables.individuals.clear()
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    node_to_new_individual = {}
    
    # Create individuals for sample nodes (grouped by original individual assignments)
    for old_individual_id in sorted(individual_to_sample_nodes.keys()):
        sample_nodes_for_individual = individual_to_sample_nodes[old_individual_id]
        
        # Use sample location for this individual (all sample nodes in individual get same location)
        representative_sample = min(sample_nodes_for_individual)  # Use lowest ID as representative
        x, y, z = sample_locations[representative_sample]
        location = np.array([x, y, z])
        
        new_individual_id = tables.individuals.add_row(
            flags=0,
            location=location,
            parents=[],
            metadata=b''
        )
        
        # Assign this individual to all sample nodes in the group
        for sample_node_id in sample_nodes_for_individual:
            node_to_new_individual[sample_node_id] = new_individual_id
    
    # Create separate individuals for each internal node with its own unique location
    for node_id in non_sample_node_ids:
        if node_id in valid_node_location_ids:
            x, y, z = node_locations[node_id]
            location = np.array([x, y, z])
            
            new_individual_id = tables.individuals.add_row(
                flags=0,
                location=location,
                parents=[],
                metadata=b''
            )
            node_to_new_individual[node_id] = new_individual_id
    
    # Handle sample nodes that don't have individual assignments
    for node_id in sample_node_ids:
        if node_id not in node_to_new_individual:
            x, y, z = sample_locations[node_id]
            location = np.array([x, y, z])
            
            new_individual_id = tables.individuals.add_row(
                flags=0,
                location=location,
                parents=[],
                metadata=b''
            )
            node_to_new_individual[node_id] = new_individual_id
    
    # Rebuild nodes table with corrected individual assignments
    new_nodes = tables.nodes.copy()
    new_nodes.clear()
    
    for node in ts.nodes():
        new_individual_id = node_to_new_individual.get(node.id, -1)
        
        new_nodes.add_row(
            time=node.time,
            flags=node.flags,
            population=node.population,
            individual=new_individual_id,
            metadata=node.metadata
        )
    
    tables.nodes.replace_with(new_nodes)
    
    result_ts = tables.tree_sequence()
    logger.info(f"Applied custom locations: {len(individual_to_sample_nodes)} sample individuals, {len(valid_node_location_ids)} internal nodes")
    
    return result_ts 