"""
Shape loading utilities for the viz module.

Provides functions to load built-in geographic shapes and process custom shapefiles
for use in 3D spatial visualizations.
"""

from __future__ import annotations

import json
import warnings
from pathlib import Path
from typing import Any, Union

# Type alias for shapefile input
ShapefileInput = Union[str, Path, "gpd.GeoDataFrame", dict, None]


# Built-in shape definitions
BUILTIN_SHAPES = {
    "unit_grid": {
        "crs": None,  # No CRS - abstract coordinates
        "bounds": (0, 0, 10, 10),
    },
    "eastern_hemisphere": {
        "crs": "EPSG:4326",
        "bounds": (-30, -60, 180, 90),
    },
    "world": {
        "crs": "EPSG:4326",
        "bounds": (-180, -90, 180, 90),
    },
}


def _get_geo_data_dir() -> Path:
    """Get the path to the bundled geo_data directory."""
    return Path(__file__).parent / "geo_data"


def _generate_unit_grid(size: int = 10) -> dict:
    """
    Generate a unit grid shape.

    Args:
        size: Grid size (default 10x10)

    Returns:
        GeoJSON-like dictionary with grid geometry
    """
    geometries = []

    # Create horizontal lines
    for i in range(size + 1):
        geometries.append({
            "type": "LineString",
            "coordinates": [[0, i], [size, i]]
        })

    # Create vertical lines
    for i in range(size + 1):
        geometries.append({
            "type": "LineString",
            "coordinates": [[i, 0], [i, size]]
        })

    return {
        "type": "GeometryCollection",
        "name": "Unit Grid",
        "bounds": [0, 0, size, size],
        "geometries": geometries,
    }


def _load_bundled_geojson(filename: str) -> dict:
    """
    Load a bundled GeoJSON file.

    Args:
        filename: Name of the file in geo_data directory

    Returns:
        Parsed GeoJSON dictionary

    Raises:
        FileNotFoundError: If the bundled file doesn't exist
    """
    filepath = _get_geo_data_dir() / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Bundled shape file not found: {filepath}")

    with open(filepath, "r") as f:
        return json.load(f)


def _load_shapefile_from_path(path: Union[str, Path]) -> dict:
    """
    Load a shapefile from a file path.

    Args:
        path: Path to .shp file or zipped shapefile

    Returns:
        GeoJSON-like dictionary with geometry

    Raises:
        FileNotFoundError: If the file doesn't exist
        ValueError: If the file cannot be read
    """
    try:
        import geopandas as gpd
    except ImportError:
        raise ImportError(
            "geopandas is required for loading shapefiles. "
            "Install it with: pip install geopandas"
        )

    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Shapefile not found: {path}")

    try:
        gdf = gpd.read_file(path)
    except Exception as e:
        raise ValueError(f"Could not read shapefile: {e}")

    return _geodataframe_to_shape(gdf)


def _geodataframe_to_shape(gdf: "gpd.GeoDataFrame") -> dict:
    """
    Convert a GeoDataFrame to a shape dictionary.

    Args:
        gdf: GeoDataFrame with geometry

    Returns:
        GeoJSON-like dictionary with geometry and metadata
    """
    if gdf.empty:
        raise ValueError("Shapefile contains no geometry")

    # Get CRS string
    crs_string = None
    if gdf.crs is not None:
        crs_string = str(gdf.crs)

    # Calculate bounds
    total_bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]

    # Convert to GeoJSON
    geojson = json.loads(gdf.to_json())

    # Extract geometries for our format
    geometries = []
    for feature in geojson.get("features", []):
        geom = feature.get("geometry", {})
        if geom:
            geometries.append(geom)

    return {
        "type": "GeometryCollection",
        "name": gdf.attrs.get("name", "Custom Shape"),
        "bounds": list(total_bounds),
        "crs": crs_string,
        "geometries": geometries,
    }


