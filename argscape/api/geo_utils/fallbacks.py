"""
Fallback functions for geographic utilities.
"""

from typing import Dict
from shapely.geometry import Polygon

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