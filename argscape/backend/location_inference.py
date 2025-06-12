"""
Location inference functionality for ARGscape.
Handles various location inference methods.
"""

import logging
import os
import tempfile
from typing import Dict, Tuple, Optional

import numpy as np
import tskit

# Configure logging
logger = logging.getLogger(__name__)

# Import optional dependencies
try:
    from fastgaia import infer_locations as fastgaia_infer
    logger.info("fastgaia successfully imported")
    FASTGAIA_AVAILABLE = True
except ImportError:
    fastgaia_infer = None
    FASTGAIA_AVAILABLE = False
    logger.warning("fastgaia not available - fast location inference disabled")

try:
    import gaiapy as gp
    logger.info("gaiapy successfully imported")
    GEOANCESTRY_AVAILABLE = True
except ImportError:
    gp = None
    GEOANCESTRY_AVAILABLE = False
    logger.warning("gaiapy not available - GAIA quadratic location inference disabled")

# Import midpoint inference
try:
    from argscape.backend.midpoint_inference import run_midpoint_inference
    logger.info("Midpoint inference successfully imported")
    MIDPOINT_AVAILABLE = True
except ImportError:
    logger.warning("Midpoint inference not available")
    MIDPOINT_AVAILABLE = False

# Import geo_utils functions
from argscape.backend.geo_utils import (
    apply_inferred_locations_to_tree_sequence,
    apply_gaia_quadratic_locations_to_tree_sequence,
    apply_gaia_linear_locations_to_tree_sequence
)

def run_fastgaia_inference(
    ts: tskit.TreeSequence,
    weight_span: bool = True,
    weight_branch_length: bool = True
) -> Tuple[tskit.TreeSequence, Dict]:
    """Run fastgaia inference on a tree sequence.
    
    Args:
        ts: Input tree sequence
        weight_span: Whether to weight by span
        weight_branch_length: Whether to weight by branch length
        
    Returns:
        Tuple of (tree sequence with inferred locations, inference info dict)
    """
    if not FASTGAIA_AVAILABLE:
        raise RuntimeError("fastgaia package not available")
        
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_ts_path = os.path.join(temp_dir, "temp.trees")
        ts.dump(temp_ts_path)
        
        output_inferred = os.path.join(temp_dir, "inferred_locations.csv")
        output_debug = os.path.join(temp_dir, "debug_info.csv")
        
        logger.info(f"Running fastgaia inference for {ts.num_nodes} nodes...")
        
        result_summary = fastgaia_infer(
            tree_path=temp_ts_path,
            continuous_sample_locations_path=None,
            discrete_sample_locations_path=None,
            cost_matrix_path=None,
            weight_span=weight_span,
            weight_branch_length=weight_branch_length,
            output_inferred_continuous=output_inferred,
            output_inferred_discrete=None,
            output_locations_continuous=None,
            output_debug=output_debug,
            verbosity=1
        )
        
        if not os.path.exists(output_inferred):
            raise RuntimeError("Inference completed but no output file was generated")
            
        try:
            import pandas as pd
            locations_df = pd.read_csv(output_inferred)
            logger.info(f"Read {len(locations_df)} inferred locations")
        except ImportError:
            raise RuntimeError("pandas not available for location inference")
            
        from argscape.backend.geo_utils import apply_inferred_locations_to_tree_sequence
        ts_with_locations = apply_inferred_locations_to_tree_sequence(ts, locations_df)
        
        inference_info = {
            "num_inferred_locations": len(locations_df),
            "inference_parameters": {
                "weight_span": weight_span,
                "weight_branch_length": weight_branch_length
            }
        }
        
        return ts_with_locations, inference_info

