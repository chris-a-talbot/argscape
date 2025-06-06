"""
Geographic utilities for spatial ARG visualization
Handles shapefiles, coordinate systems, and geographic transformations
"""

import logging
import tempfile
import os
from typing import Dict, List, Tuple, Optional, Union
import numpy as np
import json

try:
    import geopandas as gpd
    import shapely.geometry as geom
    from shapely.geometry import Point, Polygon, MultiPolygon
    from pyproj import CRS, Transformer
    GEOSPATIAL_AVAILABLE = True
except ImportError:
    gpd = None
    geom = None
    Point = None
    Polygon = None
    MultiPolygon = None
    CRS = None
    Transformer = None
    GEOSPATIAL_AVAILABLE = False

logger = logging.getLogger(__name__)

class CoordinateReferenceSystem:
    """Represents a coordinate reference system with transformation capabilities"""
    
    def __init__(self, name: str, crs_string: str, bounds: Optional[Tuple[float, float, float, float]] = None):
        self.name = name
        self.crs_string = crs_string
        self.bounds = bounds  # (min_x, min_y, max_x, max_y)
        
        if GEOSPATIAL_AVAILABLE:
            try:
                self.crs = CRS.from_string(crs_string)
            except Exception as e:
                logger.warning(f"Could not create CRS from string '{crs_string}': {e}")
                self.crs = None
        else:
            self.crs = None
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "crs_string": self.crs_string,
            "bounds": self.bounds
        }

# Built-in coordinate reference systems
BUILTIN_CRS = {
    "unit_grid": CoordinateReferenceSystem(
        name="Unit Grid",
        crs_string="+proj=longlat +datum=WGS84 +no_defs",  # Use WGS84 as base but treat as unit grid
        bounds=(0.0, 0.0, 1.0, 1.0)
    ),
    "wgs84": CoordinateReferenceSystem(
        name="WGS84 (Geographic)",
        crs_string="EPSG:4326",
        bounds=(-180.0, -90.0, 180.0, 90.0)
    ),
    "web_mercator": CoordinateReferenceSystem(
        name="Web Mercator",
        crs_string="EPSG:3857",
        bounds=(-20037508.34, -20037508.34, 20037508.34, 20037508.34)
    )
}

def load_geojson_file(filepath: str) -> Dict:
    """
    Load a GeoJSON file from disk
    
    Args:
        filepath: Path to the GeoJSON file
        
    Returns:
        Dictionary with GeoJSON data converted to shape format
    """
    try:
        import json
        import os
        
        if not os.path.exists(filepath):
            logger.warning(f"GeoJSON file not found: {filepath}")
            return get_eastern_hemisphere_outline_fallback()
            
        with open(filepath, 'r') as f:
            geojson_data = json.load(f)
        
        # Extract the first feature's geometry
        if geojson_data.get("type") == "FeatureCollection" and geojson_data.get("features"):
            feature = geojson_data["features"][0]
            geometry = feature["geometry"]
            
            # Calculate bounds
            coords = geometry["coordinates"][0]
            lons = [coord[0] for coord in coords]
            lats = [coord[1] for coord in coords]
            bounds = [min(lons), min(lats), max(lons), max(lats)]
            
            return {
                "type": geometry["type"],
                "coordinates": geometry["coordinates"],
                "crs": "EPSG:4326",
                "name": feature.get("properties", {}).get("name", "Eastern Hemisphere"),
                "bounds": bounds
            }
        else:
            logger.warning("Invalid GeoJSON format")
            return get_eastern_hemisphere_outline_fallback()
            
    except Exception as e:
        logger.error(f"Error loading GeoJSON file {filepath}: {e}")
        return get_eastern_hemisphere_outline_fallback()

def get_eastern_hemisphere_outline_fallback() -> Dict:
    """
    Fallback Eastern Hemisphere outline (simplified) - Extended to include Western Europe and Africa
    Excludes Antarctica (starts at -60° latitude).
    """
    # Extended to include Spain, Portugal, Morocco, etc. (westward to -15°)
    # Excludes Antarctica by not going below -60° latitude
    eastern_hemisphere_coords = [
        [-15, -60], [-10, -60], [0, -60], [30, -60], [45, -35], [60, -25], [80, -10], [100, 10],
        [120, 25], [140, 35], [160, 50], [180, 60], [180, 75], [150, 75],
        [120, 70], [90, 65], [60, 55], [30, 60], [0, 70], [-10, 65], [-15, 60], [-15, -60]
    ]
    
    return {
        "type": "Polygon",
        "coordinates": [eastern_hemisphere_coords],
        "crs": "EPSG:4326",
        "name": "Eastern Hemisphere (Simplified, No Antarctica)",
        "bounds": [-15, -60, 180, 75]  # Extended western boundary, excludes Antarctica
    }

