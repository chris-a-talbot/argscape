# Performance Optimization Guide

This guide covers strategies for optimizing ARGscape performance when working with large tree sequences, including sample limits, subsetting strategies, filtering, and choosing between the web app and Python API.

## Understanding Performance Constraints

Coming soon...

## Sample Limits with `max_samples`

The most effective way to visualize large tree sequences is to limit the number of samples.

### How It Works

When `max_samples` is set, ARGscape:
1. Selects a subset of samples using the specified `subset_mode`
2. Calls `ts.simplify()` to create a smaller tree sequence
3. Extracts the graph from the simplified version

### Subset Modes

| Mode | Description | Best For |
|------|-------------|----------|
| `"even"` | Evenly spaced samples (0, k, 2k, ...) | Representative overview |
| `"random"` | Random selection | Unbiased sampling |

### Direct Sample Selection

For precise control, use the `samples` parameter instead of `max_samples`:

```python
# Select specific samples by node ID
viz = argscape.visualize(ts, samples=[0, 5, 10, 15, 20, 25])

# Select a range of samples by index
viz = argscape.visualize(ts, samples=(0, 50))  # First 50 samples
```

This is useful when:
- Samples are grouped by population or phenotype
- You need to track specific individuals
- You want consistent sample selection across analyses

### Examples

```python
import argscape

# Large tree sequence with 5000 samples
ts = tskit.load("large_dataset.trees")
print(f"Original: {ts.num_samples} samples, {ts.num_nodes} nodes")

# Visualize 100 evenly-spaced samples
viz = argscape.visualize(
    ts,
    max_samples=100,
    subset_mode="even"
)

# Random subset (reproducible with seed)
viz = argscape.visualize(
    ts,
    max_samples=100,
    subset_mode="random",
    subset_seed=42
)
```

### Choosing Sample Count

| Sample Count | Rendering Speed | Visual Clarity | Use Case |
|--------------|-----------------|----------------|----------|
| 10-50 | Instant | Excellent | Detailed inspection |
| 50-100 | Fast | Very good | General exploration |
| 100-200 | Moderate | Good | Overview of structure |
| 200-500+ | Slow | Crowded | Maximum detail |

## Genomic Range Filtering

Focus on specific genomic regions to reduce complexity.

### How It Works

The `genomic_range` parameter:
1. Calls `ts.keep_intervals([[start, end]])`
2. Trims the tree sequence to the specified region
3. Results in fewer trees and potentially fewer nodes

### Examples

```python
# Visualize only the first 10kb
viz = argscape.visualize(
    ts,
    genomic_range=(0, 10000)
)

# Focus on a specific gene region
viz = argscape.visualize(
    ts,
    genomic_range=(150000, 200000),
    max_samples=100
)

# Combine with sample limiting for very large sequences
viz = argscape.visualize(
    ts,
    max_samples=50,
    genomic_range=(0, 100000)
)
```

### When to Use

- Tree sequence has many local trees (>100)
- Investigating a specific genomic region
- Reducing overall complexity

## Temporal Range Filtering

Filter by node times to focus on specific time periods.

### How It Works

The `temporal_range` parameter:
1. Keeps all sample nodes regardless of time
2. Removes internal nodes outside the time range
3. Removes edges connecting to removed nodes

### Examples

```python
# Focus on recent history (last 100 generations)
viz = argscape.visualize(
    ts,
    temporal_range=(0, 100)
)

# Examine deep ancestry (1000-5000 generations ago)
viz = argscape.visualize(
    ts,
    temporal_range=(1000, 5000)
)
```

### Combining Filters

```python
# Combined filtering for complex datasets
viz = argscape.visualize(
    ts,
    max_samples=100,
    subset_mode="even",
    genomic_range=(0, 50000),
    temporal_range=(0, 500)
)
```

## Memory Considerations

### Browser Memory Limits

Modern browsers typically allow 1-4 GB of JavaScript heap memory. ARGscape memory usage depends on:

| Factor | Memory Impact |
|--------|---------------|
| Node count | ~100 bytes per node |
| Edge count | ~80 bytes per edge |
| Mutation data | ~200 bytes per mutation (when shown) |
| Rendering buffers | ~10 MB base + proportional to visual elements |

### Estimating Memory Usage

```python
# Check tree sequence size before visualizing
ts = tskit.load("data.trees")
print(f"Samples: {ts.num_samples}")
print(f"Nodes: {ts.num_nodes}")
print(f"Edges: {ts.num_edges}")
print(f"Trees: {ts.num_trees}")
print(f"Mutations: {ts.num_mutations}")

# Rough memory estimate (bytes)
estimated_memory = (
    ts.num_nodes * 100 +
    ts.num_edges * 80 +
    ts.num_mutations * 200 +
    10_000_000  # Base rendering overhead
)
print(f"Estimated memory: {estimated_memory / 1_000_000:.1f} MB")
```

### When Memory Is Exceeded

Symptoms:
- Browser tab crashes
- Visualization freezes during loading
- "Out of memory" console errors

Solutions:
1. Reduce `max_samples`
2. Apply `genomic_range` filter
3. Use the Python API for static exports

## Web App vs. Python API

### When to Use the Web App

