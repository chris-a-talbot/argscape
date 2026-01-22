# argscape/benchmark/datasets.py
"""Generate and manage standardized benchmark datasets."""

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List, Optional, Tuple
import numpy as np

try:
    import msprime
    import tskit
    MSPRIME_AVAILABLE = True
except ImportError:
    MSPRIME_AVAILABLE = False

from .config import DatasetConfig


def _add_spatial_locations(
    ts: "tskit.TreeSequence",
    distribution: str = "uniform_square",
    extent: float = 100.0,
    seed: int = 42,
) -> "tskit.TreeSequence":
    """Add spatial locations to sample individuals.

    Args:
        ts: Input tree sequence
        distribution: Location distribution type
        extent: Spatial extent (width/height of area)
        seed: Random seed for reproducibility

    Returns:
        Tree sequence with spatial locations added to individuals
    """
    rng = np.random.default_rng(seed)
    tables = ts.dump_tables()

    # Clear existing individuals
    tables.individuals.clear()

    # Get sample nodes
    sample_nodes = [n for n in ts.nodes() if n.flags & tskit.NODE_IS_SAMPLE]

    # Generate locations based on distribution
    n_samples = len(sample_nodes)
    if distribution == "uniform_square":
        locations = rng.uniform(0, extent, size=(n_samples, 2))
    elif distribution == "uniform_globe":
        # Lat/lon coordinates
        lons = rng.uniform(-180, 180, n_samples)
        lats = rng.uniform(-60, 70, n_samples)  # Avoid extreme latitudes
        locations = np.column_stack([lons, lats])
    else:
        raise ValueError(f"Unknown distribution: {distribution}")

    # Create individuals with locations and update nodes
    node_individual_map = {}
    for i, node in enumerate(sample_nodes):
        ind_id = tables.individuals.add_row(location=locations[i])
        node_individual_map[node.id] = ind_id

    # Update nodes table with individual references
    nodes = tables.nodes.copy()
    tables.nodes.clear()
    for node in ts.nodes():
        ind_id = node_individual_map.get(node.id, -1)
        tables.nodes.append(node.replace(individual=ind_id))

    return tables.tree_sequence()


@dataclass
class DatasetMetadata:
    """Metadata for a generated dataset."""
    name: str
    num_samples: int
    sequence_length: float
    num_trees: int
    num_nodes: int
    recombination_rate: float
    population_size: int
    random_seed: int
    spatial_distribution: str
    has_ground_truth: bool


def generate_simulated_dataset(
    name: str,
    num_samples: int,
    sequence_length: float,
    output_dir: Path,
    recombination_rate: float = 1e-8,
    population_size: int = 10000,
    random_seed: int = 42,
    spatial_distribution: str = "uniform_square",
    spatial_extent: float = 100.0,
) -> Tuple[Path, DatasetMetadata]:
    """Generate a simulated dataset with known ground truth.

    Args:
        name: Dataset name
        num_samples: Number of samples
        sequence_length: Sequence length in base pairs
        output_dir: Directory to save dataset
        recombination_rate: Recombination rate
        population_size: Effective population size
        random_seed: Random seed for reproducibility
        spatial_distribution: How to distribute sample locations
        spatial_extent: Spatial extent for locations

    Returns:
        Tuple of (path to .trees file, metadata)
    """
    if not MSPRIME_AVAILABLE:
        raise RuntimeError("msprime is required for dataset generation")

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Simulate ancestry
    ts = msprime.sim_ancestry(
        samples=num_samples,
        sequence_length=sequence_length,
        recombination_rate=recombination_rate,
        population_size=population_size,
        random_seed=random_seed,
    )

    # Add mutations for more realistic tree sequences
    ts = msprime.sim_mutations(ts, rate=1e-8, random_seed=random_seed)

    # Add spatial locations to samples
    ts = _add_spatial_locations(
        ts,
        distribution=spatial_distribution,
        extent=spatial_extent,
        seed=random_seed,
    )

    # Save tree sequence
    ts_path = output_dir / f"{name}.trees"
    ts.dump(str(ts_path))

    # Create metadata
    metadata = DatasetMetadata(
        name=name,
        num_samples=num_samples,
        sequence_length=sequence_length,
        num_trees=ts.num_trees,
        num_nodes=ts.num_nodes,
        recombination_rate=recombination_rate,
        population_size=population_size,
        random_seed=random_seed,
        spatial_distribution=spatial_distribution,
        has_ground_truth=True,
    )

    # Save metadata
    metadata_path = output_dir / f"{name}.json"
    with open(metadata_path, 'w') as f:
        json.dump(asdict(metadata), f, indent=2)

    return ts_path, metadata


def generate_benchmark_datasets(
    config: DatasetConfig,
    quiet: bool = False,
) -> List[Tuple[Path, DatasetMetadata]]:
    """Generate all benchmark datasets according to configuration.

    Args:
        config: Dataset configuration
        quiet: Suppress progress output

    Returns:
        List of (path, metadata) tuples for generated datasets
    """
    output_dir = Path(config.simulated_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    datasets = []

    # Generate sample scaling series (fixed sequence length)
    base_seq_len = 1e6
    for n_samples in config.sample_counts:
        name = f"samples_{n_samples}"
        if not quiet:
            print(f"Generating {name}...")
        path, meta = generate_simulated_dataset(
            name=name,
            num_samples=n_samples,
            sequence_length=base_seq_len,
            output_dir=output_dir,
            random_seed=config.random_seed,
        )
        datasets.append((path, meta))

    # Generate sequence length scaling series (fixed sample count)
    base_samples = 100
    for seq_len in config.sequence_lengths:
        name = f"seqlen_{int(seq_len)}"
        if not quiet:
            print(f"Generating {name}...")
        path, meta = generate_simulated_dataset(
            name=name,
            num_samples=base_samples,
            sequence_length=seq_len,
            output_dir=output_dir,
            random_seed=config.random_seed,
        )
        datasets.append((path, meta))

    return datasets


def list_datasets(config: DatasetConfig) -> List[Path]:
    """List available benchmark datasets.

    Args:
        config: Dataset configuration

    Returns:
        List of paths to .trees files
    """
    datasets = []

    # Check configured directories
    for directory in [config.simulated_dir, config.real_dir]:
        dir_path = Path(directory)
        if dir_path.exists():
            datasets.extend(dir_path.glob("*.trees"))

    # Also check parent directory (datasets/) if subdirs are empty
    if not datasets:
        parent = Path(config.simulated_dir).parent
        if parent.exists() and parent != Path(config.simulated_dir):
            datasets.extend(parent.glob("*.trees"))

    return sorted(datasets)


def load_dataset_metadata(ts_path: Path) -> Optional[DatasetMetadata]:
    """Load metadata for a dataset if available.

    Args:
        ts_path: Path to .trees file

    Returns:
        DatasetMetadata if metadata file exists, None otherwise
    """
    metadata_path = ts_path.with_suffix('.json')
    if not metadata_path.exists():
        return None

    with open(metadata_path) as f:
        data = json.load(f)

    return DatasetMetadata(**data)
