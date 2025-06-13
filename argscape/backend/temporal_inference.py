"""
Temporal inference functionality for ARGscape.
Handles tsdate-based temporal inference.
"""

import logging
import os
from typing import Dict, Tuple, Optional

import numpy as np
import tskit

# Configure logging
logger = logging.getLogger(__name__)

# Import tsdate
try:
    import tsdate
    logger.info("tsdate successfully imported")
    TSDATE_AVAILABLE = True
except ImportError:
    tsdate = None
    TSDATE_AVAILABLE = False
    logger.warning("tsdate not available - temporal inference disabled")

def check_mutations_present(ts: tskit.TreeSequence) -> bool:
    """Check if tree sequence has mutations.
    
    Args:
        ts: Input tree sequence
        
    Returns:
        True if tree sequence has mutations, False otherwise
    """
    return ts.num_mutations > 0

def run_tsdate_inference(
    ts: tskit.TreeSequence,
    mutation_rate: float = 1e-8,
    progress: bool = True,
    preprocess: bool = True,
    remove_telomeres: bool = False,
    minimum_gap: Optional[float] = None,
    split_disjoint: bool = True,
    filter_populations: bool = False,
    filter_individuals: bool = False,
    filter_sites: bool = False
) -> Tuple[tskit.TreeSequence, Dict]:
    """Run tsdate inference on a tree sequence.
    
    Args:
        ts: Input tree sequence
        mutation_rate: Per base pair per generation mutation rate
        progress: Whether to show progress bar
        preprocess: Whether to preprocess the tree sequence before dating
        remove_telomeres: Whether to remove telomeres during preprocessing (alias for erase_flanks)
        minimum_gap: Minimum gap between sites to remove (default: 1,000,000)
        split_disjoint: Whether to split disjoint nodes into separately dated nodes
        filter_populations: Whether to filter populations during simplification
        filter_individuals: Whether to filter individuals during simplification
        filter_sites: Whether to filter sites during simplification
        
    Returns:
        Tuple of (tree sequence with inferred times, inference info dict)
    """
    if not TSDATE_AVAILABLE:
        raise RuntimeError("tsdate package not available")
    
    if not check_mutations_present(ts):
        raise ValueError("Tree sequence must have mutations for tsdate inference")
    
    logger.info(f"Running tsdate inference with mutation rate {mutation_rate}...")
    
    try:
        # Make a copy of the tree sequence to avoid modifying the original
        # Use dump_tables() to create a deep copy
        ts_copy = ts.dump_tables().tree_sequence()
        logger.info(f"Created copy of tree sequence: {ts_copy.num_nodes} nodes, {ts_copy.num_trees} trees, {ts_copy.num_mutations} mutations")
        
        # Preprocess tree sequence if requested
        if preprocess:
            logger.info("Preprocessing tree sequence before dating...")
            logger.info(f"Preprocessing options: remove_telomeres={remove_telomeres}, "
                       f"minimum_gap={minimum_gap}, split_disjoint={split_disjoint}, "
                       f"filter_populations={filter_populations}, "
                       f"filter_individuals={filter_individuals}, "
                       f"filter_sites={filter_sites}")
            
            try:
                # Preprocess the copy
                ts_copy = tsdate.preprocess_ts(
                    ts_copy,
                    remove_telomeres=remove_telomeres,  # alias for erase_flanks
                    minimum_gap=minimum_gap,
                    split_disjoint=split_disjoint,
                    filter_populations=filter_populations,
                    filter_individuals=filter_individuals,
                    filter_sites=filter_sites
                )
                logger.info(f"Preprocessing complete: {ts_copy.num_nodes} nodes, {ts_copy.num_trees} trees, {ts_copy.num_mutations} mutations")
            except Exception as preprocess_error:
                logger.error(f"Error during preprocessing: {str(preprocess_error)}")
                raise RuntimeError(f"Preprocessing failed: {str(preprocess_error)}")
        
        # Run tsdate inference on the copy
        try:
            ts_with_times = tsdate.date(
                ts_copy,
                mutation_rate=mutation_rate,
                progress=progress
            )
            logger.info(f"Dating complete: {ts_with_times.num_nodes} nodes, {ts_with_times.num_trees} trees, {ts_with_times.num_mutations} mutations")
        except Exception as date_error:
            logger.error(f"Error during tsdate dating: {str(date_error)}")
            raise RuntimeError(f"tsdate dating failed: {str(date_error)}")
        
        # Count nodes with updated times
        num_nodes = ts_with_times.num_nodes
        num_samples = ts_with_times.num_samples
        num_inferred_times = num_nodes - num_samples  # All non-sample nodes get new times
        
        inference_info = {
            "num_inferred_times": num_inferred_times,
            "total_nodes": num_nodes,
            "mutation_rate": mutation_rate,
            "preprocessing": {
                "preprocessed": preprocess,
                "remove_telomeres": remove_telomeres if preprocess else None,
                "minimum_gap": minimum_gap if preprocess else None,
                "split_disjoint": split_disjoint if preprocess else None,
                "filter_populations": filter_populations if preprocess else None,
                "filter_individuals": filter_individuals if preprocess else None,
                "filter_sites": filter_sites if preprocess else None
            },
            "mutations": {
                "original": ts.num_mutations,
                "after_preprocessing": ts_copy.num_mutations if preprocess else None,
                "final": ts_with_times.num_mutations
            }
        }
        
        logger.info(f"tsdate inference completed successfully for {num_inferred_times} nodes")
        
        return ts_with_times, inference_info
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error during tsdate inference: {error_msg}")
        if hasattr(e, '__cause__') and e.__cause__ is not None:
            logger.error(f"Caused by: {str(e.__cause__)}")
        if hasattr(e, '__context__') and e.__context__ is not None:
            logger.error(f"Context: {str(e.__context__)}")
        raise RuntimeError(f"tsdate inference failed: {error_msg}") 