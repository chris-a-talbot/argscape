"""
Spacetrees location inference functionality.

Adapted from spacetrees (Osmond & Coop 2024) to work directly with tskit tree sequences.
"""

import logging
from typing import Dict, Tuple, List, Optional

import numpy as np
import pandas as pd
import tskit

# Import spacetrees functions
logger = logging.getLogger(__name__)
SPACETREES_AVAILABLE = False

try:
    from argscape.api.inference.spacetrees import (
        locate_ancestors,
        estimate_dispersal,
    )
    from argscape.api.inference.spacetrees.utils import (
        get_shared_times,
        chop_shared_times,
        center_shared_times,
        log_coal_density,
    )
    logger.info("spacetrees successfully imported")
    SPACETREES_AVAILABLE = True
except ImportError as e:
    logger.warning(f"spacetrees not available - spacetrees location inference disabled: {e}")
    # Define stub functions to prevent errors
    def locate_ancestors(*args, **kwargs):
        raise RuntimeError("spacetrees not available")
    def estimate_dispersal(*args, **kwargs):
        raise RuntimeError("spacetrees not available")
    def get_shared_times(*args, **kwargs):
        raise RuntimeError("spacetrees not available")
    def chop_shared_times(*args, **kwargs):
        raise RuntimeError("spacetrees not available")
    def center_shared_times(*args, **kwargs):
        raise RuntimeError("spacetrees not available")
    def log_coal_density(*args, **kwargs):
        raise RuntimeError("spacetrees not available")

def extract_sample_locations_array(ts: tskit.TreeSequence) -> np.ndarray:
    """Extract sample locations from tree sequence into a numpy array.
    
    Args:
        ts: Input tree sequence
        
    Returns:
        2D array of sample locations (n_samples, n_dimensions)
    """
    sample_locations = []
    sample_node_ids = list(ts.samples())
    
    logger.info(f"Found {len(sample_node_ids)} sample nodes")
    
    # Extract locations from individuals table
    for node_id in sample_node_ids:
        node = ts.node(node_id)
        if node.individual != -1:  # Node has an individual
            individual = ts.individual(node.individual)
            if len(individual.location) >= 2:  # Has x, y coordinates
                # Use 2D coordinates (spacetrees works with 2D)
                sample_locations.append([
                    individual.location[0],  # x coordinate
                    individual.location[1],  # y coordinate
                ])
    
    if not sample_locations:
        raise ValueError("No sample locations found in tree sequence metadata")
    
    # Verify we have locations for all samples
    if len(sample_locations) != len(sample_node_ids):
        raise ValueError(f"Missing locations for some sample nodes")
    
    return np.array(sample_locations)


def group_trees_by_locus(
    ts: tskit.TreeSequence,
    locus_size: Optional[float] = None,
    num_loci: Optional[int] = None
) -> List[List[int]]:
    """
    Group trees into loci based on genomic position.
    
    Args:
        ts: Tree sequence
        locus_size: Size of each locus in base pairs (if None, use num_loci)
        num_loci: Number of loci to create (if None, use locus_size)
        
    Returns:
        List of lists of tree indices, where each inner list represents trees in one locus
    """
    if locus_size is None and num_loci is None:
        # Default: treat each tree as a separate locus (current behavior)
        return [[i] for i in range(ts.num_trees)]
    
    if num_loci is not None:
        locus_size = ts.sequence_length / num_loci
    
    loci = []
    current_locus = []
    current_locus_end = locus_size
    
    for i, tree in enumerate(ts.trees()):
        tree_start = tree.interval.left
        tree_end = tree.interval.right
        
        # If tree spans multiple loci, assign to the locus containing its midpoint
        tree_midpoint = (tree_start + tree_end) / 2.0
        
        if tree_midpoint >= current_locus_end and current_locus:
            # Start new locus
            loci.append(current_locus)
            current_locus = []
            current_locus_end += locus_size
        
        current_locus.append(i)
    
    if current_locus:
        loci.append(current_locus)
    
    return loci


