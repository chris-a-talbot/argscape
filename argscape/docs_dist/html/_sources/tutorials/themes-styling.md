# Themes & Styling

ARGscape includes four built-in themes designed for different use cases: interactive exploration, presentations, and publication figures. Each theme defines colors for all visualization elements including nodes, edges, mutations, and text.

## Available Themes

```{list-table}
:header-rows: 1
:widths: 15 25 60

* - Theme
  - Best For
  - Description
* - `tskit`
  - Interactive exploration
  - Dark theme with cyan and green accents. The original ARGscape look.
* - `liquid`
  - General use, presentations
  - Light Apple-inspired theme with glass effects. Clean and modern.
* - `grayscale`
  - Publications (print)
  - No colors, high contrast. Reproduces well in black-and-white.
* - `paper`
  - Publications (color)
  - Optimized for print figures with distinct, accessible colors.
```

## Theme Details

### tskit

The **tskit** theme is a dark theme inspired by the original ARGscape web application. It features cyan and green accents on a dark teal background.

```python
viz = argscape.visualize(ts, theme="tskit")
```

**When to use:** Interactive data exploration, presentations in dark environments, matching the ARGscape web application aesthetic.

**Color Palette:**

| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark teal | `#03303E` |
| Sample nodes | Pale green | `#14E2A8` |
| Internal nodes | Light blue | `#60A0B7` |
| Root nodes | Cyan | `#38BDF8` |
| Edges | Gray | `#999999` |
| Text | White | `#ffffff` |
| Mutations | Indigo | `#4F46E5` |

---

### liquid

The **liquid** theme is a light, Apple-inspired theme with a clean, modern aesthetic. It is the default theme.

```python
viz = argscape.visualize(ts, theme="liquid")  # Default
```

**When to use:** General purpose, presentations with light backgrounds, screen-based viewing.

**Color Palette:**

| Element | Color | Hex |
|---------|-------|-----|
| Background | Light gray | `#f5f5f7` |
| Sample nodes | ARGscape green | `#14E2A8` |
| Internal nodes | Slate | `#94A3B8` |
| Root nodes | ARGscape green | `#14E2A8` |
| Edges | Slate | `#94A3B8` |
| Text | Near-black | `#1d1d1f` |
| Mutations | Indigo | `#4F46E5` |

---

### grayscale

The **grayscale** theme uses only shades of gray, making it ideal for publications that may be printed in black-and-white.

```python
viz = argscape.visualize(ts, theme="grayscale")
```

**When to use:** Publications requiring black-and-white compatibility, print figures where color reproduction is uncertain, accessibility.

**Color Palette:**

| Element | Color | Hex |
|---------|-------|-----|
| Background | White | `#ffffff` |
| Sample nodes | Dark gray | `#464646` |
| Internal nodes | Medium gray | `#646464` |
| Root nodes | Dark gray | `#323232` |
| Edges | Light gray | `#8C8C8C` |
| Text | Near-black | `#212529` |
| Mutations | Gray | `#4a4a4a` |

```{tip}
When using the grayscale theme, consider increasing node sizes slightly to maintain visibility without color differentiation.
```

---

### paper

The **paper** theme is optimized for publication figures with distinct, print-friendly colors that maintain their appearance in both digital and print formats.

```python
viz = argscape.visualize(ts, theme="paper")
```

**When to use:** Academic publications, journal figures, posters, any print media where color is available.

**Color Palette:**

| Element | Color | Hex |
|---------|-------|-----|
| Background | White | `#ffffff` |
| Sample nodes | Blue | `#2563eb` |
| Internal nodes | Gray | `#6b7280` |
| Root nodes | Red | `#dc2626` |
| Edges | Dark gray | `#374151` |
| Text | Near-black | `#111827` |
| Mutations | Orange | `#ea580c` |

```{note}
The paper theme uses blue for samples and red for roots, providing clear visual distinction between node types that works well for colorblind readers.
```

---

## Theme Comparison

Here's a side-by-side comparison of key colors across all themes:

```{list-table}
:header-rows: 1
:widths: 20 20 20 20 20

* - Element
  - tskit
  - liquid
  - grayscale
  - paper
* - Background
  - `#03303E` (dark teal)
  - `#f5f5f7` (light gray)
  - `#ffffff` (white)
  - `#ffffff` (white)
* - Sample nodes
  - `#14E2A8` (green)
  - `#14E2A8` (green)
  - `#464646` (gray)
  - `#2563eb` (blue)
* - Root nodes
  - `#38BDF8` (cyan)
  - `#14E2A8` (green)
  - `#323232` (gray)
  - `#dc2626` (red)
* - Edges
  - `#999999` (gray)
  - `#94A3B8` (slate)
  - `#8C8C8C` (gray)
  - `#374151` (dark gray)
```

## Using Themes

### Basic Usage

```python
import argscape

# Use any theme by name
viz = argscape.visualize(ts, theme="tskit")
viz = argscape.visualize(ts, theme="liquid")
viz = argscape.visualize(ts, theme="grayscale")
viz = argscape.visualize(ts, theme="paper")
```

### List Available Themes

```python
from argscape.viz.themes import list_themes

print(list_themes())
# Output: ['tskit', 'liquid', 'grayscale', 'paper']
```

### Invalid Theme Names

If you specify an unknown theme name, a `ValueError` is raised:

```python
viz = argscape.visualize(ts, theme="unknown")
# Raises: ValueError: Unknown theme: unknown. Available: tskit, liquid, grayscale, paper
```

## Recommendations by Use Case

| Use Case | Recommended Theme |
|----------|-------------------|
| Data exploration | `tskit` or `liquid` |
| Conference presentation (dark room) | `tskit` |
| Conference presentation (lit room) | `liquid` |
| Journal figure (color) | `paper` |
| Journal figure (black-and-white) | `grayscale` |
| Poster | `paper` |
| Documentation/tutorial | `liquid` |
| Web embedding | `liquid` |

## Example: Export with Different Themes

```python
import argscape
import tskit

ts = tskit.load("example.trees")

# Create the same visualization with different themes
for theme_name in ["tskit", "liquid", "grayscale", "paper"]:
    viz = argscape.visualize(ts, theme=theme_name, max_samples=50)
    viz.export(f"figure_{theme_name}.png", dpi=300)
```

## See Also

- {doc}`/python-api/visualization` - Main visualization function and parameters
- {doc}`exporting` - Exporting figures in various formats
