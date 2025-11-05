from typing import List, Tuple, Dict, Any
from .land_detect import is_point_on_land_eastern_hemisphere
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Try to import scipy for statistical tests, fall back gracefully if not available
try:
    from scipy import stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    logger.debug("scipy not available, some statistical tests will be disabled")


def detect_grid_pattern(coordinates: List[Tuple[float, float]], 
                       tolerance: float = 0.01) -> Dict[str, Any]:
    """
    Detect if coordinates form a regular grid pattern (common in SLiM simulations).
    
    Args:
        coordinates: List of (x, y) coordinate tuples
        tolerance: Tolerance for grid alignment (as fraction of range)
        
    Returns:
        Dictionary with:
        - is_grid: bool indicating if pattern is grid-like
        - grid_score: float (0-1) indicating grid regularity
        - reasoning: List of explanation strings
    """
    if len(coordinates) < 4:
        return {
            "is_grid": False,
            "grid_score": 0.0,
            "reasoning": ["Too few points to detect grid pattern"]
        }
    
    x_vals, y_vals = zip(*coordinates)
    x_vals = np.array(x_vals)
    y_vals = np.array(y_vals)
    
    min_x, max_x = np.min(x_vals), np.max(x_vals)
    min_y, max_y = np.min(y_vals), np.max(y_vals)
    x_range = max_x - min_x if max_x > min_x else 1.0
    y_range = max_y - min_y if max_y > min_y else 1.0
    
    reasoning = []
    grid_score = 0.0
    
    # Test 1: Check for uniform distribution (grids should be uniform)
    # Use Kolmogorov-Smirnov test against uniform distribution
    if SCIPY_AVAILABLE:
        try:
            # Normalize coordinates to [0, 1] for testing
            x_norm = (x_vals - min_x) / x_range if x_range > 0 else x_vals
            y_norm = (y_vals - min_y) / y_range if y_range > 0 else y_vals
            
            # KS test for uniformity
            ks_x_stat, ks_x_p = stats.kstest(x_norm, 'uniform')
            ks_y_stat, ks_y_p = stats.kstest(y_norm, 'uniform')
            
            # High p-value suggests uniform distribution (grid-like)
            uniform_score = (ks_x_p + ks_y_p) / 2.0
            if uniform_score > 0.05:
                reasoning.append(f"Uniform distribution detected (p={uniform_score:.3f})")
                grid_score += 0.3
        except Exception as e:
            logger.debug(f"KS test failed: {e}")
    
    # Test 2: Check for regular spacing (grid cells)
    # Look for common spacing intervals - this is key for detecting grids
    try:
        # Sort and compute differences
        x_sorted = np.sort(np.unique(x_vals))
        y_sorted = np.sort(np.unique(y_vals))
        
        if len(x_sorted) > 1 and len(y_sorted) > 1:
            x_diffs = np.diff(x_sorted)
            y_diffs = np.diff(y_sorted)
            
            # Find most common spacing
            x_tolerance = tolerance * x_range
            y_tolerance = tolerance * y_range
            
            # Check if most differences are similar (grid-like)
            # Use coefficient of variation - lower CV means more regular spacing
            if len(x_diffs) > 0:
                x_std = np.std(x_diffs)
                x_mean = np.mean(x_diffs)
                x_cv = x_std / x_mean if x_mean > 0 else float('inf')
                
                # Lower threshold for large grids (100x100 should have very low CV)
                cv_threshold = 0.2 if len(x_sorted) > 50 else 0.3
                if x_cv < cv_threshold:
                    reasoning.append(f"Regular X spacing detected (CV={x_cv:.3f}, {len(x_sorted)} unique X values)")
                    grid_score += 0.3  # Increased weight for spacing detection
                elif x_cv < 0.5:
                    reasoning.append(f"Moderately regular X spacing (CV={x_cv:.3f})")
                    grid_score += 0.15
            
            if len(y_diffs) > 0:
                y_std = np.std(y_diffs)
                y_mean = np.mean(y_diffs)
                y_cv = y_std / y_mean if y_mean > 0 else float('inf')
                
                cv_threshold = 0.2 if len(y_sorted) > 50 else 0.3
                if y_cv < cv_threshold:
                    reasoning.append(f"Regular Y spacing detected (CV={y_cv:.3f}, {len(y_sorted)} unique Y values)")
                    grid_score += 0.3  # Increased weight for spacing detection
                elif y_cv < 0.5:
                    reasoning.append(f"Moderately regular Y spacing (CV={y_cv:.3f})")
                    grid_score += 0.15
                    
            # Additional check: if we have many unique values in a grid-like pattern
            # For a 100x100 grid, we'd expect ~100 unique x and ~100 unique y values
            total_points = len(coordinates)
            unique_x_count = len(x_sorted)
            unique_y_count = len(y_sorted)
            
            # Check if unique counts match expected grid dimensions
            # For a perfect grid, sqrt(total_points) ≈ unique_x_count ≈ unique_y_count
            if total_points > 100:  # Only check for larger grids
                expected_grid_dim = np.sqrt(total_points)
                # Allow some flexibility (±50% deviation)
                x_ratio = unique_x_count / expected_grid_dim if expected_grid_dim > 0 else 0
                y_ratio = unique_y_count / expected_grid_dim if expected_grid_dim > 0 else 0
                
                # If both ratios are close to 1.0, it's likely a grid
                if 0.7 <= x_ratio <= 1.5 and 0.7 <= y_ratio <= 1.5:
                    reasoning.append(f"Grid-like structure: {unique_x_count}x{unique_y_count} from {total_points} points")
                    grid_score += 0.2
                    
    except Exception as e:
        logger.debug(f"Spacing analysis failed: {e}")
    
    # Test 3: Check for square/rectangular aspect ratio
    aspect_ratio = x_range / y_range if y_range > 0 else 1.0
    if 0.5 <= aspect_ratio <= 2.0:
        reasoning.append(f"Square-like aspect ratio ({aspect_ratio:.2f})")
        grid_score += 0.1
    
    # Test 4: Check point distribution uniformity using histogram
    # Grids should have roughly equal points per grid cell
    try:
        # Normalize coordinates
        x_norm = (x_vals - min_x) / x_range if x_range > 0 else x_vals
        y_norm = (y_vals - min_y) / y_range if y_range > 0 else y_vals
        
        # Use a reasonable number of bins based on data size
        # For a 100x100 grid, we'd want ~10-20 bins
        num_bins = max(5, min(20, int(np.sqrt(len(coordinates)) / 5)))
        x_bins = np.linspace(0, 1, num_bins + 1)
        y_bins = np.linspace(0, 1, num_bins + 1)
        
        H, _, _ = np.histogram2d(x_norm, y_norm, bins=[x_bins, y_bins])
        
        # For a uniform grid, histogram should be relatively flat
        # Check coefficient of variation of cell counts
        cell_counts = H.flatten()
        cell_counts_nonzero = cell_counts[cell_counts > 0]
        
        if len(cell_counts_nonzero) > 0:
            cell_cv = np.std(cell_counts_nonzero) / np.mean(cell_counts_nonzero) if np.mean(cell_counts_nonzero) > 0 else 0.0
            # Low CV indicates uniform distribution across cells (grid-like)
            if cell_cv < 0.8:  # More lenient threshold
                reasoning.append(f"Uniform cell distribution (CV={cell_cv:.3f})")
                grid_score += 0.15
    except Exception as e:
        logger.debug(f"Histogram uniformity check failed: {e}")
    
    # Lower threshold for grid detection - be more aggressive
    # A score of 0.4-0.5 should be enough to indicate a grid pattern
    is_grid = grid_score > 0.4
    
    return {
        "is_grid": is_grid,
        "grid_score": min(grid_score, 1.0),
        "reasoning": reasoning if reasoning else ["No grid pattern detected"]
    }


