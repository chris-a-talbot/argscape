from typing import Dict, Optional, List, Tuple
from pathlib import Path
from shapely.geometry import Polygon, box, LineString, mapping
from shapely.geometry.base import BaseGeometry
import geopandas as gpd
import logging
import json
import tempfile
import zipfile
from pyproj import CRS
from shapely.geometry import Point
from shapely.geometry import shape as shapely_shape
from functools import lru_cache
import random
import importlib.resources
import io
from .io import load_geojson_file
from .fallbacks import get_eastern_hemisphere_outline_fallback
import fiona

logger = logging.getLogger(__name__)


def get_eastern_hemisphere_outline_fallback() -> Dict:
    """
    Returns a simplified fallback polygon of the Eastern Hemisphere (excluding Antarctica).
    """
    coords = [
        (-15, -60), (-10, -60), (0, -60), (30, -60), (45, -35), (60, -25), (80, -10),
        (100, 10), (120, 25), (140, 35), (160, 50), (180, 60), (180, 75), (150, 75),
        (120, 70), (90, 65), (60, 55), (30, 60), (0, 70), (-10, 65), (-15, 60), (-15, -60)
    ]
    polygon = Polygon(coords)

    return {
        "type": polygon.geom_type,
        "coordinates": polygon.__geo_interface__["coordinates"],
        "crs": "EPSG:4326",
        "name": "Eastern Hemisphere (Simplified, No Antarctica)",
        "bounds": list(polygon.bounds)
    }


def load_natural_earth_land(filter_eastern_hemisphere: bool = True) -> Dict:
    """Load Natural Earth land shapefile with improved resource handling."""
    try:
        # Try multiple approaches for package resource access
        shapefile_path = None
        
        # Method 1: Try files() API (Python 3.9+)
        try:
            from importlib import resources
            if hasattr(resources, 'files'):
                files = resources.files('argscape.backend.geo_utils.data.ne_110m_land')
                shapefile_path = files / 'ne_110m_land.shp'
                if not shapefile_path.is_file():
                    raise FileNotFoundError("Shapefile not found with files() API")
        except Exception as e:
            logger.debug(f"files() API failed: {e}")
        
        # Method 2: Try traditional path API
        if not shapefile_path:
            try:
                with importlib.resources.path('argscape.backend.geo_utils.data.ne_110m_land', 'ne_110m_land.shp') as path:
                    if path.exists():
                        shapefile_path = path
                    else:
                        raise FileNotFoundError("Shapefile not found with path API")
            except Exception as e:
                logger.debug(f"path() API failed: {e}")
        
        # Method 3: Direct file access fallback
        if not shapefile_path:
            base_dir = Path(__file__).resolve().parent
            search_paths = [
                base_dir / "data" / "ne_110m_land" / "ne_110m_land.shp",
                base_dir / "data" / "ne_50m_land" / "ne_50m_land.shp",
            ]
            shapefile_path = next((p for p in search_paths if p.exists()), None)
            if not shapefile_path:
                logger.warning("Natural Earth shapefile not found in any location.")
                return get_eastern_hemisphere_outline_fallback()

        # Read the shapefile
        gdf = gpd.read_file(str(shapefile_path))
        logger.info(f"Loaded Natural Earth data from {shapefile_path}")
        
        # Rest of your processing code...
        if filter_eastern_hemisphere:
            bbox = box(-15, -60, 180, 90)
            gdf = gdf.clip(bbox)

        geometry = gdf.unary_union
        
        if hasattr(geometry, '__geo_interface__'):
            return {
                "type": geometry.geom_type,
                "coordinates": geometry.__geo_interface__["coordinates"],
                "crs": "EPSG:4326",
                "name": "Eastern Hemisphere (Natural Earth)",
                "bounds": list(geometry.bounds)
            }
        else:
            logger.warning("Geometry does not support GeoJSON interface.")
            return get_eastern_hemisphere_outline_fallback()

    except Exception as e:
        logger.error(f"Failed to load Natural Earth data: {e}")
        return get_eastern_hemisphere_outline_fallback()


