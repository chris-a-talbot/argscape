"""Unified CLI for ARGscape."""

import sys
import argparse


def main():
    """Main entry point for argscape CLI."""
    parser = argparse.ArgumentParser(
        prog="argscape",
        description="ARGscape: Interactive ARG visualization and analysis",
    )

    # Add version
    parser.add_argument(
        "--version", action="store_true",
        help="Show version and exit"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # argscape serve - start web server (requires [spatial])
    serve_parser = subparsers.add_parser(
        "serve",
        help="Start the ARGscape web application (requires argscape[spatial])"
    )
    serve_parser.add_argument("--host", default="127.0.0.1", help="Host (default: 127.0.0.1)")
    serve_parser.add_argument("--port", type=int, default=8000, help="Port (default: 8000)")
    serve_parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    serve_parser.add_argument("--no-browser", action="store_true", help="Don't open browser")
    serve_parser.add_argument("--no-tsdate", action="store_true", help="Disable tsdate")

    # argscape infer - spatial inference (requires [spatial])
    infer_parser = subparsers.add_parser(
        "infer",
        help="Run spatial/temporal inference (requires argscape[spatial])"
    )
    infer_parser.add_argument("args", nargs="*", help="Arguments passed to inference CLI")

    # argscape load - load tree sequences (requires [spatial])
    load_parser = subparsers.add_parser(
        "load",
        help="Load tree sequences into session storage (requires argscape[spatial])"
    )
    load_parser.add_argument("args", nargs="*", help="Arguments passed to load CLI")

    # argscape benchmark - run benchmarks (requires [spatial])
    benchmark_parser = subparsers.add_parser(
        "benchmark",
        help="Run benchmarks (requires argscape[spatial])"
    )
    benchmark_parser.add_argument("args", nargs="*", help="Arguments passed to benchmark CLI")

    # argscape viz - standalone visualization (base install)
    viz_parser = subparsers.add_parser(
        "viz",
        help="Standalone visualization (no server needed)"
    )
    viz_parser.add_argument("args", nargs="*", help="Arguments passed to viz CLI")

    args = parser.parse_args()

    if args.version:
        from argscape import __version__
        print(f"ARGscape {__version__}")
        return 0

    if args.command is None:
        parser.print_help()
        return 0

    if args.command == "serve":
        return _run_serve(args)
    elif args.command == "infer":
        return _run_infer(args)
    elif args.command == "load":
        return _run_load(args)
    elif args.command == "benchmark":
        return _run_benchmark(args)
    elif args.command == "viz":
        return _run_viz(args)

    return 0


def _run_serve(args):
    """Start the web server."""
    try:
        from argscape.spatial import require_web
        require_web("The 'argscape serve' command")
    except ImportError as e:
        print(f"Error: {e}", file=sys.stderr)
        print("\nInstall with: pip install argscape[spatial]", file=sys.stderr)
        return 1

    import uvicorn
    import webbrowser
    import threading
    import time
    import os

    def open_browser(host, port):
        time.sleep(1)
        webbrowser.open(f"http://{host}:{port}")

    if not args.no_browser:
        threading.Thread(target=open_browser, args=(args.host, args.port), daemon=True).start()

    if args.no_tsdate:
        os.environ["DISABLE_TSDATE"] = "1"

    uvicorn.run(
        "argscape.api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )
    return 0


def _run_infer(args):
    """Run spatial inference CLI."""
    try:
        from argscape.spatial import require_spatial
        require_spatial("The 'argscape infer' command")
    except ImportError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    # Import and run the spatial CLI with remaining args
    from argscape.spatial_cli import main as spatial_main
    return spatial_main(args.args or [])


def _run_load(args):
    """Run load CLI."""
    try:
        from argscape.spatial import require_web
        require_web("The 'argscape load' command")
    except ImportError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    from argscape.load_cli import main as load_main
    return load_main(args.args or [])


def _run_benchmark(args):
    """Run benchmark CLI."""
    try:
        from argscape.spatial import require_web
        require_web("The 'argscape benchmark' command")
    except ImportError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    from argscape.benchmark.cli import main as benchmark_main
    return benchmark_main(args.args or [])


def _run_viz(args):
    """Run standalone visualization CLI."""
    from argscape.viz.cli import main as viz_main
    return viz_main(args.args or [])


if __name__ == "__main__":
    sys.exit(main() or 0)
