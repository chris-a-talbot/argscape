# Running Benchmarks

This guide explains how to run benchmarks using the `argscape benchmark` command-line tool.

## Prerequisites

Before running benchmarks, ensure:

1. ARGscape is installed with spatial dependencies:
   ```bash
   pip install argscape[spatial]
   ```

2. The ARGscape server is running:
   ```bash
   argscape serve --no-browser
   ```

3. For visualization benchmarks, Playwright browsers are installed:
   ```bash
   pip install playwright
   playwright install chromium
   ```

## Basic Usage

The simplest way to run all benchmarks:

```bash
argscape benchmark run
```

This will:
1. Check server availability at `http://localhost:8000`
2. Look for datasets in the default location
3. Run all inference methods on all datasets
4. Run visualization benchmarks
5. Write results to `./results/`

## The `run` Subcommand

### Command Syntax

```bash
argscape benchmark run [OPTIONS]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output directory for results | `results` |
| `--datasets` | `-d` | Dataset directory | Generated datasets |
| `--methods` | `-m` | Comma-separated list of methods | All methods |
| `--inference-only` | | Only run inference benchmarks | False |
| `--visualization-only` | | Only run visualization benchmarks | False |
| `--repetitions` | `-r` | Number of repetitions per benchmark | 3 |
| `--timeout` | | Timeout per inference run (seconds) | 600 |
| `--server-url` | | ARGscape server URL | `http://localhost:8000` |
| `--show-browser` | | Show browser during visualization tests | False (headless) |
| `--resume` | | Resume from previous run, skip successful benchmarks | False |
| `--quiet` | `-q` | Suppress progress output | False |
| `--debug` | | Enable debug output | False |

### Examples

**Run only inference benchmarks:**

```bash
argscape benchmark run --inference-only
```

**Run specific methods:**

```bash
argscape benchmark run --methods fastgaia,midpoint,tsdate
```

**Use custom dataset directory:**

```bash
argscape benchmark run --datasets /path/to/my/datasets
```

**Run with more repetitions for stability:**

```bash
argscape benchmark run --repetitions 5
```

**Connect to a different server:**

```bash
argscape benchmark run --server-url http://localhost:9000
```

**Resume a failed benchmark run:**

```bash
argscape benchmark run --resume
```

The `--resume` flag reads previous results and skips benchmarks that completed successfully. This is useful for long-running benchmark suites that may be interrupted.

**Debug mode with visible browser:**

```bash
argscape benchmark run --visualization-only --show-browser --debug
```

## Workflow

### Step 1: Generate Datasets (Optional)

If you do not have datasets, generate them first:

```bash
argscape benchmark generate-datasets
```

See {doc}`datasets` for details on dataset generation.

### Step 2: Start the Server

In a separate terminal:

```bash
argscape serve --no-browser
```

The benchmark tool will verify the server is running before proceeding.

### Step 3: Run Benchmarks

```bash
argscape benchmark run --output my_results
```

Progress is displayed as benchmarks run:

```
Checking server at http://localhost:8000...
Server is available
Clearing session...
Found 7 datasets

=== Running Inference Benchmarks ===
Using server at http://localhost:8000
[1/56] fastgaia on samples_50 (API)...
[2/56] fastgaia on samples_100 (API)...
...

=== Running Visualization Benchmarks ===
Using server at http://localhost:8000
Running visualization benchmarks on 7 datasets...

Results written to my_results
```

### Step 4: Generate Reports

After benchmarks complete, generate publication-ready reports:

```bash
argscape benchmark report --results my_results
```

This creates:
- LaTeX tables in `my_results/tables/`
- Matplotlib plots in `my_results/figures/`

## Output Directory Structure

After a complete benchmark run, the output directory contains:

```
results/
  inference/
    raw_metrics.csv        # All inference measurements
    outputs/               # Inference output files (if using subprocess mode)
  visualization/
    raw_metrics.csv        # All visualization measurements
  tables/
    inference_comparison.tex  # LaTeX table
  figures/
    scaling_plots.png      # PNG plots
    scaling_plots.pdf      # PDF plots for papers
  summary.json             # Complete JSON with system info
```

## Timing and Repetitions

Each benchmark is run multiple times (default: 3) to improve measurement stability. The result with the median wall time is reported.

For accurate timing:
- Close other applications to reduce CPU contention
- Use a machine with consistent performance (avoid laptops in power-saving mode)
- Consider longer timeouts for large datasets

## Memory Measurement

Memory usage is measured server-side when running via the API. The `peak_memory_mb` metric reflects the maximum memory consumed during the inference process.

## Timeout Handling

If an inference method exceeds the timeout (default: 10 minutes):
- The benchmark is terminated
- The result is recorded with an error message
- The benchmark suite continues with the next method/dataset

Increase the timeout for large datasets:

```bash
argscape benchmark run --timeout 1800  # 30 minutes
```

## Troubleshooting

### Server Not Available

```
Error: ARGscape server not available at http://localhost:8000.
Start the server first with: argscape serve --no-browser
```

Ensure the server is running and accessible at the specified URL.

### No Datasets Found

```
Error: No datasets found. Run 'argscape benchmark generate-datasets' first.
```

Generate datasets or specify a directory containing `.trees` files.

### Playwright Not Installed

```
RuntimeError: Playwright is required for visualization benchmarks.
Install with: pip install playwright && playwright install
```

Install Playwright and browser drivers:

```bash
pip install playwright
playwright install chromium
```

### Timeout Errors

If methods consistently time out, consider:
- Using smaller datasets
- Increasing the timeout value
- Excluding slow methods with `--methods`