def get_eastern_hemisphere_outline() -> Dict:
    """
    Returns a detailed outline of the Eastern Hemisphere in WGS84.
    Priority order:
        1. Natural Earth shapefile
        2. Custom GeoJSON file
        3. Hardcoded fallback
    """
    try:
        result = load_natural_earth_land(filter_eastern_hemisphere=True)
        if result and result.get("name") != "Eastern Hemisphere (Simplified, No Antarctica)":
            logger.info("Using Natural Earth Eastern Hemisphere outline.")
            return result
    except Exception as e:
        logger.debug(f"Natural Earth loading failed: {e}")

    # Fallback: try loading from a GeoJSON file
    try:
        with importlib.resources.path('argscape.backend.geo_utils.data', 'eastern_hemisphere.geojson') as geojson_path:
            if geojson_path.exists():
                logger.info("Using custom GeoJSON Eastern Hemisphere outline.")
                return load_geojson_file(str(geojson_path))
    except (ImportError, FileNotFoundError) as e:
        logger.debug(f"Could not load GeoJSON from package resources: {e}")
        # Fallback to direct file access (for development)
        geojson_path = Path(__file__).resolve().parent / "data" / "eastern_hemisphere.geojson"
        if geojson_path.exists():
            logger.info("Using custom GeoJSON Eastern Hemisphere outline.")
            return load_geojson_file(str(geojson_path))

    # Final fallback: hardcoded simplified outline
    logger.info("Using hardcoded fallback Eastern Hemisphere outline.")
    return get_eastern_hemisphere_outline_fallback()


def get_builtin_shapes() -> Dict[str, Dict]:
    """Get all built-in geographic shapes"""
    return {
        "eastern_hemisphere": get_eastern_hemisphere_outline()
    }


def process_shapefile(file_contents: bytes, filename: str, tolerance: Optional[float] = 0.01) -> Dict:
    """
    Process an uploaded shapefile (typically zipped) and return standardized geographic data.

    Args:
        file_contents: Raw file contents (likely a .zip archive)
        filename: Original uploaded filename
        tolerance: Optional simplification tolerance in degrees (None disables simplification)

    Returns:
        Dictionary with GeoJSON, CRS info, bounds, and feature count
    """
    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            zip_path = Path(tmp_dir) / "upload.zip"
            zip_path.write_bytes(file_contents)

            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(tmp_dir)

            shp_files = list(Path(tmp_dir).rglob("*.shp"))
            if not shp_files:
                raise ValueError("No .shp file found in uploaded archive.")

            gdf = gpd.read_file(shp_files[0])

        # Reproject to WGS84 if needed
        if gdf.crs and gdf.crs != CRS.from_epsg(4326):
            gdf = gdf.to_crs("EPSG:4326")

        # Simplify geometry if a tolerance is specified
        if tolerance is not None and tolerance > 0:
            gdf["geometry"] = gdf.geometry.simplify(tolerance)

        # Convert to GeoJSON
        geojson = json.loads(gdf.to_json())
        bounds = gdf.unary_union.bounds

        return {
            "geojson": geojson,
            "crs": "EPSG:4326",
            "bounds": list(bounds),
            "name": filename,
            "feature_count": len(gdf)
        }

    except Exception as e:
        logger.error(f"Error processing shapefile {filename}: {e}")
        raise ValueError(f"Could not process shapefile: {e}")
    

def generate_grid_outline(size: int = 10) -> Dict:
    """
    Generate a unit square grid (0–1) outline as a GeoJSON GeometryCollection.

    Args:
        size: Number of divisions along each axis (must be > 0)

    Returns:
        Dictionary with grid line geometries in GeoJSON format.
    """
    if size <= 0:
        raise ValueError("Grid size must be a positive integer")

    step = 1 / size
    lines = []

    # Vertical lines
    for i in range(size + 1):
        x = i * step
        lines.append(mapping(LineString([(x, 0), (x, 1)])))

    # Horizontal lines
    for i in range(size + 1):
        y = i * step
        lines.append(mapping(LineString([(0, y), (1, y)])))

    return {
        "type": "GeometryCollection",
        "geometries": lines,
        "crs": "unit_grid",
        "name": f"{size}x{size} Unit Grid",
        "bounds": [0, 0, 1, 1]
    }


