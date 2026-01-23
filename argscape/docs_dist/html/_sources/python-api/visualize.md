# argscape.visualize()

The `visualize()` function is the main entry point for creating ARGscape visualizations from tree sequences.

```python
import argscape
import tskit

ts = tskit.load("example.trees")
viz = argscape.visualize(ts, theme="liquid", max_samples=100)
viz.show()  # Opens in browser
```

::::{dropdown} Full Function Signature
:closed:

```python
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
    # Focal node
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
    vertical_spacing: float = 100.0,
    horizontal_spacing: float = 100.0,
    # Spatial (3D)
    shapefile: ShapefileInput = None,
    location_crs: str | None = None,
    shapefile_crs: str | None = None,
    geographic_base: Literal["unit_grid", "eastern_hemisphere", "world"] = "unit_grid",
    temporal_multiplier: float = 12.0,
    spatial_multiplier: float = 160.0,
) -> VizResult
```

::::

## Parameters

### Mode

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `mode`
  - `Literal["force_graph", "spatial_3d"]`
  - `"force_graph"`
  - Visualization mode. `"force_graph"` creates a 2D network visualization with D3.js force-directed layout. `"spatial_3d"` creates a 3D visualization using Three.js, ideal for data with geographic coordinates.
```

### Data Selection

These parameters control which data from the tree sequence is included in the visualization.

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `max_samples`
  - `int | None`
  - `None`
  - Maximum number of samples to include. If `None`, all samples are used. Useful for large tree sequences.
* - `subset_mode`
  - `Literal["even", "random"]`
  - `"even"`
  - How to select samples when `max_samples` is set. `"even"` selects evenly spaced samples; `"random"` selects randomly.
* - `subset_seed`
  - `int | None`
  - `None`
  - Random seed for reproducibility when using `subset_mode="random"`.
* - `genomic_range`
  - `tuple[float, float] | None`
  - `None`
  - Genomic position range `(start, end)` to filter the tree sequence. Only edges within this range are shown.
* - `temporal_range`
  - `tuple[float, float] | None`
  - `None`
  - Time range `(min_time, max_time)` to filter nodes. Sample nodes are always kept regardless of this filter.
* - `samples`
  - `list[int] | tuple[int, int] | None`
  - `None`
  - Direct sample selection. Provide a list of sample node IDs, or a `(start, end)` tuple for index range. Overrides `max_samples` when provided.
```

**Examples:**

```python
# Visualize 50 evenly-spaced samples from a specific genomic region
viz = argscape.visualize(
    ts,
    max_samples=50,
    subset_mode="even",
    genomic_range=(10000, 20000)
)

# Visualize specific samples by node ID
viz = argscape.visualize(ts, samples=[0, 5, 10, 15, 20])

# Visualize a range of samples (indices 10-50)
viz = argscape.visualize(ts, samples=(10, 50))

# Random subset with reproducible seed
viz = argscape.visualize(ts, max_samples=30, subset_mode="random", subset_seed=42)
```

### Focal Node

These parameters control focused views that show a node and its related nodes (descendants or ancestors).

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `focal_node`
  - `int | None`
  - `None`
  - Node ID to focus on. If set, shows only this node and its descendants or ancestors based on `focal_mode`.
* - `focal_mode`
  - `Literal["subarg", "ancestors"]`
  - `"subarg"`
  - View mode when `focal_node` is set. `"subarg"` shows descendants (subtree); `"ancestors"` shows the path to roots.
```

**Example:**

```python
# Show node 42 and all its descendants (subARG)
viz = argscape.visualize(ts, focal_node=42, focal_mode="subarg")

# Show node 10 and all its ancestors
viz = argscape.visualize(ts, focal_node=10, focal_mode="ancestors")
```

```{tip}
You can also select focal nodes interactively: left-click a node for subARG view, right-click for ancestors view. See {doc}`/tutorials/focal-nodes` for details.
```

### Appearance

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `theme`
  - `str | Theme`
  - `"liquid"`
  - Color theme. Can be a name (`"tskit"`, `"liquid"`, `"grayscale"`, `"paper"`) or a custom `Theme` object from `argscape.customize_theme()`. See {doc}`themes` for details.
* - `width`
  - `int`
  - `1200`
  - Visualization width in pixels.
* - `height`
  - `int`
  - `800`
  - Visualization height in pixels.
* - `show_controls`
  - `bool`
  - `False`
  - Show quick actions bar and legend in notebook display. When `True`, enables the interactive control panel with theme switcher, statistics, layout settings, and export options. Always shown in browser via `.show()`.
```

