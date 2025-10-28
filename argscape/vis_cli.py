"""
Command-line visualization helper for ARGscape.

Provides two modes:
- run: capture a snapshot of a 2D or 3D visualization for a loaded tree sequence
- interactive: guide the user to select sequence, view, size, and output

It reuses the same persistent session storage as argscape_infer.
Requires optional dependency 'playwright' for headless rendering. If not installed,
prints instructions.
"""

import argparse
import os
import sys
import time
import subprocess
from pathlib import Path
from typing import Optional, Tuple

import contextlib

try:
    import requests  # type: ignore
except Exception:  # pragma: no cover
    requests = None  # type: ignore

try:
    import tskit  # type: ignore
except Exception:
    tskit = None  # type: ignore


CLI_SESSION_IP = "cli"
DEFAULT_HOST = os.environ.get("ARGSCAPE_HOST", "127.0.0.1")
DEFAULT_PORT = int(os.environ.get("ARGSCAPE_PORT", "8000"))


def _url_hp(host: str, port: int, path: str) -> str:
    return f"http://{host}:{port}{path}"


def _ensure_backend_running(host: str, port: int, timeout_s: int = 30) -> Optional[subprocess.Popen]:
    """Ensure the FastAPI backend is running; if not, start it in a subprocess.
    Returns the Popen handle if started, else None if already running.
    """
    if requests is None:
        return None
    # Try both likely health paths
    for path in ("/api/health", "/health"):
        try:
            resp = requests.get(_url_hp(host, port, path), timeout=2)
            if resp.ok:
                print("Backend already running.")
                return None
        except Exception:
            pass

    # Start backend without opening browser
    print(f"Starting ARGscape backend on {host}:{port} ...", flush=True)
    proc = subprocess.Popen([
        sys.executable,
        "-m",
        "argscape.cli",
        "--no-browser",
        "--no-tsdate",
        "--host",
        host,
        "--port",
        str(port),
    ])

    # Wait until healthy
    start = time.time()
    print("Waiting for backend to become ready", end="", flush=True)
    while time.time() - start < timeout_s:
        for path in ("/api/health", "/health"):
            try:
                resp = requests.get(_url_hp(host, port, path), timeout=2)
                if resp.ok:
                    print(" done.")
                    return proc
            except Exception:
                pass
        print(".", end="", flush=True)
        time.sleep(0.5)
    # If we get here, backend did not start in time
    print(" failed.")
    with contextlib.suppress(Exception):
        proc.terminate()
    raise RuntimeError("Failed to start backend for visualization")


def _list_loaded() -> Tuple[str, Tuple[str, ...]]:
    try:
        from argscape.api.services import session_storage  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"Session storage unavailable: {e}")
    session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
    names = tuple(sorted(session_storage.get_file_list(session_id)))
    storage_path = str(session_storage.storage_base_path)
    return storage_path, names


def _ensure_playwright():
    try:
        from playwright.sync_api import sync_playwright  # type: ignore
        return sync_playwright
    except Exception as e:
        raise RuntimeError(
            "Playwright is required for visualization snapshots.\n"
            "Install with:\n"
            "  pip install 'argscape[vis]'\n"
            "  playwright install chromium\n"
            f"Original error: {e}"
        )


def _route_for_view(view: str, filename: str, second: Optional[str]) -> str:
    if view == "2d":
        return f"/graph/{filename}"
    if view == "3d":
        return f"/spatial/{filename}"
    if view == "diff":
        if not second:
            raise ValueError("diff view requires --second <filename>")
        return f"/spatial-diff/{filename}?second={second}"
    raise ValueError("view must be one of: 2d | 3d | diff")


