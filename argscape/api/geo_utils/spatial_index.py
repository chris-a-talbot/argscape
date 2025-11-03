"""
Spatial indexing utilities for fast spatial queries on tree sequences.
Uses KD-tree for efficient nearest-neighbor and range queries.
"""

import logging
import numpy as np
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass

import tskit

logger = logging.getLogger(__name__)

# Optional scipy for KD-tree (fallback to brute force if not available)
try:
    from scipy.spatial import cKDTree
    SCIPY_AVAILABLE = True
except ImportError:
    cKDTree = None
    SCIPY_AVAILABLE = False
    logger.warning("scipy not available - spatial indexing will use slower fallback")


@dataclass
class SpatialMetadata:
    """Cached spatial metadata for a tree sequence."""
    has_sample_spatial: bool
    has_all_spatial: bool
    spatial_status: str
    num_nodes_with_spatial: int
    num_samples_with_spatial: int
    bounds: Optional[Tuple[float, float, float, float]]  # min_x, min_y, max_x, max_y
    
    def to_dict(self) -> Dict:
        """Convert to dictionary format."""
        return {
            "has_sample_spatial": self.has_sample_spatial,
            "has_all_spatial": self.has_all_spatial,
            "spatial_status": self.spatial_status,
            "num_nodes_with_spatial": self.num_nodes_with_spatial,
            "num_samples_with_spatial": self.num_samples_with_spatial,
            "bounds": self.bounds
        }


