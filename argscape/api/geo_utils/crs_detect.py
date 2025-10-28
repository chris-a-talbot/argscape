from typing import List, Tuple, Dict, Any
from .land_detect import is_point_on_land_eastern_hemisphere
import logging

logger = logging.getLogger(__name__)

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

    # Case 1: Normalized unit grid
    if all(0 <= v <= 1 for v in x_vals + y_vals):
        reasoning.append("Coordinates fall within [0, 1] range")
        if x_range < 0.1 and y_range < 0.1:
            reasoning.append("Small spatial spread suggests normalized or simulated data")
        return _build_detection_result("unit_grid", 0.95, reasoning, bounds, count, 0)

    # Case 2: Likely geographic (WGS84-like)
    if -180 <= min_x <= 180 and -90 <= min_y <= 90:
        if -15 <= min_x <= 180 and -60 <= min_y <= 75:
            land_points = sum(1 for x, y in coordinates if is_point_on_land_eastern_hemisphere(x, y))
            land_pct = land_points / count * 100
            reasoning.append(f"{land_pct:.0f}% of points are on land in the Eastern Hemisphere")

            if land_pct > 50:
                reasoning.append("Coordinates likely represent WGS84 (EPSG:4326)")
                return _build_detection_result("EPSG:4326", 0.95, reasoning, bounds, count, land_points)
            elif land_pct > 20:
                return _build_detection_result("EPSG:4326", 0.8, reasoning, bounds, count, land_points)
            else:
                reasoning.append("Few land points suggest this is not geographic data")
                return _build_detection_result("planar", 0.6, reasoning, bounds, count, land_points)

        else:
            reasoning.append("Coordinates within global geographic bounds")
            if x_range > 10 or y_range > 10:
                reasoning.append("Spread suggests geographic/continental scale")
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
    """
    if crs in ("unit_grid", "planar"):
        return "unit_grid"
    if crs == "EPSG:4326":
        min_x, min_y, max_x, max_y = bounds
        if -15 <= min_x <= 180 and -60 <= min_y <= 75:
            return "eastern_hemisphere"
    return "unit_grid"