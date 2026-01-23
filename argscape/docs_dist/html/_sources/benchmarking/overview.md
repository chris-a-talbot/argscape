# Benchmarking Overview

ARGscape includes a comprehensive benchmarking module for measuring the performance and accuracy of inference methods and visualization tools. This module is designed for researchers who want to evaluate different spatial and temporal inference algorithms or compare visualization performance across datasets of varying sizes.

## What the Benchmarking System Measures

The benchmarking system evaluates three key areas:

### Inference Performance

Measures how efficiently different inference methods process tree sequences:

- **Wall time**: Total elapsed time from start to finish
- **CPU time**: Actual processor time consumed
- **Peak memory usage**: Maximum memory footprint during inference

Supported inference methods include:
- FastGAIA (spatial inference)
- GAIA-quadratic (spatial inference)
- GAIA-linear (spatial inference)
- Midpoint (spatial inference, weighted and unweighted variants)
- SPARG (spatial inference)
- Spacetrees (spatial inference)
- tsdate (temporal inference)

### Inference Accuracy

When ground truth data is available (from simulated datasets), the system computes accuracy metrics:

**Spatial accuracy metrics:**
- Mean error (in km or coordinate units)
- Median error
- Root mean squared error (RMSE)
- Standard deviation of errors
- Number of nodes compared

**Temporal accuracy metrics:**
- Mean absolute error
- Median absolute error
- RMSE
- Correlation coefficient between inferred and true times
- Number of nodes compared

### Visualization Performance

Measures how well the visualization tools handle datasets of different sizes:

- **Render time**: Time to initial render
- **Time to interactive**: Time until the visualization responds to user input
- **FPS during pan**: Frame rate while dragging the view
- **FPS during zoom**: Frame rate while zooming
- **Heap size**: JavaScript memory consumption

Supported visualization tools:
- argscape-2d (ForceGraph)
- argscape-3d (Spatial3D)
- lorax (external tool, planned)
- tskit_arg_visualizer (external tool, planned)

## Requirements

### Server Requirement

The benchmarking system requires the ARGscape server to be running. Both inference and visualization benchmarks are executed through the API to ensure consistent measurement conditions.

Start the server before running benchmarks:

```bash
argscape --no-browser
```

Or using uvicorn directly:

```bash
uvicorn argscape.api.main:app --port 8000
```

### Installation

Install ARGscape with benchmark dependencies:

```bash
pip install argscape[benchmark]
```

This installs additional requirements:
- `msprime` for generating simulated datasets
- `playwright` for visualization benchmarks
- `matplotlib` for generating plots

For visualization benchmarks, also install browser drivers:

```bash
playwright install chromium
```

## Output Structure

Benchmark results are organized in a structured directory:

```
results/
  inference/
    raw_metrics.csv      # Detailed metrics for each run
    outputs/             # Inference output files (subprocess mode)
  visualization/
    raw_metrics.csv      # Visualization metrics
  tables/
    inference_comparison.tex  # LaTeX table for papers
  figures/
    scaling_plots.png    # Performance scaling plots
    scaling_plots.pdf
  summary.json           # Complete results with system info
```

## System Information

The benchmark results include detailed system information for reproducibility:

- ARGscape version
- Python version
- Platform and processor details
- Dependency versions (tskit, msprime, fastgaia, etc.)
- Timestamp of the benchmark run

This metadata is stored in `summary.json` and helps ensure benchmark results can be compared fairly across different systems.

## Next Steps

- {doc}`running-benchmarks` - Learn how to run benchmarks
- {doc}`interpreting-results` - Understand the output metrics
- {doc}`datasets` - Generate standardized test datasets
