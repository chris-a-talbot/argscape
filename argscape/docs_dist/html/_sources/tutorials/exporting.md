# Exporting Visualizations

This tutorial covers ARGscape's export capabilities for creating publication-quality figures. Learn how to export in different formats, control resolution, and optimize for various use cases.

## Basic Export

The `export()` method saves visualizations to files:

```python
import argscape

viz = argscape.visualize(ts)
viz.export("figure.png")
```

The format is automatically detected from the file extension.

## Supported Formats

| Format | Extension | Type | Best For |
|--------|-----------|------|----------|
| PNG | `.png` | Raster | Web, presentations, general use |
| SVG | `.svg` | Vector | Web, scalable graphics |
| PDF | `.pdf` | Vector | Publications, print |

```python
# PNG - raster image
viz.export("figure.png")

# SVG - scalable vector graphics
viz.export("figure.svg")

# PDF - vector for print
viz.export("figure.pdf")
```

## Resolution (DPI)

Control the resolution of PNG exports with the `dpi` parameter:

```python
# Default resolution (150 DPI)
viz.export("figure.png")

# High resolution for publications (300 DPI)
viz.export("figure_hires.png", dpi=300)

# Lower resolution for web (96 DPI)
viz.export("figure_web.png", dpi=96)
```

| DPI | Use Case | File Size |
|-----|----------|-----------|
| 72-96 | Web display, previews | Smallest |
| 150 | Default, presentations | Medium |
| 300 | Print publications | Large |
| 600 | High-quality print | Very large |

```{note}
DPI only affects PNG exports. SVG and PDF are vector formats that scale infinitely.
```

## Explicit Format

Override format detection with the `format` parameter:

```python
# Force PNG format regardless of extension
viz.export("my_figure", format="png")

# Force PDF format
viz.export("output", format="pdf")
```

## Sizing for Publications

Control visualization dimensions before export:

```python
# Standard figure (fits journal column)
viz = argscape.visualize(
    ts,
    width=1000,   # ~3.5 inches at 300 DPI
    height=700,
)
viz.export("figure.pdf", dpi=300)

# Full-page figure
viz = argscape.visualize(
    ts,
    width=2400,   # ~8 inches at 300 DPI
    height=1800,  # ~6 inches at 300 DPI
)
viz.export("figure_full.pdf", dpi=300)
```

### Common Publication Sizes

| Journal Type | Width (px @ 300 DPI) | Inches |
|--------------|---------------------|--------|
| Single column | 900-1050 | 3-3.5" |
| 1.5 column | 1350-1500 | 4.5-5" |
| Full width | 1800-2100 | 6-7" |

```python
# Single column figure
viz = argscape.visualize(ts, width=1050, height=750)

# Full width figure
viz = argscape.visualize(ts, width=2100, height=1200)
```

## Export Workflow

### For Publications

```python
import argscape

# Create visualization with publication settings
viz = argscape.visualize(
    ts,
    # Publication theme
    theme="paper",

    # Appropriate size
    width=1000,
    height=700,

    # Clear styling
    sample_node_size=10,
    edge_width=1.2,
    edge_opacity=0.8,

    # Layout - dagre minimizes edge crossings for cleaner figures
    sample_order="dagre",

    # Data filtering for clarity
    max_samples=50,
)

# Export as PDF (vector, scales perfectly)
viz.export("figure_1.pdf", dpi=300)

# Also export PNG for review
viz.export("figure_1_preview.png", dpi=150)
```

```{tip}
Use `sample_order="dagre"` for publication figures. The dagre algorithm arranges samples to minimize edge crossings, producing cleaner, more readable layouts.
```

### For Presentations

```python
# Full HD slide
viz = argscape.visualize(
    ts,
    theme="tskit",  # Dark theme for slides
    width=1920,
    height=1080,
    sample_node_size=12,  # Larger for visibility
)
viz.export("slide_figure.png", dpi=150)
```

Also consider using the web application to create animations of your ARG through space and time!

### For Web

```python
# Web-optimized
viz = argscape.visualize(
    ts,
    theme="liquid",
    width=1200,
    height=800,
)
viz.export("web_figure.png", dpi=96)
```