def extract_sample_locations(ts: tskit.TreeSequence) -> np.ndarray:
    """Extract sample locations from tree sequence metadata.
    
    Args:
        ts: Input tree sequence
        
    Returns:
        numpy array of shape (n_samples, 3) with [node_id, x, y] for each sample
    """
    sample_locations = []
    
    # Get sample node IDs
    sample_node_ids = [node.id for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE]
    logger.info(f"Found {len(sample_node_ids)} sample nodes")
    
    # Extract locations from individuals table
    for node_id in sample_node_ids:
        node = ts.node(node_id)
        if node.individual != -1:  # Node has an individual
            individual = ts.individual(node.individual)
            if len(individual.location) >= 2:  # Has x, y coordinates
                # Format: [node_id, x_coordinate, y_coordinate]
                sample_locations.append([
                    node_id,
                    individual.location[0],  # x coordinate
                    individual.location[1]   # y coordinate
                ])
    
    if not sample_locations:
        raise ValueError("No sample locations found in tree sequence metadata")
    
    return np.array(sample_locations)

def run_gaia_quadratic_inference(ts: tskit.TreeSequence) -> Tuple[tskit.TreeSequence, Dict]:
    """Run GAIA quadratic inference on a tree sequence.
    
    Args:
        ts: Input tree sequence
        
    Returns:
        Tuple of (tree sequence with inferred locations, inference info dict)
    """
    if not GEOANCESTRY_AVAILABLE:
        raise RuntimeError("gaiapy package not available")
    
    # Extract sample locations
    logger.info("Extracting sample locations from tree sequence metadata...")
    sample_locations = extract_sample_locations(ts)
    logger.info(f"Extracted {len(sample_locations)} sample locations with shape {sample_locations.shape}")
    
    # Run quadratic MPR
    logger.info("Computing quadratic MPR...")
    mpr_quad = gp.quadratic_mpr(ts, sample_locations)
    logger.info("Successfully computed quadratic MPR")
    
    # Minimize to find optimal locations
    logger.info("Minimizing quadratic MPR to find optimal locations...")
    locations = gp.quadratic_mpr_minimize(mpr_quad)
    logger.info(f"Inferred locations for {locations.shape[0]} nodes with shape {locations.shape}")
    
    # Augment tree sequence with inferred locations
    logger.info("Augmenting tree sequence with inferred locations...")
    from argscape.backend.geo_utils import apply_gaia_quadratic_locations_to_tree_sequence
    ts_with_locations = apply_gaia_quadratic_locations_to_tree_sequence(ts, locations)
    
    # Count inferred locations (non-sample nodes)
    num_samples = ts.num_samples
    num_inferred_locations = locations.shape[0] - num_samples
    
    inference_info = {
        "num_inferred_locations": num_inferred_locations,
        "total_nodes": locations.shape[0]
    }
    
    return ts_with_locations, inference_info

def run_gaia_linear_inference(ts: tskit.TreeSequence) -> Tuple[tskit.TreeSequence, Dict]:
    """Run GAIA linear inference on a tree sequence.
    
    Args:
        ts: Input tree sequence
        
    Returns:
        Tuple of (tree sequence with inferred locations, inference info dict)
    """
    if not GEOANCESTRY_AVAILABLE:
        raise RuntimeError("gaiapy package not available")
    
    # Extract sample locations
    logger.info("Extracting sample locations from tree sequence metadata...")
    sample_locations = extract_sample_locations(ts)
    logger.info(f"Extracted {len(sample_locations)} sample locations with shape {sample_locations.shape}")
    
    # Run linear MPR
    logger.info("Computing linear MPR...")
    mpr_linear = gp.linear_mpr(ts, sample_locations)
    logger.info("Successfully computed linear MPR")
    
    # Minimize to find optimal locations
    logger.info("Minimizing linear MPR to find optimal locations...")
    locations = gp.linear_mpr_minimize(mpr_linear)
    logger.info(f"Inferred locations for {locations.shape[0]} nodes with shape {locations.shape}")
    
    # Augment tree sequence with inferred locations
    logger.info("Augmenting tree sequence with inferred locations...")
    from argscape.backend.geo_utils import apply_gaia_linear_locations_to_tree_sequence
    ts_with_locations = apply_gaia_linear_locations_to_tree_sequence(ts, locations)
    
    # Count inferred locations (non-sample nodes)
    num_samples = ts.num_samples
    num_inferred_locations = locations.shape[0] - num_samples
    
    inference_info = {
        "num_inferred_locations": num_inferred_locations,
        "total_nodes": locations.shape[0]
    }
    
    return ts_with_locations, inference_info 