def _ensure_loaded_in_session(name_or_path: str) -> str:
    """If name_or_path is a readable .trees file, load it into the CLI session and
    return the stored name (file stem). Otherwise return the original string.
    """
    p = Path(name_or_path).expanduser()
    if p.exists() and p.is_file():
        if tskit is None:
            return name_or_path
        try:
            from argscape.api.services import session_storage  # type: ignore
        except Exception:
            return name_or_path
        try:
            ts = tskit.load(str(p))  # type: ignore
            name = p.stem
            session_id = session_storage.get_or_create_session(CLI_SESSION_IP)
            # Save raw file data and tree sequence
            with open(p, "rb") as f:
                session_storage.store_file(session_id, name, f.read())
            session_storage.store_tree_sequence(session_id, name, ts)
            print(f"Loaded '{name}' into session for visualization.")
            return name
        except Exception:
            return name_or_path
    return name_or_path


def _wait_for_render(page, view: str, timeout_ms: int):
    if view == "2d":
        page.wait_for_selector("svg", timeout=timeout_ms)
    else:  # 3d or diff both use WebGL canvas
        page.wait_for_selector("canvas", timeout=timeout_ms)


def cmd_run(args: argparse.Namespace) -> int:
    started_proc: Optional[subprocess.Popen] = None
    try:
        print("Ensuring backend is running...", flush=True)
        started_proc = _ensure_backend_running(args.host, args.port, timeout_s=args.start_timeout)
        print("Initializing Playwright...", flush=True)
        sync_playwright = _ensure_playwright()
        print("Playwright ready.")
        # Allow --filename to be either a storage name or a direct .trees path
        resolved_name = _ensure_loaded_in_session(args.filename)
        route = _route_for_view(args.view, resolved_name, args.second)
        out_dir = Path(args.output).expanduser().resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / (args.outfile or f"{Path(args.filename).stem}_{args.view}.png")

        # Use Playwright sync context manager correctly
        with sync_playwright() as p:  # type: ignore
            browser = p.chromium.launch(headless=True)
            # Force the same session as the CLI by sending X-Forwarded-For/X-Real-IP headers
            context = browser.new_context(
                accept_downloads=True,
                viewport={"width": args.width, "height": args.height},
                extra_http_headers={
                    "X-Forwarded-For": CLI_SESSION_IP,
                    "X-Real-IP": CLI_SESSION_IP,
                },
            )
            page = context.new_page()
            url = _url_hp(args.host, args.port, route)
            print(f"Opening {url} ...", flush=True)
            resp = page.goto(url, wait_until="networkidle")
            # If direct SPA route returns 404 (no index fallback), load root and push state
            try:
                status = resp.status if resp else None
            except Exception:
                status = None
            if status and status >= 400:
                print("Route returned 404; loading root and navigating via History API...", flush=True)
                root = _url_hp(args.host, args.port, "/")
                page.goto(root, wait_until="networkidle")
                page.evaluate(
                    f"window.history.pushState({{}}, '', '{route}'); window.dispatchEvent(new PopStateEvent('popstate'));"
                )
            print("Waiting for visualization to render...", flush=True)
            # Proactively load the selected filename into the page if route failed to resolve data
            try:
                page.wait_for_selector("svg, canvas", timeout=args.render_timeout * 1000)
            except Exception:
                # Try pushing a simple fetch to warm the backend list (harmless)
                try:
                    page.evaluate("fetch('/api/uploaded-files/')")
                except Exception:
                    pass
                # Retry brief wait; we'll still continue to export fallback if not ready
                page.wait_for_timeout(1000)
            if args.extra_wait and args.extra_wait > 0:
                print(f"Extra wait {args.extra_wait:.1f}s for stabilization...", flush=True)
                time.sleep(args.extra_wait)

            # Prefer in-app export for fidelity when available
            download_title = None
            if args.view == "2d":
                download_title = "Download ARG visualization as PNG"
            elif args.view == "3d":
                download_title = "Download 3D visualization as PNG"
            elif args.view == "diff":
                download_title = "Download spatial diff visualization as PNG"

            if download_title:
                try:
                    print("Triggering in-app export...")
                    with page.expect_download(timeout=args.render_timeout * 1000) as dl_info:
                        page.locator(f"button[title='{download_title}']").click()
                    download = dl_info.value
                    download.save_as(str(out_path))
                    print(f"Saved snapshot: {out_path}")
                    browser.close()
                    return 0
                except Exception as _:
                    print("In-app export unavailable; falling back to screenshot.")

            print("Capturing screenshot...", flush=True)
            page.screenshot(path=str(out_path), full_page=False)
            browser.close()

        print(f"Saved snapshot: {out_path}")
        return 0
    except Exception as e:
        # The raised message includes setup instructions if Playwright is missing
        print(f"Error: {e}", file=sys.stderr)
        return 1
    finally:
        if started_proc is not None:
            with contextlib.suppress(Exception):
                started_proc.terminate()


