# argscape benchmark

Benchmark ARGscape inference and visualization performance.

```{note}
This command requires `argscape[spatial]`. If you only have the base package, install the spatial extras first:
`pip install argscape[spatial]`
```

## Synopsis

```bash
argscape benchmark --version
argscape benchmark run [options...]
argscape benchmark generate-datasets [options...]
argscape benchmark report [options...]
```

## Description

The `argscape benchmark` command provides tools for measuring the performance of ARGscape's inference algorithms and visualization rendering. It can generate standardized benchmark datasets, run timed benchmarks, and produce reports with performance metrics.

This is useful for:
- Comparing inference method performance across different dataset sizes
- Measuring visualization rendering times
- Generating reproducible benchmark results for publications
- Identifying performance regressions

## Global Options

`--version`
: Display the ARGscape version number and exit.

## Subcommands

### run

Run benchmarks on inference methods and/or visualization.

```bash
argscape benchmark run [options...]
```

#### Options

`-o, --output DIR`
: Output directory for benchmark results. Default: `results`.

`-d, --datasets DIR`
: Directory containing benchmark datasets. If not specified, uses generated datasets.

`-m, --methods METHODS`
: Comma-separated list of inference method names to benchmark. If not specified, benchmarks all available methods.

`--inference-only`
: Only run inference benchmarks (skip visualization benchmarks).

`--visualization-only`
: Only run visualization benchmarks (skip inference benchmarks).

`-r, --repetitions N`
: Number of repetitions for each benchmark to ensure timing stability. Default: `3`.

`--timeout SECONDS`
: Timeout per inference run in seconds. Default: `600` (10 minutes).

`--show-browser`
: Show browser window during visualization benchmarks (default is headless mode).

`--server-url URL`
: URL of a running ARGscape server. Default: `http://localhost:8000`. The server must be started separately before running visualization benchmarks.

`--resume`
: Resume from a previous run, only re-running benchmarks that failed or timed out.

`-q, --quiet`
: Suppress progress output.

`--debug`
: Enable debug output from subprocesses.

### generate-datasets

Generate standardized benchmark datasets using msprime simulations.

```bash
argscape benchmark generate-datasets [options...]
```

#### Options

`-o, --output DIR`
: Output directory for generated datasets. Default: `datasets/simulated`.

`--samples COUNTS`
: Comma-separated list of sample counts to generate. Default: `50,100,250,500`.

`--sequence-lengths LENGTHS`
: Comma-separated list of sequence lengths to generate. Default: `1e5,1e6,1e7`.

`--seed SEED`
: Random seed for reproducibility. Default: `42`.

`-q, --quiet`
: Suppress progress output.

### report

Generate reports from benchmark results.

```bash
argscape benchmark report [options...]
```

#### Options

`-r, --results DIR`
: Directory containing benchmark results. Default: `results`.

`-f, --format FORMAT`
: Output format for the report. Choices:
  - `latex` - LaTeX tables for publications
  - `plots` - PNG/SVG performance plots
  - `all` - Generate both LaTeX and plots (default)

`-q, --quiet`
: Suppress progress output.

## Examples

Generate benchmark datasets:

```bash
argscape benchmark generate-datasets --output ./datasets
```

Generate datasets with custom sample sizes:

```bash
argscape benchmark generate-datasets --samples 25,50,100,200 --seed 123
```

Run all benchmarks (requires server running):

```bash
# Terminal 1: Start the server
argscape serve --no-browser

# Terminal 2: Run benchmarks
argscape benchmark run --output ./results --datasets ./datasets
```

Run only inference benchmarks for specific methods:

```bash
argscape benchmark run --inference-only --methods midpoint,fastgaia --output ./results
```

Run benchmarks with more repetitions for stable timing:

```bash
argscape benchmark run --repetitions 10 --timeout 1200 --output ./results
```

Resume a failed benchmark run:

```bash
argscape benchmark run --resume --output ./results
```

Generate a LaTeX report from results:

```bash
argscape benchmark report --results ./results --format latex
```

Generate all report formats:

```bash
argscape benchmark report --results ./results --format all
```

## Workflow

A typical benchmarking workflow:

1. **Generate datasets** with standardized parameters:
   ```bash
   argscape benchmark generate-datasets -o datasets
   ```

2. **Start the ARGscape server** (required for visualization benchmarks):
   ```bash
   argscape serve --no-browser --no-tsdate
   ```

3. **Run benchmarks** in a separate terminal:
   ```bash
   argscape benchmark run -d datasets -o results
   ```

4. **Generate reports**:
   ```bash
   argscape benchmark report -r results -f all
   ```

## Output Files

### Benchmark Results

Results are saved in the output directory with:
- `inference_results.json` - Timing data for inference methods
- `visualization_results.json` - Timing data for rendering
- Individual timing files per dataset/method combination

### Reports

Generated reports include:
- LaTeX tables with timing statistics
- Performance scaling plots (time vs. sample count, sequence length)
- Method comparison charts

## Exit Codes

- `0` - Success
- `1` - Error (benchmark failed, missing dependencies)

## Requirements

- Running ARGscape server for visualization benchmarks
- msprime for dataset generation
- Playwright for headless browser benchmarks (installed automatically)

## Related

- {doc}`argscape-serve` - Start the web server for visualization benchmarks
- {doc}`argscape-infer` - Run inference interactively
