# Theme Functions

ARGscape provides functions for working with visualization themes programmatically.

## argscape.get_theme()

Retrieve a built-in theme by name.

```python
import argscape

theme = argscape.get_theme("paper")
print(theme.name)              # "paper"
print(theme.background)        # "#ffffff"
print(theme.nodes.sample)      # "#2563eb"
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `str` | Theme name: `"liquid"`, `"tskit"`, `"grayscale"`, or `"paper"` |

### Returns

A `Theme` object containing all color definitions.

### Raises

- `ValueError` - If the theme name is not recognized

## argscape.list_themes()

Get a list of all available theme names.

```python
>>> argscape.list_themes()
['tskit', 'liquid', 'grayscale', 'paper']
```

### Returns

`list[str]` - List of available theme names.

## argscape.customize_theme()

Create a custom theme by overriding specific colors from a base theme.

```python
import argscape

# Create custom theme based on 'paper'
my_theme = argscape.customize_theme(
    "paper",
    sample_color="#e63946",
    edge_color="#457b9d",
)
```

::::{dropdown} Full Function Signature
:closed:

```python
def customize_theme(
    base: str | Theme = "liquid",
    *,
    # Node colors
    sample_color: str | None = None,
    internal_color: str | None = None,
    root_color: str | None = None,
    # Edge colors
    edge_color: str | None = None,
    # Other colors
    background_color: str | None = None,
    mutation_color: str | None = None,
    text_color: str | None = None,
) -> Theme
```

::::

### Parameters

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `base`
  - `str | Theme`
  - `"liquid"`
  - Base theme to customize. Can be a theme name or an existing `Theme` object.
* - `sample_color`
  - `str | None`
  - `None`
  - Override color for sample (leaf) nodes. Hex string (e.g., `"#ff0000"`).
* - `internal_color`
  - `str | None`
  - `None`
  - Override color for internal nodes.
* - `root_color`
  - `str | None`
  - `None`
  - Override color for root nodes.
* - `edge_color`
  - `str | None`
  - `None`
  - Override color for edges.
* - `background_color`
  - `str | None`
  - `None`
  - Override background color.
* - `mutation_color`
  - `str | None`
  - `None`
  - Override color for mutation markers.
* - `text_color`
  - `str | None`
  - `None`
  - Override color for text labels.
```

### Returns

A new `Theme` object with the specified overrides applied.

### Examples

**Basic customization:**

```python
import argscape

# Red samples on paper theme
my_theme = argscape.customize_theme(
    "paper",
    sample_color="#e63946",
)

# Use with visualize() via color parameters
viz = argscape.visualize(ts, theme="paper", sample_color="#e63946")
```

**Multiple color overrides:**

```python
# Nature-inspired palette on grayscale base
forest_theme = argscape.customize_theme(
    "grayscale",
    sample_color="#2a9d8f",      # Teal samples
    internal_color="#e9c46a",    # Gold internal nodes
    root_color="#e76f51",        # Coral roots
    edge_color="#264653",        # Dark teal edges
    mutation_color="#f4a261",    # Orange mutations
)
```

**Chaining customizations:**

```python
# Start from a custom theme
base = argscape.customize_theme("paper", sample_color="#e63946")

# Further customize
final = argscape.customize_theme(
    base,
    edge_color="#1d3557",
    background_color="#f1faee",
)
```

## Theme Object

The `Theme` class is a frozen dataclass containing all visualization colors.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | `str` | Theme identifier |
| `background` | `str` | Background color |
| `nodes` | `NodeColors` | Node color settings |
| `edges` | `EdgeColors` | Edge color settings |
| `text` | `str` | Primary text color |
| `text_secondary` | `str` | Secondary text color |
| `grid` | `str` | Grid line color |
| `mutation` | `str` | Mutation marker color |
| `mutation_unknown` | `str` | Unknown mutation marker color |

### NodeColors

| Attribute | Description |
|-----------|-------------|
| `sample` | Sample (leaf) node color |
| `internal` | Internal node color |
| `root` | Root node color |
| `cluster` | Cluster indicator color |
| `selected` | Selected node highlight color |

### EdgeColors

| Attribute | Description |
|-----------|-------------|
| `default` | Default edge color |
| `highlight` | Highlighted edge color |
| `dimmed` | Dimmed/inactive edge color |

### Methods

#### to_dict()

Serialize the theme to a dictionary (useful for JSON export).

```python
theme = argscape.get_theme("paper")
theme_dict = theme.to_dict()
```

## Built-in Themes

### liquid (default)

Light, Apple-inspired theme with glassmorphism effects.

```python
theme = argscape.get_theme("liquid")
# Background: #f5f5f7 (Apple light gray)
# Samples: #14E2A8 (ARGscape green)
# Internal: #94A3B8 (Slate)
```

**Best for:** General use, web display, Jupyter notebooks

### tskit

Dark theme with cyan and green accents matching the original ARGscape look.

```python
theme = argscape.get_theme("tskit")
# Background: #03303E (Dark teal)
# Samples: #14E2A8 (Pale green)
# Internal: #60A0B7 (Light blue)
# Roots: #38BDF8 (Cyan)
```

**Best for:** Presentations, screen viewing, dark environments

### grayscale

Black and white theme for journals that don't accept color figures.

```python
theme = argscape.get_theme("grayscale")
# Background: #ffffff
# All elements in shades of gray
```

**Best for:** Journal publications (no color), print without color

### paper

High-contrast colors optimized for print publications.

```python
theme = argscape.get_theme("paper")
# Background: #ffffff
# Samples: #2563eb (Blue)
# Internal: #6b7280 (Gray)
# Roots: #dc2626 (Red)
# Mutations: #ea580c (Orange)
```

**Best for:** Color journal figures, posters, presentations

## Using Custom Themes

You can pass a custom `Theme` object directly to `visualize()`:

```python
import argscape

# Create a custom theme
my_theme = argscape.customize_theme(
    "paper",
    sample_color="#e63946",
    edge_color="#457b9d",
)

# Pass the theme object directly
viz = argscape.visualize(ts, theme=my_theme)
viz.show()
```

Alternatively, use inline color parameters for quick overrides:

```python
# Inline color overrides (no need to create theme object)
viz = argscape.visualize(
    ts,
    theme="paper",              # Base theme name
    sample_color="#e63946",     # Override specific colors
    edge_color="#457b9d",
)
```

Both approaches produce the same result. Use `customize_theme()` when you want to:
- Reuse the same custom theme across multiple visualizations
- Inspect or log the theme colors programmatically
- Build themes incrementally through chaining

## See Also

- {doc}`visualize` - Main visualization function with color parameters
- {doc}`/tutorials/themes` - Tutorial on themes and styling
- {doc}`/tutorials/first-visualization` - Getting started with visualizations