def validate_coordinates_in_shape(
    points: List[Tuple[float, float]],
    shape_data: Dict
) -> List[bool]:
    """
    Validate which coordinates fall within (or on the boundary of) the provided shape.

    Args:
        points: List of (x, y) coordinate tuples.
        shape_data: GeoJSON-like dictionary describing a polygon or multipolygon.

    Returns:
        List of booleans: True if the point is inside or on the boundary, False otherwise.
    """
    try:
        geom_shape = shapely_shape(shape_data)

        # Convert to Point objects
        point_objects = gpd.GeoSeries([Point(x, y) for x, y in points])

        # Check containment or touching (on boundary)
        return point_objects.apply(lambda pt: geom_shape.contains(pt) or geom_shape.touches(pt)).tolist()

    except Exception as e:
        logger.error(f"Error validating coordinates in shape: {e}")
        return [True] * len(points)  # Fallback: assume all valid
    

@lru_cache(maxsize=1)
def get_land_geometry_eastern_hemisphere():
    """
    Get (and cache) the dissolved Natural Earth land geometry for the Eastern Hemisphere.
    Returns a shapely geometry or None.
    """
    try:
        # Try to load from package data first
        try:
            with importlib.resources.path('argscape.backend.geo_utils.data.ne_110m_land', 'ne_110m_land.shp') as shapefile_path:
                if shapefile_path.exists():
                    gdf = gpd.read_file(shapefile_path)
                    logger.info("Loaded Natural Earth data from package resources.")
                else:
                    raise FileNotFoundError("Shapefile not found in package resources")
        except (ImportError, FileNotFoundError) as e:
            logger.debug(f"Could not load from package resources: {e}")
            # Fallback to direct file access (for development)
            data_dir = Path(__file__).resolve().parent / "data"
            search_paths = [
                data_dir / "ne_110m_land" / "ne_110m_land.shp",
                data_dir / "ne_50m_land" / "ne_50m_land.shp",
            ]
            shapefile_path = next((p for p in search_paths if p.exists()), None)
            if not shapefile_path:
                logger.warning("Natural Earth shapefile not found. Falling back to boundary-only checks.")
                return None
            gdf = gpd.read_file(shapefile_path)

        # Clip to extended Eastern Hemisphere (-15 to 180 longitude, above -60 latitude)
        hemisphere_box = box(-15, -60, 180, 90)
        gdf = gdf.clip(hemisphere_box)

        # Dissolve all geometries into one
        geometry = gdf.unary_union
        logger.info("Loaded and cached Natural Earth land geometry.")
        return geometry

    except Exception as e:
        logger.error(f"Failed to load Eastern Hemisphere land geometry: {e}")
        return None


def fallback_land_heuristic(lon: float, lat: float) -> bool:
    """
    Approximate whether a point is on land using coarse region-based bounding boxes.
    Designed as a fast and library-independent fallback.
    """

    # Africa (excluding major inland lakes and Red Sea)
    if -15 <= lon <= 65 and -40 <= lat <= 40:
        if not ((20 <= lon <= 45 and -5 <= lat <= 15) or    # Great Lakes region
                (30 <= lon <= 42 and 23 <= lat <= 30)):     # Red Sea
            return True

    # Europe
    if -15 <= lon <= 70 and 35 <= lat <= 80:
        return True

    # Asia (excluding large water bodies)
    if 25 <= lon <= 180 and 5 <= lat <= 75:
        if not ((60 <= lon <= 70 and 35 <= lat <= 50) or    # Caspian Sea
                (75 <= lon <= 95 and 5 <= lat <= 25) or     # Bay of Bengal
                (35 <= lon <= 60 and 15 <= lat <= 30)):     # Arabian Sea
            return True

    # Indian subcontinent and SE Asia
    if 65 <= lon <= 140 and -10 <= lat <= 40:
        if not (75 <= lon <= 95 and 5 <= lat <= 25):        # Bay of Bengal
            return True

    # Australia and New Zealand
    if 110 <= lon <= 180 and -55 <= lat <= -10:
        return True

    # Japan, Korea, Philippines
    if 120 <= lon <= 150 and 20 <= lat <= 50:
        return True

    # Madagascar
    if 43 <= lon <= 51 and -26 <= lat <= -12:
        return True

    # Arabian Peninsula (excluding Persian Gulf)
    if 30 <= lon <= 65 and 10 <= lat <= 35:
        if not (50 <= lon <= 56 and 24 <= lat <= 29):       # Persian Gulf
            return True

    # Sri Lanka
    if 78 <= lon <= 82 and 5 <= lat <= 10:
        return True

    # Indonesia / Malaysia Archipelago – stochastic approximation
    if 90 <= lon <= 140 and -15 <= lat <= 10:
        return random.random() > 0.2  # 80% chance to be land

    return False
