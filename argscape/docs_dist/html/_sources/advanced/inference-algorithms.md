# Inference Algorithms

ARGscape provides access to multiple spatial and temporal inference algorithms for estimating ancestral locations and node times. This guide explains each algorithm, when to use them, and their accuracy vs. speed tradeoffs.

## Overview

Inference algorithms in ARGscape fall into two categories:

| Category | Purpose | Algorithms |
|----------|---------|------------|
| **Spatial** | Infer geographic locations of ancestors | FastGAIA, Geoancestry (GAIA), SPARG, Spacetrees, Midpoint |
| **Temporal** | Infer times (ages) of ancestral nodes | Tsdate |

```{note}
**Availability by interface:**
- **Python API (`argscape.infer()`)**: Midpoint, FastGAIA, GAIA, Tsdate
- **CLI (`argscape infer`)**: Midpoint, FastGAIA, GAIA, SPARG
- **Web App**: All algorithms including SPARG and Spacetrees
```

## Spatial Inference Algorithms

### FastGAIA

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `weight_span` | bool | `True` | Weight by genomic span of edges |
| `weight_branch_length` | bool | `True` | Weight by branch length (time) |

---

### GAIA Quadratic / Linear

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `use_branch_lengths` | bool | `False` | Incorporate branch lengths in parsimony calculation |

---

### SPARG

```{note}
SPARG is available in the **CLI** and **web app** only. It is not exposed in the Python API.
```

#### Output Information

SPARG returns additional information:
- `dispersal_rate`: Estimated dispersal rate matrix
- `num_inferred_locations`: Number of ancestors located

---

### Spacetrees

```{note}
Spacetrees is available in the **web app** only. It is not exposed in the Python API or CLI.
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `time_cutoff` | float | None | Only infer locations for ancestors younger than this |
| `ancestor_times` | list | None | Specific times to locate ancestors (None = all unique node times) |
| `use_importance_sampling` | bool | `True` | Weight trees by coalescent probability |
| `require_common_ancestor` | bool | `True` | Only use trees where all samples coalesce |
| `Ne` | float | None | Effective population size (constant) |
| `Ne_epochs` | list | None | Time boundaries for varying Ne |
| `Nes` | list | None | Ne values for each epoch |
| `use_blup` | bool | `False` | Use BLUP instead of MLE |
| `blup_var` | bool | `False` | Also return variance estimates |

---

### Midpoint Inference

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `weight_by_span` | bool | `True` | Weight by genomic span of edges |
| `weight_branch_length` | bool | `False` | Weight by branch length |

---

## Temporal Inference

### Tsdate

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mutation_rate` | float | `1e-8` | Per-site, per-generation mutation rate |
| `preprocess` | bool | `True` | Apply preprocessing steps |
| `remove_telomeres` | bool | `False` | Remove telomeric regions |
| `minimum_gap` | float | None | Minimum gap size for splitting |
| `split_disjoint` | bool | `True` | Split disjoint trees |

---

## See Also

- {doc}`/python-api/visualize` - Main visualization API
- {doc}`/tutorials/spatial-3d` - 3D spatial visualization tutorial
- {doc}`/cli-reference/argscape-infer` - CLI for running inference
