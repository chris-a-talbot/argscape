# Visualization

The visualization API provides two main components: the `visualize()` function to create visualizations, and the `VizResult` class to display or export them.

```python
import argscape
import tskit

ts = tskit.load("example.trees")
viz = argscape.visualize(ts, theme="liquid", max_samples=100)
viz.show()  # Opens in browser
```

---

## argscape.visualize()

The `visualize()` function is the main entry point for creating ARGscape visualizations from tree sequences.

### Function Signature

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
    theme: str = "liquid",
    width: int = 1200,
    height: int = 800,
    # Nodes
    sample_node_size: int = 8,
    internal_node_size: int = 4,
    root_node_size: int = 6,
    show_sample_ids: bool = False,
    show_internal_ids: bool = False,
    show_root_ids: bool = False,
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

### Parameters

#### Mode

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

#### Data Selection

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

#### Focal Node

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

#### Appearance

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `theme`
  - `str`
  - `"liquid"`
  - Color theme name. Available: `"tskit"`, `"liquid"`, `"grayscale"`, `"paper"`. See {doc}`/tutorials/themes-styling` for details.
* - `width`
  - `int`
  - `1200`
  - Visualization width in pixels.
* - `height`
  - `int`
  - `800`
  - Visualization height in pixels.
```

**Example:**

```python
# Create a wide, publication-ready visualization
viz = argscape.visualize(ts, theme="paper", width=1600, height=600)
```

#### Nodes

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
```

**Example:**

```python
# Larger sample nodes with visible IDs
viz = argscape.visualize(
    ts,
    sample_node_size=12,
    show_sample_ids=True
)
```

#### Edges

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

#### Mutations

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

#### Layout (2D Force Graph)

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

##### Sample Order Options

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

#### Spatial (3D)

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

##### Geographic Base Options

| Value | Description | CRS |
|-------|-------------|-----|
| `"unit_grid"` | Abstract 10x10 grid for simulated data | None |
| `"eastern_hemisphere"` | Eastern hemisphere map | EPSG:4326 |
| `"world"` | World map | EPSG:4326 |

##### ShapefileInput Type

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

### Returns

Returns a `VizResult` object with methods to display or export the visualization.

### Raises

- `ValueError` - If an unknown theme name is provided
- `FileNotFoundError` - If a shapefile path doesn't exist
- `ImportError` - If geopandas is required but not installed (for shapefile loading)

---

## VizResult

The `VizResult` class represents a rendered ARGscape visualization. It is returned by `argscape.visualize()` and provides methods to display or export the visualization.

```python
class VizResult:
    """
    Result of argscape.visualize() - holds rendered visualization.

    Provides methods to display or export the visualization:
    - show(): Open in browser with full interactive UI
    - display(): Render inline in Jupyter notebook
    - export(path): Save to file (PNG, SVG, PDF)
    """
```

### Methods

#### show()

```python
def show(self) -> VizResult
```

Open the visualization in the default web browser.

This method launches a local server and opens the interactive visualization in your system's default browser. The visualization includes the full ARGscape UI with controls for filtering, zooming, and exploring the data.

**Returns:** `VizResult` - Returns self for method chaining.

**Example:**

```python
viz = argscape.visualize(ts)
viz.show()  # Opens browser with interactive visualization
```

```{note}
The browser window will open automatically. The local server runs in the background and will be cleaned up when the Python process exits.
```

---

#### display()

```python
def display(self) -> VizResult
```

Display the visualization inline in a Jupyter notebook.

This method embeds the interactive visualization directly in the notebook output cell. It uses an HTML iframe to render the React-based visualization.

**Returns:** `VizResult` - Returns self for method chaining.

**Example:**

```python
viz = argscape.visualize(ts, theme="liquid")
viz.display()  # Renders inline in Jupyter
```

```{tip}
For best results in Jupyter, ensure your notebook is running in a browser environment (not VS Code's built-in notebook viewer, which may have limitations with embedded iframes).
```

---

#### export()

```python
def export(
    self,
    path: str,
    format: str | None = None,
    dpi: int = 150,
) -> VizResult
```

Export the visualization to a file.

This method uses Playwright to render the visualization and save it as a static image or vector file. Supported formats are PNG, SVG, and PDF.

**Parameters:**

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `path`
  - `str`
  - (required)
  - Output file path. The format is inferred from the extension if not specified.
* - `format`
  - `str | None`
  - `None`
  - Export format: `"png"`, `"svg"`, or `"pdf"`. If `None`, inferred from file extension.
* - `dpi`
  - `int`
  - `150`
  - Resolution for raster export (PNG). Higher values produce larger, sharper images.
```

**Returns:** `VizResult` - Returns self for method chaining.

**Raises:** Playwright exceptions if browser automation fails.

**Example:**

```python
viz = argscape.visualize(ts, theme="paper")

# Export as PNG (default DPI)
viz.export("figure.png")

# High-resolution PNG for publication
viz.export("figure_hires.png", dpi=300)

# Vector formats for scalable graphics
viz.export("figure.svg")
viz.export("figure.pdf")

# Explicit format override
viz.export("output", format="png")  # Saves as "output" with PNG format
```

```{note}
The `export()` method requires Playwright to be installed. If not already set up, install with:

    pip install playwright
    playwright install chromium
```

---

### Method Chaining

All methods return `self`, enabling fluent method chaining:

```python
# Create, display, and export in one chain
argscape.visualize(ts, theme="liquid") \
    .display() \
    .export("figure.png")

# Show in browser and also export
argscape.visualize(ts, max_samples=50) \
    .show() \
    .export("figure.pdf", dpi=300)
```

---

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

- {doc}`/tutorials/focal-nodes` - Focal node selection for subARGs and ancestors
- {doc}`/tutorials/themes-styling` - Available themes and styling options
- {doc}`/advanced/shapefiles-crs` - Advanced geographic configuration
