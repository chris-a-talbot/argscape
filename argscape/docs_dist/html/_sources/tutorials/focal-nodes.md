# Focal Node Selection

This tutorial covers ARGscape's focal node feature for exploring subARGs and ancestor relationships. Learn how to focus on specific nodes through the API or interactive clicks.

## What Are Focal Nodes?

When working with large ARGs, it's often useful to focus on a specific node and its relationships. ARGscape provides two focal views:

- **SubARG View** - Shows a node and all its descendants (the subtree rooted at that node)
- **Ancestors View** - Shows a node and all its ancestors (the path to the root)

Both views simplify the visualization by filtering to only the relevant portion of the graph.

## Using the API

The `visualize()` function accepts `focal_node` and `focal_mode` parameters to initialize the visualization in a focused view.

### SubARG (Descendants)

Focus on a node and its descendants:

```python
import argscape

# Show node 50 and all its descendants
viz = argscape.visualize(
    ts,
    focal_node=50,
    focal_mode="subarg",  # Default mode
)
viz.show()
```

This is useful for examining the genealogy of a specific subset of samples.

### Ancestors View

Focus on a node and its ancestors:

```python
# Show node 10 and all its ancestors
viz = argscape.visualize(
    ts,
    focal_node=10,
    focal_mode="ancestors",
)
viz.show()
```

This is useful for tracing a sample's lineage back to the root.

### Finding Node IDs

To find valid node IDs for your tree sequence:

```python
import tskit

ts = tskit.load("example.trees")

# Sample node IDs
print(f"Samples: {list(ts.samples())}")

# Internal nodes (non-samples)
internal = [n.id for n in ts.nodes() if not n.is_sample()]
print(f"Internal nodes: {internal[:10]}...")  # First 10
```

## Interactive Selection

When viewing a visualization, you can interactively select focal nodes using mouse clicks.

### Click Controls

| Action | Result |
|--------|--------|
| **Left-click** on node | SubARG view (node + descendants) |
| **Right-click** on node | Ancestors view (node + ancestors) |

### View Mode Header

When in a focused view, a header appears at the top showing:
- Current view mode (SubARG or Ancestors)
- The focal node ID
- A button to return to full view

Click "Show Full Graph" to reset to the complete ARG.

## Combining with Other Options

Focal node selection works with all other visualization options:

```python
# Focused view with custom styling
viz = argscape.visualize(
    ts,
    focal_node=42,
    focal_mode="subarg",
    theme="paper",
    edge_opacity=0.8,
    show_sample_ids=True,
)
viz.export("subarg_42.pdf")
```

### With Data Filtering

Focal node selection applies after data filtering:

```python
# First filter by genomic range, then focus
viz = argscape.visualize(
    ts,
    genomic_range=(0, 50000),  # Filter first
    focal_node=25,
    focal_mode="subarg",
)
```

```{note}
If the focal node is filtered out by `genomic_range` or `temporal_range`, the visualization shows the full (filtered) graph.
```

## 3D Spatial Mode

Focal nodes work in both 2D and 3D visualization modes:

```python
# 3D ancestors view
viz = argscape.visualize(
    ts,
    mode="spatial_3d",
    focal_node=5,
    focal_mode="ancestors",
)
viz.show()
```

## Jupyter Notebooks

In notebooks, use `display()` for inline rendering:

```python
# Inline focused view
viz = argscape.visualize(
    ts,
    focal_node=30,
    focal_mode="subarg",
)
viz.display()
```

You can then interactively click nodes to change focus within the embedded visualization.

## Use Cases

### Examining Sample Ancestry

Trace a specific sample's lineage:

```python
# Pick a sample of interest
sample_id = ts.samples()[0]

# View its ancestors
viz = argscape.visualize(
    ts,
    focal_node=sample_id,
    focal_mode="ancestors",
)
viz.show()
```

### Exploring Coalescence Events

Focus on an internal node to see which samples descend from it:

```python
# Find a node near a coalescence event
# (nodes with multiple children)
for node_id in range(ts.num_nodes):
    children = [e.child for e in ts.edges() if e.parent == node_id]
    if len(set(children)) > 1:
        print(f"Node {node_id} has {len(set(children))} children")
        break

# Visualize its subtree
viz = argscape.visualize(ts, focal_node=node_id, focal_mode="subarg")
viz.show()
```

### Comparing Subtrees

Export subtree visualizations for comparison:

```python
# Internal nodes to compare
nodes_of_interest = [45, 67, 89]

for node_id in nodes_of_interest:
    viz = argscape.visualize(
        ts,
        focal_node=node_id,
        focal_mode="subarg",
        theme="paper",
        width=800,
        height=600,
    )
    viz.export(f"subtree_{node_id}.pdf")
```

## API Reference

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `focal_node` | `int \| None` | `None` | Node ID to focus on |
| `focal_mode` | `"subarg" \| "ancestors"` | `"subarg"` | View mode when focal_node is set |

### Behavior

- If `focal_node` is `None`, the full graph is shown
- If `focal_node` is set but the node doesn't exist, the full graph is shown
- Interactive clicks override the initial `focal_node` setting

## Next Steps

- {doc}`first-visualization` - Basic visualization options
- {doc}`filtering-data` - Combine with genomic and temporal filtering
- {doc}`exporting` - Export focused views for publication
