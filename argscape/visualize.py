"""
Main Python API for ARGscape visualizations.

Provides a simple, flat-kwargs interface for creating visualizations:
    viz = argscape.visualize(ts, theme="liquid", max_samples=100)
    viz.show()  # Opens in browser
"""

from __future__ import annotations

import warnings
from pathlib import Path
from typing import TYPE_CHECKING, Literal, Any, Union

if TYPE_CHECKING:
    import tskit
    import geopandas as gpd

from .viz.data import extract_graph, SampleOrderType
from .viz.themes import get_theme, list_themes, customize_theme, TSKIT, Theme
from .spatial import is_spatial_available, require_spatial
from .animation import (
    TemporalAnimation,
    GenomicAnimation,
    AnimationType,
    normalize_animation,
)

# Type alias for shapefile input (avoids importing from shapes.py which needs geopandas)
ShapefileInput = Union[str, Path, "gpd.GeoDataFrame", dict, None]


class VizResult:
    """
    Result of argscape.visualize() - holds rendered visualization.

    Provides methods to display or export the visualization:
    - show(): Open in browser with full interactive UI
    - display(): Render inline in Jupyter notebook
    - export(path): Save to file (PNG, SVG, PDF)
    """

    def __init__(
        self,
        data: dict[str, Any],
        options: dict[str, Any],
        mode: str,
    ) -> None:
        self._data = data
        self._options = options
        self._mode = mode

    def show(self) -> VizResult:
        """Open visualization in default web browser."""
        from .viz.renderer import Renderer
        renderer = Renderer(self._mode, self._data, self._options)
        renderer.open_browser(interactive=True)
        return self

    def display(self) -> VizResult:
        """Display inline in Jupyter notebook."""
        from .viz.renderer import Renderer
        renderer = Renderer(self._mode, self._data, self._options)
        renderer.display_notebook()
        return self

    def export(
        self,
        path: str,
        format: str | None = None,
        dpi: int = 150,
    ) -> VizResult:
        """Export visualization to file."""
        from .viz.renderer import Renderer

        if format is None:
            format = path.rsplit(".", 1)[-1].lower()
            if format not in ("png", "svg", "pdf"):
                format = "png"

        renderer = Renderer(self._mode, self._data, self._options)
        renderer.export_static(path, format=format, dpi=dpi)
        return self


def _generate_unit_grid(size: int = 10) -> dict:
    """Generate a minimal unit grid shape without geopandas.

    This provides a fallback geographic shape when spatial dependencies
    are not installed and the user is in 2D mode.

    Args:
        size: Grid size (creates a size x size grid)

    Returns:
        GeoJSON-like dict with grid lines
    """
    geometries = []
    # Horizontal lines
    for i in range(size + 1):
        geometries.append({
            "type": "LineString",
            "coordinates": [[0, i], [size, i]]
        })
    # Vertical lines
    for i in range(size + 1):
        geometries.append({
            "type": "LineString",
            "coordinates": [[i, 0], [i, size]]
        })
    return {
        "type": "GeometryCollection",
        "name": "Unit Grid",
        "bounds": [0, 0, size, size],
        "crs": None,
        "geometries": geometries,
    }


def _load_shape_if_available(
    shapefile: ShapefileInput,
    geographic_base: str,
    shapefile_crs: str | None,
) -> dict | None:
    """Load geographic shape if spatial dependencies are available.

    This function handles the conditional loading of shapefiles:
    - If user provided a custom shapefile, spatial deps are required
    - If spatial not available, returns a minimal unit_grid shape
    - If spatial is available, uses the full shape loading

    Args:
        shapefile: User-provided shapefile (path, GeoDataFrame, or dict)
        geographic_base: Built-in shape name
        shapefile_crs: Override CRS for shapefile

    Returns:
        Geographic shape dict

    Raises:
        ImportError: If user provided custom shapefile but spatial is unavailable
    """
    # If user provided a custom shapefile, they need spatial dependencies
    if shapefile is not None:
        require_spatial("Custom shapefile loading")

    # If spatial not available, return a minimal unit_grid shape
    if not is_spatial_available():
        return _generate_unit_grid()

    # Spatial is available, use the full shape loading
    from .viz.shapes import load_shape
    return load_shape(
        shapefile=shapefile,
        geographic_base=geographic_base,
        shapefile_crs=shapefile_crs,
    )


