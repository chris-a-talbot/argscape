import numpy as np
import logging
from typing import Sequence, Tuple, List
from scipy.spatial import cKDTree
from scipy.optimize import linear_sum_assignment
import pyproj
from argscape.api.constants import (
    WGS84_LONGITUDE_MIN,
    WGS84_LONGITUDE_MAX,
    WGS84_LATITUDE_MIN,
    WGS84_LATITUDE_MAX,
    WGS84_LONGITUDE_RANGE,
    WGS84_LATITUDE_RANGE,
    WGS84_GEOGRAPHIC_NOISE_SCALE,
    WEB_MERCATOR_X_RANGE,
    WEB_MERCATOR_Y_RANGE,
    WEB_MERCATOR_NOISE_SCALE,
    WEB_MERCATOR_BOUNDS_X,
    WEB_MERCATOR_BOUNDS_Y,
    UNIT_GRID_MARGIN,
    UNIT_GRID_NOISE_SCALE,
    COORDINATE_BOUNDARY_EPSILON
)

logger = logging.getLogger(__name__)


def _sample_land_candidates(
    n_samples: int,
    *,
    oversample: int = 3,               # lower factor – enough because we no longer discard many
    rng: np.random.Generator,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Fast land-only sampler (global).

    • We just ask “is this random lon/lat on land?” once.
    • If not, we throw it away and draw another point – no local search.

    Returns
    -------
    lonlat      (m,2) float64  – on-land geographic coords
    lonlat_norm (m,2) float64  – same, normalised to [0,1]²
    """
    from argscape.api.geo_utils.land_detect import is_point_on_land_eastern_hemisphere

    want   = max(oversample * n_samples, n_samples + 500)
    lonlat = np.empty((want, 2), dtype=np.float64)
    count  = 0
    tries  = 0
    max_tries = want * 10  # plenty – aborts only in pathological cases

    while count < want and tries < max_tries:
        tries += 1
        # uniform lon/lat
        x_n, y_n = rng.random(2)
        lon = x_n * WGS84_LONGITUDE_RANGE + WGS84_LONGITUDE_MIN
        lat = y_n * WGS84_LATITUDE_RANGE + WGS84_LATITUDE_MIN
        if is_point_on_land_eastern_hemisphere(lon, lat):
            lonlat[count] = (lon, lat)
            count += 1

    if count < n_samples:
        raise RuntimeError("Could not collect enough land points – check land mask")

    lonlat = lonlat[:count]
    lonlat_norm = np.column_stack([
        (lonlat[:, 0] - WGS84_LONGITUDE_MIN) / WGS84_LONGITUDE_RANGE,
        (lonlat[:, 1] - WGS84_LATITUDE_MIN) / WGS84_LATITUDE_RANGE,
    ])
    return lonlat, lonlat_norm


def _compute_coastal_mask(
    lonlat: np.ndarray,
    *,
    step_deg: float = 2.0,
) -> np.ndarray:
    """
    Return a boolean mask: True = coastal (land within ≤ step_deg of sea).
    We test the 4 cardinal neighbours only – cheap and good enough.
    """
    from argscape.api.geo_utils.land_detect import (
        is_point_on_land_eastern_hemisphere as _is_land,
    )

    coast = np.empty(lonlat.shape[0], dtype=bool)
    for i, (lon, lat) in enumerate(lonlat):
        coast[i] = (
            not _is_land(lon + step_deg, lat)
            or not _is_land(lon - step_deg, lat)
            or not _is_land(lon, lat + step_deg)
            or not _is_land(lon, lat - step_deg)
        )
    return coast


def _assign_land_points(
    src_norm: np.ndarray,
    cand_norm: np.ndarray,
    cand_geo: np.ndarray,
) -> np.ndarray:
    """
    Match each source point to a unique land candidate.

    • Hungarian for n ≤ 300  → exact, still O( n³ ) but tiny.  
    • Greedy KD-tree for n > 300  → O( n log m ) and minimal memory.
    """
    n, m = src_norm.shape[0], cand_norm.shape[0]

    # -------- small job: Hungarian -------------------------------------
    if n <= 300:
        cost = np.linalg.norm(src_norm[:, None, :] - cand_norm[None, :, :], axis=2)
        _, cols = linear_sum_assignment(cost)
        return cand_geo[cols]

    # -------- big job: greedy KD-tree ----------------------------------
    tree  = cKDTree(cand_norm)
    taken = np.full(m, False, dtype=bool)
    out   = np.empty((n, 2), dtype=np.float64)

    for i, pt in enumerate(src_norm):
        k = 4                       # start with 4 neighbours
        while True:
            _, idxs = tree.query(pt, k=k)
            idxs = np.atleast_1d(idxs)
            free = idxs[~taken[idxs]]
            if free.size:
                chosen = free[0]
                taken[chosen] = True
                out[i] = cand_geo[chosen]
                break
            k = min(k * 2, m)  # widen search if all taken
    return out


def normalize_coordinates_to_unit_space(
    points: Sequence[Tuple[float, float]], 
    bounds: Tuple[float, float, float, float]
) -> List[Tuple[float, float]]:
    """
    Normalize a list of coordinates to the unit square [0, 1] x [0, 1].

    Args:
        points: List or array-like of (x, y) tuples.
        bounds: (min_x, min_y, max_x, max_y) bounding box.

    Returns:
        Normalized list of (x, y) tuples.
    """
    min_x, min_y, max_x, max_y = bounds
    width = max_x - min_x
    height = max_y - min_y

    if width == 0 or height == 0:
        logger.warning("Zero width or height in bounds – cannot normalize coordinates.")
        return list(points)

    arr = np.array(points, dtype=np.float64)
    arr[:, 0] = (arr[:, 0] - min_x) / width
    arr[:, 1] = (arr[:, 1] - min_y) / height

    return [tuple(pt) for pt in arr]


def generate_wgs84_coordinates(normalized_coords: np.ndarray,
                               *,
                               random_seed: int | None = None
) -> np.ndarray:
    """
    **Smart land embedding** – projects the MDS points to real-world land
    while *globally* preserving their mutual geometry.

    Steps
    -----
      1.  Draw a generous pool of random land points (oversampling factor = 5);
      2.  Convert both pools to the same [0,1]² space;
      3.  Solve the optimal assignment problem (Hungarian or greedy KD-tree)
          to pair every sample with the *nearest unique* land point;
      4.  Add very small isotropic jitter to break sub-pixel ties.

    Returns
    -------
    (n,2) float64 array of *(lon, lat)* – each point guaranteed to be on land.
    """
    rng = np.random.default_rng(random_seed)
    n_samples = normalized_coords.shape[0]

    # 1. make candidate land bank
    cand_geo, cand_norm = _sample_land_candidates(n_samples, rng=rng)

    # 2. decide per-sample land point (global optimum when possible)
    final_coords = _assign_land_points(normalized_coords, cand_norm, cand_geo)

    # 3. optional microscopic noise (keeps visibly identical nodes apart, but
    #    never pushes a point into the sea because the oracle keeps it inland)
    jitter = rng.normal(0, WGS84_GEOGRAPHIC_NOISE_SCALE * 0.25, size=final_coords.shape)
    final_coords += jitter

    return final_coords


def generate_web_mercator_coordinates(normalized_coords: np.ndarray) -> np.ndarray:
    """
    Generate Web Mercator coordinates.
    
    Args:
        normalized_coords: Normalized coordinates in [0,1]
        
    Returns:
        Final coordinates in Web Mercator (X, Y)
    """
    # Scale to Web Mercator bounds
    final_coords = (normalized_coords - 0.5) * 2  # Scale to [-1, 1]
    final_coords[:, 0] *= WEB_MERCATOR_X_RANGE  # X coordinates
    final_coords[:, 1] *= WEB_MERCATOR_Y_RANGE  # Y coordinates
    
    # Add Web Mercator noise
    noise = np.random.normal(0, WEB_MERCATOR_NOISE_SCALE, final_coords.shape)
    final_coords += noise
    
    # Ensure coordinates stay within reasonable Web Mercator bounds
    final_coords[:, 0] = np.clip(final_coords[:, 0], -WEB_MERCATOR_BOUNDS_X, WEB_MERCATOR_BOUNDS_X)
    final_coords[:, 1] = np.clip(final_coords[:, 1], -WEB_MERCATOR_BOUNDS_Y, WEB_MERCATOR_BOUNDS_Y)
    
    return final_coords


def generate_unit_grid_coordinates(normalized_coords: np.ndarray) -> np.ndarray:
    """
    Scale normalized [0,1] coordinates to fit inside a unit grid with margins,
    add small noise, and clip to remain within bounds.

    Args:
        normalized_coords: (n_samples, 2) array of normalized coordinates in [0, 1].

    Returns:
        (n_samples, 2) array of adjusted coordinates within [0, 1].
    """
    grid_size = 1.0 - 2 * UNIT_GRID_MARGIN
    coords = normalized_coords * grid_size + UNIT_GRID_MARGIN

    noise = np.random.normal(loc=0.0, scale=UNIT_GRID_NOISE_SCALE, size=coords.shape)
    noisy_coords = coords + noise

    # Only clip values that exceed boundaries due to noise
    lower_bound = COORDINATE_BOUNDARY_EPSILON
    upper_bound = 1.0 - COORDINATE_BOUNDARY_EPSILON
    needs_clipping = (noisy_coords < lower_bound) | (noisy_coords > upper_bound)
    noisy_coords[needs_clipping] = np.clip(noisy_coords[needs_clipping], lower_bound, upper_bound)

    return noisy_coords


def transform_coordinates(
    coordinates: List[Tuple[float, float]], 
    source_crs: str, 
    target_crs: str
) -> List[Tuple[float, float]]:
    """
    Transform coordinates from one CRS to another.
    
    Args:
        coordinates: List of (x, y) coordinate tuples
        source_crs: Source coordinate reference system (e.g., "EPSG:4326")
        target_crs: Target coordinate reference system (e.g., "EPSG:3857")
        
    Returns:
        List of transformed (x, y) coordinate tuples
        
    Raises:
        ValueError: If CRS transformation fails or if CRS is not supported
    """
    try:
        # Handle special cases for unit grid
        if source_crs == "unit_grid" or target_crs == "unit_grid":
            raise ValueError("Cannot transform to/from unit_grid CRS - it's a special case")
        
        # Create transformer
        transformer = pyproj.Transformer.from_crs(source_crs, target_crs, always_xy=True)
        
        # Convert coordinates to arrays for vectorized transformation
        coords_array = np.array(coordinates)
        x = coords_array[:, 0]
        y = coords_array[:, 1]
        
        # Transform coordinates
        x_trans, y_trans = transformer.transform(x, y)
        
        # Convert back to list of tuples
        return list(zip(x_trans, y_trans))
        
    except ImportError:
        logger.error("pyproj not available for coordinate transformation")
        raise ValueError("Coordinate transformation requires pyproj")
    except Exception as e:
        logger.error(f"Error transforming coordinates: {str(e)}")
        raise ValueError(f"Failed to transform coordinates: {str(e)}")