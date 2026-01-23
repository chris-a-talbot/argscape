# ARGscape Documentation

**Interactive visualization and analysis of ancestral recombination graphs**

ARGscape provides powerful tools for visualizing ancestral recombination graphs (ARGs) encoded as tskit tree sequences. Whether you're exploring the evolutionary history of samples, analyzing spatial patterns, or running inference methods, ARGscape has you covered.

```{admonition} Quick Links
:class: tip

- **New to tree sequences?** Start with the [tskit docs](https://tskit.dev/tskit/docs/stable/introduction.html)
- **New to ARGscape?** Start with the {doc}`getting-started/installation` guide
- **Want to visualize a tree sequence?** See the {doc}`tutorials/first-visualization` tutorial
- **Want to visualize a georeferenced tree sequence?** See the {doc}`tutorials/spatial-3d` tutorial
```

## What is ARGscape?

ARGscape is a toolkit for visualizing and analyzing tree sequences. It offers:

- **2D Graph Visualization** - Interactive visualization of ARG topology
- **3D Spatial Visualization** - Geographic placement of nodes with temporal depth
- **Spatial Inference** - Run GAIA, SPARG, Midpoint, and other inference methods
- **Temporal Inference** - Date internal nodes with tsdate
- **Export Capabilities** - Generate publication-ready figures in PNG, SVG, or PDF

## Two Ways to Use ARGscape

### Python API & CLI

Install ARGscape as a Python package and use it directly from your scripts, notebooks, or terminal:

```bash
pip install argscape
```
```python
import argscape
import tskit

# Load your tree sequence
ts = tskit.load("sample.trees")

# Create and display a visualization
viz = argscape.visualize(ts, theme="tskit", max_samples=100)
viz.show()  # Opens in browser
```

Or from the command line:

```bash
argscape viz sample.trees -o figure.png --theme tskit
```

For 3D visualizations and inference tools, you'll need to install the `argscape[spatial]` module - see {doc}`getting-started/installation`.

### Web Application

The web app offers an interactive interface and extended visualization capabilities. You'll need the `argscape[spatial]` module installed. You can then run:

```bash
argscape serve  # Opens browser at http://localhost:8000
```

## Documentation Overview

::::{grid} 2
:gutter: 3

:::{grid-item-card} Getting Started
:link: getting-started/installation
:link-type: doc

Installation, quickstart guide, and choosing between web and Python interfaces.
:::

:::{grid-item-card} Tutorials
:link: tutorials/first-visualization
:link-type: doc

Step-by-step guides for visualization, filtering, theming, and exporting.
:::

:::{grid-item-card} Python API
:link: python-api/overview
:link-type: doc

Complete documentation of `visualize()`, `VizResult`, `infer()`, and `InferResult`.
:::

:::{grid-item-card} CLI Reference
:link: cli-reference/argscape
:link-type: doc

Reference for all command-line tools: `argscape viz`, `argscape serve`, `argscape infer`, and more.
:::

:::{grid-item-card} Advanced Topics
:link: advanced/shapefiles-crs
:link-type: doc

Shapefiles & CRS, inference algorithms, performance optimization, and benchmarking.
:::

::::

## Citation

If you use ARGscape in your research, please cite:

> Talbot, C., & Bradburd, G. (2025). ARGscape: A modular, interactive tool for manipulation of spatiotemporal ancestral recombination graphs. *arXiv preprint* arXiv:2510.07255.

```bibtex
@article{talbot2025argscape,
  title={ARGscape: A modular, interactive tool for manipulation of spatiotemporal ancestral recombination graphs},
  author={Talbot, Christopher and Bradburd, Gideon},
  journal={arXiv preprint arXiv:2510.07255},
  year={2025}
}
```

## Links

- **Website**: [argscape.com](https://argscape.com)
- **GitHub**: [github.com/chris-a-talbot/argscape](https://github.com/chris-a-talbot/argscape)
- **Paper**: [arXiv:2510.07255](https://arxiv.org/abs/2510.07255)
