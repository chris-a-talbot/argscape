# argscape/benchmark/visualization.py
"""Benchmark visualization tools using Playwright."""

import asyncio
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Any, Optional

try:
    from playwright.async_api import async_playwright, Page, CDPSession
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


@dataclass
class VisualizationResult:
    """Result from benchmarking a visualization tool."""
    tool: str
    dataset: str
    render_time_ms: float
    time_to_interactive_ms: float
    fps_pan: float
    fps_zoom: float
    heap_size_mb: float
    num_nodes: int
    num_samples: int
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for CSV/JSON output."""
        return {
            "tool": self.tool,
            "dataset": self.dataset,
            "render_time_ms": self.render_time_ms,
            "time_to_interactive_ms": self.time_to_interactive_ms,
            "fps_pan": self.fps_pan,
            "fps_zoom": self.fps_zoom,
            "heap_size_mb": self.heap_size_mb,
            "num_nodes": self.num_nodes,
            "num_samples": self.num_samples,
            "error": self.error,
        }


async def _get_heap_size(client: "CDPSession") -> float:
    """Get JavaScript heap size in MB."""
    try:
        result = await client.send("Runtime.getHeapUsage")
        return result.get("usedSize", 0) / (1024 * 1024)
    except Exception:
        return 0.0


async def _measure_fps(page: "Page", action: str, duration_ms: int = 2000) -> float:
    """Measure frame rate during an interaction.

    Args:
        page: Playwright page
        action: Type of action ("pan" or "zoom")
        duration_ms: Duration to measure

    Returns:
        Frames per second
    """
    # Inject FPS measurement script
    await page.evaluate("""
        window.__fpsFrames = [];
        window.__fpsRaf = null;
        function measureFps() {
            window.__fpsFrames.push(performance.now());
            window.__fpsRaf = requestAnimationFrame(measureFps);
        }
        measureFps();
    """)

    # Perform the action
    if action == "pan":
        # Simulate drag
        box = await page.locator("[data-testid='graph-ready']").bounding_box()
        if box:
            start_x = box["x"] + box["width"] / 2
            start_y = box["y"] + box["height"] / 2
            await page.mouse.move(start_x, start_y)
            await page.mouse.down()
            for i in range(10):
                await page.mouse.move(start_x + i * 10, start_y + i * 5)
                await asyncio.sleep(duration_ms / 10000)
            await page.mouse.up()
    elif action == "zoom":
        # Simulate scroll wheel
        box = await page.locator("[data-testid='graph-ready']").bounding_box()
        if box:
            await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            for _ in range(5):
                await page.mouse.wheel(0, -100)
                await asyncio.sleep(duration_ms / 5000)

    await asyncio.sleep(duration_ms / 1000)

    # Get frame count
    frames = await page.evaluate("""
        cancelAnimationFrame(window.__fpsRaf);
        const frames = window.__fpsFrames;
        delete window.__fpsFrames;
        delete window.__fpsRaf;
        return frames;
    """)

    if len(frames) < 2:
        return 0.0

    duration_s = (frames[-1] - frames[0]) / 1000
    if duration_s <= 0:
        return 0.0

    return (len(frames) - 1) / duration_s


async def benchmark_argscape_visualization(
    page: "Page",
    client: "CDPSession",
    ts_path: Path,
    viz_type: str,
    server_url: str = "http://localhost:8000",
) -> VisualizationResult:
    """Benchmark ARGscape visualization.

    Args:
        page: Playwright page
        client: CDP session for memory measurement
        ts_path: Path to tree sequence file
        viz_type: "2d" or "3d"
        server_url: ARGscape server URL

    Returns:
        VisualizationResult with metrics
    """
    import tskit
    ts = tskit.load(str(ts_path))
    dataset_name = ts_path.stem

    try:
        # Upload file and navigate to visualization
        # First, upload the tree sequence
        await page.goto(f"{server_url}")

        # Wait for upload area and upload file
        file_input = page.locator('input[type="file"]')
        await file_input.set_input_files(str(ts_path))

        # Wait for processing
        await page.wait_for_selector("[data-testid='graph-ready']", timeout=120000)

        # Measure render time (from navigation to graph ready)
        render_time_ms = await page.evaluate("performance.now()")

        # Measure time to interactive
        await page.wait_for_load_state("networkidle")
        time_to_interactive_ms = await page.evaluate("performance.now()")

        # Measure FPS during interactions
        fps_pan = await _measure_fps(page, "pan")
        fps_zoom = await _measure_fps(page, "zoom")

        # Get heap size
        heap_size_mb = await _get_heap_size(client)

        return VisualizationResult(
            tool=f"argscape-{viz_type}",
            dataset=dataset_name,
            render_time_ms=render_time_ms,
            time_to_interactive_ms=time_to_interactive_ms,
            fps_pan=fps_pan,
            fps_zoom=fps_zoom,
            heap_size_mb=heap_size_mb,
            num_nodes=ts.num_nodes,
            num_samples=ts.num_samples,
        )

    except Exception as e:
        return VisualizationResult(
            tool=f"argscape-{viz_type}",
            dataset=dataset_name,
            render_time_ms=0,
            time_to_interactive_ms=0,
            fps_pan=0,
            fps_zoom=0,
            heap_size_mb=0,
            num_nodes=ts.num_nodes,
            num_samples=ts.num_samples,
            error=str(e),
        )


async def _run_visualization_benchmarks_async(
    datasets: List[Path],
    tools: List[str],
    server_url: str,
    headless: bool,
) -> List[VisualizationResult]:
    """Async implementation of visualization benchmarks."""
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright is required for visualization benchmarks. Install with: pip install playwright && playwright install")

    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()

        # Enable CDP for memory measurement
        client = await context.new_cdp_session(page)
        await client.send("Performance.enable")

        for ts_path in datasets:
            for tool in tools:
                if tool.startswith("argscape-"):
                    viz_type = tool.split("-")[1]
                    result = await benchmark_argscape_visualization(
                        page, client, ts_path, viz_type, server_url
                    )
                    results.append(result)
                # TODO: Add support for lorax and tskit_arg_visualizer

        await browser.close()

    return results


def run_visualization_benchmarks(
    datasets: List[Path],
    tools: List[str],
    server_url: str = "http://localhost:8000",
    headless: bool = True,
    quiet: bool = False,
) -> List[VisualizationResult]:
    """Run visualization benchmarks.

    Args:
        datasets: List of dataset paths
        tools: List of tool names to benchmark
        server_url: ARGscape server URL
        headless: Run browser in headless mode
        quiet: Suppress progress output

    Returns:
        List of VisualizationResult objects
    """
    if not quiet:
        print(f"Running visualization benchmarks on {len(datasets)} datasets...")

    return asyncio.run(_run_visualization_benchmarks_async(
        datasets, tools, server_url, headless
    ))