**Example:**

```python
# Create a wide, publication-ready visualization
viz = argscape.visualize(ts, theme="paper", width=1600, height=600)

# Enable interactive controls in Jupyter notebook
viz = argscape.visualize(ts, show_controls=True)
viz.display()  # Shows with quick actions bar
```

### Custom Colors

Override specific colors from the chosen theme. All color values should be hex strings (e.g., `"#ff0000"`).

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `sample_color`
  - `str | None`
  - `None`
  - Override color for sample (leaf) nodes.
* - `internal_color`
  - `str | None`
  - `None`
  - Override color for internal nodes.
* - `root_color`
  - `str | None`
  - `None`
  - Override color for root nodes.
* - `edge_color`
  - `str | None`
  - `None`
  - Override color for edges.
* - `background_color`
  - `str | None`
  - `None`
  - Override background color.
* - `mutation_color`
  - `str | None`
  - `None`
  - Override color for mutation markers.
* - `text_color`
  - `str | None`
  - `None`
  - Override color for text labels.
```

**Example:**

```python
# Use paper theme but with custom sample color
viz = argscape.visualize(
    ts,
    theme="paper",
    sample_color="#e63946",  # Red samples
    edge_color="#457b9d",    # Blue-gray edges
)

# Custom colors on dark background
viz = argscape.visualize(
    ts,
    theme="tskit",
    sample_color="#ffd166",  # Gold samples
    mutation_color="#06d6a0", # Teal mutations
)
```

```{tip}
For more advanced theme customization, see {doc}`themes`.
```

### Nodes

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `sample_node_size`
  - `int`
  - `8`
  - Size of sample nodes in pixels.
* - `internal_node_size`
  - `int`
  - `4`
  - Size of internal (non-sample, non-root) nodes in pixels.
* - `root_node_size`
  - `int`
  - `6`
  - Size of root nodes in pixels.
* - `show_sample_ids`
  - `bool`
  - `False`
  - Whether to display labels on sample nodes.
* - `show_internal_ids`
  - `bool`
  - `False`
  - Whether to display labels on internal nodes.
* - `show_root_ids`
  - `bool`
  - `False`
  - Whether to display labels on root nodes.
* - `color_by_population`
  - `bool`
  - `False`
  - Color nodes by their population assignment instead of by node type (sample/internal/root). Requires tree sequence to have population data assigned to nodes. When enabled, each unique population gets a distinct color using golden-ratio-based hue distribution for visual separation.
```

**Example:**

```python
# Larger sample nodes with visible IDs
viz = argscape.visualize(
    ts,
    sample_node_size=12,
    show_sample_ids=True
)

# Color nodes by population
viz = argscape.visualize(
    ts,
    color_by_population=True,
    show_sample_ids=True
)
```

### Edges

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `edge_width`
  - `float`
  - `1.0`
  - Width of edge lines in pixels.
* - `edge_opacity`
  - `float`
  - `0.6`
  - Opacity of edges (0.0 to 1.0).
* - `show_edge_labels`
  - `bool`
  - `False`
  - Whether to display labels on edges showing genomic span.
```

**Example:**

```python
# Thicker, more visible edges
viz = argscape.visualize(ts, edge_width=2.0, edge_opacity=0.8)
```

### Mutations

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `show_mutations`
  - `bool`
  - `False`
  - Whether to display mutation markers on edges.
* - `mutation_size`
  - `int`
  - `6`
  - Size of mutation markers in pixels.
```

**Example:**

```python
# Display mutations
viz = argscape.visualize(ts, show_mutations=True, mutation_size=8)
```

### Layout (2D Force Graph)

These parameters control the layout of the 2D force graph visualization.

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `sample_order`
  - `SampleOrderType`
  - `"consensus_minlex"`
  - Algorithm for ordering sample nodes horizontally. See sample ordering options below.
* - `temporal_spacing`
  - `Literal["equal", "linear", "log"]`
  - `"equal"`
  - How to space nodes vertically by time. `"equal"` gives equal spacing between time points; `"linear"` is proportional to time; `"log"` uses logarithmic scaling.
* - `vertical_spacing`
  - `float`
  - `100.0`
  - Vertical spacing as percentage of available height (0-100).
* - `horizontal_spacing`
  - `float`
  - `100.0`
  - Horizontal spacing as percentage of available width (0-100).
