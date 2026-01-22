"""Configuration for benchmark runs."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Dict, Any


@dataclass
class InferenceMethodConfig:
    """Configuration for a single inference method."""
    name: str
    enabled: bool = True
    params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DatasetConfig:
    """Configuration for benchmark datasets."""
    simulated_dir: Path = field(default_factory=lambda: Path("datasets/simulated"))
    real_dir: Path = field(default_factory=lambda: Path("datasets/real"))

    # Scaling series configurations
    sample_counts: List[int] = field(default_factory=lambda: [50, 100, 250, 500])
    sequence_lengths: List[float] = field(default_factory=lambda: [1e5, 1e6, 1e7])
    random_seed: int = 42


@dataclass
class BenchmarkConfig:
    """Main benchmark configuration."""
    output_dir: Path = field(default_factory=lambda: Path("results"))

    # What to benchmark
    inference_only: bool = False
    visualization_only: bool = False

    # Inference methods to benchmark
    inference_methods: List[InferenceMethodConfig] = field(default_factory=lambda: [
        InferenceMethodConfig("fastgaia"),
        InferenceMethodConfig("gaia-quadratic"),
        InferenceMethodConfig("gaia-linear"),
        InferenceMethodConfig("midpoint", params={"weighted": True}),
        InferenceMethodConfig("midpoint", params={"weighted": False}),
        InferenceMethodConfig("sparg"),
        InferenceMethodConfig("spacetrees"),
        InferenceMethodConfig("tsdate"),
    ])

    # Visualization tools to benchmark
    visualization_tools: List[str] = field(default_factory=lambda: [
        "argscape-2d",
        "argscape-3d",
        "lorax",
        "tskit_arg_visualizer",
    ])

    # Dataset configuration
    datasets: DatasetConfig = field(default_factory=DatasetConfig)

    # Number of repetitions for timing stability
    repetitions: int = 3

    # Timeout per inference run in seconds (default 10 minutes)
    timeout: float = 600.0

    # Playwright options
    headless: bool = True
    browser: str = "chromium"
