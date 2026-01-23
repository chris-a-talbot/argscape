# InferResult

The `InferResult` class represents the output of spatial or temporal inference on a tree sequence. It is returned by {doc}`argscape.infer() <inference>`.

```python
import argscape

result = argscape.infer(ts, method="fastgaia")
result.ts      # Tree sequence with inferred locations
result.info    # Metadata dictionary
result.method  # "fastgaia"
```

## Class Definition

```python
@dataclass
class InferResult:
    ts: tskit.TreeSequence  # Tree sequence with inferred data
    info: Dict[str, Any]    # Inference metadata
    method: str             # Method name used
```

## Attributes

### ts

```python
ts: tskit.TreeSequence
```

The tree sequence with inferred data. For spatial methods, internal nodes will have inferred locations stored in their individual metadata. For temporal methods (tsdate), node times will be updated.

**Example:**

```python
result = argscape.infer(ts, method="fastgaia")

# Access inferred tree sequence
inferred_ts = result.ts

# Check a node's inferred location
for node_id in range(inferred_ts.num_nodes):
    node = inferred_ts.node(node_id)
    if node.individual != -1:
        individual = inferred_ts.individual(node.individual)
        print(f"Node {node_id}: location = {individual.location}")
```

### info

```python
info: Dict[str, Any]
```

A dictionary containing method-specific metadata about the inference run. Contents vary by method but typically include:

- `method`: The method name used
- `num_inferred_locations`: Number of nodes with inferred locations (spatial methods)
- `inference_parameters`: Parameters used for the inference

**Example:**

```python
result = argscape.infer(ts, method="fastgaia")
print(result.info)
# {
#     'method': 'fastgaia',
#     'num_inferred_locations': 45,
#     'inference_parameters': {'weight_span': True, 'weight_branch_length': True},
#     ...
# }
```

### method

```python
method: str
```

The name of the inference method that was used. One of:

- Spatial: `"midpoint"`, `"fastgaia"`, `"gaia-quadratic"`, `"gaia-linear"`, `"sparg"`, `"spacetrees"`
- Temporal: `"tsdate"`

## Usage Patterns

### Visualizing Results

```python
import argscape

# Run inference
result = argscape.infer(ts, method="fastgaia")

# Visualize the inferred tree sequence in 3D
viz = argscape.visualize(result.ts, mode="spatial_3d")
viz.show()

# Export visualization
viz.export("inferred_locations.png", dpi=300)
```

### Chaining Inference and Visualization

```python
import argscape

# Infer spatial locations and visualize
result = argscape.infer(ts, method="fastgaia")
argscape.visualize(result.ts, mode="spatial_3d").show()

# Infer temporal information and visualize
result = argscape.infer(ts, method="tsdate", mutation_rate=1e-8)
argscape.visualize(result.ts, temporal_spacing="linear").show()
```

### Saving Inferred Tree Sequences

```python
import argscape

# Run inference
result = argscape.infer(ts, method="fastgaia")

# Save the inferred tree sequence for later use
result.ts.dump("inferred_locations.trees")
```

### Comparing Methods

```python
import argscape

methods = ["midpoint", "fastgaia", "sparg"]
results = {}

for method in methods:
    if argscape.available_methods().get(method, False):
        results[method] = argscape.infer(ts, method=method)
        print(f"{method}: {results[method].info.get('num_inferred_locations', 'N/A')} locations inferred")
```

## See Also

- {doc}`inference` - The argscape.infer() function
- {doc}`visualize` - Visualizing inference results
- {doc}`/advanced/inference-algorithms` - Details on available algorithms