def load_natural_earth_land(filter_eastern_hemisphere: bool = True) -> Dict:
    """
    Load Natural Earth land shapefile and optionally filter to Eastern Hemisphere
    
    Args:
        filter_eastern_hemisphere: If True, filter to Eastern Hemisphere (0° to 180° longitude)
        
    Returns:
        Dictionary with shape data
    """
    try:
        import geopandas as gpd
        import os
        from shapely.geometry import box
        
        current_dir = os.path.dirname(__file__)
        
        # Check for Natural Earth land files (try both resolutions)
        possible_paths = [
            os.path.join(current_dir, "data", "ne_110m_land", "ne_110m_land.shp"),
            os.path.join(current_dir, "data", "ne_50m_land", "ne_50m_land.shp"),
            os.path.join(current_dir, "data", "ne_110m_land.shp"),
            os.path.join(current_dir, "data", "ne_50m_land.shp"),
        ]
        
        shapefile_path = None
        for path in possible_paths:
            if os.path.exists(path):
                shapefile_path = path
                break
        
        if not shapefile_path:
            logger.warning("Natural Earth land shapefile not found")
            return get_eastern_hemisphere_outline_fallback()
        
        # Load the shapefile
        gdf = gpd.read_file(shapefile_path)
        
        if filter_eastern_hemisphere:
            # Create Extended Eastern Hemisphere bounding box (-15° to 180° longitude)
            # Extended westward to include Spain, Portugal, Morocco, etc.
            # Exclude Antarctica by setting southern boundary to -60° instead of -90°
            eastern_hemisphere_box = box(-15, -60, 180, 90)
            
            # Clip to Extended Eastern Hemisphere (excluding Antarctica)
            gdf = gdf.clip(eastern_hemisphere_box)
        
        # Convert to single geometry (dissolve all land masses)
        dissolved = gdf.dissolve()
        
        # Get the geometry
        geometry = dissolved.geometry.iloc[0]
        
        # Convert to GeoJSON-like format
        if hasattr(geometry, '__geo_interface__'):
            geo_interface = geometry.__geo_interface__
            
            # Calculate bounds
            bounds = geometry.bounds  # returns (minx, miny, maxx, maxy)
            
            return {
                "type": geo_interface["type"],
                "coordinates": geo_interface["coordinates"],
                "crs": "EPSG:4326",
                "name": "Eastern Hemisphere (Natural Earth)",
                "bounds": list(bounds)
            }
        else:
            logger.warning("Could not convert Natural Earth geometry")
            return get_eastern_hemisphere_outline_fallback()
            
    except Exception as e:
        logger.error(f"Error loading Natural Earth shapefile: {e}")
        return get_eastern_hemisphere_outline_fallback()

def get_eastern_hemisphere_outline() -> Dict:
    """
    Get a detailed outline of the Eastern Hemisphere in WGS84
    Returns GeoJSON-like structure with the boundary
    """
    import os
    
    current_dir = os.path.dirname(__file__)
    
    # Priority order:
    # 1. Natural Earth land shapefile (most accurate)
    # 2. Custom GeoJSON file
    # 3. Fallback hardcoded outline
    
    # Try Natural Earth first
    try:
        result = load_natural_earth_land(filter_eastern_hemisphere=True)
        if result and result.get("name") != "Eastern Hemisphere (Simplified)":
            logger.info("Using Natural Earth Eastern Hemisphere outline")
            return result
    except Exception as e:
        logger.debug(f"Natural Earth loading failed: {e}")
    
    # Try GeoJSON file
    geojson_path = os.path.join(current_dir, "data", "eastern_hemisphere.geojson")
    if os.path.exists(geojson_path):
        logger.info("Using GeoJSON Eastern Hemisphere outline")
        return load_geojson_file(geojson_path)
    
    # Fallback to hardcoded version
    logger.info("Using fallback Eastern Hemisphere outline")
    return get_eastern_hemisphere_outline_fallback()

def get_builtin_shapes() -> Dict[str, Dict]:
    """Get all built-in geographic shapes"""
    return {
        "eastern_hemisphere": get_eastern_hemisphere_outline()
    }

