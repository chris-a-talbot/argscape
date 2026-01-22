# argscape/benchmark/runner.py
"""Main benchmark runner that orchestrates all benchmarks."""

import csv
from pathlib import Path
from typing import List, Optional, Set, Tuple

from .config import BenchmarkConfig
from .datasets import list_datasets, generate_benchmark_datasets
from .inference import run_inference_benchmarks, InferenceResult
from .visualization import run_visualization_benchmarks, VisualizationResult
from .api_runner import check_server_available, clear_session
from .reporters import (
    write_inference_csv,
    write_visualization_csv,
    write_summary_json,
    generate_latex_tables,
    generate_plots,
)


def load_successful_benchmarks(csv_path: Path) -> Tuple[Set[Tuple[str, str]], List[InferenceResult]]:
    """Load previous benchmark results and identify successful runs.

    Args:
        csv_path: Path to the raw_metrics.csv file

    Returns:
        Tuple of (set of (method, dataset) pairs that succeeded, list of all results)
    """
    successful = set()
    all_results = []

    if not csv_path.exists():
        return successful, all_results

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            method = row.get("method", "")
            dataset = row.get("dataset", "")
            error = row.get("error", "")

            # Create InferenceResult from row
            result = InferenceResult(
                method=method,
                dataset=dataset,
                wall_time_s=float(row.get("wall_time_s", 0)),
                cpu_time_s=float(row.get("cpu_time_s", 0)),
                peak_memory_mb=float(row.get("peak_memory_mb", 0)),
                num_nodes=int(row.get("num_nodes", 0)),
                num_samples=int(row.get("num_samples", 0)),
                num_trees=int(row.get("num_trees", 0)),
                error=error if error else None,
            )
            all_results.append(result)

            # Consider successful if no error and wall_time > 0
            if not error and float(row.get("wall_time_s", 0)) > 0:
                successful.add((method, dataset))

    return successful, all_results


def run_benchmarks(
    config: BenchmarkConfig,
    datasets_dir: Optional[Path] = None,
    server_url: str = "http://localhost:8000",
    quiet: bool = False,
    debug: bool = False,
    resume: bool = False,
) -> None:
    """Run all configured benchmarks.

    Requires the ARGscape server to be running at server_url for both
    inference and visualization benchmarks.

    Args:
        config: Benchmark configuration
        datasets_dir: Override dataset directory
        server_url: ARGscape server URL (required for both inference and visualization)
        quiet: Suppress progress output
        debug: Enable debug output
        resume: If True, skip benchmarks that succeeded in previous run
    """
    output_dir = Path(config.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Check server availability - required for both inference and visualization
    if not quiet:
        print(f"Checking server at {server_url}...")

    if not check_server_available(server_url):
        raise RuntimeError(
            f"ARGscape server not available at {server_url}.\n"
            "Start the server first with: argscape --no-browser\n"
            "Or: uvicorn argscape.api.main:app --port 8000"
        )

    if not quiet:
        print("Server is available")

    # Clear any existing files from previous sessions
    if not quiet:
        print("Clearing session...")
    clear_session(server_url)

    # Get datasets
    if datasets_dir:
        datasets = list(Path(datasets_dir).glob("*.trees"))
    else:
        datasets = list_datasets(config.datasets)

    if not datasets:
        raise RuntimeError(
            "No datasets found. Run 'argscape_benchmark generate-datasets' first."
        )

    if not quiet:
        print(f"Found {len(datasets)} datasets")

    # Load previous results if resuming
    skip_benchmarks: Set[Tuple[str, str]] = set()
    previous_results: List[InferenceResult] = []
    if resume:
        csv_path = output_dir / "inference" / "raw_metrics.csv"
        skip_benchmarks, previous_results = load_successful_benchmarks(csv_path)
        if not quiet and skip_benchmarks:
            print(f"Resuming: skipping {len(skip_benchmarks)} successful benchmarks")

    inference_results: List[InferenceResult] = []
    visualization_results: List[VisualizationResult] = []

    # Run inference benchmarks via API
    if not config.visualization_only:
        if not quiet:
            print("\n=== Running Inference Benchmarks ===")
            print(f"Using server at {server_url}")
        new_results = run_inference_benchmarks(
            config=config,
            datasets=datasets,
            quiet=quiet,
            debug=debug,
            server_url=server_url,
            skip_benchmarks=skip_benchmarks,
        )

        # Merge with previous successful results
        if resume and previous_results:
            # Keep successful results from previous run, add new results
            successful_previous = [r for r in previous_results if r.error is None]
            inference_results = successful_previous + new_results
        else:
            inference_results = new_results

        # Write inference results
        write_inference_csv(
            inference_results,
            output_dir / "inference" / "raw_metrics.csv",
        )

    # Run visualization benchmarks
    if not config.inference_only:
        if not quiet:
            print("\n=== Running Visualization Benchmarks ===")
            print(f"Using server at {server_url}")
        visualization_results = run_visualization_benchmarks(
            datasets=datasets,
            tools=config.visualization_tools,
            server_url=server_url,
            headless=config.headless,
            quiet=quiet,
        )

        # Write visualization results
        write_visualization_csv(
            visualization_results,
            output_dir / "visualization" / "raw_metrics.csv",
        )

    # Write summary
    write_summary_json(
        inference_results,
        visualization_results,
        output_dir / "summary.json",
    )

    if not quiet:
        print(f"\nResults written to {output_dir}")


def generate_reports(
    config: BenchmarkConfig,
    format: str = "all",
    quiet: bool = False,
) -> None:
    """Generate reports from existing benchmark results.

    Args:
        config: Benchmark configuration
        format: Output format ("latex", "plots", or "all")
        quiet: Suppress progress output
    """
    import json

    output_dir = Path(config.output_dir)
    summary_path = output_dir / "summary.json"

    if not summary_path.exists():
        raise RuntimeError(
            f"No benchmark results found at {summary_path}. "
            "Run 'argscape_benchmark run' first."
        )

    with open(summary_path) as f:
        summary = json.load(f)

    # Reconstruct result objects
    inference_results = [
        InferenceResult(**r) for r in summary.get("inference_results", [])
    ]

    if format in ("latex", "all"):
        if not quiet:
            print("Generating LaTeX tables...")
        generate_latex_tables(inference_results, output_dir / "tables")

    if format in ("plots", "all"):
        if not quiet:
            print("Generating plots...")
        generate_plots(inference_results, output_dir / "figures")

    if not quiet:
        print(f"Reports written to {output_dir}")
