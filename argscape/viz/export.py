"""Headless browser capture for static export."""

import asyncio
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Literal


def _is_in_async_loop() -> bool:
    """Check if we're running inside an async event loop (like Jupyter)."""
    try:
        loop = asyncio.get_running_loop()
        return loop is not None
    except RuntimeError:
        return False


def _capture_in_subprocess(
    html: str,
    output_path: str,
    format: Literal["png", "svg", "pdf"],
    dpi: int,
    timeout: int,
) -> None:
    """Run capture in a subprocess to avoid async loop conflicts in Jupyter."""
    # Write HTML to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        f.write(html)
        html_path = f.name

    # Python code to run in subprocess
    capture_script = f'''
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

html_path = {repr(html_path)}
output_path = {repr(output_path)}
format = {repr(format)}
dpi = {dpi}
timeout = {timeout}

html = Path(html_path).read_text(encoding='utf-8')
output = Path(output_path)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        page.set_content(html)
        page.wait_for_selector("#argscape-ready", state="attached", timeout=timeout)
        page.wait_for_timeout(100)

        if format == "png":
            container = page.locator("#argscape-root")
            scale = dpi / 96
            if scale != 1:
                container.screenshot(path=str(output), scale="device")
            else:
                container.screenshot(path=str(output), scale="css")
        elif format == "svg":
            svg_content = page.evaluate("window.argscapeExportSVG ? window.argscapeExportSVG() : ''")
            if not svg_content:
                raise RuntimeError("SVG export not available")
            output.write_text(svg_content)
        elif format == "pdf":
            page.pdf(path=str(output), prefer_css_page_size=True)
    finally:
        browser.close()

# Clean up temp file
Path(html_path).unlink()
'''

    result = subprocess.run(
        [sys.executable, '-c', capture_script],
        capture_output=True,
        text=True,
        timeout=timeout // 1000 + 30  # Convert ms to seconds, add buffer
    )

    if result.returncode != 0:
        # Clean up temp file on error
        try:
            Path(html_path).unlink()
        except FileNotFoundError:
            pass
        raise RuntimeError(f"Export failed: {result.stderr}")


def _capture_sync(
    html: str,
    output_path: str,
    format: Literal["png", "svg", "pdf"],
    dpi: int,
    timeout: int,
) -> None:
    """Synchronous capture implementation."""
    from playwright.sync_api import sync_playwright

    output = Path(output_path)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            page.set_content(html)
            page.wait_for_selector("#argscape-ready", state="attached", timeout=timeout)
            page.wait_for_timeout(100)

            if format == "png":
                container = page.locator("#argscape-root")
                scale = dpi / 96
                if scale != 1:
                    container.screenshot(path=str(output), scale="device")
                else:
                    container.screenshot(path=str(output), scale="css")

            elif format == "svg":
                svg_content = page.evaluate("window.argscapeExportSVG ? window.argscapeExportSVG() : ''")
                if not svg_content:
                    raise RuntimeError("SVG export not available for this visualization")
                output.write_text(svg_content)

            elif format == "pdf":
                page.pdf(path=str(output), prefer_css_page_size=True)

            else:
                raise ValueError(f"Unknown format: {format}. Use 'png', 'svg', or 'pdf'.")

        finally:
            browser.close()


def capture(
    html: str,
    output_path: str,
    format: Literal["png", "svg", "pdf"] = "png",
    dpi: int = 150,
    timeout: int = 30000,
) -> None:
    """
    Render HTML in headless browser and capture output.

    Args:
        html: Complete HTML string to render
        output_path: Path to save output file
        format: Output format ("png", "svg", "pdf")
        dpi: Resolution for PNG output (default 150)
        timeout: Timeout in milliseconds for rendering (default 30000)

    Raises:
        ImportError: If playwright is not installed
        TimeoutError: If rendering times out
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise ImportError(
            "Playwright is required for static export. Install with:\n"
            "  pip install playwright && playwright install chromium"
        )

    # If running in an async event loop (like Jupyter), use subprocess
    if _is_in_async_loop():
        _capture_in_subprocess(html, output_path, format, dpi, timeout)
    else:
        _capture_sync(html, output_path, format, dpi, timeout)


def is_playwright_available() -> bool:
    """Check if playwright is installed and configured."""
    try:
        from playwright.sync_api import sync_playwright
        return True
    except ImportError:
        return False
