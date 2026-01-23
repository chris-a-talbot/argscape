# Web App vs Python API

ARGscape offers two complementary interfaces: a web application and a Python API. This guide helps you choose the right approach for your workflow.

## Feature Comparison

| Feature | Web App | Python API / CLI |
|---------|---------|------------------|
| Interactive visualization | Yes | Yes (browser) |
| Jupyter notebook integration | No | Yes |
| Static export (PNG/SVG/PDF) | Yes | Yes |
| Export as Python script | Yes | N/A |
| Real-time parameter adjustment | Yes | No |
| Animations | Yes | No |
| Batch processing | No | Yes |
| Scriptable workflows | No | Yes |
| Session persistence | Yes | No |
| File upload UI | Yes | Load from path |
| Diff visualization | Yes | No |
| Run inference methods | Yes | Yes |

## When to Use the Web App

The web application is ideal when you want to:

- **Explore interactively** - Adjust parameters and see changes in real-time
- **Use animations** - Step through genomic positions or temporal slices
- **Run inference** - Execute spatial/temporal inference methods with visual feedback
- **Compare datasets** - Use diff visualization to compare two tree sequences
- **Quick prototyping** - Upload and visualize without writing code

### Starting the Web App

```bash
argscape serve  # Opens browser at http://localhost:8000
```

Or with options:

```bash
argscape serve --port 8080 --no-tsdate  # Custom port, disable tsdate loading
```

## When to Use the Python API

The Python API is better when you need to:

- **Integrate with Jupyter** - Display visualizations inline in notebooks
- **Automate workflows** - Generate visualizations programmatically
- **Process multiple files** - Batch export figures for publications
- **Reproduce results** - Script exact visualization parameters

### Basic Python Usage

```python
import argscape
import tskit

ts = tskit.load("sample.trees")

# Create and display
viz = argscape.visualize(ts, theme="liquid", max_samples=100)
viz.display()  # Jupyter inline
viz.show()     # Browser
viz.export("figure.png", dpi=300)  # File
```

### Batch Processing Example

```python
from pathlib import Path
import argscape
import tskit

# Process all .trees files in a directory
for trees_file in Path("data/").glob("*.trees"):
    ts = tskit.load(trees_file)
    viz = argscape.visualize(ts, theme="paper", max_samples=50)
    viz.export(f"figures/{trees_file.stem}.png", dpi=300)
    print(f"Exported {trees_file.name}")
```

## When to Use the CLI

The command-line interface bridges both worlds:

- **Quick visualization** - View without writing Python code
- **Shell scripts** - Integrate into bash workflows
- **CI/CD pipelines** - Generate figures in automated builds

### CLI Examples

```bash
# View in browser
argscape viz sample.trees

# Export with options
argscape viz sample.trees -o output.png \
    --theme liquid \
    --max-samples 100 \
    --show-mutations \
    --dpi 300

# Process multiple files
for f in data/*.trees; do
    argscape viz "$f" -o "figures/$(basename $f .trees).png"
done
```

## Bridging Web App and Python

The web app can export your visualization settings as a Python script, making it easy to:

1. **Prototype in the web app** - Use real-time controls to find the perfect settings
2. **Export as Python** - Click "Python" in the Export tab to download a script
3. **Run in Python** - Execute the script for batch processing or automation

```python
# Script generated from web app
import argscape
import tskit

ts = tskit.load("sample.trees")

viz = argscape.visualize(
    ts,
    mode="force_graph",
    max_samples=50,
    theme="liquid",
    sample_order="dagre",
    show_mutations=True,
)

viz.export("figure.png", dpi=300)
```

This workflow combines the best of both: interactive exploration in the web app, and reproducible automation in Python.

## Equivalent Workflows

### Creating a Basic Visualization

::::{tab-set}

:::{tab-item} Web App
1. Launch `argscape`
2. Upload your `.trees` file
3. Click "Visualize"
4. Adjust settings in the control panel
5. Click "Export" to download
:::

:::{tab-item} Python
```python
import argscape
import tskit

ts = tskit.load("sample.trees")
viz = argscape.visualize(ts)
viz.export("output.png")
```
:::

:::{tab-item} CLI
```bash
argscape viz sample.trees -o output.png
```
:::

::::

### Running Spatial Inference

::::{tab-set}

:::{tab-item} Web App
1. Upload tree sequence with sample locations
2. Navigate to "Inference" panel
3. Select method (FastGAIA, SPARG, etc.)
4. Click "Run"
5. View results in 3D visualization
:::

:::{tab-item} Python
```python
import argscape
import tskit

ts = tskit.load("sample.trees")

# Run spatial inference
result = argscape.infer(ts, method="fastgaia")

# Visualize in 3D
viz = argscape.visualize(result.ts, mode="spatial_3d")
viz.show()
```
:::

:::{tab-item} CLI
```bash
# Load into session
argscape infer load --file sample.trees --name my_ts

# Run inference
argscape infer run --name my_ts --method fastgaia --output results/
```
:::

::::