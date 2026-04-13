# argscape/benchmark/subprocess_runner.py
"""Run inference in isolated subprocesses for accurate memory measurement."""

import json
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional


@dataclass
class SubprocessResult:
    """Result from a subprocess benchmark run."""
    wall_time_s: float
    cpu_time_s: float
    peak_memory_mb: float
    output_path: Optional[Path]
    inference_info: Dict[str, Any]
    error: Optional[str] = None


# Script template that runs in the subprocess
_BENCHMARK_SCRIPT = '''
import json
import os
import resource
import sys
import time
import tracemalloc

# Suppress verbose logging from inference modules
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")

def main():
    input_data = json.loads(sys.argv[1])
    ts_path = input_data["ts_path"]
    method = input_data["method"]
    params = input_data.get("params", {})
    output_path = input_data.get("output_path")
    debug = input_data.get("debug", False)

    def log(msg):
        if debug:
            print(f"[DEBUG] {msg}", file=sys.stderr, flush=True)

    log(f"Starting benchmark: {method} on {ts_path}")

    # Start memory tracking
    tracemalloc.start()

    # Start timing
    start_wall = time.perf_counter()
    start_resource = resource.getrusage(resource.RUSAGE_SELF)

    try:
        log("Importing tskit...")
        import tskit
        log("Loading tree sequence...")
        ts = tskit.load(ts_path)
        log(f"Loaded: {ts.num_nodes} nodes")

        # Import and run the appropriate inference method
        log(f"Importing {method} inference...")
        if method == "midpoint":
            from argscape.api.inference import run_midpoint_inference
            log("Running midpoint inference...")
            weight_by_span = params.get("weighted", True)
            ts_out, info = run_midpoint_inference(ts, weight_by_span=weight_by_span)
        elif method == "fastgaia":
            from argscape.api.inference import run_fastgaia_inference
            log("Running fastgaia inference...")
            ts_out, info = run_fastgaia_inference(ts)
        elif method == "gaia-quadratic":
            from argscape.api.inference import run_gaia_quadratic_inference
            log("Running gaia-quadratic inference...")
            ts_out, info, _ = run_gaia_quadratic_inference(ts)
        elif method == "gaia-linear":
            from argscape.api.inference import run_gaia_linear_inference
            log("Running gaia-linear inference...")
            ts_out, info, _ = run_gaia_linear_inference(ts)
        elif method == "sparg":
            from argscape.api.inference import run_sparg_inference
            log("Running sparg inference...")
            ts_out, info = run_sparg_inference(ts)
        # Spacetrees temporarily disabled
        # elif method == "spacetrees":
        #     from argscape.api.inference import run_spacetrees_inference
        #     log("Running spacetrees inference...")
        #     ts_out, info = run_spacetrees_inference(ts, quiet=True)
        elif method == "tsdate":
            from argscape.api.inference.temporal_inference import run_tsdate_inference
            log("Running tsdate inference...")
            ts_out, info = run_tsdate_inference(ts)
        else:
            raise ValueError(f"Unknown method: {method}")
        log("Inference complete")

        # Save output if requested
        if output_path:
            ts_out.dump(output_path)

        error = None

    except Exception as e:
        info = {}
        error = str(e)

    # End timing
    end_wall = time.perf_counter()
    end_resource = resource.getrusage(resource.RUSAGE_SELF)

    # Get memory stats
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    # Calculate metrics
    wall_time = end_wall - start_wall
    cpu_time = (end_resource.ru_utime - start_resource.ru_utime) + \\
               (end_resource.ru_stime - start_resource.ru_stime)
    peak_memory_mb = peak / (1024 * 1024)

    # Also get max RSS from resource module (more accurate for total process memory)
    max_rss_mb = end_resource.ru_maxrss / (1024 * 1024)  # Convert from KB on macOS

    result = {
        "wall_time_s": wall_time,
        "cpu_time_s": cpu_time,
        "peak_memory_mb": max(peak_memory_mb, max_rss_mb),
        "inference_info": info,
        "error": error
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main()
'''


def run_inference_subprocess(
    ts_path: Path,
    method: str,
    params: Optional[Dict[str, Any]] = None,
    output_path: Optional[Path] = None,
    timeout: float = 600.0,
    debug: bool = False,
) -> SubprocessResult:
    """Run inference in an isolated subprocess for accurate memory measurement.

    Args:
        ts_path: Path to input tree sequence
        method: Inference method name
        params: Optional parameters for the inference method
        output_path: Optional path to save output tree sequence
        timeout: Maximum time to wait for inference (seconds)
        debug: Enable debug output

    Returns:
        SubprocessResult with timing, memory, and output info
    """
    input_data = {
        "ts_path": str(ts_path),
        "method": method,
        "params": params or {},
        "output_path": str(output_path) if output_path else None,
        "debug": debug,
    }

    # Write script to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(_BENCHMARK_SCRIPT)
        script_path = f.name

    try:
        start = time.perf_counter()

        # If debug mode, stream stderr directly instead of capturing
        if debug:
            result = subprocess.run(
                [sys.executable, script_path, json.dumps(input_data)],
                stdout=subprocess.PIPE,
                stderr=None,  # Let stderr go to console
                text=True,
                timeout=timeout,
            )
        else:
            result = subprocess.run(
                [sys.executable, script_path, json.dumps(input_data)],
                capture_output=True,
                text=True,
                timeout=timeout,
            )

        if result.returncode != 0:
            return SubprocessResult(
                wall_time_s=time.perf_counter() - start,
                cpu_time_s=0,
                peak_memory_mb=0,
                output_path=output_path,
                inference_info={},
                error=result.stderr if result.stderr else "Unknown error (check console for debug output)",
            )

        data = json.loads(result.stdout)
        return SubprocessResult(
            wall_time_s=data["wall_time_s"],
            cpu_time_s=data["cpu_time_s"],
            peak_memory_mb=data["peak_memory_mb"],
            output_path=output_path,
            inference_info=data.get("inference_info", {}),
            error=data.get("error"),
        )

    except subprocess.TimeoutExpired:
        return SubprocessResult(
            wall_time_s=timeout,
            cpu_time_s=0,
            peak_memory_mb=0,
            output_path=None,
            inference_info={},
            error=f"Timeout after {timeout}s",
        )
    except json.JSONDecodeError as e:
        return SubprocessResult(
            wall_time_s=0,
            cpu_time_s=0,
            peak_memory_mb=0,
            output_path=None,
            inference_info={},
            error=f"Failed to parse result: {e}",
        )
    finally:
        Path(script_path).unlink(missing_ok=True)