class SpatialIndex:
    """Spatial index for efficient queries on tree sequence node locations."""
    
    def __init__(self, ts: tskit.TreeSequence):
        """
        Build spatial index for tree sequence.
        
        Args:
            ts: Tree sequence with spatial data
        """
        self.ts = ts
        self.tree = None
        self.locations = []
        self.node_ids = []
        self.individual_to_nodes = {}
        self.metadata: Optional[SpatialMetadata] = None
        
        # Build index
        self._build_index()
    
    def _build_index(self):
        """Build the spatial index from tree sequence."""
        logger.debug(f"Building spatial index for {self.ts.num_nodes} nodes")
        
        locations = []
        node_ids = []
        sample_node_ids = set()
        individual_to_nodes = {}
        
        # Fast path: Use numpy arrays for node access
        # Track which nodes have individuals
        has_individual = np.array([node.individual != -1 for node in self.ts.nodes()])
        
        # Early exit if no nodes have individuals
        if not np.any(has_individual):
            self.metadata = SpatialMetadata(
                has_sample_spatial=False,
                has_all_spatial=False,
                spatial_status="none",
                num_nodes_with_spatial=0,
                num_samples_with_spatial=0,
                bounds=None
            )
            return
        
        # Collect locations efficiently
        for node in self.ts.nodes():
            if node.individual != -1 and node.individual < self.ts.num_individuals:
                individual = self.ts.individual(node.individual)
                if individual.location is not None and len(individual.location) >= 2:
                    x, y = float(individual.location[0]), float(individual.location[1])
                    # Check for valid coordinates
                    if np.isfinite(x) and np.isfinite(y):
                        locations.append([x, y])
                        node_ids.append(node.id)
                        
                        # Track individual to nodes mapping
                        if individual.id not in individual_to_nodes:
                            individual_to_nodes[individual.id] = []
                        individual_to_nodes[individual.id].append(node.id)
                        
                        # Track if this is a sample node
                        if node.flags & tskit.NODE_IS_SAMPLE:
                            sample_node_ids.add(node.id)
        
        # Store data
        self.locations = np.array(locations) if locations else np.array([]).reshape(0, 2)
        self.node_ids = np.array(node_ids) if node_ids else np.array([])
        self.individual_to_nodes = individual_to_nodes
        
        # Build KD-tree if scipy available and we have locations
        if SCIPY_AVAILABLE and len(self.locations) > 0:
            try:
                self.tree = cKDTree(self.locations)
                logger.debug(f"Built KD-tree with {len(self.locations)} locations")
            except Exception as e:
                logger.warning(f"Failed to build KD-tree: {e}")
                self.tree = None
        
        # Compute metadata
        total_samples = sum(1 for node in self.ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE)
        has_sample_spatial = len(sample_node_ids) == total_samples and total_samples > 0
        has_all_spatial = len(self.node_ids) == self.ts.num_nodes and self.ts.num_nodes > 0
        
        # Compute bounds
        bounds = None
        if len(self.locations) > 0:
            min_x, min_y = np.min(self.locations, axis=0)
            max_x, max_y = np.max(self.locations, axis=0)
            bounds = (float(min_x), float(min_y), float(max_x), float(max_y))
        
        spatial_status = "all" if has_all_spatial else ("sample_only" if has_sample_spatial else "partial")
        
        self.metadata = SpatialMetadata(
            has_sample_spatial=has_sample_spatial,
            has_all_spatial=has_all_spatial,
            spatial_status=spatial_status,
            num_nodes_with_spatial=len(self.node_ids),
            num_samples_with_spatial=len(sample_node_ids),
            bounds=bounds
        )
        
        logger.info(f"Spatial index built: {self.metadata.spatial_status}, "
                   f"{self.metadata.num_nodes_with_spatial} nodes with spatial data")
    
    def query_radius(self, point: Tuple[float, float], radius: float) -> List[int]:
        """
        Find all nodes within radius of point.
        
        Args:
            point: (x, y) coordinates
            radius: Search radius
        
        Returns:
            List of node IDs within radius
        """
        if len(self.locations) == 0:
            return []
        
        if self.tree is not None:
            # Use KD-tree for fast query
            indices = self.tree.query_ball_point(point, radius)
            return [self.node_ids[i] for i in indices]
        else:
            # Fallback to brute force
            distances = np.sqrt(np.sum((self.locations - np.array(point)) ** 2, axis=1))
            indices = np.where(distances <= radius)[0]
            return [self.node_ids[i] for i in indices]
    
    def query_bbox(
        self, 
        min_x: float, 
        min_y: float, 
        max_x: float, 
        max_y: float
    ) -> List[int]:
        """
        Find all nodes within bounding box.
        
        Args:
            min_x, min_y: Lower-left corner
            max_x, max_y: Upper-right corner
        
        Returns:
            List of node IDs within bounding box
        """
        if len(self.locations) == 0:
            return []
        
        # Filter by bounding box
        mask = (
            (self.locations[:, 0] >= min_x) &
            (self.locations[:, 0] <= max_x) &
            (self.locations[:, 1] >= min_y) &
            (self.locations[:, 1] <= max_y)
        )
        indices = np.where(mask)[0]
        return [self.node_ids[i] for i in indices]
    
    def get_location(self, node_id: int) -> Optional[Tuple[float, float]]:
        """
        Get location for a node.
        
        Args:
            node_id: Node ID
        
        Returns:
            (x, y) coordinates or None if not found
        """
        # Find node in index
        mask = self.node_ids == node_id
        if not np.any(mask):
            return None
        
        idx = np.where(mask)[0][0]
        return tuple(self.locations[idx])
    
    def has_spatial_data(self) -> bool:
        """Check if index has any spatial data."""
        return len(self.locations) > 0
    
    def get_metadata(self) -> SpatialMetadata:
        """Get spatial metadata."""
        return self.metadata


# Cache for spatial indices to avoid rebuilding
_spatial_index_cache: Dict[int, SpatialIndex] = {}


def get_spatial_index(ts: tskit.TreeSequence, use_cache: bool = True) -> SpatialIndex:
    """
    Get or build spatial index for tree sequence.
    
    Args:
        ts: Tree sequence
        use_cache: Whether to use cached index (default: True)
    
    Returns:
        SpatialIndex instance
    """
    ts_id = id(ts)
    
    if use_cache and ts_id in _spatial_index_cache:
        return _spatial_index_cache[ts_id]
    
    # Build new index
    index = SpatialIndex(ts)
    
    if use_cache:
        _spatial_index_cache[ts_id] = index
    
    return index


def clear_spatial_index_cache():
    """Clear the spatial index cache."""
    global _spatial_index_cache
    _spatial_index_cache.clear()
    logger.debug("Cleared spatial index cache")