## Batch Export

Export visualizations for different data views:

```python
import argscape

# Export different genomic regions
regions = [(0, 25000), (25000, 50000), (50000, 75000)]

for i, (start, end) in enumerate(regions):
    viz = argscape.visualize(
        ts,
        genomic_range=(start, end),
        theme="paper",
    )
    viz.export(f"region_{i}.pdf", dpi=300)
```

## Theme Comparison Exports

```python
import argscape

themes = ["tskit", "liquid", "grayscale", "paper"]

for theme_name in themes:
    viz = argscape.visualize(
        ts,
        theme=theme_name,
        max_samples=30,
    )
    viz.export(f"theme_{theme_name}.png", dpi=150)
```

## Technical Requirements

Export uses Playwright for headless browser rendering:

```bash
# Install Playwright (included in argscape[viz])
pip install argscape[viz]

# Install browser
playwright install chromium
```

If Playwright is not installed, export will raise an `ImportError` with installation instructions.

## Export Quality Tips

### For Clarity

```python
viz = argscape.visualize(
    ts,
    # Reduce clutter
    max_samples=50,
    show_sample_ids=False,

    # Minimize edge crossings
    sample_order="dagre",

    # Clean edges
    edge_opacity=0.7,
    edge_width=1.2,
)
```

### For Print

```python
viz = argscape.visualize(
    ts,
    # Print-friendly theme
    theme="paper",  # or "grayscale"

    # Appropriate line weights
    edge_width=1.5,

    # Visible node sizes
    sample_node_size=10,
    internal_node_size=5,
)
viz.export("print.pdf", dpi=300)
```

### For Accessibility

```python
viz = argscape.visualize(
    ts,
    # Paper theme has distinct colors
    theme="paper",

    # Larger elements
    sample_node_size=12,
    edge_width=2.0,
)
```

## Format Recommendations

| Use Case | Format | DPI | Theme |
|----------|--------|-----|-------|
| Journal main figure | PDF | 300 | paper, grayscale |
| Journal supplement | PNG | 300 | paper, grayscale |
| Presentation | PNG | 150 | tskit, liquid |
| Web display | PNG | 96 | liquid |
| Poster | PDF | 300+ | paper |
| Archive/scalable | SVG | N/A | any |

## Export as Python Script

The web app can export your current visualization settings as a Python script. This bridges the gap between interactive exploration and reproducible code.

### From the Web App

1. Configure your visualization in the web app (filters, theme, styling, etc.)
2. Open the **Export** tab in the Quick Actions Bar
3. Click **Python** to download a script

The generated script captures your current settings:

```python
"""
ARGscape visualization script
Generated from web app on 2024-01-23
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
    sample_order="dagre",
)

# Display (choose one)
viz.show()       # Opens in browser
# viz.display()  # Jupyter notebook
# viz.export("output.png")  # Save to file
```

### Use Cases

- **Reproducibility**: Save the exact parameters used for a figure
- **Batch processing**: Use the web app to prototype, then script for multiple files
- **Documentation**: Include visualization code in research repositories
- **Collaboration**: Share visualization settings with colleagues

### What's Captured

The script includes all non-default settings:

| Category | Parameters |
|----------|------------|
| Mode | 2D force graph or 3D spatial |
| Data selection | max_samples, genomic_range, temporal_range |
| Theme | theme name |
| Nodes | sizes, show IDs |
| Edges | width, opacity |
| Mutations | visibility, size |
| Layout (2D) | sample_order, spacing |
| Spatial (3D) | geographic_base, multipliers |

```{tip}
The script only includes parameters that differ from defaults, keeping the code clean and readable.
```

## Troubleshooting

### Low quality output

- Increase `dpi` for PNG
- Use PDF or SVG for print
- Ensure source dimensions are adequate

### Playwright errors

```bash
# Reinstall browsers
playwright install chromium

# Or install specific version
pip install playwright --upgrade
playwright install
```

## Next Steps

- {doc}`first-visualization` - Visualization options for better exports
- {doc}`themes` - Choose the right theme for your use case
- {doc}`filtering-data` - Simplify data before export