def visualize(
    ts: tskit.TreeSequence,
    *,
    # Mode
    mode: Literal["force_graph", "spatial_3d"] = "force_graph",
    # Data selection
    max_samples: int | None = None,
    subset_mode: Literal["even", "random"] = "even",
    subset_seed: int | None = None,
    samples: list[int] | tuple[int, int] | None = None,
    genomic_range: tuple[float, float] | None = None,
    temporal_range: tuple[float, float] | None = None,
    # Focal node (subARG or ancestors view)
    focal_node: int | None = None,
    focal_mode: Literal["subarg", "ancestors"] = "subarg",
    # Appearance
    theme: str | Theme = "liquid",
    width: int = 1200,
    height: int = 800,
    show_controls: bool = False,
    # Custom colors (override theme)
    sample_color: str | None = None,
    internal_color: str | None = None,
    root_color: str | None = None,
    edge_color: str | None = None,
    background_color: str | None = None,
    mutation_color: str | None = None,
    text_color: str | None = None,
    # Nodes
    sample_node_size: int = 8,
    internal_node_size: int = 4,
    root_node_size: int = 6,
    show_sample_ids: bool = False,
    show_internal_ids: bool = False,
    show_root_ids: bool = False,
    color_by_population: bool = False,
    # Edges
    edge_width: float = 1.0,
    edge_opacity: float = 0.6,
    show_edge_labels: bool = False,
    # Mutations
    show_mutations: bool = False,
    mutation_size: int = 6,
    # Layout (2D)
    sample_order: SampleOrderType = "consensus_minlex",
    temporal_spacing: Literal["equal", "linear", "log"] = "equal",
    vertical_spacing: float = 100.0,  # Percentage of available height (0-100)
    horizontal_spacing: float = 100.0,  # Percentage of available width (0-100)
    # Spatial (3D) - Geographic settings
    shapefile: ShapefileInput = None,
    location_crs: str | None = None,
    shapefile_crs: str | None = None,
    geographic_base: Literal["unit_grid", "eastern_hemisphere", "world"] = "unit_grid",
    temporal_multiplier: float = 12.0,
    spatial_multiplier: float = 160.0,
    # Animation
    animation: AnimationType = None,
) -> VizResult:
    """
    Create an ARGscape visualization from a tree sequence.

    This is the main entry point for the visualization API. Returns a
    VizResult that can be displayed in browser, Jupyter, or exported.

    Args:
        ts: A tskit.TreeSequence to visualize
        mode: "force_graph" for 2D or "spatial_3d" for 3D
        max_samples: Maximum samples to include (None for all)
        subset_mode: How to select samples ("even" or "random")
        subset_seed: Random seed for reproducibility
        samples: Direct sample selection - list of sample node IDs, or
                 (start, end) tuple for index range. Overrides max_samples.
        genomic_range: (start, end) genomic positions to filter
        temporal_range: (min_time, max_time) to filter nodes
        focal_node: Node ID to focus on (shows subARG or ancestors)
        focal_mode: "subarg" for descendants or "ancestors" for ancestors
        theme: Color theme ("tskit", "liquid", "grayscale", "paper")
        width: Visualization width in pixels
        height: Visualization height in pixels
        show_controls: Show quick actions bar and legend in notebook display.
            Default False for minimal notebook output; set True for interactive
            controls (theme switcher, statistics panel, export options, etc.).
        sample_color: Override sample node color (hex, e.g., "#ff0000")
        internal_color: Override internal node color
        root_color: Override root node color
        edge_color: Override edge color
        background_color: Override background color
        mutation_color: Override mutation marker color
        text_color: Override text color
        sample_node_size: Size of sample nodes in pixels
        internal_node_size: Size of internal nodes in pixels
        root_node_size: Size of root nodes in pixels
        show_sample_ids: Show labels on sample nodes
        show_internal_ids: Show labels on internal nodes
        show_root_ids: Show labels on root nodes
        color_by_population: Color nodes by their population assignment instead
            of by node type (sample/internal/root). Requires tree sequence to
            have population data assigned to nodes.
        edge_width: Edge line width
        edge_opacity: Edge opacity (0-1)
        show_edge_labels: Show labels on edges
        show_mutations: Show mutation markers
        mutation_size: Size of mutation markers
        sample_order: Sample ordering algorithm
        temporal_spacing: Temporal spacing mode
        vertical_spacing: Vertical spacing percentage (0-100)
        horizontal_spacing: Horizontal spacing percentage (0-100)
        shapefile: Custom shapefile (path, GeoDataFrame, or GeoJSON dict)
        location_crs: CRS of tree sequence locations (e.g., "EPSG:4326")
        shapefile_crs: Override CRS for shapefile if needed
        geographic_base: Built-in shape ("unit_grid", "eastern_hemisphere", "world")
        temporal_multiplier: Z-axis scaling for 3D
        spatial_multiplier: X-Y scaling for 3D
        animation: Animation configuration. Pass a TemporalAnimation for time-based
            layer reveal, GenomicAnimation for sliding window through genome, or a
            list containing both. See animation classes for configuration options.

    Returns:
        VizResult with show(), display(), and export() methods

    Example:
        >>> import argscape
        >>> viz = argscape.visualize(ts, theme="liquid", max_samples=50)
        >>> viz.show()  # Opens in browser

        # With custom shapefile and CRS:
        >>> viz = argscape.visualize(
        ...     ts,
        ...     mode="spatial_3d",
        ...     shapefile="countries.shp",
        ...     location_crs="EPSG:4326"
        ... )
    """
    # Check spatial availability for 3D mode
    if mode == "spatial_3d":
        require_spatial("3D spatial visualization (mode='spatial_3d')")

    # Extract graph data
    graph_data = extract_graph(
        ts,
        max_samples=max_samples,
        subset_mode=subset_mode,
        subset_seed=subset_seed,
        samples=samples,
        genomic_range=genomic_range,
        temporal_range=temporal_range,
        include_mutations=show_mutations,
        sample_order=sample_order,
    )

    # Load geographic shape (handles spatial availability gracefully)
    try:
        geographic_shape = _load_shape_if_available(
            shapefile=shapefile,
            geographic_base=geographic_base,
            shapefile_crs=shapefile_crs,
        )
    except Exception as e:
        warnings.warn(f"Failed to load shapefile, falling back to unit_grid: {e}")
        geographic_shape = _generate_unit_grid()

    # Determine the effective CRS for locations
    # Priority: explicit location_crs > shapefile CRS > None (unit_grid)
    effective_crs = location_crs
    if effective_crs is None:
        effective_crs = geographic_shape.get("crs")

    # Get shape bounds for coordinate normalization reference
    shape_bounds = tuple(geographic_shape.get("bounds", [0, 0, 1, 1]))

    # Transform node coordinates if we have a real CRS
    data = graph_data.to_dict()
    if effective_crs is not None and mode == "spatial_3d":
        data = _transform_coordinates(
            data,
            effective_crs,
            shape_bounds,
        )

    # Add geographic metadata
    data["geographic_shape"] = geographic_shape
    data["metadata"]["location_crs"] = effective_crs
    data["metadata"]["location_bounds"] = list(shape_bounds)

    # Build theme - apply custom color overrides if any are specified
    has_color_overrides = any([
        sample_color, internal_color, root_color, edge_color,
        background_color, mutation_color, text_color
    ])

    if has_color_overrides:
        theme_obj = customize_theme(
            theme,
            sample_color=sample_color,
            internal_color=internal_color,
            root_color=root_color,
            edge_color=edge_color,
            background_color=background_color,
            mutation_color=mutation_color,
            text_color=text_color,
        )
    elif isinstance(theme, Theme):
        theme_obj = theme
    else:
        theme_obj = get_theme(theme)

    options = {
        "mode": mode,
        "theme": theme_obj.to_dict(),
        "width": width,
        "height": height,
        "showControls": show_controls,
        "initialState": {
            "nodes": {
                "sampleSize": sample_node_size,
                "internalSize": internal_node_size,
                "rootSize": root_node_size,
                "showSampleIds": show_sample_ids,
                "showInternalIds": show_internal_ids,
                "showRootIds": show_root_ids,
                "colorByPopulation": color_by_population,
            },
            "edges": {
                "width": edge_width,
                "opacity": edge_opacity,
                "showLabels": show_edge_labels,
            },
            "mutations": {
                "show": show_mutations,
                "size": mutation_size,
            },
            "layout": {
                "sampleOrder": sample_order,
                "temporalSpacing": temporal_spacing,
                "verticalSpacing": vertical_spacing,
                "horizontalSpacing": horizontal_spacing,
            },
            "spatial": {
                "geoBase": geographic_base,
                "temporalMultiplier": temporal_multiplier,
                "spatialMultiplier": spatial_multiplier,
                # Auto-fit flags: True if user didn't explicitly set values
                "autoFitTemporal": temporal_multiplier == 12.0,
                "autoFitSpatial": spatial_multiplier == 160.0,
            },
            "focal": {
                "nodeId": focal_node,
                "mode": focal_mode if focal_node is not None else None,
            },
        },
    }

    # Add animation config if provided
    animation_config = normalize_animation(animation)
    if animation_config:
        options["animation"] = animation_config

    return VizResult(data, options, mode)