def check_uniformity_vs_clustering(coordinates: List[Tuple[float, float]]) -> Dict[str, Any]:
    """
    Test whether coordinates are uniformly distributed (simulation-like) 
    or clustered (geographic-like).
    
    Returns:
        Dictionary with:
        - is_uniform: bool
        - uniformity_score: float (0-1)
        - reasoning: List of strings
    """
    if len(coordinates) < 10:
        return {
            "is_uniform": False,
            "uniformity_score": 0.5,
            "reasoning": ["Too few points for clustering analysis"]
        }
    
    x_vals, y_vals = zip(*coordinates)
    x_vals = np.array(x_vals)
    y_vals = np.array(y_vals)
    
    reasoning = []
    uniformity_score = 0.5  # Start neutral
    
    # Test 1: Nearest neighbor distances
    # Uniform distributions have consistent nearest neighbor distances
    # Clustered distributions have varying distances (small in clusters, large between)
    if SCIPY_AVAILABLE:
        try:
            from scipy.spatial.distance import cdist
            
            coords_array = np.array(coordinates)
            # Compute pairwise distances
            distances = cdist(coords_array, coords_array)
            # Set diagonal to inf (self-distances)
            np.fill_diagonal(distances, np.inf)
            
            # Get nearest neighbor distances
            nn_distances = np.min(distances, axis=1)
            
            # Coefficient of variation of NN distances
            nn_cv = np.std(nn_distances) / np.mean(nn_distances) if np.mean(nn_distances) > 0 else 0.0
            
            # Low CV indicates uniform distribution
            if nn_cv < 0.5:
                reasoning.append(f"Uniform nearest-neighbor distances (CV={nn_cv:.3f})")
                uniformity_score += 0.3
            elif nn_cv > 1.0:
                reasoning.append(f"Clustered distribution detected (CV={nn_cv:.3f})")
                uniformity_score -= 0.3
        except Exception as e:
            logger.debug(f"NN distance analysis failed: {e}")
    else:
        # Fallback: use simple distance-based heuristic without scipy
        try:
            coords_array = np.array(coordinates)
            # Compute a sample of pairwise distances manually
            # Use deterministic sampling (every nth point) for reproducibility
            sample_size = min(100, len(coordinates))
            step = max(1, len(coordinates) // sample_size)
            indices = np.arange(0, len(coordinates), step)[:sample_size]
            sample_coords = coords_array[indices]
            
            # Manual pairwise distance computation for sample
            distances_sample = []
            for i in range(len(sample_coords)):
                for j in range(i+1, len(sample_coords)):
                    dist = np.linalg.norm(sample_coords[i] - sample_coords[j])
                    distances_sample.append(dist)
            
            if distances_sample:
                nn_distances = np.array(distances_sample)
                nn_cv = np.std(nn_distances) / np.mean(nn_distances) if np.mean(nn_distances) > 0 else 0.0
                if nn_cv < 0.5:
                    reasoning.append(f"Uniform distances (CV={nn_cv:.3f}, approximate)")
                    uniformity_score += 0.2
                elif nn_cv > 1.0:
                    reasoning.append(f"Clustered distribution (CV={nn_cv:.3f}, approximate)")
                    uniformity_score -= 0.2
        except Exception as e:
            logger.debug(f"Fallback distance analysis failed: {e}")
    
    # Test 2: Spatial autocorrelation
    # Uniform distributions have low autocorrelation
    # Geographic data often has high autocorrelation (nearby points are similar)
    try:
        # Normalize coordinates
        min_x, max_x = np.min(x_vals), np.max(x_vals)
        min_y, max_y = np.min(y_vals), np.max(y_vals)
        x_range = max_x - min_x if max_x > min_x else 1.0
        y_range = max_y - min_y if max_y > min_y else 1.0
        
        x_norm = (x_vals - min_x) / x_range
        y_norm = (y_vals - min_y) / y_range
        
        # Divide space into grid cells and count points per cell
        grid_size = max(5, int(np.sqrt(len(coordinates)) / 2))
        x_bins = np.linspace(0, 1, grid_size + 1)
        y_bins = np.linspace(0, 1, grid_size + 1)
        
        H, _, _ = np.histogram2d(x_norm, y_norm, bins=[x_bins, y_bins])
        
        # Count non-empty cells
        non_empty_cells = np.sum(H > 0)
        total_cells = grid_size * grid_size
        
        # Uniform distribution should fill more cells
        fill_ratio = non_empty_cells / total_cells
        if fill_ratio > 0.6:
            reasoning.append(f"High spatial coverage ({fill_ratio:.1%} of cells)")
            uniformity_score += 0.2
        elif fill_ratio < 0.3:
            reasoning.append(f"Low spatial coverage ({fill_ratio:.1%} of cells, suggests clustering)")
            uniformity_score -= 0.2
    except Exception as e:
        logger.debug(f"Spatial autocorrelation analysis failed: {e}")
    
    is_uniform = uniformity_score > 0.6
    
    return {
        "is_uniform": is_uniform,
        "uniformity_score": max(0.0, min(1.0, uniformity_score)),
        "reasoning": reasoning if reasoning else ["Uniformity test inconclusive"]
    }


def detect_coordinate_system(coordinates: List[Tuple[float, float]]) -> Dict[str, Any]:
    """
    Analyze a list of coordinates to infer the most likely coordinate system.

    Args:
        coordinates: List of (x, y) or (lon, lat) tuples.

    Returns:
        A dictionary including:
        - likely_crs: best-guess CRS label
        - confidence: score between 0 and 1
        - reasoning: summary explanation
        - bounds: [min_x, min_y, max_x, max_y]
        - coordinate_count: number of points
        - land_points: number on land (if checked)
        - land_percentage: percent of points on land
        - suggested_geographic_mode: map display strategy
    """
    if not coordinates:
        return {
            "likely_crs": "unknown",
            "confidence": 0.0,
            "reasoning": "No coordinates provided",
            "bounds": None,
            "coordinate_count": 0,
            "land_points": 0,
            "land_percentage": 0.0,
            "suggested_geographic_mode": "unit_grid"
        }

    x_vals, y_vals = zip(*coordinates)
    min_x, max_x = min(x_vals), max(x_vals)
    min_y, max_y = min(y_vals), max(y_vals)
    bounds = [min_x, min_y, max_x, max_y]
    x_range, y_range = max_x - min_x, max_y - min_y
    count = len(coordinates)
    reasoning = []
    land_points = 0

    # Early detection: Check for grid patterns (SLiM simulations)
    grid_result = detect_grid_pattern(coordinates)
    if grid_result["is_grid"] and grid_result["grid_score"] > 0.6:
        reasoning.extend(grid_result["reasoning"])
        reasoning.append("Regular grid pattern suggests simulated/planar coordinates")
        # If it's in [0,1] range, it's definitely unit_grid
        if all(0 <= v <= 1 for v in x_vals + y_vals):
            reasoning.append("Coordinates in [0, 1] range")
            return _build_detection_result("unit_grid", 0.98, reasoning, bounds, count, 0)
        else:
            # Grid pattern but outside [0,1] - likely planar simulation
            return _build_detection_result("planar", 0.85, reasoning, bounds, count, 0)

    # Case 1: Normalized unit grid
    if all(0 <= v <= 1 for v in x_vals + y_vals):
        reasoning.append("Coordinates fall within [0, 1] range")
        uniformity_result = check_uniformity_vs_clustering(coordinates)
        if uniformity_result["is_uniform"]:
            reasoning.extend(uniformity_result["reasoning"])
            reasoning.append("Uniform distribution suggests simulated data")
        return _build_detection_result("unit_grid", 0.95, reasoning, bounds, count, 0)

    # Case 2: Likely geographic (WGS84-like)
    if -180 <= min_x <= 180 and -90 <= min_y <= 90:
        # ALWAYS check for grid patterns FIRST, even in geographic bounds
        # SLiM simulations can produce grids in geographic coordinate ranges
        if grid_result["is_grid"] or grid_result["grid_score"] > 0.4:
            reasoning.extend(grid_result["reasoning"])
            reasoning.append("Grid pattern detected in geographic bounds - likely simulated planar coordinates")
            # Grid pattern trumps geographic bounds
            if all(0 <= v <= 1 for v in x_vals + y_vals):
                return _build_detection_result("unit_grid", 0.95, reasoning, bounds, count, 0)
            else:
                return _build_detection_result("planar", 0.9, reasoning, bounds, count, 0)
        
        # Check for uniform distribution first - if uniform, likely NOT geographic
        uniformity_result = check_uniformity_vs_clustering(coordinates)
        if uniformity_result["is_uniform"] and uniformity_result["uniformity_score"] > 0.7:
            reasoning.extend(uniformity_result["reasoning"])
            reasoning.append("Uniform distribution in geographic bounds suggests simulated planar coordinates")
            return _build_detection_result("planar", 0.85, reasoning, bounds, count, 0)
        
        if -15 <= min_x <= 180 and -60 <= min_y <= 75:
            # Try land detection with better error handling
            land_points = 0
            land_check_errors = 0
            try:
                for x, y in coordinates:
                    try:
                        if is_point_on_land_eastern_hemisphere(x, y):
                            land_points += 1
                    except Exception as e:
                        land_check_errors += 1
                        logger.debug(f"Land check failed for ({x}, {y}): {e}")
                
                if land_check_errors > count * 0.5:
                    reasoning.append(f"Land detection failed for {land_check_errors}/{count} points")
                    reasoning.append("Falling back to distribution-based detection")
                    # Use uniformity/clustering as fallback
                    if uniformity_result["is_uniform"]:
                        reasoning.extend(uniformity_result["reasoning"])
                        return _build_detection_result("planar", 0.7, reasoning, bounds, count, 0)
                    else:
                        # Clustered distribution suggests geographic
                        reasoning.extend(uniformity_result["reasoning"])
                        return _build_detection_result("EPSG:4326", 0.75, reasoning, bounds, count, land_points)
                
                land_pct = land_points / count * 100
                reasoning.append(f"{land_pct:.0f}% of points are on land in the Eastern Hemisphere")
                
                if land_pct > 50:
                    reasoning.append("Coordinates likely represent WGS84 (EPSG:4326)")
                    # Check for clustering (geographic data should be clustered)
                    if not uniformity_result["is_uniform"]:
                        reasoning.extend(uniformity_result["reasoning"])
                    return _build_detection_result("EPSG:4326", 0.95, reasoning, bounds, count, land_points)
                elif land_pct > 20:
                    return _build_detection_result("EPSG:4326", 0.8, reasoning, bounds, count, land_points)
                else:
                    reasoning.append("Few land points suggest this is not geographic data")
                    # If uniform, likely planar simulation
                    if uniformity_result["is_uniform"]:
                        reasoning.extend(uniformity_result["reasoning"])
                        return _build_detection_result("planar", 0.75, reasoning, bounds, count, land_points)
                    return _build_detection_result("planar", 0.6, reasoning, bounds, count, land_points)
            
            except Exception as e:
                logger.warning(f"Land detection failed entirely: {e}")
                reasoning.append(f"Land detection failed: {str(e)}")
                # Fall back to distribution analysis
                if uniformity_result["is_uniform"]:
                    reasoning.extend(uniformity_result["reasoning"])
                    return _build_detection_result("planar", 0.7, reasoning, bounds, count, 0)
                else:
                    reasoning.extend(uniformity_result["reasoning"])
                    return _build_detection_result("EPSG:4326", 0.7, reasoning, bounds, count, 0)

        else:
            reasoning.append("Coordinates within global geographic bounds")
            if x_range > 10 or y_range > 10:
                reasoning.append("Spread suggests geographic/continental scale")
            # Check uniformity
            if uniformity_result["is_uniform"]:
                reasoning.extend(uniformity_result["reasoning"])
                reasoning.append("But uniform distribution suggests simulated coordinates")
                return _build_detection_result("planar", 0.65, reasoning, bounds, count, 0)
            return _build_detection_result("EPSG:4326", 0.7, reasoning, bounds, count, 0)

    # Case 3: Web Mercator or large projection
    if any(abs(v) > 1_000_000 for v in x_vals + y_vals):
        reasoning.append("Large values consistent with projected coordinate system")
        if abs(max_x) < 20037508 and abs(max_y) < 20037508:
            reasoning.append("Values within Web Mercator bounds")
            return _build_detection_result("EPSG:3857", 0.8, reasoning, bounds, count, 0)
        return _build_detection_result("projected", 0.6, reasoning, bounds, count, 0)

    # Case 4: Small planar coordinates
    if all(abs(v) < 50 for v in x_vals + y_vals):
        reasoning.append("Coordinates are small, likely arbitrary planar space")
        if x_range / y_range > 2 or y_range / x_range > 2:
            reasoning.append("Non-square aspect ratio suggests rectangular space")
        return _build_detection_result("planar", 0.8, reasoning, bounds, count, 0)

    # Case 5: General planar spread
    if x_range > 1 and y_range > 1:
        reasoning.append("Medium-range coordinates suggest general planar CRS")
        return _build_detection_result("planar", 0.7, reasoning, bounds, count, 0)

    # Default fallback
    reasoning.append("Pattern does not match any common CRS profiles")
    return _build_detection_result("unknown", 0.3, reasoning, bounds, count, 0)


def _build_detection_result(
    crs: str,
    confidence: float,
    reasoning: List[str],
    bounds: List[float],
    count: int,
    land_points: int
) -> Dict[str, Any]:
    return {
        "likely_crs": crs,
        "confidence": round(confidence, 2),
        "reasoning": "; ".join(reasoning),
        "bounds": bounds,
        "coordinate_count": count,
        "land_points": land_points,
        "land_percentage": round((land_points / count) * 100, 1) if count > 0 else 0.0,
        "suggested_geographic_mode": get_suggested_geographic_mode(crs, bounds)
    }


def get_suggested_geographic_mode(crs: str, bounds: List[float]) -> str:
    """
    Suggest display mode (e.g., 'unit_grid', 'eastern_hemisphere') for given CRS + bounds.
    
    We default to 'unit_grid' to be safe - users can manually select geographic modes
    if they know their data is geographic. This avoids misclassifying SLiM simulations.
    """
    # Always default to unit_grid - let users explicitly choose geographic modes
    # This is safer than trying to detect everything perfectly
    return "unit_grid"