def _choose(prompt: str, options: Tuple[str, ...]) -> Optional[str]:
    if not options:
        return None
    print(prompt)
    for i, opt in enumerate(options, 1):
        print(f"  {i}. {opt}")
    while True:
        s = input("Enter number (or 'q' to cancel): ").strip()
        if s.lower() in {"q", "quit", "exit"}:
            return None
        if s.isdigit() and 1 <= int(s) <= len(options):
            return options[int(s) - 1]
        print("Invalid choice, try again.")


def cmd_interactive(_: argparse.Namespace) -> int:
    try:
        _, names = _list_loaded()
        if not names:
            print("No loaded sequences. First run: argscape_infer load --file <path> --name <name>")
            return 0
        name = _choose("Select a loaded tree sequence:", names)
        if not name:
            return 0
        view = _choose("Select a view:", ("2d", "3d", "diff"))
        if not view:
            return 0
        second = None
        if view == "diff":
            second = _choose("Select second sequence:", tuple(n for n in names if n != name))
            if not second:
                return 0
        out_dir = input(f"Output directory [{os.getcwd()}]: ").strip() or os.getcwd()
        width = input("Width [1600]: ").strip() or "1600"
        height = input("Height [900]: ").strip() or "900"
        return cmd_run(argparse.Namespace(
            view=view,
            filename=name,
            second=second,
            output=out_dir,
            outfile=None,
            width=int(width),
            height=int(height),
            render_timeout=20,
            extra_wait=1.0,
            start_timeout=30,
            host=DEFAULT_HOST,
            port=DEFAULT_PORT,
        ))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="argscape_vis",
        description="Capture snapshots of ARGscape visualizations (2D/3D) via headless browser.",
    )
    sub = parser.add_subparsers(dest="command")

    p_run = sub.add_parser("run", help="Capture a snapshot of a visualization")
    p_run.add_argument("--view", required=True, choices=["2d", "3d", "diff"], help="Visualization type")
    p_run.add_argument("--filename", required=True, help="Primary tree sequence filename (as shown in UI)")
    p_run.add_argument("--second", required=False, help="Second filename for diff view")
    p_run.add_argument("--output", required=True, help="Directory to save snapshot")
    p_run.add_argument("--outfile", required=False, help="Snapshot filename (default: <name>_<view>.png)")
    p_run.add_argument("--width", type=int, default=1600, help="Viewport width (px)")
    p_run.add_argument("--height", type=int, default=900, help="Viewport height (px)")
    p_run.add_argument("--host", default=DEFAULT_HOST, help="Backend host (default: 127.0.0.1)")
    p_run.add_argument("--port", type=int, default=DEFAULT_PORT, help="Backend port (default: 8000)")
    p_run.add_argument("--render-timeout", type=int, default=20, help="Seconds to wait for render element")
    p_run.add_argument("--extra-wait", type=float, default=1.0, help="Extra seconds to wait before screenshot")
    p_run.add_argument("--start-timeout", type=int, default=30, help="Seconds to wait for backend startup")
    p_run.set_defaults(func=cmd_run)

    p_interactive = sub.add_parser("interactive", help="Interactive guided snapshot creator")
    p_interactive.add_argument("--host", default=DEFAULT_HOST, help="Backend host (default: 127.0.0.1)")
    p_interactive.add_argument("--port", type=int, default=DEFAULT_PORT, help="Backend port (default: 8000)")
    p_interactive.set_defaults(func=cmd_interactive)

    return parser


def main(argv: Optional[list] = None) -> int:
    print("argscape_vis is temporarily disabled in 0.3.0. This command will return 1.", file=sys.stderr)
    return 1


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
