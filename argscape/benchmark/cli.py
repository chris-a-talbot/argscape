# argscape/benchmark/cli.py
"""Command-line interface for ARGscape benchmarking."""

import argparse
import sys
from pathlib import Path
from typing import Optional, List

from .config import BenchmarkConfig, DatasetConfig
from .runner import run_benchmarks, generate_reports
from .datasets import generate_benchmark_datasets


def cmd_run(args: argparse.Namespace) -> int:
    """Run benchmarks."""
    config = BenchmarkConfig(
        output_dir=Path(args.output),
        inference_only=args.inference_only,
        visualization_only=args.visualization_only,
        repetitions=args.repetitions,
        timeout=args.timeout,
        headless=not args.show_browser,
    )

    # Filter methods if specified
    if args.methods:
        method_names = [m.strip() for m in args.methods.split(",")]
        config.inference_methods = [
            m for m in config.inference_methods
            if m.name in method_names
        ]

    try:
        run_benchmarks(
            config=config,
            datasets_dir=Path(args.datasets) if args.datasets else None,
            server_url=args.server_url,
            quiet=args.quiet,
            debug=args.debug,
            resume=args.resume,
        )
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def cmd_generate_datasets(args: argparse.Namespace) -> int:
    """Generate benchmark datasets."""
    config = DatasetConfig(
        simulated_dir=Path(args.output),
        random_seed=args.seed,
    )

    if args.samples:
        config.sample_counts = [int(s) for s in args.samples.split(",")]

    if args.sequence_lengths:
        config.sequence_lengths = [float(s) for s in args.sequence_lengths.split(",")]

    try:
        datasets = generate_benchmark_datasets(config, quiet=args.quiet)
        if not args.quiet:
            print(f"Generated {len(datasets)} datasets in {args.output}")
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def cmd_report(args: argparse.Namespace) -> int:
    """Generate reports from benchmark results."""
    config = BenchmarkConfig(output_dir=Path(args.results))

    try:
        generate_reports(config, format=args.format, quiet=args.quiet)
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def build_parser() -> argparse.ArgumentParser:
    """Build argument parser."""
    from argscape import __version__

    parser = argparse.ArgumentParser(
        prog="argscape_benchmark",
        description="ARGscape benchmarking tools for measuring inference and visualization performance.",
    )
    parser.add_argument(
        "--version", action="version",
        version=f"ARGscape {__version__}",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # run subcommand
    p_run = subparsers.add_parser("run", help="Run benchmarks")
    p_run.add_argument(
        "--output", "-o", default="results",
        help="Output directory for results (default: results)",
    )
    p_run.add_argument(
        "--datasets", "-d",
        help="Dataset directory (default: use generated datasets)",
    )
    p_run.add_argument(
        "--methods", "-m",
        help="Comma-separated list of inference methods to benchmark",
    )
    p_run.add_argument(
        "--inference-only", action="store_true",
        help="Only run inference benchmarks",
    )
    p_run.add_argument(
        "--visualization-only", action="store_true",
        help="Only run visualization benchmarks",
    )
    p_run.add_argument(
        "--repetitions", "-r", type=int, default=3,
        help="Number of repetitions for timing stability (default: 3)",
    )
    p_run.add_argument(
        "--show-browser", action="store_true",
        help="Show browser during visualization benchmarks",
    )
    p_run.add_argument(
        "--server-url", default="http://localhost:8000",
        help="ARGscape server URL (required - start server first with: argscape --no-browser)",
    )
    p_run.add_argument(
        "--quiet", "-q", action="store_true",
        help="Suppress progress output",
    )
    p_run.add_argument(
        "--debug", action="store_true",
        help="Enable debug output from subprocess",
    )
    p_run.add_argument(
        "--timeout", type=float, default=600.0,
        help="Timeout per inference run in seconds (default: 600 = 10 minutes)",
    )
    p_run.add_argument(
        "--resume", action="store_true",
        help="Resume from previous run, only re-running failed/timed-out benchmarks",
    )
    p_run.set_defaults(func=cmd_run)

    # generate-datasets subcommand
    p_gen = subparsers.add_parser(
        "generate-datasets",
        help="Generate standardized benchmark datasets",
    )
    p_gen.add_argument(
        "--output", "-o", default="datasets/simulated",
        help="Output directory for datasets (default: datasets/simulated)",
    )
    p_gen.add_argument(
        "--samples",
        help="Comma-separated sample counts (default: 50,100,250,500)",
    )
    p_gen.add_argument(
        "--sequence-lengths",
        help="Comma-separated sequence lengths (default: 1e5,1e6,1e7)",
    )
    p_gen.add_argument(
        "--seed", type=int, default=42,
        help="Random seed for reproducibility (default: 42)",
    )
    p_gen.add_argument(
        "--quiet", "-q", action="store_true",
        help="Suppress progress output",
    )
    p_gen.set_defaults(func=cmd_generate_datasets)

    # report subcommand
    p_report = subparsers.add_parser(
        "report",
        help="Generate reports from benchmark results",
    )
    p_report.add_argument(
        "--results", "-r", default="results",
        help="Results directory (default: results)",
    )
    p_report.add_argument(
        "--format", "-f", choices=["latex", "plots", "all"], default="all",
        help="Output format (default: all)",
    )
    p_report.add_argument(
        "--quiet", "-q", action="store_true",
        help="Suppress progress output",
    )
    p_report.set_defaults(func=cmd_report)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    """Main entry point."""
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
