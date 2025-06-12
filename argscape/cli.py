import uvicorn
import webbrowser
import threading
import time
import argparse


def open_browser(host: str, port: int):
    time.sleep(1)  # Give the server a moment to start
    webbrowser.open(f"http://{host}:{port}")


def main():
    parser = argparse.ArgumentParser(description="Start the Argscape web application.")
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
    args = parser.parse_args()

    if not args.no_browser:
        threading.Thread(target=open_browser, args=(args.host, args.port), daemon=True).start()

    uvicorn.run(
        "argscape.backend.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )
