# Animations

ARGscape supports animated visualizations that bring tree sequences to life. Animations can reveal temporal structure, show how lineages coalesce over time, or demonstrate how the ARG changes across the genome.

## Overview

Two types of animations are available:

| Animation Type | Description | Use Case |
|----------------|-------------|----------|
| **Temporal** | Animates through time layers | Visualize coalescence, show ancestry accumulation |
| **Genomic** | Slides a window across the genome | Show local tree variation, explore recombination |

Animations are configured via the `animation` parameter in `argscape.visualize()` and controlled interactively via a play button in the visualization.

## Quick Start

```python
import argscape
from argscape import TemporalAnimation, GenomicAnimation

# Temporal animation - watch lineages coalesce
viz = argscape.visualize(ts, animation=TemporalAnimation(mode="glide"))
viz.show()

# Genomic animation - slide through local trees
viz = argscape.visualize(ts, animation=GenomicAnimation(window=10000, overlap=0.5))
viz.show()
```

## Temporal Animation

Temporal animations reveal the time structure of the ARG by progressively showing or hiding nodes based on their time values.

### Import

```python
from argscape import TemporalAnimation
```

### Parameters

```{list-table}
:header-rows: 1
:widths: 15 25 15 45

* - Parameter
  - Type
  - Default
  - Description
* - `mode`
  - `Literal["hide", "glide", "root-to-samples"]`
  - `"glide"`
  - Animation mode (see below)
* - `rate`
  - `float`
  - `1.0`
  - Speed in time layers per second
```

### Animation Modes

#### `"glide"` (Default)

Smoothly expands the visible time range from samples upward toward roots. Nodes appear as the temporal filter expands to include them.

```python
# Glide from samples to roots at 2 layers per second
viz = argscape.visualize(
    ts,
    animation=TemporalAnimation(mode="glide", rate=2.0)
)
```

**Best for:** Showing how sample lineages connect through coalescence events.

#### `"root-to-samples"`

The reverse of glide - starts at the roots and expands downward toward samples. Useful for showing how ancestral lineages diversify.

```python
# Reveal from roots down to samples
viz = argscape.visualize(
    ts,
    animation=TemporalAnimation(mode="root-to-samples", rate=1.5)
)
```

**Best for:** Showing diversification from common ancestors.

#### `"hide"`

Similar to glide, but nodes outside the current time range are hidden rather than dimmed. Creates a cleaner animation with nodes appearing as they enter the visible range.

```python
# Hide nodes outside visible range
viz = argscape.visualize(
    ts,
    animation=TemporalAnimation(mode="hide", rate=1.0)
)
```

**Best for:** Cleaner presentations, focusing attention on visible nodes.

## Genomic Animation

Genomic animations slide a window across the sequence, showing how the local tree structure changes due to recombination.

### Import

```python
from argscape import GenomicAnimation
```

### Parameters

```{list-table}
:header-rows: 1
:widths: 15 25 15 45

* - Parameter
  - Type
  - Default
  - Description
* - `window`
  - `int | None`
  - `None`
  - Window size in base pairs
* - `window_trees`
  - `int | None`
  - `None`
  - Window size in number of trees (alternative to `window`)
* - `step`
  - `int | None`
  - `None`
  - Step size per frame (in same units as window)
* - `overlap`
  - `float | None`
  - `None`
  - Overlap fraction (0.0-1.0) between windows (alternative to `step`)
* - `rate`
  - `float`
  - `1.0`
  - Speed in steps per second
```

### Window Size Options

You can specify window size in two ways:

**Base pairs (`window`):** Fixed genomic length regardless of tree density.

```python
# 10kb window
animation = GenomicAnimation(window=10000)
```

**Tree count (`window_trees`):** Fixed number of local trees, adapts to recombination rate.

```python
# Show 5 trees at a time
animation = GenomicAnimation(window_trees=5)
```

```{note}
Specify either `window` or `window_trees`, not both. If neither is specified, defaults to 1/10th of sequence length.
```

### Step/Overlap Options

Control how the window advances:

**Step size (`step`):** Explicit step in base pairs or trees.

```python
# Move 2kb per frame
animation = GenomicAnimation(window=10000, step=2000)
```

**Overlap fraction (`overlap`):** Fraction of window that overlaps with previous position.

```python
# 50% overlap (smoother animation)
animation = GenomicAnimation(window=10000, overlap=0.5)

# 75% overlap (very smooth, slower progress)
animation = GenomicAnimation(window=10000, overlap=0.75)
```

```{note}
Specify either `step` or `overlap`, not both. If neither is specified, windows are non-overlapping (equivalent to `overlap=0`).
```

## Animation Controls

### In Browser (`.show()`)

When viewing in a browser, the animation controls panel provides:

- **Play/Pause button:** Start or pause the animation
- **Animation type toggle:** Switch between temporal and genomic (when both configured)
- **Mode selection:** Choose temporal mode (hide/glide/root-to-samples)
- **Speed slider:** Adjust playback rate in real-time
- **Progress bar:** Shows current position and allows seeking
- **Reset button:** Return to beginning

### In Notebooks (`.display()`)

In Jupyter notebooks:

- **With `show_controls=False` (default):** Only the play button is visible
- **With `show_controls=True`:** Full animation panel is available

```python
# Minimal - just play button
viz = argscape.visualize(ts, animation=TemporalAnimation())
viz.display()

# Full controls
viz = argscape.visualize(ts, animation=TemporalAnimation(), show_controls=True)
viz.display()
```

## API Reference

### TemporalAnimation

```python
@dataclass
class TemporalAnimation:
    mode: Literal["hide", "glide", "root-to-samples"] = "glide"
    rate: float = 1.0
```

### GenomicAnimation

```python
@dataclass
class GenomicAnimation:
    window: int | None = None
    window_trees: int | None = None
    step: int | None = None
    overlap: float | None = None
    rate: float = 1.0
```

## See Also

- {doc}`visualize` - Full `visualize()` parameter reference
- {doc}`vizresult` - Display and export methods
- {doc}`/tutorials/filtering-data` - Manual temporal/genomic filtering
