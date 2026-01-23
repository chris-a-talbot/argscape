# Benchmark Datasets

The benchmarking system includes tools for generating standardized datasets with known ground truth. These datasets enable fair comparison of inference methods and measurement of accuracy.

## Generating Datasets

Use the `generate-datasets` subcommand to create benchmark datasets:

```bash
argscape_benchmark generate-datasets
```

This creates simulated tree sequences with spatial locations assigned to samples.

## Command Options

```bash
argscape_benchmark generate-datasets [OPTIONS]
```

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output directory | `datasets/simulated` |
| `--samples` | | Comma-separated sample counts | `50,100,250,500` |
| `--sequence-lengths` | | Comma-separated sequence lengths | `1e5,1e6,1e7` |
| `--seed` | | Random seed for reproducibility | `42` |
| `--quiet` | `-q` | Suppress progress output | False |

## Standard Dataset Configuration

By default, the system generates two series of datasets:

### Sample Scaling Series

Datasets with varying numbers of samples but fixed sequence length (1 Mb):

| Dataset Name | Samples | Sequence Length |
|--------------|---------|-----------------|
| `samples_50` | 50 | 1,000,000 bp |
| `samples_100` | 100 | 1,000,000 bp |
| `samples_250` | 250 | 1,000,000 bp |
| `samples_500` | 500 | 1,000,000 bp |

This series tests how methods scale with the number of individuals.

### Sequence Length Scaling Series

Datasets with fixed sample count (100) but varying sequence lengths:

| Dataset Name | Samples | Sequence Length |
|--------------|---------|-----------------|
| `seqlen_100000` | 100 | 100,000 bp |
| `seqlen_1000000` | 100 | 1,000,000 bp |
| `seqlen_10000000` | 100 | 10,000,000 bp |

This series tests how methods scale with genome size (and consequently, the number of local trees).

## Custom Dataset Generation

### Different Sample Counts

```bash
argscape_benchmark generate-datasets --samples 25,50,75,100,150,200
```

### Different Sequence Lengths

```bash
argscape_benchmark generate-datasets --sequence-lengths 5e4,1e5,5e5,1e6
```

### Combined Customization

```bash
argscape_benchmark generate-datasets \
    --output my_datasets \
    --samples 50,100,200 \
    --sequence-lengths 1e5,1e6 \
    --seed 12345
```

## Simulation Parameters

Datasets are generated using msprime with the following parameters:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Recombination rate | 1e-8 | Per-base per-generation |
| Mutation rate | 1e-8 | Per-base per-generation |
| Population size | 10,000 | Effective population size |
| Random seed | 42 (default) | For reproducibility |

These parameters produce realistic tree sequences representative of human genetic data.

## Spatial Locations

Sample individuals are assigned spatial locations using a uniform distribution within a square area (100 x 100 coordinate units by default).

The spatial distribution options include:

- **uniform_square**: Uniform random locations in a square area
- **uniform_globe**: Random latitude/longitude coordinates (avoiding extreme latitudes)

## Ground Truth

Each generated dataset includes known ground truth for accuracy testing:

### What Constitutes Ground Truth

For simulated datasets:
- **Sample locations**: The assigned spatial coordinates
- **Ancestor times**: The true coalescence times from the simulation
- **Tree topology**: The true genealogical relationships

### How Accuracy is Measured

During benchmarking, inferred values are compared to ground truth:

- **Spatial inference**: Inferred ancestor locations are compared to the simulation's internal locations (if available) or the expected locations based on the dispersal model
- **Temporal inference**: Inferred node times are compared to true coalescence times

## Dataset Metadata

Each `.trees` file has an accompanying `.json` metadata file:

```json
{
  "name": "samples_100",
  "num_samples": 100,
  "sequence_length": 1000000.0,
  "num_trees": 1523,
  "num_nodes": 2534,
  "recombination_rate": 1e-08,
  "population_size": 10000,
  "random_seed": 42,
  "spatial_distribution": "uniform_square",
  "has_ground_truth": true
}
```

This metadata is used during benchmarking to:
- Report dataset characteristics in results
- Determine if accuracy metrics can be computed
- Ensure reproducibility

## Using Your Own Datasets

You can benchmark against your own datasets by specifying a directory:

```bash
argscape_benchmark run --datasets /path/to/your/datasets
```

Requirements for custom datasets:
- Files must have `.trees` extension
- Files must be valid tskit tree sequences
- For accuracy testing, samples should have locations in individual metadata

### Adding Metadata for Custom Datasets

Create a `.json` file with the same base name as your `.trees` file:

```json
{
  "name": "my_dataset",
  "num_samples": 150,
  "sequence_length": 5000000.0,
  "num_trees": 3200,
  "num_nodes": 4500,
  "has_ground_truth": false
}
```

Set `has_ground_truth` to `true` only if your dataset includes known true locations/times for accuracy comparison.

## Dataset Organization

The default directory structure:

```
datasets/
  simulated/
    samples_50.trees
    samples_50.json
    samples_100.trees
    samples_100.json
    ...
  real/
    (for real-world datasets)
```

The benchmark runner searches both `simulated/` and `real/` subdirectories by default.

## Reproducibility

### Ensuring Identical Datasets

Use the same random seed to generate identical datasets:

```bash
argscape_benchmark generate-datasets --seed 42
```

Different seeds produce different random topologies and locations.

### Version Considerations

Dataset characteristics may vary slightly between msprime versions. Record the msprime version (stored in `summary.json`) for reproducibility.

## Memory Considerations

Large datasets require more memory for both generation and benchmarking:

| Samples | Sequence Length | Approx. File Size | Memory for Inference |
|---------|-----------------|-------------------|---------------------|
| 50 | 1 Mb | ~1 MB | ~100-200 MB |
| 100 | 1 Mb | ~3 MB | ~200-400 MB |
| 250 | 1 Mb | ~10 MB | ~500-800 MB |
| 500 | 1 Mb | ~30 MB | ~1-2 GB |
| 100 | 10 Mb | ~25 MB | ~500 MB - 1 GB |

Plan your benchmark suite according to available system resources.

## Tips for Dataset Selection

### For Method Comparison

- Use multiple sample counts to understand scaling behavior
- Include both small datasets (fast iteration) and large datasets (stress testing)
- Use consistent random seeds across benchmark runs

### For Accuracy Analysis

- Simulated datasets provide ground truth for quantitative accuracy metrics
- Real datasets may be used for qualitative evaluation but lack ground truth
- Consider the spatial extent and distribution when interpreting spatial errors

### For Publication

- Document all simulation parameters
- Use consistent seeds for reproducibility
- Generate datasets covering the range of interest for your research question
