# Custom Themes

This tutorial explains ARGscape's built-in color themes. Themes control the visual appearance of your visualizations, from node colors to backgrounds and text.

## Overview

ARGscape includes four carefully designed themes:

| Theme | Style | Best For |
|-------|-------|----------|
| `tskit` | Dark with cyan/green accents | Default ARGscape look, presentations |
| `liquid` | Light with glass effects | General use, web display |
| `grayscale` | Black and white | Journal publications |
| `paper` | High contrast colors | Print publications, color figures |

## Using Themes

Specify a theme with the `theme` parameter:

```python
import argscape

viz = argscape.visualize(ts, theme="liquid")
viz.show()
```

## Theme Gallery

### tskit Theme

The original ARGscape dark theme with signature cyan and green accents.

```python
viz = argscape.visualize(ts, theme="tskit")
```

**Colors:**
- Background: Dark teal (`#03303E`)
- Sample nodes: Pale green (`#14E2A8`)
- Internal nodes: Light blue (`#60A0B7`)
- Root nodes: Cyan (`#38BDF8`)
- Edges: Gray with 0.4 opacity
- Mutations: Indigo (`#4F46E5`)

**Best for:**
- Presentations (high contrast on dark background)
- Screen viewing
- The classic ARGscape aesthetic

### liquid Theme

A light, Apple-inspired theme with subtle glass effects. This is the default theme.

```python
viz = argscape.visualize(ts, theme="liquid")
```

**Colors:**
- Background: Apple light gray (`#f5f5f7`)
- Sample nodes: ARGscape green (`#14E2A8`)
- Internal nodes: Slate (`#94A3B8`)
- Root nodes: ARGscape green (`#14E2A8`)
- Edges: Slate with opacity
- Text: Near-black (`#1d1d1f`)

**Best for:**
- General use
- Web display
- Modern, clean aesthetic

### grayscale Theme

A publication-ready theme using only shades of gray.

```python
viz = argscape.visualize(ts, theme="grayscale")
```

**Colors:**
- Background: White (`#ffffff`)
- Sample nodes: Dark gray (`#464646`)
- Internal nodes: Medium gray (`#646464`)
- Root nodes: Darker gray (`#323232`)
- Edges: Light gray (`#8C8C8C`)
- Mutations: Gray (`#4a4a4a`)

**Best for:**
- Journal submissions (no color requirements)
- Black and white printing
- Supplementary figures

### paper Theme

High-contrast colors optimized for print publications.

```python
viz = argscape.visualize(ts, theme="paper")
```

**Colors:**
- Background: White (`#ffffff`)
- Sample nodes: Blue (`#2563eb`)
- Internal nodes: Gray (`#6b7280`)
- Root nodes: Red (`#dc2626`)
- Edges: Dark gray (`#374151`)
- Mutations: Orange (`#ea580c`)
- Selection highlight: Amber (`#f59e0b`)

**Best for:**
- Color print publications
- Figures requiring distinct node types
- Maximum legibility

## Theme Structure

Each theme defines colors for these elements:

```
Theme
├── name             # Theme identifier
├── background       # Canvas background color
├── nodes
│   ├── sample       # Sample (leaf) node color
│   ├── internal     # Internal node color
│   ├── root         # Root node color
│   ├── cluster      # Clustered node color
│   └── selected     # Selection highlight color
├── edges
│   ├── default      # Normal edge color
│   ├── highlight    # Highlighted edge color
│   └── dimmed       # Dimmed/inactive edge color
├── text             # Primary text color
├── text_secondary   # Secondary text color
├── grid             # Grid line color
├── mutation         # Known mutation marker color
└── mutation_unknown # Unknown mutation marker color
```

## Listing Available Themes

```python
from argscape.viz.themes import list_themes

print(list_themes())
# ['tskit', 'liquid', 'grayscale', 'paper']
```

## Getting Theme Details

```python
from argscape.viz.themes import get_theme

theme = get_theme("paper")
print(theme.name)           # 'paper'
print(theme.background)     # '#ffffff'
print(theme.nodes.sample)   # '#2563eb'
```

## Choosing the Right Theme

### For Presentations

Use `tskit` for dark backgrounds or `liquid` for light backgrounds:

```python
# Dark presentation slides
viz = argscape.visualize(ts, theme="tskit", width=1920, height=1080)
viz.export("slide_figure.png", dpi=150)
```

### For Publications

Choose based on journal requirements:

```python
# Grayscale for journals that don't accept color
viz = argscape.visualize(ts, theme="grayscale")
viz.export("figure_1.pdf", dpi=300)

# Paper theme for color figures
viz = argscape.visualize(ts, theme="paper")
viz.export("figure_2.pdf", dpi=300)
```

### For Web/Screen

Both `liquid` and `tskit` work well:

```python
# Light mode for web embedding
viz = argscape.visualize(ts, theme="liquid")
viz.display()  # In Jupyter

# Dark mode for visual impact
viz = argscape.visualize(ts, theme="tskit")
viz.show()  # In browser
```

## Comparing Themes

Create the same visualization with different themes:

```python
import argscape

themes = ["tskit", "liquid", "grayscale", "paper"]

for theme_name in themes:
    viz = argscape.visualize(
        ts,
        theme=theme_name,
        max_samples=30,
        show_mutations=True,
    )
    viz.export(f"comparison_{theme_name}.png")
```

## Theme Combinations

Themes work with all other visualization options:

```python
# Paper theme with full styling
viz = argscape.visualize(
    ts,
    theme="paper",

    # Node styling
    sample_node_size=12,
    show_sample_ids=True,

    # Edge styling
    edge_width=1.5,
    edge_opacity=0.8,

    # Mutations
    show_mutations=True,
    mutation_size=8,

    # Layout
    sample_order="consensus_minlex",
)
viz.export("publication_figure.pdf", dpi=300)
```

## Tips for Publication Figures

1. **Use `grayscale` or `paper`** - designed for print
2. **Increase DPI** - use 300+ for publication quality
3. **Consider PDF export** - vector format scales perfectly
4. **Test print preview** - colors may look different in print
5. **Check journal guidelines** - some require specific formats

```python
# Publication-ready export
viz = argscape.visualize(
    ts,
    theme="paper",
    width=1000,   # Appropriate for column width
    height=700,
)
viz.export("figure.pdf", dpi=300)
```

## Next Steps

- {doc}`first-visualization` - All visualization options
- {doc}`exporting` - Export settings for different use cases
- {doc}`spatial-3d` - Themes in 3D visualizations
