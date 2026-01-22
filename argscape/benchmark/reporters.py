# argscape/benchmark/reporters.py
"""Output benchmark results in various formats."""

import csv
import json
import platform
import sys
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

from .inference import InferenceResult
from .visualization import VisualizationResult


def get_system_info() -> Dict[str, Any]:
    """Collect system information for reproducibility."""
    import argscape

    info = {
        "timestamp": datetime.now().isoformat(),
        "argscape_version": argscape.__version__,
        "python_version": sys.version,
        "platform": platform.platform(),
        "processor": platform.processor(),
        "machine": platform.machine(),
    }

    # Try to get dependency versions
    deps = {}
    for pkg in ["tskit", "msprime", "fastgaia", "gaiapy", "playwright"]:
        try:
            mod = __import__(pkg)
            deps[pkg] = getattr(mod, "__version__", "unknown")
        except ImportError:
            deps[pkg] = "not installed"

    info["dependencies"] = deps

    return info


def write_inference_csv(
    results: List[InferenceResult],
    output_path: Path,
) -> None:
    """Write inference results to CSV.

    Args:
        results: List of inference results
        output_path: Path to output CSV file
    """
    if not results:
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Get all possible fields
    fieldnames = list(results[0].to_dict().keys())

    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for result in results:
            writer.writerow(result.to_dict())


def write_visualization_csv(
    results: List[VisualizationResult],
    output_path: Path,
) -> None:
    """Write visualization results to CSV.

    Args:
        results: List of visualization results
        output_path: Path to output CSV file
    """
    if not results:
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = list(results[0].to_dict().keys())

    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for result in results:
            writer.writerow(result.to_dict())


def write_summary_json(
    inference_results: List[InferenceResult],
    visualization_results: List[VisualizationResult],
    output_path: Path,
) -> None:
    """Write summary JSON with all results and system info.

    Args:
        inference_results: List of inference results
        visualization_results: List of visualization results
        output_path: Path to output JSON file
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    summary = {
        "system_info": get_system_info(),
        "inference_results": [r.to_dict() for r in inference_results],
        "visualization_results": [r.to_dict() for r in visualization_results],
    }

    with open(output_path, 'w') as f:
        json.dump(summary, f, indent=2)


def generate_latex_tables(
    inference_results: List[InferenceResult],
    output_dir: Path,
) -> None:
    """Generate LaTeX tables for paper.

    Args:
        inference_results: List of inference results
        output_dir: Directory to write tables
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Group by dataset for comparison table
    by_dataset: Dict[str, List[InferenceResult]] = {}
    for r in inference_results:
        if r.dataset not in by_dataset:
            by_dataset[r.dataset] = []
        by_dataset[r.dataset].append(r)

    # Method comparison table
    latex = [
        r"\begin{table}[htbp]",
        r"\centering",
        r"\caption{Inference Method Performance Comparison}",
        r"\begin{tabular}{lrrrrr}",
        r"\toprule",
        r"Method & Time (s) & Memory (MB) & Mean Error & Median Error \\",
        r"\midrule",
    ]

    # Aggregate across datasets
    by_method: Dict[str, List[InferenceResult]] = {}
    for r in inference_results:
        if r.method not in by_method:
            by_method[r.method] = []
        by_method[r.method].append(r)

    for method, results in sorted(by_method.items()):
        avg_time = sum(r.wall_time_s for r in results) / len(results)
        avg_memory = sum(r.peak_memory_mb for r in results) / len(results)

        # Get accuracy (spatial or temporal)
        mean_errors = []
        median_errors = []
        for r in results:
            if r.spatial_accuracy:
                mean_errors.append(r.spatial_accuracy.mean_error_km)
                median_errors.append(r.spatial_accuracy.median_error_km)
            elif r.temporal_accuracy:
                mean_errors.append(r.temporal_accuracy.mean_error)
                median_errors.append(r.temporal_accuracy.median_error)

        mean_err = sum(mean_errors) / len(mean_errors) if mean_errors else float('nan')
        median_err = sum(median_errors) / len(median_errors) if median_errors else float('nan')

        latex.append(
            f"{method} & {avg_time:.2f} & {avg_memory:.1f} & {mean_err:.2f} & {median_err:.2f} \\\\"
        )

    latex.extend([
        r"\bottomrule",
        r"\end{tabular}",
        r"\label{tab:inference-comparison}",
        r"\end{table}",
    ])

    with open(output_dir / "inference_comparison.tex", 'w') as f:
        f.write("\n".join(latex))


def generate_plots(
    inference_results: List[InferenceResult],
    output_dir: Path,
) -> None:
    """Generate matplotlib plots for paper.

    Args:
        inference_results: List of inference results
        output_dir: Directory to write plots
    """
    try:
        import matplotlib.pyplot as plt
        import numpy as np
    except ImportError:
        print("matplotlib not available, skipping plot generation")
        return

    output_dir.mkdir(parents=True, exist_ok=True)

    # Scaling plot: time vs num_samples
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # Group by method
    by_method: Dict[str, List[InferenceResult]] = {}
    for r in inference_results:
        if r.method not in by_method:
            by_method[r.method] = []
        by_method[r.method].append(r)

    # Time scaling
    ax = axes[0]
    for method, results in by_method.items():
        results = sorted(results, key=lambda r: r.num_samples)
        samples = [r.num_samples for r in results]
        times = [r.wall_time_s for r in results]
        ax.plot(samples, times, 'o-', label=method)

    ax.set_xlabel("Number of Samples")
    ax.set_ylabel("Wall Time (s)")
    ax.set_title("Inference Time Scaling")
    ax.legend()
    ax.set_xscale('log')
    ax.set_yscale('log')

    # Memory scaling
    ax = axes[1]
    for method, results in by_method.items():
        results = sorted(results, key=lambda r: r.num_samples)
        samples = [r.num_samples for r in results]
        memory = [r.peak_memory_mb for r in results]
        ax.plot(samples, memory, 'o-', label=method)

    ax.set_xlabel("Number of Samples")
    ax.set_ylabel("Peak Memory (MB)")
    ax.set_title("Memory Usage Scaling")
    ax.legend()
    ax.set_xscale('log')
    ax.set_yscale('log')

    plt.tight_layout()
    plt.savefig(output_dir / "scaling_plots.png", dpi=150)
    plt.savefig(output_dir / "scaling_plots.pdf")
    plt.close()