```

#### Sample Order Options

| Value | Description |
|-------|-------------|
| `"numeric"` | Samples ordered by node ID (0, 1, 2, ...) |
| `"first_minlex"` | Minlex postorder traversal of the first tree |
| `"center_minlex"` | Minlex postorder traversal of the center tree |
| `"consensus_minlex"` | Consensus ordering from multiple trees (default, recommended) |
| `"ancestral_path"` | Orders by ancestral path similarity |
| `"coalescence"` | Orders by coalescence patterns |
| `"dagre"` | Minimizes edge crossings using barycenter heuristic |

**Example:**

```python
# Custom layout with log temporal spacing
viz = argscape.visualize(
    ts,
    sample_order="dagre",
    temporal_spacing="log",
    vertical_spacing=80.0
)
```

### Spatial (3D)

These parameters control the 3D spatial visualization mode. They are only relevant when `mode="spatial_3d"`.

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `shapefile`
  - `ShapefileInput`
  - `None`
  - Custom shapefile for geographic background. Can be a file path (str/Path), GeoDataFrame, or GeoJSON dict.
* - `location_crs`
  - `str | None`
  - `None`
  - Coordinate Reference System of the tree sequence locations (e.g., `"EPSG:4326"` for lat/lon).
* - `shapefile_crs`
  - `str | None`
  - `None`
  - Override CRS for the shapefile if it's missing or incorrect.
* - `geographic_base`
  - `Literal["unit_grid", "eastern_hemisphere", "world"]`
  - `"unit_grid"`
  - Built-in geographic shape to use when no shapefile is provided.
* - `temporal_multiplier`
  - `float`
  - `12.0`
  - Scaling factor for the Z-axis (time dimension) in 3D view.
* - `spatial_multiplier`
  - `float`
  - `160.0`
  - Scaling factor for the X-Y plane (spatial dimensions) in 3D view.
```

#### Geographic Base Options

| Value | Description | CRS |
|-------|-------------|-----|
| `"unit_grid"` | Abstract 10x10 grid for simulated data | None |
| `"eastern_hemisphere"` | Eastern hemisphere map | EPSG:4326 |
| `"world"` | World map | EPSG:4326 |

#### ShapefileInput Type

The `shapefile` parameter accepts several input types:

```python
from pathlib import Path
import geopandas as gpd

# File path (string)
viz = argscape.visualize(ts, mode="spatial_3d", shapefile="countries.shp")

# File path (Path object)
viz = argscape.visualize(ts, mode="spatial_3d", shapefile=Path("countries.shp"))

# GeoDataFrame
gdf = gpd.read_file("countries.shp")
viz = argscape.visualize(ts, mode="spatial_3d", shapefile=gdf)

# GeoJSON dictionary
geojson = {"type": "FeatureCollection", "features": [...]}
viz = argscape.visualize(ts, mode="spatial_3d", shapefile=geojson)
```

**Example:**

```python
# 3D visualization with custom shapefile
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile="europe.shp",
    location_crs="EPSG:4326",
    temporal_multiplier=20.0,
    spatial_multiplier=200.0
)
```

## Returns

Returns a {doc}`VizResult <vizresult>` object with methods to display or export the visualization.

## Raises

- `ValueError` - If an unknown theme name is provided
- `FileNotFoundError` - If a shapefile path doesn't exist
- `ImportError` - If geopandas is required but not installed (for shapefile loading)

## Complete Example

```python
import argscape
import tskit

# Load tree sequence
ts = tskit.load("example.trees")

# Create a fully customized visualization
viz = argscape.visualize(
    ts,
    # Mode
    mode="force_graph",
    # Data selection
    max_samples=100,
    subset_mode="even",
    genomic_range=(0, 50000),
    # Appearance
    theme="paper",
    width=1400,
    height=900,
    # Nodes
    sample_node_size=10,
    internal_node_size=5,
    show_sample_ids=True,
    # Edges
    edge_width=1.5,
    edge_opacity=0.7,
    # Mutations
    show_mutations=True,
    mutation_size=6,
    # Layout
    sample_order="consensus_minlex",
    temporal_spacing="linear",
    vertical_spacing=90.0,
)

# Interactive exploration in browser
viz.show()

# Also display in notebook
viz.display()

# Export multiple formats for publication
viz.export("figures/arg_overview.png", dpi=300)
viz.export("figures/arg_overview.svg")
viz.export("figures/arg_overview.pdf")
```

## See Also

- {doc}`vizresult` - VizResult class methods (show, display, export)
- {doc}`/tutorials/focal-nodes` - Focal node selection for subARGs and ancestors
- {doc}`/tutorials/themes` - Available themes and styling options
- {doc}`/advanced/shapefiles-crs` - Advanced geographic configuration
