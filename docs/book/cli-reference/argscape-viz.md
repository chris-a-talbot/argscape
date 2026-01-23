# argscape viz

Standalone visualization of tree sequences without requiring a server.

## Synopsis

```bash
argscape viz INPUT [-o OUTPUT] [--format FORMAT] [--mode MODE] [options...]
```

## Description

The `argscape viz` command provides a standalone way to visualize tree sequences without starting the full ARGscape web server. It can either open an interactive visualization in a web browser or export static images (PNG, SVG, PDF).

```{note}
2D visualization (`--mode force_graph`) works with the base installation.
3D visualization (`--mode spatial_3d`) requires `argscape[spatial]`.
Static export (`-o file.png`) requires Playwright: `pip install playwright && playwright install chromium`
```

This is useful for:
- Quick visualization of tree sequence files
- Generating publication-ready figures
- Batch processing of multiple files
- Integration with analysis pipelines

## Positional Arguments

`INPUT`
: Path to the input tree sequence file. Supported formats: `.trees`, `.ts`, `.tsz` (compressed).

## Output Options

`-o, --output PATH`
: Output file path for static export. Supported extensions: `.png`, `.svg`, `.pdf`. If not specified, opens the visualization in a web browser for interactive exploration.

`--format FORMAT`
: Output format when exporting. Choices: `png`, `svg`, `pdf`. Default: inferred from output filename extension.

`--dpi DPI`
: Resolution for raster output (PNG). Default: `150`.

## Mode Options

`-m, --mode MODE`
: Visualization mode. Choices:
  - `force_graph` - 2D force-directed graph layout (default)
  - `spatial_3d` - 3D spatial visualization with geographic/temporal dimensions

`--interactive`
: Open visualization in browser for interactive exploration (implied when no output file is specified).

## Sizing Options

`-W, --width PIXELS`
: Visualization width in pixels. Default: `1200`.

`-H, --height PIXELS`
: Visualization height in pixels. Default: `800`.

## Theme Options

`--theme THEME`
: Color theme for the visualization. Choices:
  - `tskit` - Default tskit-inspired colors (default)
  - `liquid` - Blue-green fluid theme
  - `grayscale` - Black and white for publications
  - `paper` - Light theme optimized for print

## Subsetting Options

`--max-samples N`
: Maximum number of samples to include in the visualization. Useful for large tree sequences that would be too dense to visualize effectively.

`--subset-mode MODE`
: Method for selecting samples when subsetting. Choices:
  - `even` - Evenly spaced samples across the sample range (default)
  - `random` - Randomly selected samples

`--seed SEED`
: Random seed for reproducibility when using `--subset-mode random`.

## Filtering Options

`--genomic-range START,END`
: Filter to a specific genomic position range. Format: two comma-separated numbers (e.g., `0,50000`). Only edges overlapping this range will be displayed.

`--temporal-range MIN,MAX`
: Filter to a specific time range. Format: two comma-separated numbers (e.g., `0,1000`). Only nodes within this time range will be displayed.

## Node Options

`--sample-node-size SIZE`
: Size of sample (leaf) nodes in pixels. Default: `8`.

`--internal-node-size SIZE`
: Size of internal nodes in pixels. Default: `4`.

`--root-node-size SIZE`
: Size of root nodes in pixels. Default: `6`.

`--show-sample-ids`
: Display labels on sample nodes showing their node IDs.

`--show-internal-ids`
: Display labels on internal nodes showing their node IDs.

`--show-root-ids`
: Display labels on root nodes showing their node IDs.

## Edge Options

`--edge-width WIDTH`
: Line width for edges. Default: `1.0`.

`--edge-opacity OPACITY`
: Opacity for edges (0.0 to 1.0). Default: `0.6`.

`--show-edge-labels`
: Display labels on edges.

## Mutation Options

`--show-mutations`
: Show mutation markers on edges where mutations occur.

`--mutation-size SIZE`
: Size of mutation markers in pixels. Default: `6`.

## Layout Options (2D Force Graph)

`--sample-order ORDER`
: Algorithm for ordering samples along the x-axis. Choices:
  - `numeric` - Order by node ID
  - `first_minlex` - Minimize crossings using first tree
  - `center_minlex` - Minimize crossings using center tree
  - `consensus_minlex` - Consensus ordering across all trees (default)
  - `dagre` - Use Dagre graph layout algorithm

`--temporal-spacing MODE`
: How to space nodes vertically by time. Choices:
  - `equal` - Equal spacing between time points
  - `linear` - Proportional to actual time values (default)
  - `log` - Logarithmic scaling of time

`--vertical-spacing FACTOR`
: Multiplier for vertical spacing between time layers. Default: `1.0`.

`--horizontal-spacing FACTOR`
: Multiplier for horizontal spacing between nodes. Default: `100.0`.

## Spatial Options (3D Mode)

`--geo-base BASE`
: Geographic base map for 3D visualization. Choices:
  - `unit_grid` - Simple unit coordinate grid (default)
  - `eastern_hemisphere` - Eastern hemisphere map projection

`--temporal-multiplier FACTOR`
: Scaling factor for the Z-axis (time dimension) in 3D view. Default: `1.0`.

`--spatial-multiplier FACTOR`
: Scaling factor for X-Y spatial coordinates in 3D view. Default: `100.0`.

## Examples

Open a tree sequence in the browser for interactive exploration:

```bash
argscape viz simulation.trees
```

Export a high-resolution PNG:

```bash
argscape viz simulation.trees -o figure.png --dpi 300
```

Export an SVG for publication with grayscale theme:

```bash
argscape viz simulation.trees -o figure.svg --theme grayscale
```

Visualize with mutations shown and custom node sizes:

```bash
argscape viz simulation.trees -o output.png --show-mutations --sample-node-size 12
```

Visualize a specific genomic region:

```bash
argscape viz large_genome.trees -o region.png --genomic-range 0,100000
```

Subset a large tree sequence to 100 samples:

```bash
argscape viz large.trees -o subset.png --max-samples 100 --subset-mode random --seed 42
```

3D spatial visualization:

```bash
argscape viz spatial_data.trees -o spatial.png --mode spatial_3d --temporal-multiplier 2.0
```

Create a wide figure with custom dimensions:

```bash
argscape viz data.trees -o wide_figure.png --width 2400 --height 600
```

## Exit Codes

- `0` - Success
- `1` - Error (file not found, visualization error, export error)

## Related

- {doc}`argscape-serve` - Full web application server
- {doc}`/python-api/visualize` - Python API: `argscape.visualize()` and `VizResult`
