"""
Geographic utilities for ARGscape.
"""

from .shapes import (
    get_builtin_shapes,
    process_shapefile,
    generate_grid_outline,
    validate_coordinates_in_shape
)
from .transform import (
    transform_coordinates,
    normalize_coordinates_to_unit_space,
    generate_wgs84_coordinates,
    generate_web_mercator_coordinates,
    generate_unit_grid_coordinates
)
from .tree_sequence import (
    check_spatial_completeness,
    apply_inferred_locations_to_tree_sequence,
    apply_gaia_quadratic_locations_to_tree_sequence,
    apply_gaia_linear_locations_to_tree_sequence,
    apply_custom_locations_to_tree_sequence
)
from .io import load_geojson_file, parse_location_csv
from .fallbacks import get_eastern_hemisphere_outline_fallback

__all__ = [
    # Shapes
    'get_builtin_shapes',
    'process_shapefile',
    'generate_grid_outline',
    'validate_coordinates_in_shape',
    
    # Transform
    'transform_coordinates',
    'normalize_coordinates_to_unit_space',
    'generate_wgs84_coordinates',
    'generate_web_mercator_coordinates',
    'generate_unit_grid_coordinates',
    
    # Tree sequence
    'check_spatial_completeness',
    'apply_inferred_locations_to_tree_sequence',
    'apply_gaia_quadratic_locations_to_tree_sequence',
    'apply_gaia_linear_locations_to_tree_sequence',
    'apply_custom_locations_to_tree_sequence',
    
    # I/O
    'parse_location_csv',
    'load_geojson_file',
    
    # Fallbacks
    'get_eastern_hemisphere_outline_fallback'
] 