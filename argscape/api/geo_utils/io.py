"""
I/O utility functions for handling geographic data.
"""

import logging
import pandas as pd
import io
from typing import Dict, List, Tuple, Optional
import geopandas as gpd
from shapely.geometry import Point, LineString, Polygon
from shapely.geometry.base import BaseGeometry
from pathlib import Path
import csv
import importlib.resources
from .fallbacks import get_eastern_hemisphere_outline_fallback

logger = logging.getLogger(__name__)

def parse_location_csv(csv_content: bytes, filename: str) -> Dict[int, tuple]:
    """Parse CSV file containing node locations."""
    try:
        # Read CSV content
        csv_string = csv_content.decode('utf-8')
        df = pd.read_csv(io.StringIO(csv_string))
        
        # Validate required columns
        required_columns = ['node_id', 'x', 'y']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns in {filename}: {missing_columns}")
        
        # Convert to dictionary mapping node_id to (x, y, z) tuple
        locations = {}
        for _, row in df.iterrows():
            node_id = int(row['node_id'])
            x = float(row['x'])
            y = float(row['y'])
            z = float(row['z']) if 'z' in df.columns and pd.notna(row['z']) else 0.0
            locations[node_id] = (x, y, z)
        
        logger.info(f"Parsed {len(locations)} locations from {filename}")
        return locations
        
    except Exception as e:
        raise ValueError(f"Error parsing CSV file {filename}: {str(e)}") 
    

def load_geojson_file(filepath: str) -> Dict:
    """
    Load a GeoJSON file and return standardized spatial metadata.
    
    Args:
        filepath: Path to the GeoJSON file.
        
    Returns:
        Dictionary with geometry type, coordinates, bounds, CRS, and optional name.
    """
    try:
        # First try to load as a package resource
        try:
            with importlib.resources.path('argscape.backend.geo_utils.data', Path(filepath).name) as path:
                if path.exists():
                    gdf = gpd.read_file(path)
                    logger.info(f"Loaded GeoJSON from package resources: {filepath}")
                else:
                    raise FileNotFoundError(f"GeoJSON not found in package resources: {filepath}")
        except (ImportError, FileNotFoundError) as e:
            logger.debug(f"Could not load GeoJSON from package resources: {e}")
            # Fallback to direct file access (for development)
            path = Path(filepath)
            if not path.exists():
                logger.warning(f"GeoJSON file not found: {filepath}")
                return get_eastern_hemisphere_outline_fallback()
            gdf = gpd.read_file(path)

        if gdf.empty:
            logger.warning("GeoJSON contains no features.")
            return get_eastern_hemisphere_outline_fallback()

        geometry: BaseGeometry = gdf.geometry.iloc[0]
        name = gdf.get("name", ["Unnamed Geometry"])[0]
        return {
            "type": geometry.geom_type,
            "coordinates": geometry.__geo_interface__["coordinates"],
            "crs": gdf.crs.to_string() if gdf.crs else "EPSG:4326",
            "name": name,
            "bounds": list(geometry.bounds)
        }

    except Exception as e:
        logger.error(f"Error loading GeoJSON from {filepath}: {e}")
        return get_eastern_hemisphere_outline_fallback()