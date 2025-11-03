"""
Optimized temporal computation utilities for tree sequences.
Uses numpy arrays from tskit for efficient computation.
"""

import logging
import numpy as np
import tskit
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


def compute_temporal_info(ts: tskit.TreeSequence) -> Dict:
    """
    Efficiently compute temporal information for a tree sequence.
    
    Uses tskit's numpy arrays for O(1) access instead of iterating nodes.
    This is much faster for large tree sequences.
    
    Args:
        ts: The tree sequence to analyze
        
    Returns:
        Dictionary with:
        - has_temporal: bool - whether any internal nodes have non-zero time
        - temporal_range: Optional[dict] - min_time and max_time if has_temporal
    """
    num_nodes = ts.num_nodes
    
    # Fast path: if no nodes, no temporal data
    if num_nodes == 0:
        return {
            "has_temporal": False,
            "temporal_range": None
        }
    
    # Use tskit's numpy array for node times - much faster than iteration
    # Access node flags as numpy array for efficient filtering
    node_times = ts.nodes_time
    node_flags = ts.nodes_flags
    
    # Check if any internal nodes (non-samples) have non-zero time
    # Use numpy operations for vectorized computation
    is_sample_mask = (node_flags & tskit.NODE_IS_SAMPLE) != 0
    is_internal_mask = ~is_sample_mask
    
    # Check if any internal nodes have time != 0
    if np.any(is_internal_mask):
        internal_times = node_times[is_internal_mask]
        has_temporal = np.any(internal_times != 0)
    else:
        # No internal nodes, so no temporal info
        has_temporal = False
    
    # If has_temporal, compute min/max efficiently using numpy
    temporal_range = None
    if has_temporal:
        # Use numpy min/max for all nodes (much faster than Python min/max)
        min_time = float(np.min(node_times))
        max_time = float(np.max(node_times))
        temporal_range = {
            "min_time": min_time,
            "max_time": max_time
        }
    
    return {
        "has_temporal": bool(has_temporal),
        "temporal_range": temporal_range
    }


def check_temporal_efficient(ts: tskit.TreeSequence) -> bool:
    """
    Efficiently check if tree sequence has temporal information.
    
    Short-circuits early if no internal nodes exist or if temporal found.
    
    Args:
        ts: The tree sequence to check
        
    Returns:
        True if any internal nodes have non-zero time
    """
    if ts.num_nodes == 0:
        return False
    
    # Use numpy arrays for efficient computation
    node_times = ts.nodes_time
    node_flags = ts.nodes_flags
    
    # Check internal nodes only
    is_internal_mask = (node_flags & tskit.NODE_IS_SAMPLE) == 0
    
    if not np.any(is_internal_mask):
        return False
    
    # Check if any internal node has non-zero time
    internal_times = node_times[is_internal_mask]
    return bool(np.any(internal_times != 0))


def get_temporal_range(ts: tskit.TreeSequence) -> Optional[Tuple[float, float]]:
    """
    Efficiently get temporal range (min_time, max_time) for a tree sequence.
    
    Args:
        ts: The tree sequence to analyze
        
    Returns:
        Tuple of (min_time, max_time) or None if no temporal data
    """
    temporal_info = compute_temporal_info(ts)
    if temporal_info["temporal_range"] is None:
        return None
    
    tr = temporal_info["temporal_range"]
    return (tr["min_time"], tr["max_time"])

