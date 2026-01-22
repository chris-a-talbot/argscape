# argscape/benchmark/__init__.py
"""
ARGscape Benchmarking Module.

Provides tools for measuring inference performance, visualization performance,
and accuracy against ground truth datasets.

Requires the ARGscape server to be running. Start with: argscape serve --no-browser

Install with: pip install argscape[spatial]
For visualization benchmarks: pip install playwright && playwright install chromium
"""

from argscape.spatial import require_web

# Benchmarking requires the web server
require_web("The benchmark module")

from .config import BenchmarkConfig, DatasetConfig, InferenceMethodConfig
from .runner import run_benchmarks, generate_reports
from .datasets import generate_benchmark_datasets, list_datasets
from .inference import InferenceResult
from .visualization import VisualizationResult
from .api_runner import check_server_available

__all__ = [
    "BenchmarkConfig",
    "DatasetConfig",
    "InferenceMethodConfig",
    "run_benchmarks",
    "generate_reports",
    "generate_benchmark_datasets",
    "list_datasets",
    "InferenceResult",
    "VisualizationResult",
    "check_server_available",
]