def process_shapefile(file_contents: bytes, filename: str) -> Dict:
    """
    Process uploaded shapefile and return standardized format
    
    Args:
        file_contents: The shapefile contents
        filename: Name of the uploaded file
        
    Returns:
        Dictionary with processed geographic data
    """
    if not GEOSPATIAL_AVAILABLE:
        raise ValueError("Geospatial libraries not available. Cannot process shapefiles.")
    
    try:
        # Save to temporary file for geopandas to read
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp_file:
            tmp_file.write(file_contents)
            tmp_file.flush()
            
            try:
                # Try to read as shapefile (could be zipped)
                gdf = gpd.read_file(tmp_file.name)
            except Exception:
                # If that fails, try reading the file contents directly
                with tempfile.TemporaryDirectory() as tmp_dir:
                    # Extract if it's a zip file
                    import zipfile
                    with zipfile.ZipFile(tmp_file.name, 'r') as zip_ref:
                        zip_ref.extractall(tmp_dir)
                    
                    # Find the .shp file
                    shp_files = [f for f in os.listdir(tmp_dir) if f.endswith('.shp')]
                    if not shp_files:
                        raise ValueError("No .shp file found in uploaded archive")
                    
                    shp_path = os.path.join(tmp_dir, shp_files[0])
                    gdf = gpd.read_file(shp_path)
            
            finally:
                os.unlink(tmp_file.name)
        
        # Convert to WGS84 if not already
        if gdf.crs and gdf.crs != CRS.from_epsg(4326):
            gdf = gdf.to_crs("EPSG:4326")
        
        # Simplify geometry to reduce complexity
        gdf['geometry'] = gdf.geometry.simplify(tolerance=0.01)
        
        # Convert to GeoJSON format
        geojson = json.loads(gdf.to_json())
        
        # Extract bounds
        bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]
        
        return {
            "geojson": geojson,
            "crs": "EPSG:4326",
            "bounds": bounds.tolist(),
            "name": filename,
            "feature_count": len(gdf)
        }
        
    except Exception as e:
        logger.error(f"Error processing shapefile {filename}: {e}")
        raise ValueError(f"Could not process shapefile: {str(e)}")

def transform_coordinates(points: List[Tuple[float, float]], 
                         source_crs: str, 
                         target_crs: str) -> List[Tuple[float, float]]:
    """
    Transform coordinates between coordinate reference systems
    
    Args:
        points: List of (x, y) coordinate tuples
        source_crs: Source CRS string (e.g., "EPSG:4326")
        target_crs: Target CRS string
        
    Returns:
        List of transformed (x, y) coordinate tuples
    """
    if not GEOSPATIAL_AVAILABLE:
        logger.warning("Geospatial libraries not available - returning original coordinates")
        return points
    
    if source_crs == target_crs:
        return points
    
    try:
        transformer = Transformer.from_crs(source_crs, target_crs, always_xy=True)
        transformed_points = []
        
        for x, y in points:
            new_x, new_y = transformer.transform(x, y)
            transformed_points.append((new_x, new_y))
        
        return transformed_points
        
    except Exception as e:
        logger.error(f"Error transforming coordinates from {source_crs} to {target_crs}: {e}")
        raise ValueError(f"Could not transform coordinates: {str(e)}")

def normalize_coordinates_to_unit_space(points: List[Tuple[float, float]], 
                                      bounds: Tuple[float, float, float, float]) -> List[Tuple[float, float]]:
    """
    Normalize coordinates to unit space (0-1) based on provided bounds
    
    Args:
        points: List of (x, y) coordinate tuples
        bounds: (min_x, min_y, max_x, max_y) bounds for normalization
        
    Returns:
        List of normalized (x, y) coordinate tuples in [0, 1] space
    """
    min_x, min_y, max_x, max_y = bounds
    width = max_x - min_x
    height = max_y - min_y
    
    if width == 0 or height == 0:
        logger.warning("Zero width or height in bounds - cannot normalize coordinates")
        return points
    
    normalized_points = []
    for x, y in points:
        norm_x = (x - min_x) / width
        norm_y = (y - min_y) / height
        normalized_points.append((norm_x, norm_y))
    
    return normalized_points