def extract_shared_times_from_trees(ts: tskit.TreeSequence, samples: List[int], 
                                     time_cutoff: Optional[float] = None,
                                     require_common_ancestor: bool = True) -> Tuple[List[np.ndarray], List[np.ndarray], List[np.ndarray], List[int]]:
    """
    Extract shared times matrices from all trees in a tree sequence.
    
    Args:
        ts: Input tree sequence
        samples: List of sample node IDs (ordered to match locations)
        time_cutoff: Optional time cutoff for chopping shared times
        require_common_ancestor: If True, skip trees where not all samples share a common ancestor.
                                This maintains statistical compatibility with the original spacetrees method.
        
    Returns:
        Tuple of:
        - shared_times_chopped: List of shared times matrices (one per tree)
        - shared_times_chopped_centered_inverted: List of centered, inverted matrices
        - shared_times_logdet: List of log determinants
        - tree_indices: List of tree indices that were kept (for locus grouping)
    """
    shared_times_chopped = []
    shared_times_chopped_centered_inverted = []
    shared_times_logdet = []
    tree_indices = []
    
    logger.info(f"Extracting shared times from {ts.num_trees} trees")
    
    trees_skipped = 0
    for tree_idx, tree in enumerate(ts.trees()):
        # Get shared times vector
        sts_vec = get_shared_times(tree, samples, require_common_ancestor=require_common_ancestor)
        
        # Skip trees where not all samples share a common ancestor
        if sts_vec is None:
            trees_skipped += 1
            continue
        
        tree_indices.append(tree_idx)
        
        # Chop if time cutoff specified
        if time_cutoff is not None:
            sts_vec = chop_shared_times(sts_vec, T=time_cutoff)
        
        # Convert vector to matrix
        k = int((np.sqrt(1+8*(len(sts_vec)-1))+1)/2)  # number of samples
        sts_mat = np.zeros((k, k))
        sts_mat[np.triu_indices(k, k=1)] = sts_vec[1:]  # fill upper triangle
        sts_mat = sts_mat + sts_mat.T + np.diag([sts_vec[0]]*k)  # add lower triangle and diagonal
        
        shared_times_chopped.append(sts_mat)
        
        # Center and invert
        sts_centered = center_shared_times(sts_vec)
        sts_inv = np.linalg.inv(sts_centered)
        shared_times_chopped_centered_inverted.append(sts_inv)
        
        # Log determinant
        logdet = np.linalg.slogdet(sts_centered)[1]
        shared_times_logdet.append(logdet)
    
    if trees_skipped > 0:
        logger.info(f"Skipped {trees_skipped}/{ts.num_trees} trees where not all samples share a common ancestor "
                   f"({100*trees_skipped/ts.num_trees:.1f}%). Using {len(shared_times_chopped)} trees for inference.")
    
    if len(shared_times_chopped) == 0:
        raise ValueError("No trees found where all samples share a common ancestor. "
                        "Cannot run spacetrees inference. Consider setting require_common_ancestor=False "
                        "(less statistically correct but may work for some cases).")
    
    return shared_times_chopped, shared_times_chopped_centered_inverted, shared_times_logdet, tree_indices


def extract_coalescence_times(ts: tskit.TreeSequence, time_cutoff: Optional[float] = None) -> List[List[float]]:
    """
    Extract coalescence times from all trees in a tree sequence.
    
    Args:
        ts: Input tree sequence
        time_cutoff: Optional time cutoff
        
    Returns:
        List of lists of coalescence times (one list per tree)
    """
    coalescence_times = []
    
    for tree in ts.trees():
        # Get coalescence times - these are the times of internal nodes in the tree
        # Internal nodes are all nodes except samples
        cts = []
        for node_id in range(ts.num_nodes):
            node = ts.node(node_id)
            if not node.is_sample():
                # Check if node exists in this tree by checking if it has a parent or children
                try:
                    # Try to get the node's time - if it exists in tree, this will work
                    node_time = tree.time(node_id)
                    cts.append(node_time)
                except (ValueError, KeyError):
                    # Node doesn't exist in this tree, skip it
                    pass
        
        cts = sorted(cts)
        
        if time_cutoff is not None:
            cts = [ct for ct in cts if ct < time_cutoff]
        
        coalescence_times.append(cts)
    
    return coalescence_times


