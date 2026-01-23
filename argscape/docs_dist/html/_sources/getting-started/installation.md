# Installation

ARGscape has two installation options to fit different use cases:

- **Base installation** (`pip install argscape`): Lightweight package for 2D visualization only. No geospatial dependencies required.
- **Full installation** (`pip install argscape[spatial]`): Includes 3D spatial visualization, web application, and spatial inference tools. Requires geospatial libraries.

## Lightweight Installation (pip)

For 2D visualization only, install the base package:

```bash
pip install argscape
```

This provides:
- 2D force-directed graph visualization
- Python API: `argscape.visualize(ts)` (2D only)
- CLI: `argscape viz` (2D only)

```python
import argscape
import tskit

ts = tskit.load("example.trees")
viz = argscape.visualize(ts)  # 2D force graph
viz.show()  # Opens in browser
```

## Full Installation (conda recommended)

For 3D spatial visualization, the web application, and inference tools, you need geospatial dependencies. Conda handles these automatically:

```bash
# Download environment file
curl -O https://argscape.com/environment.yml

# Create and activate environment
conda env create -f environment.yml
conda activate argscape
```

This installs `argscape[spatial]` with all dependencies for:
- 3D spatial visualization with geographic mapping
- Web application (`argscape serve`)
- Spatial inference tools (`argscape infer`)

```{note}
If you already have a conda environment, you can install the conda dependencies manually and then `pip install argscape[spatial]`. See the [environment.yml](https://argscape.com/environment.yml) for the required packages.
```

### Full Installation with pip

```{warning}
**Windows users must use conda.** Several dependencies (including msprime) do not support pip installation on Windows.
```

For macOS and Linux, pip may work without additional setup:

```bash
pip install argscape[spatial]
```

If installation fails with errors mentioning GDAL, GEOS, PROJ, or fiona, install system libraries first:

**macOS (Homebrew):**

```bash
brew install gdal geos proj
pip install argscape[spatial] --no-binary fiona
```

**Linux (Debian/Ubuntu):**

```bash
sudo apt-get update
sudo apt-get install libgdal-dev libgeos-dev libproj-dev
pip install argscape[spatial] --no-binary fiona
```

**Linux (Fedora/RHEL):**

```bash
sudo dnf install gdal-devel geos-devel proj-devel
pip install argscape[spatial] --no-binary fiona
```

```{tip}
The `--no-binary fiona` flag forces fiona to build against your system GDAL rather than using bundled binaries, which can resolve version conflicts.
```

## Optional: Static Export

For exporting visualizations as PNG, SVG, or PDF, install Playwright:

```bash
pip install playwright
playwright install chromium
```

This enables `viz.export("figure.png")` and `argscape viz -o figure.png`.

## Verifying Installation

Test that ARGscape is installed correctly:

```python
import argscape
print(argscape.__version__)

# Check what features are available
print(f"Spatial available: {argscape.is_spatial_available()}")
print(f"Playwright available: {argscape.is_playwright_available()}")
```

If you have the spatial extras installed, launch the web application:

```bash
argscape serve  # Opens browser at http://localhost:8000 - may take a few minutes to load
```

## System Requirements

- **Python**: 3.8 or higher
- **Memory**: 3GB+ recommended for large tree sequences
- **Browser**: Modern browser (Chrome, Firefox, Safari, Edge) for web interface and visualization export

## Troubleshooting

### "Spatial dependencies not installed"

If you see this error when trying to use 3D visualization or the web app:

```
Spatial dependencies not installed. Install with: pip install argscape[spatial]
```

You need the full installation. See the "Full Installation" section above.

### Geospatial Library Errors

If you see errors mentioning GDAL, GEOS, PROJ, or fiona when installing `argscape[spatial]`:

1. **Use conda** (recommended) - This is the most reliable solution
2. **Install system libraries** - See the platform-specific instructions above
3. **Use `--no-binary fiona`** - Forces building against system GDAL to avoid version conflicts

### Import Errors

If you encounter import errors after installation:

```bash
pip install --upgrade argscape
```

### Playwright Issues

If visualization export fails with "Playwright is required", install it:

```bash
pip install playwright
playwright install chromium
```

To reinstall Playwright browsers:

```bash
playwright install --force chromium
```

## Next Steps

- {doc}`quickstart` - Create your first visualization
- {doc}`web-vs-python` - Choose the right interface for your workflow