def generate_grid_outline(size: int = 10) -> Dict:
    """
    Generate a simple grid outline for unit coordinate systems
    
    Args:
        size: Grid size (size x size grid)
        
    Returns:
        Dictionary with grid outline data
    """
    # Create a simple square grid outline
    grid_lines = []
    
    # Vertical lines
    for i in range(size + 1):
        x = i / size
        grid_lines.append({
            "type": "LineString",
            "coordinates": [[x, 0], [x, 1]]
        })
    
    # Horizontal lines
    for i in range(size + 1):
        y = i / size
        grid_lines.append({
            "type": "LineString",
            "coordinates": [[0, y], [1, y]]
        })
    
    return {
        "type": "GeometryCollection",
        "geometries": grid_lines,
        "crs": "unit_grid",
        "name": f"{size}x{size} Unit Grid",
        "bounds": [0, 0, 1, 1]
    }

def validate_coordinates_in_shape(points: List[Tuple[float, float]], 
                                shape_data: Dict) -> List[bool]:
    """
    Check which coordinates fall within the provided shape
    
    Args:
        points: List of (x, y) coordinate tuples
        shape_data: Shape data dictionary
        
    Returns:
        List of boolean values indicating which points are within the shape
    """
    if not GEOSPATIAL_AVAILABLE:
        # If geospatial libraries aren't available, assume all points are valid
        return [True] * len(points)
    
    try:
        # Convert shape data to shapely geometry
        if shape_data["type"] == "Polygon":
            shape = geom.Polygon(shape_data["coordinates"][0])
        elif shape_data["type"] == "MultiPolygon":
            polygons = [geom.Polygon(coords[0]) for coords in shape_data["coordinates"]]
            shape = geom.MultiPolygon(polygons)
        else:
            # For other geometry types, use bounding box
            bounds = shape_data.get("bounds", [-180, -90, 180, 90])
            shape = geom.box(*bounds)
        
        # Check each point
        results = []
        for x, y in points:
            point = geom.Point(x, y)
            results.append(shape.contains(point) or shape.touches(point))
        
        return results
        
    except Exception as e:
        logger.error(f"Error validating coordinates in shape: {e}")
        # Return all True if validation fails
        return [True] * len(points) 

def get_land_geometry_eastern_hemisphere():
    """
    Get the land geometry for the Eastern Hemisphere using Natural Earth data.
    This is cached to avoid reloading the shapefile repeatedly.
    """
    if not hasattr(get_land_geometry_eastern_hemisphere, 'cached_geometry'):
        try:
            import geopandas as gpd
            import os
            from shapely.geometry import box
            
            current_dir = os.path.dirname(__file__)
            
            # Check for Natural Earth land files
            possible_paths = [
                os.path.join(current_dir, "data", "ne_110m_land", "ne_110m_land.shp"),
                os.path.join(current_dir, "data", "ne_50m_land", "ne_50m_land.shp"),
            ]
            
            shapefile_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    shapefile_path = path
                    break
            
            if shapefile_path:
                # Load the shapefile
                gdf = gpd.read_file(shapefile_path)
                
                # Filter to Extended Eastern Hemisphere (-15° to 180° longitude)
                # Exclude Antarctica by setting southern boundary to -60°
                eastern_hemisphere_box = box(-15, -60, 180, 90)
                gdf = gdf.clip(eastern_hemisphere_box)
                
                # Convert to single geometry (dissolve all land masses)
                dissolved = gdf.dissolve()
                geometry = dissolved.geometry.iloc[0]
                
                # Cache the geometry
                get_land_geometry_eastern_hemisphere.cached_geometry = geometry
                logger.info("Loaded Natural Earth land geometry for accurate land placement")
            else:
                # Fallback: no geometry available
                get_land_geometry_eastern_hemisphere.cached_geometry = None
                logger.warning("Natural Earth shapefile not found, using coordinate-based land detection")
                
        except Exception as e:
            logger.error(f"Error loading Natural Earth land geometry: {e}")
            get_land_geometry_eastern_hemisphere.cached_geometry = None
    
    return get_land_geometry_eastern_hemisphere.cached_geometry