def extract_branching_times(ts: tskit.TreeSequence, time_cutoff: Optional[float] = None) -> List[List[float]]:
    """
    Extract branching times from all trees in a tree sequence.
    
    Branching times are TMRCA - coalescence_times, in ascending order.
    
    Args:
        ts: Input tree sequence
        time_cutoff: Optional time cutoff
        
    Returns:
        List of lists of branching times (one list per tree)
    """
    branching_times = []
    
    for tree in ts.trees():
        # Get coalescence times
        cts = []
        for node_id in range(ts.num_nodes):
            node = ts.node(node_id)
            if not node.is_sample():
                try:
                    node_time = tree.time(node_id)
                    cts.append(node_time)
                except (ValueError, KeyError):
                    pass
        
        cts = sorted(cts)
        
        if not cts:
            branching_times.append([])
            continue
        
        # Handle multiple roots
        try:
            TMRCA = tree.time(tree.root)
        except ValueError:
            roots = tree.roots
            TMRCA = max(tree.time(r) for r in roots)
        
        Tmax = TMRCA
        if time_cutoff is not None and time_cutoff < TMRCA:
            Tmax = time_cutoff
        
        # Branching times = Tmax - coalescence_times (reversed)
        bts = Tmax - np.flip(np.array(cts))
        bts = bts[bts > 0]  # remove branching times at or before T
        bts = np.append(bts, Tmax)  # append total time as last item
        
        branching_times.append(bts.tolist())
    
    return branching_times


