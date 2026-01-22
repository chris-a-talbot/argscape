# argscape/benchmark/inference.py
"""Benchmark inference methods."""

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Any, Optional

from .config import BenchmarkConfig, InferenceMethodConfig
from .subprocess_runner import run_inference_subprocess, SubprocessResult
from .api_runner import run_inference_api, check_server_available, APIResult
from .accuracy import (
    compute_spatial_accuracy,
    compute_temporal_accuracy,
    SpatialAccuracyMetrics,
    TemporalAccuracyMetrics,
)
from .datasets import load_dataset_metadata


@dataclass
class InferenceResult:
    """Result from benchmarking a single inference method on a single dataset."""
    method: str
    dataset: str
    wall_time_s: float
    cpu_time_s: float
    peak_memory_mb: float
    num_nodes: int
    num_samples: int
    num_trees: int
    spatial_accuracy: Optional[SpatialAccuracyMetrics] = None
    temporal_accuracy: Optional[TemporalAccuracyMetrics] = None
    inference_info: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for CSV/JSON output."""
        d = {
            "method": self.method,
            "dataset": self.dataset,
            "wall_time_s": self.wall_time_s,
            "cpu_time_s": self.cpu_time_s,
            "peak_memory_mb": self.peak_memory_mb,
            "num_nodes": self.num_nodes,
            "num_samples": self.num_samples,
            "num_trees": self.num_trees,
            "error": self.error,
        }

        if self.spatial_accuracy:
            d["spatial_mean_error"] = self.spatial_accuracy.mean_error_km
            d["spatial_median_error"] = self.spatial_accuracy.median_error_km
            d["spatial_rmse"] = self.spatial_accuracy.rmse_km

        if self.temporal_accuracy:
            d["temporal_mean_error"] = self.temporal_accuracy.mean_error
            d["temporal_correlation"] = self.temporal_accuracy.correlation

        return d


def benchmark_inference_method(
    ts_path: Path,
    method_config: InferenceMethodConfig,
    output_dir: Path,
    ground_truth_path: Optional[Path] = None,
    timeout: float = 600.0,
    debug: bool = False,
    server_url: Optional[str] = None,
) -> InferenceResult:
    """Benchmark a single inference method on a single dataset.

    Args:
        ts_path: Path to input tree sequence
        method_config: Configuration for the inference method
        output_dir: Directory to save output
        ground_truth_path: Path to ground truth tree sequence for accuracy
        timeout: Maximum time to wait for inference
        debug: Enable debug output from subprocess
        server_url: If provided, run inference via API instead of subprocess

    Returns:
        InferenceResult with timing, memory, and accuracy metrics
    """
    import tskit

    # Load input to get stats
    ts = tskit.load(str(ts_path))
    dataset_name = ts_path.stem

    # Create output path (for subprocess mode)
    output_path = output_dir / f"{dataset_name}_{method_config.name}.trees"

    if server_url:
        # Run via API with server-side instrumentation
        api_result = run_inference_api(
            server_url=server_url,
            ts_path=ts_path,
            method=method_config.name,
            params=method_config.params,
            timeout=timeout,
            debug=debug,
        )
        wall_time = api_result.wall_time_s
        cpu_time = api_result.cpu_time_s
        peak_memory = api_result.peak_memory_mb
        inference_info = api_result.inference_info
        error = api_result.error
        output_exists = False  # API doesn't save locally
    else:
        # Run in subprocess for memory measurement
        result = run_inference_subprocess(
            ts_path=ts_path,
            method=method_config.name,
            params=method_config.params,
            output_path=output_path,
            timeout=timeout,
            debug=debug,
        )
        wall_time = result.wall_time_s
        cpu_time = result.cpu_time_s
        peak_memory = result.peak_memory_mb
        inference_info = result.inference_info
        error = result.error
        output_exists = output_path.exists()

    # Compute accuracy if ground truth available and inference succeeded
    # Note: accuracy only available in subprocess mode (output saved locally)
    spatial_accuracy = None
    temporal_accuracy = None

    if error is None and ground_truth_path and output_exists:
        is_temporal = method_config.name == "tsdate"

        if is_temporal:
            temporal_accuracy = compute_temporal_accuracy(
                output_path, ground_truth_path
            )
        else:
            spatial_accuracy = compute_spatial_accuracy(
                output_path, ground_truth_path
            )

    return InferenceResult(
        method=method_config.name,
        dataset=dataset_name,
        wall_time_s=wall_time,
        cpu_time_s=cpu_time,
        peak_memory_mb=peak_memory,
        num_nodes=ts.num_nodes,
        num_samples=ts.num_samples,
        num_trees=ts.num_trees,
        spatial_accuracy=spatial_accuracy,
        temporal_accuracy=temporal_accuracy,
        inference_info=inference_info,
        error=error,
    )


def run_inference_benchmarks(
    config: BenchmarkConfig,
    datasets: List[Path],
    quiet: bool = False,
    debug: bool = False,
    server_url: Optional[str] = None,
    skip_benchmarks: Optional[set] = None,
) -> List[InferenceResult]:
    """Run all inference benchmarks.

    Args:
        config: Benchmark configuration
        datasets: List of dataset paths to benchmark
        quiet: Suppress progress output
        debug: Enable debug output from subprocess
        server_url: If provided, run inference via API instead of subprocess
        skip_benchmarks: Set of (method, dataset) tuples to skip (for resume)

    Returns:
        List of InferenceResult objects
    """
    skip_benchmarks = skip_benchmarks or set()
    results = []
    output_dir = Path(config.output_dir) / "inference" / "outputs"
    output_dir.mkdir(parents=True, exist_ok=True)

    total = len(datasets) * len(config.inference_methods)
    current = 0
    skipped = 0

    mode_str = "API" if server_url else "subprocess"
    if not quiet and server_url:
        print(f"Running inference benchmarks via API ({server_url})")

    for ts_path in datasets:
        # Check if ground truth available
        metadata = load_dataset_metadata(ts_path)
        ground_truth_path = ts_path if metadata and metadata.has_ground_truth else None

        for method_config in config.inference_methods:
            if not method_config.enabled:
                continue

            current += 1
            dataset_name = ts_path.stem

            # Skip if already succeeded
            if (method_config.name, dataset_name) in skip_benchmarks:
                skipped += 1
                if not quiet:
                    print(f"[{current}/{total}] {method_config.name} on {dataset_name} (skipped - already succeeded)")
                continue

            if not quiet:
                print(f"[{current}/{total}] {method_config.name} on {dataset_name} ({mode_str})...")

            # Run multiple repetitions and take median
            rep_results = []
            for rep in range(config.repetitions):
                result = benchmark_inference_method(
                    ts_path=ts_path,
                    method_config=method_config,
                    output_dir=output_dir,
                    ground_truth_path=ground_truth_path,
                    timeout=config.timeout,
                    debug=debug,
                    server_url=server_url,
                )
                rep_results.append(result)

            # Use result with median wall time
            rep_results.sort(key=lambda r: r.wall_time_s)
            median_result = rep_results[len(rep_results) // 2]
            results.append(median_result)

    if not quiet and skipped > 0:
        print(f"Skipped {skipped} benchmarks that already succeeded")

    return results
