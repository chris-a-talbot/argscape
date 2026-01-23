# Python API Overview

ARGscape provides a Python API for visualizing and analyzing tree sequences directly from your scripts and Jupyter notebooks.

## Installation

```bash
# Basic installation (2D visualization only)
pip install argscape

# Add 3D visualization spatial inference
pip install argscape[spatial]

# Full installation - adds static image export and benchmarking (requires playwright)
pip install argscape[all]
```

## Quick Start

### Visualization

```python
import argscape
import msprime

# Create or load a tree sequence
ts = msprime.sim_ancestry(samples=20, sequence_length=10000, random_seed=42)

# Visualize
viz = argscape.visualize(ts)
viz.show()       # Open in browser
viz.display()    # Render in Jupyter notebook
viz.export("figure.png")  # Export to file (requires playwright)
```

### Spatial Inference

```python
import argscape

# Run spatial inference (requires sample locations)
result = argscape.infer(ts, method="fastgaia")

# Visualize inferred locations in 3D
argscape.visualize(result.ts, mode="spatial_3d").show()
```

## Core Functions

| Function | Description |
|----------|-------------|
| {doc}`argscape.visualize() <visualize>` | Create interactive visualizations from tree sequences |
| {doc}`argscape.infer() <inference>` | Run spatial or temporal inference |
| `argscape.available_methods()` | Check which inference methods are available |

## Core Classes

| Class | Description |
|-------|-------------|
| {doc}`VizResult <vizresult>` | Visualization result with show/display/export methods |
| {doc}`InferResult <inferresult>` | Inference result containing tree sequence and metadata |
| {doc}`TemporalAnimation <animations>` | Configure time-based animations |
| {doc}`GenomicAnimation <animations>` | Configure genomic sliding window animations |

## Visualization Modes

ARGscape supports two visualization modes:

### 2D Force Graph (`mode="force_graph"`)

Default mode. Creates an interactive network visualization with:
- Nodes positioned by time (vertical) and sample order (horizontal)
- Drag-and-drop node positioning
- Click interactions for focal node selection
- Mutation markers

```python
viz = argscape.visualize(ts, mode="force_graph")
```

### 3D Spatial (`mode="spatial_3d"`)

For tree sequences with geographic coordinates:
- X-Y plane shows spatial locations
- Z-axis shows time
- Geographic shapefile backgrounds
- Camera controls for rotation and zoom

```python
viz = argscape.visualize(ts, mode="spatial_3d")
```

## Themes

Four built-in themes are available:

| Theme | Description |
|-------|-------------|
| `"liquid"` | Default. Light theme with glassmorphism effects |
| `"tskit"` | Dark theme with cyan/green accents |
| `"grayscale"` | Black and white for publications |
| `"paper"` | Optimized for print figures |

```python
viz = argscape.visualize(ts, theme="paper")
```

See {doc}`/tutorials/themes` for detailed theme information.

## Animations

Bring your visualizations to life with animated playback:

```python
from argscape import TemporalAnimation, GenomicAnimation

# Temporal: watch lineages coalesce over time
viz = argscape.visualize(ts, animation=TemporalAnimation(mode="glide", rate=1.0))

# Genomic: slide through local trees across the genome
viz = argscape.visualize(ts, animation=GenomicAnimation(window=10000, overlap=0.5))
```

| Animation Type | Description |
|----------------|-------------|
| `TemporalAnimation` | Reveals nodes through time (samples→roots or roots→samples) |
| `GenomicAnimation` | Slides a window across the genome showing local tree variation |

See {doc}`animations` for detailed animation options and examples.

## Workflow Examples

### From Web App to Python

Use the web app to interactively explore your data, then export settings as a Python script:

1. Configure visualization in web app
2. Click **Export** → **Python** to download script
3. Run the script for batch processing or reproducibility

```python
# Generated script captures your web app settings
viz = argscape.visualize(
    ts,
    theme="liquid",
    max_samples=50,
    sample_order="dagre",
    show_mutations=True,
)
viz.export("figure.png")
```

### Publication Figure

```python
import argscape

viz = argscape.visualize(
    ts,
    theme="paper",
    width=1000,
    height=700,
    sample_order="dagre",
    show_sample_ids=True,
    edge_width=1.5,
)
viz.export("figure.pdf", dpi=300)
```

### Explore Specific Lineage

```python
import argscape

# Focus on ancestors of a sample
viz = argscape.visualize(
    ts,
    focal_node=5,
    focal_mode="ancestors",
)
viz.show()
```

### Inference and Visualization

```python
import argscape

# Infer locations and visualize
result = argscape.infer(ts, method="fastgaia")
argscape.visualize(
    result.ts,
    mode="spatial_3d",
    shapefile="countries.shp",
    location_crs="EPSG:4326",
).show()
```

### Animated Presentation

```python
import argscape
from argscape import TemporalAnimation

# Create an animated visualization for presentations
viz = argscape.visualize(
    ts,
    theme="tskit",
    animation=TemporalAnimation(mode="glide", rate=0.5),
    sample_node_size=12,
    show_sample_ids=True,
)
viz.show()  # Play button appears in visualization
```

## API Reference

- {doc}`visualize` - Create visualizations from tree sequences
- {doc}`vizresult` - Display and export visualizations
- {doc}`animations` - Configure animated playback
- {doc}`inference` - Run spatial/temporal inference
- {doc}`inferresult` - Access inference results