def run_spacetrees_inference(
    ts: tskit.TreeSequence,
    time_cutoff: Optional[float] = None,
    ancestor_times: Optional[List[float]] = None,
    use_importance_sampling: bool = True,
    require_common_ancestor: bool = True,
    quiet: bool = False,
    # New parameters
    Ne: Optional[float] = None,  # Constant Ne (backward compatible)
    Ne_epochs: Optional[List[float]] = None,  # Epoch boundaries for time-varying Ne
    Nes: Optional[List[float]] = None,  # Effective population sizes for each epoch
    num_loci: Optional[int] = None,  # Number of loci to group trees into
    locus_size: Optional[float] = None,  # Size of each locus in bp
    use_blup: bool = False,  # If True, use BLUP instead of MLE
    blup_var: bool = False,  # If True, also return variance estimates (only if use_blup=True)
) -> Tuple[tskit.TreeSequence, Dict, Dict]:
    """
    Run spacetrees inference on a tree sequence.
    
    Args:
        ts: Input tree sequence with sample locations
        time_cutoff: Optional time cutoff for inference
        ancestor_times: List of times in the past to locate ancestors at
        use_importance_sampling: If True, use importance sampling with branching times
        require_common_ancestor: If True, skip trees where not all samples share a common ancestor.
                                This maintains statistical compatibility with the original spacetrees method.
                                If False, use all trees (less statistically correct but uses more data).
        quiet: If True, suppress progress output
        Ne: Constant effective population size (backward compatible)
        Ne_epochs: Epoch boundaries for time-varying Ne
        Nes: Effective population sizes for each epoch
        num_loci: Number of loci to group trees into
        locus_size: Size of each locus in base pairs
        use_blup: If True, use Best Linear Unbiased Predictor instead of MLE
        blup_var: If True, also return variance estimates (only if use_blup=True)
        
    Returns:
        Tuple of (tree sequence with inferred locations, inference info dict, intermediate data dict)
        Intermediate data dict contains: dispersal_params, ancestor_locations
    """
    if not SPACETREES_AVAILABLE:
        raise RuntimeError("spacetrees package not available")
    
    try:
        logger.info(f"Running spacetrees inference for ts with {ts.num_nodes} nodes, "
                    f"{ts.num_samples} samples, {ts.num_edges} edges.")
        
        # Extract sample locations
        sample_node_ids = list(ts.samples())
        locations = extract_sample_locations_array(ts)
        logger.info(f"Extracted locations for {len(sample_node_ids)} samples")
        
        # Extract shared times from all trees (now returns tree_indices too)
        shared_times_chopped, shared_times_chopped_centered_inverted, shared_times_logdet, tree_indices = \
            extract_shared_times_from_trees(ts, sample_node_ids, time_cutoff=time_cutoff, require_common_ancestor=require_common_ancestor)
        
        logger.info(f"Extracted shared times from {len(shared_times_chopped)} trees")
        
        # Group trees into loci
        locus_groups = group_trees_by_locus(ts, num_loci=num_loci, locus_size=locus_size)
        
        # Create mapping from tree index to position in filtered list
        tree_idx_to_filtered_idx = {tree_idx: i for i, tree_idx in enumerate(tree_indices)}
        
        # Prepare data structure for estimate_dispersal (expects list of lists: loci x trees)
        shared_times_inverted = []
        shared_times_logdet_list = []
        branching_times_grouped = [] if use_importance_sampling else None
        logpcoals_grouped = [] if use_importance_sampling else None
        
        for locus_indices in locus_groups:
            # Group shared times for this locus (only include trees that passed filtering)
            locus_sts_inv = []
            locus_logdet = []
            locus_bts = []
            locus_lpcs = []
            
            for tree_idx in locus_indices:
                if tree_idx in tree_idx_to_filtered_idx:
                    filtered_idx = tree_idx_to_filtered_idx[tree_idx]
                    locus_sts_inv.append(shared_times_chopped_centered_inverted[filtered_idx])
                    locus_logdet.append(shared_times_logdet[filtered_idx])
            
            shared_times_inverted.append(locus_sts_inv)
            shared_times_logdet_list.append(locus_logdet)
        
        # Determine Ne configuration
        use_time_varying_ne = False
        Ne_constant = None
        if Ne_epochs is not None and Nes is not None:
            # Time-varying Ne (matches original method)
            epochs = np.array(Ne_epochs)
            Nes_array = np.array(Nes)
            use_time_varying_ne = True
        elif Ne is not None:
            # Constant Ne (backward compatible)
            Ne_constant = float(Ne)
            use_time_varying_ne = False
        else:
            # Default: estimate from sample size
            Ne_constant = float(ts.num_samples)
            use_time_varying_ne = False
            logger.warning("No Ne provided, using Ne=num_samples as default")
        
        # Extract branching times and coalescence probabilities if using importance sampling
        branching_times = None
        logpcoals = None
        if use_importance_sampling:
            branching_times_raw = extract_branching_times(ts, time_cutoff=time_cutoff)
            
            # Check if branching times are valid (not empty and have valid values)
            valid_branching_times = []
            for bts in branching_times_raw:
                if bts and len(bts) > 0 and all(np.isfinite(bts)) and bts[-1] > 0:
                    valid_branching_times.append([bts])
                else:
                    valid_branching_times.append([[]])
            
            # If too many trees have invalid branching times, disable importance sampling
            valid_count = sum(1 for bts_list in valid_branching_times if bts_list[0])
            if valid_count < len(valid_branching_times) * 0.5:  # Less than 50% valid
                logger.warning(f"Only {valid_count}/{len(valid_branching_times)} trees have valid branching times. Disabling importance sampling.")
                use_importance_sampling = False
                branching_times = None
                logpcoals = None
            else:
                # Group branching times by locus
                for locus_indices in locus_groups:
                    locus_bts = []
                    locus_lpcs = []
                    for tree_idx in locus_indices:
                        if tree_idx < len(valid_branching_times):
                            locus_bts.append(valid_branching_times[tree_idx][0])
                    
                    branching_times_grouped.append(locus_bts)
                
                # Calculate log coalescent probabilities
                coalescence_times = extract_coalescence_times(ts, time_cutoff=time_cutoff)
                
                for locus_indices in locus_groups:
                    locus_lpcs = []
                    for tree_idx in locus_indices:
                        if tree_idx < len(coalescence_times):
                            cts = coalescence_times[tree_idx]
                            if cts and len(cts) > 0:
                                Tmax = float(max(cts)) if time_cutoff is None else float(time_cutoff)
                                if use_time_varying_ne:
                                    lpc = log_coal_density(
                                        times=np.array(cts), 
                                        Nes=Nes_array, 
                                        epochs=epochs,
                                        T=Tmax
                                    )
                                else:
                                    lpc = log_coal_density(
                                        times=np.array(cts), 
                                        Nes=np.array([Ne_constant]), 
                                        T=Tmax
                                    )
                                locus_lpcs.append(float(lpc))
                            else:
                                locus_lpcs.append(0.0)
                        else:
                            locus_lpcs.append(0.0)
                    logpcoals_grouped.append(locus_lpcs)
                
                branching_times = branching_times_grouped
                logpcoals = logpcoals_grouped
        
        # Estimate dispersal rate
        logger.info("Estimating dispersal rate with spacetrees...")
        dispersal_params = estimate_dispersal(
            locations=locations,
            shared_times_inverted=shared_times_inverted,
            shared_times_logdet=shared_times_logdet_list,
            important=use_importance_sampling,
            branching_times=branching_times,
            logpcoals=logpcoals,
            quiet=quiet
        )
        
        # Convert dispersal parameters to covariance matrix
        from argscape.api.inference.spacetrees import _sds_rho_to_sigma
        if use_importance_sampling:
            sigma = _sds_rho_to_sigma(dispersal_params[:-1])  # exclude phi
        else:
            sigma = _sds_rho_to_sigma(dispersal_params)
        
        logger.info(f"Estimated dispersal rate (covariance matrix):\n{sigma}")
        
        # Locate ancestors
        if ancestor_times is None:
            # Default: locate ancestors at all unique node times in the tree sequence
            # This ensures we locate ancestors for all nodes, not just a few time points
            all_node_times = set()
            for node in ts.nodes():
                if not node.is_sample():  # Only internal nodes (ancestors)
                    all_node_times.add(node.time)
            
            # Sort times and use all unique ancestor times
            ancestor_times = sorted(list(all_node_times))
            
            # If no internal nodes found, fall back to a few time points
            if not ancestor_times:
                max_times = []
                for tree in ts.trees():
                    try:
                        max_times.append(tree.time(tree.root))
                    except ValueError:
                        roots = tree.roots
                        max_times.append(max(tree.time(r) for r in roots))
                max_time = max(max_times) if max_times else 100.0
                ancestor_times = [max_time * 0.1, max_time * 0.3, max_time * 0.5]
                logger.warning("No internal nodes found, using default time points")
            else:
                logger.info(f"Locating ancestors at all {len(ancestor_times)} unique node times")
        
        # Prepare shared times for ancestor location (need chopped but not necessarily centered)
        # Use same filtering as dispersal estimation to maintain consistency
        shared_times_for_ancestors = []
        shared_times_centered_inv_for_ancestors = []
        branching_times_for_ancestors = []
        coalescence_times_for_ancestors = []
        
        for tree_idx, tree in enumerate(ts.trees()):
            sts_vec = get_shared_times(tree, sample_node_ids, require_common_ancestor=require_common_ancestor)
            # Skip trees where not all samples share a common ancestor (maintains statistical correctness)
            if sts_vec is None:
                continue
            if time_cutoff is not None:
                sts_vec = chop_shared_times(sts_vec, T=time_cutoff)
            
            # Convert to matrix
            k = int((np.sqrt(1+8*(len(sts_vec)-1))+1)/2)
            sts_mat = np.zeros((k, k))
            sts_mat[np.triu_indices(k, k=1)] = sts_vec[1:]
            sts_mat = sts_mat + sts_mat.T + np.diag([sts_vec[0]]*k)
            shared_times_for_ancestors.append(sts_mat)
            
            # Get centered inverted version
            sts_centered = center_shared_times(sts_vec)
            sts_inv = np.linalg.inv(sts_centered)
            shared_times_centered_inv_for_ancestors.append(sts_inv)
            
            # Extract branching times and coalescence times for importance weights
            if use_importance_sampling:
                # Get coalescence times for this tree
                cts = []
                for node_id in range(ts.num_nodes):
                    node = ts.node(node_id)
                    if not node.is_sample():
                        try:
                            node_time = tree.time(node_id)
                            cts.append(node_time)
                        except (ValueError, KeyError):
                            pass
                
                cts = sorted(cts)
                if time_cutoff is not None:
                    cts = [ct for ct in cts if ct < time_cutoff]
                coalescence_times_for_ancestors.append(cts)
                
                # Get branching times
                if cts:
                    try:
                        TMRCA = tree.time(tree.root)
                    except ValueError:
                        roots = tree.roots
                        TMRCA = max(tree.time(r) for r in roots)
                    
                    Tmax = TMRCA
                    if time_cutoff is not None and time_cutoff < TMRCA:
                        Tmax = time_cutoff
                    
                    bts = Tmax - np.flip(np.array(cts))
                    bts = bts[bts > 0]
                    bts = np.append(bts, Tmax)
                    branching_times_for_ancestors.append(bts.tolist())
                else:
                    branching_times_for_ancestors.append([])
        
        # Calculate importance weights for ancestor location
        log_weights = []
        if use_importance_sampling and dispersal_params is not None:
            phi = dispersal_params[-1]  # branching rate
            from argscape.api.inference.spacetrees import _log_birth_density
            
            logger.info(f"Calculating importance weights using branching rate phi={phi:.6f}")
            
            for bts, cts in zip(branching_times_for_ancestors, coalescence_times_for_ancestors):
                if bts and len(bts) > 0:
                    # Calculate log probability of branching times under Yule process
                    lbd = _log_birth_density(branching_times=bts, phi=phi, n=len(sample_node_ids))
                    
                    # Calculate log probability of coalescence times under standard coalescent
                    if cts and len(cts) > 0:
                        Tmax = float(max(cts)) if time_cutoff is None else float(time_cutoff)
                        if use_time_varying_ne:
                            lpc = log_coal_density(
                                times=np.array(cts), 
                                Nes=Nes_array, 
                                epochs=epochs,
                                T=Tmax
                            )
                        else:
                            lpc = log_coal_density(
                                times=np.array(cts), 
                                Nes=np.array([Ne_constant]), 
                                T=Tmax
                            )
                    else:
                        lpc = 0.0
                    
                    log_weights.append(lbd - lpc)
                else:
                    log_weights.append(0.0)  # No weight if invalid branching times
        else:
            # Equal weights when not using importance sampling
            log_weights = [0.0] * len(shared_times_for_ancestors)
            if not use_importance_sampling:
                logger.info("Using equal weights (importance sampling disabled)")
        
        # Ensure log_weights length matches
        if len(log_weights) != len(shared_times_for_ancestors):
            logger.warning(f"log_weights length ({len(log_weights)}) doesn't match shared_times_for_ancestors length ({len(shared_times_for_ancestors)}). Using equal weights.")
            log_weights = [0.0] * len(shared_times_for_ancestors)
        
        # Log weight statistics
        if log_weights and any(w != 0.0 for w in log_weights):
            weight_stats = {
                'min': min(log_weights),
                'max': max(log_weights),
                'mean': np.mean(log_weights),
                'std': np.std(log_weights)
            }
            logger.info(f"Importance weights statistics: min={weight_stats['min']:.4f}, max={weight_stats['max']:.4f}, mean={weight_stats['mean']:.4f}, std={weight_stats['std']:.4f}")
        
        # Locate ancestors for all samples using spacetrees
        logger.info(f"Calling spacetrees locate_ancestors with {len(shared_times_for_ancestors)} trees, "
                   f"{len(sample_node_ids)} samples, {len(ancestor_times)} time points, "
                   f"BLUP={use_blup}, importance_sampling={use_importance_sampling}")
        
        ancestor_locations = locate_ancestors(
            samples=list(range(len(sample_node_ids))),
            times=ancestor_times,
            shared_times_chopped=shared_times_for_ancestors,
            shared_times_chopped_centered_inverted=shared_times_centered_inv_for_ancestors,
            locations=locations,
            sigma=sigma,
            log_weights=log_weights,
            BLUP=use_blup,
            BLUP_var=blup_var,
            quiet=quiet
        )
        
        logger.info(f"Spacetrees located {len(ancestor_locations)} ancestor positions "
                   f"({len(sample_node_ids)} samples × {len(ancestor_times)} times)")
        
        # Apply locations to tree sequence
        # Spacetrees provides ancestor locations at specific times for each sample
        # We need to map these to actual nodes in the tree sequence
        from argscape.api.geo_utils import apply_custom_locations_to_tree_sequence
        
        # Build node_locations dictionary
        # Start with all sample locations
        sample_locations_dict = {node_id: [locations[i, 0], locations[i, 1], 0.0] 
                                for i, node_id in enumerate(sample_node_ids)}
        
        # Map ancestor locations to nodes
        # For each (sample, time) pair, find the ancestor node of that sample at that time
        node_locations = {}
        
        # Create a mapping from sample index to sample node ID
        sample_idx_to_node_id = {i: node_id for i, node_id in enumerate(sample_node_ids)}
        
        # Group ancestor locations by sample to avoid duplicate assignments
        ancestor_locations_by_sample = {}
        for anc_loc in ancestor_locations:
            sample_idx = int(anc_loc[0])
            if sample_idx not in ancestor_locations_by_sample:
                ancestor_locations_by_sample[sample_idx] = []
            ancestor_locations_by_sample[sample_idx].append(anc_loc)
        
        # For each sample, find ancestors at the specified times
        for sample_idx, anc_locs in ancestor_locations_by_sample.items():
            sample_node_id = sample_idx_to_node_id[sample_idx]
            
            # For each ancestor time, find the best matching node
            for anc_loc in anc_locs:
                if blup_var and len(anc_loc) > 4:
                    # BLUP with variance: [sample_idx, time, x, y, variance]
                    target_time, x, y, variance = float(anc_loc[1]), float(anc_loc[2]), float(anc_loc[3]), float(anc_loc[4])
                else:
                    # MLE or BLUP without variance: [sample_idx, time, x, y]
                    target_time, x, y = float(anc_loc[1]), float(anc_loc[2]), float(anc_loc[3])
                    variance = None
                
                # Find the ancestor node of this sample at the target time
                # Search through trees to find nodes that are ancestors at this time
                best_node_id = None
                best_time_diff = float('inf')
                
                # Use a representative tree (e.g., first tree) to find the ancestor path
                # In an ARG, the ancestor at a given time should be consistent across trees
                for tree in ts.trees():
                    try:
                        # Check if sample exists in this tree
                        if not tree.is_sample(sample_node_id):
                            continue
                        
                        # Get the path from sample to root
                        current = sample_node_id
                        path = [current]
                        while True:
                            parent = tree.parent(current)
                            if parent == -1:
                                break
                            path.append(parent)
                            current = parent
                        
                        # Find the node in the path closest to target_time
                        for node_id in path:
                            node_time = ts.node(node_id).time
                            time_diff = abs(node_time - target_time)
                            if time_diff < best_time_diff:
                                best_time_diff = time_diff
                                best_node_id = node_id
                        
                        # If we found a good match (within reasonable tolerance), use it
                        if best_time_diff < target_time * 0.1:  # Within 10% of target time
                            break
                    except (ValueError, KeyError):
                        continue
                
                # If we found a node, assign the location (only if not already assigned)
                if best_node_id is not None and best_node_id not in sample_locations_dict:
                    if best_node_id not in node_locations:
                        node_locations[best_node_id] = [x, y, 0.0]
                    else:
                        # Node already has a location, average them
                        existing = node_locations[best_node_id]
                        node_locations[best_node_id] = [
                            (existing[0] + x) / 2.0,
                            (existing[1] + y) / 2.0,
                            0.0
                        ]
        
        # For nodes without locations, use midpoint interpolation from their children
        # Get all non-sample nodes
        non_sample_nodes = set(node.id for node in ts.nodes() if not node.is_sample())
        missing_nodes = non_sample_nodes - set(node_locations.keys()) - set(sample_locations_dict.keys())
        
        # Use midpoint inference for missing nodes
        if missing_nodes:
            logger.info(f"Using midpoint interpolation for {len(missing_nodes)} nodes without spacetrees locations")
            for node_id in missing_nodes:
                node = ts.node(node_id)
                # Find children of this node
                children = []
                for edge in ts.edges():
                    if edge.parent == node_id:
                        child_id = edge.child
                        child_node = ts.node(child_id)
                        # Get location from child (if available)
                        if child_id in sample_locations_dict:
                            children.append(sample_locations_dict[child_id])
                        elif child_id in node_locations:
                            children.append(node_locations[child_id])
                
                if children:
                    # Use average of children locations
                    avg_location = np.mean(children, axis=0)
                    node_locations[node_id] = [float(avg_location[0]), float(avg_location[1]), 0.0]
                else:
                    # No children with locations, use average of all sample locations
                    avg_sample_location = np.mean([loc[:2] for loc in sample_locations_dict.values()], axis=0)
                    node_locations[node_id] = [float(avg_sample_location[0]), float(avg_sample_location[1]), 0.0]
        
        # Apply locations to tree sequence
        ts_with_locations = apply_custom_locations_to_tree_sequence(
            ts,
            sample_locations=sample_locations_dict,
            node_locations=node_locations
        )
        
        inference_info = {
            "num_inferred_locations": len(ancestor_locations),
            "dispersal_rate": sigma.tolist(),
            "dispersal_parameters": dispersal_params.tolist() if isinstance(dispersal_params, np.ndarray) else dispersal_params,
            "ancestor_times": ancestor_times,
            "inference_method": "BLUP" if use_blup else "MLE",
            "blup_variance": blup_var if use_blup else None,
            "ne_configuration": {
                "constant": Ne_constant if not use_time_varying_ne else None,
                "epochs": Ne_epochs if use_time_varying_ne else None,
                "nes": Nes if use_time_varying_ne else None,
            },
            "inference_parameters": {
                "num_samples": len(sample_node_ids),
                "sequence_length": ts.sequence_length,
                "num_trees": ts.num_trees,
                "time_cutoff": time_cutoff,
                "use_importance_sampling": use_importance_sampling,
                "require_common_ancestor": require_common_ancestor,
                "num_loci": len(locus_groups),
                "locus_size": locus_size,
                "num_loci_param": num_loci,
            }
        }
        
        # Prepare intermediate data for storage
        # Convert ancestor_locations list to DataFrame for easier download
        ancestor_locations_df = pd.DataFrame(ancestor_locations, columns=['sample_idx', 'time', 'x', 'y'] + (['variance'] if blup_var else []))
        
        # Return intermediate data: dispersal_params and ancestor_locations DataFrame
        intermediate_data = {
            "dispersal_params": dispersal_params,
            "ancestor_locations": ancestor_locations_df
        }
        
        return ts_with_locations, inference_info, intermediate_data
        
    except Exception as e:
        logger.error("Error during spacetrees inference", exc_info=True)
        raise RuntimeError(f"Spacetrees inference failed: {str(e)}")

