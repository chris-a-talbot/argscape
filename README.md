<p align="center">
  <img src="https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/banner.png" alt="ARGscape Banner">
</p>

#

**ARGscape** is a visualization and analysis toolkit for ancestral recombination graphs (ARGs) encoded as tree sequences. Use it as a Python library in Jupyter notebooks, as a command-line tool, or through the web application.

```python
import argscape
import msprime

ts = msprime.sim_ancestry(samples=10, sequence_length=1e4, recombination_rate=1e-8)
viz = argscape.visualize(ts)
viz.show()  # Opens interactive visualization in browser
```

## Links

- **Web App**: [argscape.com](https://argscape.com)
- **Documentation**: [argscape.com/docs](https://argscape.com/docs)
- **Paper**: [arxiv.org/abs/2510.07255](https://arxiv.org/abs/2510.07255)

## Installation

### Python Package (Recommended)

```bash
# Basic installation (visualization only)
pip install argscape

# With spatial inference support
# Requires spatial dependencies pre-installed
# Conda installation recommended - see below
pip install argscape[spatial]
```

### Conda Environment (Full Features)

For the complete toolkit including all inference methods:

```bash
# Download environment file from GitHub or argscape.com/install
conda env create -f environment.yml
conda activate argscape_local
```

## Quick Start

### Python API

```python
import argscape

# Load and visualize a tree sequence
ts = tskit.load("example.trees")
viz = argscape.visualize(ts)
viz.display()  # Jupyter notebook
viz.show()     # Browser
viz.export("figure.png", dpi=300)  # Export

# Run spatial inference
result = argscape.infer(ts, method="fastgaia")
result.ts  # Tree sequence with inferred locations
```

### Web Application

```bash
# Start the web app locally
argscape serve

# Or visit argscape.com for the hosted version
```

### Command Line

```bash
# Run inference from terminal
argscape infer run --input data.trees --method fastgaia --output ./results
```

## Features

### Visualization

| Feature | Description |
|---------|-------------|
| **2D Force Graph** | Interactive force-directed ARG layout with D3.js |
| **3D Spatial** | Geographic visualization with Three.js for spatially-embedded data |
| **Themes** | Four built-in themes: `liquid`, `tskit`, `paper`, `grayscale` |
| **Custom Colors** | Override any theme color for publication figures |
| **Filtering** | Genomic range and temporal filtering with interactive sliders |
| **Export** | PNG, SVG, and PDF export at custom DPI |

### Spatial Inference

Estimate ancestral locations from sample coordinates:

| Method | Description | Speed |
|--------|-------------|-------|
| `midpoint` | Weighted midpoint of descendants | Fast |
| `fastgaia` | Fast GAIA algorithm | Fast |
| `gaia-quadratic` | GAIA with quadratic cost | Medium |
| `gaia-linear` | GAIA with linear cost | Medium |

```python
# Infer locations and visualize in 3D
result = argscape.infer(ts, method="fastgaia")
viz = argscape.visualize(result.ts, mode="spatial_3d")
viz.show()
```

### Interactive Controls

When using `.show()` or `.display(show_controls=True)`:

| Control | Key | Description |
|---------|-----|-------------|
| Nodes | N | Adjust sizes, toggle labels |
| Edges | E | Width and opacity |
| Mutations | M | Toggle markers |
| Layout | L | Sample ordering, spacing |
| Theme | T | Switch themes |
| Stats | I | View ARG statistics |
| Export | X | Save visualization |

## Gallery

### 2D Network Visualization

![2D ARG Visualization](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/2D.png)

### 3D Spatial Visualization

![3D ARG Visualization](https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/.github/images/3D.png)

## CLI Reference

All tools are accessed as subcommands of `argscape`. The `viz` command works with the base install; all others require `argscape[spatial]`.

### `argscape serve` - Web Application

```bash
argscape serve [--host HOST] [--port PORT] [--no-browser] [--no-tsdate] [--reload]
```

### `argscape viz` - Standalone Visualization

```bash
# Open interactive visualization in browser
argscape viz data.trees

# Export static image
argscape viz data.trees -o figure.png --dpi 300

# Options: --mode (force_graph/spatial_3d), --theme, --genomic-range, etc.
argscape viz --help
```

### `argscape infer` - Spatial Inference

```bash
# Interactive mode
argscape infer

# Direct execution
argscape infer run --input data.trees --method fastgaia --output ./results

# Session management
argscape infer load --file data.trees --name mydata
argscape infer list
```

### `argscape load` - Session Storage

```bash
argscape load load --file data.trees --name mydata
argscape load list
argscape load rm --name mydata
```

### `argscape benchmark` - Performance Benchmarks

```bash
argscape benchmark run [options]
argscape benchmark generate-datasets [options]
argscape benchmark report [options]
```

## Development

```bash
# Clone repository
git clone https://github.com/chris-a-talbot/argscape.git
cd argscape

# Backend
conda env create -f argscape/api/environment.yml
conda activate argscape_local
pip install -e .
uvicorn argscape.api.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## Citation

If you use ARGscape in your research, please cite:

> Talbot, C., & Bradburd, G. (2025). ARGscape: A modular, interactive tool for manipulation of spatiotemporal ancestral recombination graphs. *arXiv*. https://arxiv.org/abs/2510.07255

## License

MIT License

## Acknowledgments

- **tskit team** for the tree sequence toolkit and feedback
- **Bradburd Lab** for funding, support, and the GAIA algorithms
- **James Kitchens and Coop Lab** for testing and the SPARG and spacetrees algorithms
- **Messer Lab** for continued support

---

**Documentation**: [argscape.com/docs](https://argscape.com/docs) | **Issues**: [GitHub](https://github.com/chris-a-talbot/argscape/issues)