def _transform_coordinates(
    data: dict[str, Any],
    source_crs: str,
    shape_bounds: tuple[float, float, float, float],
) -> dict[str, Any]:
    """
    Transform node coordinates based on CRS and shape bounds.

    Stores original coordinates in node metadata and validates bounds.

    Args:
        data: Graph data dict with nodes
        source_crs: Source CRS string (e.g., "EPSG:4326")
        shape_bounds: Bounds of the geographic shape (minx, miny, maxx, maxy)

    Returns:
        Modified data dict with original coordinates stored
    """
    minx, miny, maxx, maxy = shape_bounds
    out_of_bounds_count = 0

    for node in data["nodes"]:
        if node.get("location") is not None:
            loc = node["location"]
            x, y = loc[0], loc[1]

            # Store original coordinates for tooltip display
            node["original_location"] = list(loc)

            # Check if coordinates are within bounds
            if not (minx <= x <= maxx and miny <= y <= maxy):
                out_of_bounds_count += 1

    if out_of_bounds_count > 0:
        total_with_location = sum(
            1 for n in data["nodes"] if n.get("location") is not None
        )
        warnings.warn(
            f"{out_of_bounds_count} of {total_with_location} node locations "
            f"fall outside shapefile bounds. Check CRS settings."
        )

    return data