def is_point_on_land_eastern_hemisphere(lon: float, lat: float) -> bool:
    """
    Check if a point is on land in the Eastern Hemisphere using Natural Earth land data.
    Falls back to coordinate-based detection if shapefile is not available.
    Excludes Antarctica (latitudes below -60°).
    
    Args:
        lon: Longitude (-15 to 180)
        lat: Latitude (-60 to 75)
        
    Returns:
        True if on land, False if in ocean/large lakes/Antarctica
    """
    # Exclude Antarctica - reject any points below -60° latitude
    if lat < -60:
        return False
    # Try using Natural Earth land geometry first
    land_geometry = get_land_geometry_eastern_hemisphere()
    
    if land_geometry is not None:
        try:
            from shapely.geometry import Point
            point = Point(lon, lat)
            return land_geometry.contains(point) or land_geometry.intersects(point)
        except Exception as e:
            logger.debug(f"Error checking point against land geometry: {e}")
            # Fall through to coordinate-based method
    
    # Fallback to coordinate-based land detection (simplified but reliable)
    # This is faster and doesn't require shapely for basic cases
    
    # Africa - main continent
    if -15 <= lon <= 65 and -40 <= lat <= 40:
        # Exclude major water bodies
        if not ((20 <= lon <= 45 and -5 <= lat <= 15) or    # Central African lakes/rivers
                (30 <= lon <= 42 and 25 <= lat <= 35)):      # Red Sea
            return True
    
    # Europe - comprehensive coverage
    if -15 <= lon <= 70 and 35 <= lat <= 75:
        return True
    
    # Asia - main continent
    if 25 <= lon <= 180 and 5 <= lat <= 75:
        # Exclude major seas and lakes
        if not ((35 <= lon <= 55 and 15 <= lat <= 30) or    # Arabian Sea/Persian Gulf
                (75 <= lon <= 95 and 5 <= lat <= 25) or      # Bay of Bengal
                (45 <= lon <= 75 and 35 <= lat <= 50)):      # Caspian Sea region
            return True
    
    # India and Southeast Asia
    if 65 <= lon <= 140 and -10 <= lat <= 40:
        # Exclude major water bodies
        if not (75 <= lon <= 95 and 5 <= lat <= 25):  # Bay of Bengal
            return True
    
    # Australia and New Zealand
    if 110 <= lon <= 180 and -50 <= lat <= -10:
        return True
    
    # Japan/Korea/Philippines archipelago
    if 120 <= lon <= 150 and 20 <= lat <= 50:
        return True
    
    # Madagascar
    if 43 <= lon <= 51 and -26 <= lat <= -12:
        return True
    
    # Arabian Peninsula
    if 30 <= lon <= 65 and 10 <= lat <= 35:
        # Exclude Persian Gulf
        if not (48 <= lon <= 58 and 20 <= lat <= 30):
            return True
    
    # Sri Lanka
    if 78 <= lon <= 82 and 5 <= lat <= 10:
        return True
    
    # Indonesia/Malaysia archipelago - give high probability for island regions
    if 90 <= lon <= 140 and -15 <= lat <= 10:
        import random
        return random.random() > 0.3  # 70% chance for archipelago
    
    return False

