# argscape.infer()

The `infer()` function provides a unified Python interface for running spatial and temporal inference on tree sequences.

```{note}
Inference requires `argscape[spatial]`. Install with:
`pip install argscape[spatial]`
```

## Quick Start

```python
import argscape
import tskit

# Load a tree sequence with sample locations
ts = tskit.load("example.trees")

# Run inference
result = argscape.infer(ts, method="fastgaia")

# Access results
result.ts      # Tree sequence with inferred locations
result.info    # Metadata dictionary
result.method  # "fastgaia"
```

::::{dropdown} Full Function Signature
:closed:

```python
def infer(
    ts: tskit.TreeSequence,
    method: str = "fastgaia",
    # FastGAIA options
    weight_span: bool = True,
    weight_branch_length: bool = True,
    # Midpoint options
    weight_by_span: bool | None = None,
    # GAIA options
    use_branch_lengths: bool = False,
    # Tsdate options
    mutation_rate: float = 1e-8,
    progress: bool = True,
    preprocess: bool = True,
    remove_telomeres: bool = False,
    minimum_gap: float | None = None,
    split_disjoint: bool = True,
    filter_populations: bool = False,
    filter_individuals: bool = False,
    filter_sites: bool = False,
) -> InferResult
```

::::

## Available Methods

Check which methods are available on your system:

```python
>>> argscape.available_methods()
{
    'midpoint': True,
    'fastgaia': True,
    'gaia-quadratic': True,
    'gaia-linear': True,
    'tsdate': True
}
```

### Spatial Methods

| Method | Description | Package Required |
|--------|-------------|------------------|
| `midpoint` | Weighted midpoint of child locations | None (always available) |
| `fastgaia` | Fast GAIA algorithm | `fastgaia` |
| `gaia-quadratic` | GAIA with quadratic cost | `geoancestry` |
| `gaia-linear` | GAIA with linear cost | `geoancestry` |

### Temporal Methods

| Method | Description | Package Required |
|--------|-------------|------------------|
| `tsdate` | Date internal nodes | `tsdate` |

```{note}
SPARG and Spacetrees are available in the [ARGscape web application](https://argscape.com) but are not exposed in the Python API.
```

## Method-Specific Options

### Midpoint

Fast, simple inference using weighted midpoints of child locations.

```python
result = argscape.infer(
    ts,
    method="midpoint",
    weight_by_span=True,        # Weight by edge genomic span
    weight_branch_length=False,  # Weight by branch length
)
```

### FastGAIA

Fast implementation of the GAIA algorithm.

```python
result = argscape.infer(
    ts,
    method="fastgaia",
    weight_span=True,           # Weight by edge span
    weight_branch_length=True,  # Weight by branch length
)
```

### GAIA (Quadratic/Linear)

Parsimony-based reconstruction with different cost functions.

```python
# Quadratic cost
result = argscape.infer(
    ts,
    method="gaia-quadratic",
    use_branch_lengths=False,  # Use branch lengths in parsimony
)

# Linear cost
result = argscape.infer(
    ts,
    method="gaia-linear",
    use_branch_lengths=False,
)
```

### Tsdate

Temporal inference using mutation-based dating.

```python
result = argscape.infer(
    ts,
    method="tsdate",
    mutation_rate=1e-8,
    progress=True,
    preprocess=True,
    remove_telomeres=False,
    split_disjoint=True,
)
```

```{note}
Tsdate requires the tree sequence to have mutations (at least 3).
```

## Returns

Returns an {doc}`InferResult <inferresult>` object containing:

- `ts`: Tree sequence with inferred data
- `info`: Dictionary of inference metadata
- `method`: The method name used

## Input Requirements

### Spatial Methods

All spatial methods require sample nodes to have locations in their individual metadata:

```python
# Check if your tree sequence has locations
for sample_id in ts.samples():
    node = ts.node(sample_id)
    if node.individual != -1:
        individual = ts.individual(node.individual)
        print(f"Sample {sample_id}: location = {individual.location}")
```

### Tsdate

Tsdate requires mutations in the tree sequence:

```python
print(f"Mutations: {ts.num_mutations}")  # Must be >= 3
```

## Combining with Visualization

```python
import argscape

# Run inference
result = argscape.infer(ts, method="fastgaia")

# Visualize the result
viz = argscape.visualize(result.ts, mode="spatial_3d")
viz.show()

# Export
viz.export("inferred_locations.png")
```

## See Also

- {doc}`inferresult` - InferResult class details
- {doc}`/cli-reference/argscape-infer` - CLI interface for inference
- {doc}`visualize` - Visualization API
- {doc}`/advanced/inference-algorithms` - Algorithm details
