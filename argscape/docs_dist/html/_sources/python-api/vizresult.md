# VizResult

The `VizResult` class represents a rendered ARGscape visualization. It is returned by {doc}`argscape.visualize() <visualize>` and provides methods to display or export the visualization.

```python
import argscape

viz = argscape.visualize(ts, theme="liquid")
viz.show()      # Open in browser
viz.display()   # Render in Jupyter
viz.export("figure.png")  # Save to file
```

## Class Definition

```python
class VizResult:
    """
    Result of argscape.visualize() - holds rendered visualization.

    Provides methods to display or export the visualization:
    - show(): Open in browser with full interactive UI
    - display(): Render inline in Jupyter notebook
    - export(path): Save to file (PNG, SVG, PDF)
    """
```

## Methods

### show()

```python
def show(self) -> VizResult
```

Open the visualization in the default web browser.

This method launches a local server and opens the interactive visualization in your system's default browser. The visualization includes the full ARGscape UI with controls for filtering, zooming, and exploring the data.

**Returns:** `VizResult` - Returns self for method chaining.

**Example:**

```python
viz = argscape.visualize(ts)
viz.show()  # Opens browser with interactive visualization
```

```{note}
The browser window will open automatically. The local server runs in the background and will be cleaned up when the Python process exits.
```

---

### display()

```python
def display(self) -> VizResult
```

Display the visualization inline in a Jupyter notebook.

This method embeds the interactive visualization directly in the notebook output cell. It uses an HTML iframe to render the React-based visualization.

**Returns:** `VizResult` - Returns self for method chaining.

**Example:**

```python
viz = argscape.visualize(ts, theme="liquid")
viz.display()  # Renders inline in Jupyter
```

```{tip}
For best results in Jupyter, ensure your notebook is running in a browser environment (not VS Code's built-in notebook viewer, which may have limitations with embedded iframes).
```

---

### export()

```python
def export(
    self,
    path: str,
    format: str | None = None,
    dpi: int = 150,
) -> VizResult
```

Export the visualization to a file.

This method uses Playwright to render the visualization and save it as a static image or vector file. Supported formats are PNG, SVG, and PDF.

**Parameters:**

```{list-table}
:header-rows: 1
:widths: 20 15 15 50

* - Parameter
  - Type
  - Default
  - Description
* - `path`
  - `str`
  - (required)
  - Output file path. The format is inferred from the extension if not specified.
* - `format`
  - `str | None`
  - `None`
  - Export format: `"png"`, `"svg"`, or `"pdf"`. If `None`, inferred from file extension.
* - `dpi`
  - `int`
  - `150`
  - Resolution for raster export (PNG). Higher values produce larger, sharper images.
```

**Returns:** `VizResult` - Returns self for method chaining.

**Raises:** Playwright exceptions if browser automation fails.

**Example:**

```python
viz = argscape.visualize(ts, theme="paper")

# Export as PNG (default DPI)
viz.export("figure.png")

# High-resolution PNG for publication
viz.export("figure_hires.png", dpi=300)

# Vector formats for scalable graphics
viz.export("figure.svg")
viz.export("figure.pdf")

# Explicit format override
viz.export("output", format="png")  # Saves as "output" with PNG format
```

```{note}
The `export()` method requires Playwright to be installed. If not already set up, install with:

    pip install playwright
    playwright install chromium
```

---

## Export Formats

| Format | Extension | Type | Best For |
|--------|-----------|------|----------|
| PNG | `.png` | Raster | Web, presentations, general use |
| SVG | `.svg` | Vector | Web, scalable graphics |
| PDF | `.pdf` | Vector | Publications, print |

### Resolution Guidelines

| DPI | Use Case | File Size |
|-----|----------|-----------|
| 72-96 | Web display, previews | Smallest |
| 150 | Default, presentations | Medium |
| 300 | Print publications | Large |
| 600 | High-quality print | Very large |

```{note}
DPI only affects PNG exports. SVG and PDF are vector formats that scale infinitely.
```

## Playwright Setup

Export functionality requires Playwright for headless browser rendering:

```bash
# Install Playwright (included in argscape[viz])
pip install argscape[viz]

# Install browser
playwright install chromium
```

If Playwright is not installed, `export()` will raise an `ImportError` with installation instructions.

## See Also

- {doc}`visualize` - Create visualizations with argscape.visualize()
- {doc}`/tutorials/exporting` - Detailed export workflow guide
- {doc}`/tutorials/themes` - Available themes