def detect_coordinate_system(coordinates: List[Tuple[float, float]]) -> Dict[str, any]:
    """
    Analyze coordinate patterns to detect the most likely coordinate system
    
    Args:
        coordinates: List of (x, y) coordinate tuples
        
    Returns:
        Dictionary with detection results including likely CRS, confidence, and reasoning
    """
    if not coordinates:
        return {
            "likely_crs": "unknown",
            "confidence": 0.0,
            "reasoning": "No coordinates provided",
            "bounds": None,
            "coordinate_count": 0,
            "land_points": 0,
            "land_percentage": 0.0
        }
    
    # Calculate bounds
    x_coords = [x for x, y in coordinates]
    y_coords = [y for x, y in coordinates]
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    bounds = [min_x, min_y, max_x, max_y]
    
    # Analysis patterns
    x_range = max_x - min_x
    y_range = max_y - min_y
    total_points = len(coordinates)
    
    # Detection logic
    confidence = 0.0
    likely_crs = "unknown"
    reasoning = []
    land_points = 0
    
    # Check for unit grid pattern (0-1 range)
    if (0 <= min_x <= 1 and 0 <= max_x <= 1 and 
        0 <= min_y <= 1 and 0 <= max_y <= 1):
        confidence = 0.95
        likely_crs = "unit_grid"
        reasoning.append("Coordinates are within [0,1] range")
        if x_range < 0.1 and y_range < 0.1:
            reasoning.append("Very small range suggests normalized/simulated data")
    
    # Check for small planar coordinates (likely arbitrary units)
    elif (abs(min_x) < 50 and abs(max_x) < 50 and 
          abs(min_y) < 50 and abs(max_y) < 50 and
          x_range > 0.1 and y_range > 0.1):
        confidence = 0.8
        likely_crs = "planar"
        reasoning.append("Small coordinate values suggest arbitrary planar units")
        if x_range / y_range > 2 or y_range / x_range > 2:
            reasoning.append("Non-square aspect ratio suggests rectangular coordinate space")
        else:
            reasoning.append("Square-like aspect ratio suggests square coordinate space")
    
    # Check for WGS84 geographic coordinates
    elif (-180 <= min_x <= 180 and -180 <= max_x <= 180 and
          -90 <= min_y <= 90 and -90 <= max_y <= 90):
        
        # Check if points are on land (for Extended Eastern Hemisphere, excluding Antarctica)
        if -15 <= min_x <= 180 and -60 <= min_y <= 75:
            land_points = sum(1 for x, y in coordinates if is_point_on_land_eastern_hemisphere(x, y))
            land_percentage = (land_points / total_points) * 100
            
            if land_percentage > 50:
                confidence = 0.95
                likely_crs = "EPSG:4326"
                reasoning.append("Coordinates fit Eastern Hemisphere geographic pattern")
                reasoning.append(f"{land_percentage:.0f}% of points are on land")
            elif land_percentage > 20:
                confidence = 0.8
                likely_crs = "EPSG:4326"
                reasoning.append("Coordinates within geographic bounds, some points on land")
                reasoning.append(f"{land_percentage:.0f}% of points are on land")
            else:
                confidence = 0.6
                likely_crs = "planar"
                reasoning.append("Coordinates within geographic bounds but mostly in ocean")
                reasoning.append("Likely planar coordinates that happen to fit lat/lon range")
        else:
            confidence = 0.7
            likely_crs = "EPSG:4326"
            reasoning.append("Coordinates are within valid longitude/latitude ranges")
            
            # Additional checks for geographic patterns
            if x_range > 10 or y_range > 10:
                reasoning.append("Large coordinate range suggests continental/global scale")
    
    # Check for Web Mercator (large numbers)
    elif (abs(min_x) > 1000000 or abs(max_x) > 1000000 or
          abs(min_y) > 1000000 or abs(max_y) > 1000000):
        confidence = 0.8
        likely_crs = "EPSG:3857"  # Web Mercator
        reasoning.append("Large coordinate values suggest projected coordinate system")
        if abs(max_x) < 20037508 and abs(max_y) < 20037508:
            reasoning.append("Values within Web Mercator bounds")
    
    # Check for other projected systems (moderate numbers)
    elif (abs(min_x) > 100 or abs(max_x) > 100 or 
          abs(min_y) > 100 or abs(max_y) > 100):
        confidence = 0.6
        likely_crs = "projected"
        reasoning.append("Moderate coordinate values suggest projected coordinate system")
    
    # Check for rectangular/square planar coordinates (medium range)
    elif (x_range > 1 and y_range > 1):
        confidence = 0.7
        likely_crs = "planar"
        reasoning.append("Medium-range coordinates suggest planar coordinate system")
        if x_range / y_range > 2 or y_range / x_range > 2:
            reasoning.append("Rectangular aspect ratio")
        else:
            reasoning.append("Square-like aspect ratio")
    
    # Unknown pattern
    else:
        confidence = 0.3
        likely_crs = "unknown"
        reasoning.append("Coordinate pattern does not match common systems")
    
    return {
        "likely_crs": likely_crs,
        "confidence": confidence,
        "reasoning": "; ".join(reasoning),
        "bounds": bounds,
        "coordinate_count": len(coordinates),
        "land_points": land_points,
        "land_percentage": round(land_points / total_points * 100, 1) if total_points > 0 else 0.0,
        "suggested_geographic_mode": get_suggested_geographic_mode(likely_crs, bounds)
    }

def get_suggested_geographic_mode(crs: str, bounds: List[float]) -> str:
    """
    Suggest the best geographic display mode based on detected CRS
    
    Args:
        crs: Detected coordinate reference system
        bounds: Coordinate bounds [min_x, min_y, max_x, max_y]
        
    Returns:
        Suggested geographic mode string
    """
    if crs == "unit_grid":
        return "unit_grid"
    elif crs == "planar":
        return "unit_grid"  # Use unit grid for planar coordinates
    elif crs == "EPSG:4326":
        # Check if coordinates fit Extended Eastern Hemisphere
        min_x, min_y, max_x, max_y = bounds
        if -15 <= min_x <= 180 and -60 <= min_y <= 75:
            return "eastern_hemisphere"
        else:
            return "unit_grid"  # Default to grid for other geographic areas
    else:
        return "unit_grid"  # Default fallback