The web app at [argscape.com](https://argscape.com) is best for:

- Quick exploration of small to medium datasets
- Interactive analysis with dynamic filtering
- Sharing visualizations (Railway links)
- Users without Python environment

**Limits**: 50 MB files, 500 samples, 10 Mb sequences

### When to Use the Python API

The Python API (`argscape.visualize()`) is best for:

- Large datasets exceeding web limits
- Automated pipelines and batch processing
- Publication-quality exports
- Local processing without upload

```python
import argscape

# Process large dataset locally
ts = tskit.load("very_large.trees")  # 100MB file

# Subset and visualize
viz = argscape.visualize(
    ts,
    max_samples=200,
    genomic_range=(0, 100000)
)

# Export to file (no browser rendering limits)
viz.export("figure.png", dpi=300)
viz.export("figure.pdf")
```

### Comparison Table

| Aspect | Web App | Python API |
|--------|---------|------------|
| Max file size | 50 MB | Unlimited (local memory) |
| Max samples | 500 | Limited by browser memory |
| Interactive exploration | Yes | Yes (with `.show()`) |
| Batch processing | No | Yes |
| Jupyter integration | Via upload | Native (`.display()`) |
| Static export | Limited | Full control |
| Requires Python | No | Yes |

## Layout Algorithm Performance

The `sample_order` parameter affects both layout quality and computation time.

### Algorithm Comparison

| Algorithm | Speed | Edge Crossings | Best For |
|-----------|-------|----------------|----------|
| `"dagre"` | Fastest | Minimal | Publication figures, clean layouts |
| `"consensus_minlex"` | Fast | Few | General use (default) |
| `"numeric"` | Fast | Many | Quick previews |
| `"first_minlex"` | Fast | Variable | Single-tree focus |
| `"ancestral_path"` | Moderate | Few | Ancestry-focused analysis |

### Using Dagre for Performance

The `dagre` algorithm uses a barycenter heuristic to minimize edge crossings. It's both fast and produces clean layouts, making it ideal for publication figures:

```python
# Fast, clean layout with dagre
viz = argscape.visualize(
    ts,
    sample_order="dagre",
    max_samples=100
)
```

For large datasets, `dagre` can be significantly faster than algorithms like `ancestral_path` while still producing visually clear results.

## Browser Rendering Optimization

### Reducing Visual Complexity

```python
# Minimal rendering for performance
viz = argscape.visualize(
    ts,
    max_samples=100,
    # Hide labels (significant performance impact)
    show_sample_ids=False,
    show_internal_ids=False,
    show_root_ids=False,
    # Hide mutations if not needed
    show_mutations=False,
    # Hide edge labels
    show_edge_labels=False
)
```

### 3D Spatial Performance

3D rendering with Three.js/Deck.GL has additional considerations:

```python
# Optimized 3D visualization
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    max_samples=100,  # Fewer samples for 3D
    # Smaller node sizes render faster
    sample_node_size=6,
    internal_node_size=3,
    # Lower edge opacity reduces blend calculations
    edge_opacity=0.4
)
```

### Shapefile Performance

Complex shapefiles slow 3D rendering:

```python
import geopandas as gpd

# Simplify shapefile before use
gdf = gpd.read_file("detailed_map.shp")
gdf["geometry"] = gdf.geometry.simplify(0.01)  # Degrees for WGS84

viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    shapefile=gdf  # Simplified version
)
```

## Batch Processing Strategies

### Processing Multiple Datasets

```python
import argscape
from pathlib import Path

# Process all tree sequences in a directory
input_dir = Path("tree_sequences/")
output_dir = Path("visualizations/")

for ts_file in input_dir.glob("*.trees"):
    ts = tskit.load(ts_file)

    # Apply consistent subsetting
    viz = argscape.visualize(
        ts,
        max_samples=min(100, ts.num_samples),
        theme="paper"
    )

    # Export with matching filename
    output_path = output_dir / f"{ts_file.stem}.png"
    viz.export(str(output_path), dpi=150)
    print(f"Exported: {output_path}")
```

### Parameter Sweeps

```python
import argscape

# Compare different sample counts
for n_samples in [25, 50, 100, 200]:
    viz = argscape.visualize(
        ts,
        max_samples=n_samples,
        subset_seed=42  # Reproducible subset
    )
    viz.export(f"comparison_{n_samples}_samples.png")
```

## Common Bottlenecks

| Bottleneck | Symptom | Solution |
|------------|---------|----------|
| Large node count | Slow data extraction | Reduce `max_samples` |
| Many edges | Slow rendering | Apply `genomic_range` |
| Complex shapefiles | Slow 3D init | Simplify geometry |
| Many mutations | Memory issues | Set `show_mutations=False` |
| Label rendering | Slow interaction | Disable ID labels |
| Slow layout algorithm | Long initial render | Use `sample_order="dagre"` |

## Recommended Configurations

### Quick Exploration

```python
viz = argscape.visualize(
    ts,
    max_samples=50,
    show_sample_ids=True,
    theme="liquid"
)
viz.show()
```

### Publication Figure

```python
viz = argscape.visualize(
    ts,
    max_samples=100,
    sample_order="dagre",  # Minimizes edge crossings
    theme="paper",
    width=1400,
    height=800,
    edge_width=1.5,
    edge_opacity=0.7
)
viz.export("figure.pdf", dpi=300)
```

### Large Dataset Overview

```python
viz = argscape.visualize(
    ts,
    max_samples=200,
    subset_mode="even",
    show_sample_ids=False,
    show_internal_ids=False,
    edge_opacity=0.4
)
viz.show()
```

### 3D Geographic

```python
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    max_samples=100,
    geographic_base="eastern_hemisphere",
    temporal_multiplier=15.0,
    spatial_multiplier=180.0
)
viz.show()
```

## See Also

- {doc}`/python-api/visualize` - Full parameter reference
- {doc}`shapefiles-crs` - Geographic configuration
- {doc}`inference-algorithms` - Algorithm performance characteristics