def _geojson_dict_to_shape(geojson: dict) -> dict:
    """
    Convert a GeoJSON dictionary to our shape format.

    Args:
        geojson: GeoJSON dictionary (FeatureCollection or Geometry)

    Returns:
        Shape dictionary with geometry and bounds
    """
    geometries = []
    all_coords = []

    def extract_coords(coords):
        """Recursively extract all coordinates for bounds calculation."""
        if isinstance(coords[0], (int, float)):
            all_coords.append(coords[:2])  # Just x, y
        else:
            for c in coords:
                extract_coords(c)

    def process_geometry(geom):
        if geom.get("type") == "GeometryCollection":
            for g in geom.get("geometries", []):
                process_geometry(g)
        else:
            geometries.append(geom)
            if "coordinates" in geom:
                extract_coords(geom["coordinates"])

    # Handle different GeoJSON types
    if geojson.get("type") == "FeatureCollection":
        for feature in geojson.get("features", []):
            if "geometry" in feature and feature["geometry"]:
                process_geometry(feature["geometry"])
    elif geojson.get("type") == "Feature":
        if "geometry" in geojson and geojson["geometry"]:
            process_geometry(geojson["geometry"])
    elif "type" in geojson:
        process_geometry(geojson)

    if not geometries:
        raise ValueError("GeoJSON contains no geometry")

    # Calculate bounds
    if all_coords:
        xs = [c[0] for c in all_coords]
        ys = [c[1] for c in all_coords]
        bounds = [min(xs), min(ys), max(xs), max(ys)]
    else:
        bounds = [0, 0, 1, 1]

    return {
        "type": "GeometryCollection",
        "name": geojson.get("name", "Custom Shape"),
        "bounds": bounds,
        "crs": geojson.get("crs", {}).get("properties", {}).get("name"),
        "geometries": geometries,
    }


def get_builtin_shape(name: str) -> dict:
    """
    Load a built-in shape by name.

    Args:
        name: Shape name ("unit_grid", "eastern_hemisphere", or "world")

    Returns:
        Shape dictionary with geometry and metadata

    Raises:
        ValueError: If the shape name is not recognized
    """
    if name not in BUILTIN_SHAPES:
        valid = ", ".join(BUILTIN_SHAPES.keys())
        raise ValueError(f"Unknown built-in shape: {name}. Valid options: {valid}")

    if name == "unit_grid":
        return _generate_unit_grid()
    else:
        filename = f"{name}.json"
        try:
            shape = _load_bundled_geojson(filename)
            # Ensure bounds and crs are set
            if "bounds" not in shape:
                shape["bounds"] = list(BUILTIN_SHAPES[name]["bounds"])
            if "crs" not in shape:
                shape["crs"] = BUILTIN_SHAPES[name]["crs"]
            return shape
        except FileNotFoundError:
            warnings.warn(
                f"Built-in shape '{name}' not found, falling back to unit_grid"
            )
            return _generate_unit_grid()


def load_shape(
    shapefile: ShapefileInput = None,
    geographic_base: str = "unit_grid",
    shapefile_crs: str | None = None,
) -> dict:
    """
    Load a geographic shape from various input types.

    Args:
        shapefile: One of:
            - str/Path: Path to .shp file or zipped shapefile
            - GeoDataFrame: geopandas GeoDataFrame
            - dict: GeoJSON dictionary
            - None: Use built-in shape
        geographic_base: Built-in shape to use if shapefile is None
            ("unit_grid", "eastern_hemisphere", or "world")
        shapefile_crs: Override CRS for the shapefile (e.g., "EPSG:4326")

    Returns:
        Shape dictionary with:
            - type: "GeometryCollection"
            - name: Shape name
            - bounds: [minx, miny, maxx, maxy]
            - crs: CRS string or None
            - geometries: List of geometry objects

    Raises:
        FileNotFoundError: If shapefile path doesn't exist
        ValueError: If shapefile cannot be read or has no geometry
    """
    if shapefile is None:
        shape = get_builtin_shape(geographic_base)
    elif isinstance(shapefile, (str, Path)):
        shape = _load_shapefile_from_path(shapefile)
    elif isinstance(shapefile, dict):
        shape = _geojson_dict_to_shape(shapefile)
    else:
        # Assume it's a GeoDataFrame
        try:
            import geopandas as gpd
            if isinstance(shapefile, gpd.GeoDataFrame):
                shape = _geodataframe_to_shape(shapefile)
            else:
                raise ValueError(
                    f"Unsupported shapefile type: {type(shapefile)}. "
                    "Expected str, Path, GeoDataFrame, or dict."
                )
        except ImportError:
            raise ValueError(
                f"Unsupported shapefile type: {type(shapefile)}. "
                "Install geopandas to use GeoDataFrame input."
            )

    # Override CRS if specified
    if shapefile_crs is not None:
        shape["crs"] = shapefile_crs

    return shape


def get_shape_crs(shape: dict) -> str | None:
    """
    Get the CRS of a shape.

    Args:
        shape: Shape dictionary

    Returns:
        CRS string or None if no CRS
    """
    return shape.get("crs")


def get_shape_bounds(shape: dict) -> tuple[float, float, float, float]:
    """
    Get the bounds of a shape.

    Args:
        shape: Shape dictionary

    Returns:
        Tuple of (minx, miny, maxx, maxy)
    """
    bounds = shape.get("bounds", [0, 0, 1, 1])
    return tuple(bounds)
