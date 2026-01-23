# Python Script Export Feature Design

**Date:** 2026-01-23
**Status:** Approved

## Overview

Add the ability to export the current visualization state as a Python script that recreates the visualization using the `argscape` Python API. This allows users to:
- Reproduce their web app visualizations locally
- Integrate visualizations into Python workflows
- Share reproducible visualization configurations

## User Flow

1. User configures a visualization in the web app (2D or 3D)
2. User opens Export tab in Quick Actions Bar
3. User clicks "Python" button (alongside existing PNG/SVG)
4. Browser downloads `<filename>_viz.py`

## Generated Script Format

```python
"""
ARGscape visualization script
Generated from web app on 2026-01-23

To use: Update the tree sequence path below, then run this script.
"""

import argscape
import tskit

# Load your tree sequence (update this path)
ts = tskit.load("your_file.trees")

# Create visualization with the same settings as the web app
viz = argscape.visualize(
    ts,
    mode="force_graph",
    max_samples=50,
    theme="liquid",
    show_mutations=True,
    # ... only non-default settings included
)

# Display (choose one)
viz.show()       # Opens in browser
# viz.display()  # Jupyter notebook
# viz.export("output.png")  # Save to file
```

## State Mapping

### From TreeSequenceContext
| Web App State | Python API Parameter |
|--------------|---------------------|
| `maxSamples` | `max_samples` |
| `sampleSubsetMode` ("even"/"random") | `subset_mode` |
| `sampleSubsetMode` ("ids") | `samples` (list) |
| `sampleSubsetMode` ("range") | `samples` (tuple) |
| `sampleRange` | `samples` |
| `sampleIds` | `samples` |
| `randomSeed` | `subset_seed` |
| `genomicRange` | `genomic_range` |
| `temporalRange` | `temporal_range` |

### From ColorThemeContext
| Web App State | Python API Parameter |
|--------------|---------------------|
| `theme` | `theme` |
| Custom color overrides | `sample_color`, `edge_color`, etc. |

### From Visualization Component State
| Web App State | Python API Parameter |
|--------------|---------------------|
| View mode | `mode` ("force_graph" or "spatial_3d") |
| Sample node size | `sample_node_size` |
| Internal node size | `internal_node_size` |
| Root node size | `root_node_size` |
| Show sample IDs | `show_sample_ids` |
| Show internal IDs | `show_internal_ids` |
| Show root IDs | `show_root_ids` |
| Edge width | `edge_width` |
| Edge opacity | `edge_opacity` |
| Show mutations | `show_mutations` |
| Mutation size | `mutation_size` |
| Sample order | `sample_order` |
| Temporal spacing | `temporal_spacing` |
| Vertical spacing | `vertical_spacing` |
| Horizontal spacing | `horizontal_spacing` |
| Geographic base (3D) | `geographic_base` |
| Temporal multiplier (3D) | `temporal_multiplier` |
| Spatial multiplier (3D) | `spatial_multiplier` |
| Focal node | `focal_node` |
| Focal mode | `focal_mode` |

## Implementation

### New Files
- `frontend/src/utils/pythonScriptGenerator.ts` - Script generation logic (~150-200 lines)

### Modified Files

**ExportPanel.tsx:**
- Add `onDownloadPython?: () => void` prop
- Add "Python" button in Visualization section

**ArgVisualizationPage.tsx (2D):**
- Gather state from contexts and local component state
- Call `generatePythonScript()` with state
- Trigger file download

**SpatialArg3DVisualizationPage.tsx (3D):**
- Same pattern as 2D
- Include 3D-specific settings (geographic_base, multipliers)

### Code Generation Logic

The `generatePythonScript()` function will:
1. Accept a typed options object with all visualization state
2. Compare each value against Python API defaults
3. Only include parameters that differ from defaults (keeps scripts clean)
4. Format values appropriately (strings quoted, tuples/lists formatted)
5. Return the complete script as a string

### File Download

Standard browser download pattern:
```typescript
const blob = new Blob([scriptContent], { type: 'text/x-python' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `${filename}_viz.py`;
link.click();
URL.revokeObjectURL(url);
```

## Scope

- **No backend changes required** - entirely client-side
- **No new dependencies**
- Estimated: 1 new file, 3 modified files
