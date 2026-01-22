# argscape/benchmark/accuracy.py
"""Compute accuracy metrics by comparing inferred values to ground truth."""

from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import numpy as np

try:
    import tskit
    TSKIT_AVAILABLE = True
except ImportError:
    TSKIT_AVAILABLE = False


@dataclass
class SpatialAccuracyMetrics:
    """Spatial inference accuracy metrics."""
    mean_error_km: float
    median_error_km: float
    rmse_km: float
    std_error_km: float
    num_compared: int


@dataclass
class TemporalAccuracyMetrics:
    """Temporal inference accuracy metrics."""
    mean_error: float
    median_error: float
    rmse: float
    correlation: float
    num_compared: int


def haversine_distance(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Calculate great-circle distance between two points in km.

    Args:
        lon1, lat1: First point coordinates (degrees)
        lon2, lat2: Second point coordinates (degrees)

    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth radius in km

    lat1, lat2, lon1, lon2 = map(np.radians, [lat1, lat2, lon1, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))

    return R * c


def euclidean_distance(x1: float, y1: float, x2: float, y2: float) -> float:
    """Calculate Euclidean distance between two points.

    Args:
        x1, y1: First point coordinates
        x2, y2: Second point coordinates

    Returns:
        Distance in coordinate units
    """
    return np.sqrt((x2 - x1)**2 + (y2 - y1)**2)


def compute_spatial_accuracy(
    inferred_ts_path: Path,
    ground_truth_ts_path: Path,
    use_haversine: bool = False,
) -> SpatialAccuracyMetrics:
    """Compute spatial accuracy metrics between inferred and ground truth locations.

    Args:
        inferred_ts_path: Path to tree sequence with inferred locations
        ground_truth_ts_path: Path to tree sequence with ground truth locations
        use_haversine: Use great-circle distance (for lat/lon coordinates)

    Returns:
        SpatialAccuracyMetrics with error statistics
    """
    if not TSKIT_AVAILABLE:
        raise RuntimeError("tskit is required for accuracy computation")

    inferred_ts = tskit.load(str(inferred_ts_path))
    truth_ts = tskit.load(str(ground_truth_ts_path))

    distance_fn = haversine_distance if use_haversine else euclidean_distance

    errors = []

    # Compare non-sample nodes (samples have known locations)
    for node in inferred_ts.nodes():
        if node.flags & tskit.NODE_IS_SAMPLE:
            continue  # Skip samples

        # Get inferred location
        if node.individual == -1:
            continue
        inferred_ind = inferred_ts.individual(node.individual)
        if len(inferred_ind.location) < 2:
            continue
        inferred_loc = inferred_ind.location[:2]

        # Get ground truth location (if available)
        truth_node = truth_ts.node(node.id)
        if truth_node.individual == -1:
            continue
        truth_ind = truth_ts.individual(truth_node.individual)
        if len(truth_ind.location) < 2:
            continue
        truth_loc = truth_ind.location[:2]

        # Compute distance
        dist = distance_fn(inferred_loc[0], inferred_loc[1],
                          truth_loc[0], truth_loc[1])
        errors.append(dist)

    if not errors:
        return SpatialAccuracyMetrics(
            mean_error_km=float('nan'),
            median_error_km=float('nan'),
            rmse_km=float('nan'),
            std_error_km=float('nan'),
            num_compared=0,
        )

    errors = np.array(errors)
    return SpatialAccuracyMetrics(
        mean_error_km=float(np.mean(errors)),
        median_error_km=float(np.median(errors)),
        rmse_km=float(np.sqrt(np.mean(errors**2))),
        std_error_km=float(np.std(errors)),
        num_compared=len(errors),
    )


def compute_temporal_accuracy(
    inferred_ts_path: Path,
    ground_truth_ts_path: Path,
) -> TemporalAccuracyMetrics:
    """Compute temporal accuracy metrics between inferred and ground truth times.

    Args:
        inferred_ts_path: Path to tree sequence with inferred times
        ground_truth_ts_path: Path to tree sequence with ground truth times

    Returns:
        TemporalAccuracyMetrics with error statistics
    """
    if not TSKIT_AVAILABLE:
        raise RuntimeError("tskit is required for accuracy computation")

    inferred_ts = tskit.load(str(inferred_ts_path))
    truth_ts = tskit.load(str(ground_truth_ts_path))

    inferred_times = []
    truth_times = []

    # Compare non-sample nodes
    for node in inferred_ts.nodes():
        if node.flags & tskit.NODE_IS_SAMPLE:
            continue

        truth_node = truth_ts.node(node.id)

        inferred_times.append(node.time)
        truth_times.append(truth_node.time)

    if not inferred_times:
        return TemporalAccuracyMetrics(
            mean_error=float('nan'),
            median_error=float('nan'),
            rmse=float('nan'),
            correlation=float('nan'),
            num_compared=0,
        )

    inferred_times = np.array(inferred_times)
    truth_times = np.array(truth_times)
    errors = np.abs(inferred_times - truth_times)

    # Compute correlation
    if np.std(inferred_times) > 0 and np.std(truth_times) > 0:
        correlation = float(np.corrcoef(inferred_times, truth_times)[0, 1])
    else:
        correlation = float('nan')

    return TemporalAccuracyMetrics(
        mean_error=float(np.mean(errors)),
        median_error=float(np.median(errors)),
        rmse=float(np.sqrt(np.mean(errors**2))),
        correlation=correlation,
        num_compared=len(errors),
    )
