from dataclasses import dataclass, field
from typing import Optional, Tuple, Dict
from pyproj import CRS
import logging

logger = logging.getLogger(__name__)

@dataclass
class CoordinateReferenceSystem:
    """Represents a coordinate reference system with transformation capabilities."""
    name: str
    crs_string: str
    bounds: Optional[Tuple[float, float, float, float]] = None
    crs: CRS = field(init=False)

    def __post_init__(self):
        try:
            self.crs = CRS.from_user_input(self.crs_string)
        except Exception as e:
            logger.warning(f"Could not create CRS from string '{self.crs_string}': {e}")
            self.crs = None

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "crs_string": self.crs_string,
            "bounds": self.bounds
        }

    def __repr__(self):
        return f"<CRS {self.name}: {self.crs_string}>"


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