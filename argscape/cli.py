import uvicorn
import webbrowser
import threading
import time
import argparse
import os
from argscape import __version__


def open_browser(host: str, port: int):
    time.sleep(1)  # Give the server a moment to start
    webbrowser.open(f"http://{host}:{port}")


def main():
    parser = argparse.ArgumentParser(
        description="Start the ARGscape web application.",
        epilog=(
            "Related commands:\n"
            "  argscape_infer   Run spatial/temporal inference from CLI (load/list/run/interactive)\n"
            "  argscape_load    Load .trees files into persistent session storage\n"
            "  argscape_vis     Capture 2D/3D visualization snapshots (optional: playwright)\n\n"
            "Examples:\n"
            "  argscape_infer load --file sample.trees --name demo\n"
            "  argscape_infer run --name demo --method midpoint --output ./out\n"
            "  argscape_vis run --view 3d --filename demo --output ./out\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--host", type=str, default="127.0.0.1",
        help="Host to run the server on (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--port", type=int, default=8000,
        help="Port to run the server on (default: 8000)"
    )
    parser.add_argument(
        "--reload", action="store_true",
        help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--no-browser", action="store_true",
        help="Don't automatically open the web browser"
    )
    parser.add_argument(
        "--no-tsdate", action="store_true",
        help="Disable tsdate temporal inference"
    )
    parser.add_argument(
        "--version", action="version",
        version=f"ARGscape {__version__}",
        help="Show version number and exit"
    )
    args = parser.parse_args()

    if not args.no_browser:
        threading.Thread(target=open_browser, args=(args.host, args.port), daemon=True).start()

    # Set environment variable for tsdate
    if args.no_tsdate:
        os.environ["DISABLE_TSDATE"] = "1"

    uvicorn.run(
        "argscape.api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )


if __name__ == "__main__":
    main()
