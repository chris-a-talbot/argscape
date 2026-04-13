# argscape/benchmark/api_runner.py
"""Run inference via ARGscape API for benchmarking."""

import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import requests

logger = logging.getLogger(__name__)


@dataclass
class APIResult:
    """Result from an API-based benchmark run."""
    wall_time_s: float
    cpu_time_s: float
    peak_memory_mb: float
    inference_info: Dict[str, Any]
    new_filename: Optional[str] = None
    error: Optional[str] = None


def check_server_available(server_url: str) -> bool:
    """Check if the ARGscape server is available.

    Args:
        server_url: Base URL of the server (e.g., http://localhost:8000)

    Returns:
        True if server is responding, False otherwise
    """
    try:
        response = requests.get(f"{server_url}/api/health", timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        # Try docs endpoint as fallback
        try:
            response = requests.get(f"{server_url}/docs", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False


def upload_tree_sequence(server_url: str, ts_path: Path) -> Tuple[Optional[str], Optional[str]]:
    """Upload a tree sequence to the server.

    Args:
        server_url: Base URL of the server
        ts_path: Path to tree sequence file

    Returns:
        Tuple of (filename on server, error message if failed)
    """
    url = f"{server_url}/api/upload-tree-sequence"

    try:
        with open(ts_path, "rb") as f:
            files = {"file": (ts_path.name, f, "application/octet-stream")}
            response = requests.post(url, files=files, timeout=60)

        if response.status_code == 200:
            data = response.json()
            return data.get("filename"), None
        else:
            return None, f"Upload failed: {response.status_code} - {response.text}"
    except requests.exceptions.RequestException as e:
        return None, f"Upload error: {e}"


def delete_tree_sequence(server_url: str, filename: str) -> bool:
    """Delete a tree sequence from the server.

    Args:
        server_url: Base URL of the server
        filename: Filename to delete

    Returns:
        True if deleted successfully
    """
    url = f"{server_url}/api/tree-sequence/{filename}"
    try:
        response = requests.delete(url, timeout=30)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


def clear_session(server_url: str) -> bool:
    """Clear all tree sequences from the current session.

    Args:
        server_url: Base URL of the server

    Returns:
        True if cleared successfully
    """
    # First get list of files
    try:
        response = requests.get(f"{server_url}/api/uploaded-files/", timeout=30)
        if response.status_code != 200:
            return False

        data = response.json()
        files = data.get("uploaded_tree_sequences", [])

        # Delete each file
        for filename in files:
            if filename:
                delete_tree_sequence(server_url, filename)

        return True
    except requests.exceptions.RequestException:
        return False


# Supported inference methods
SUPPORTED_METHODS = [
    "fastgaia",
    "gaia-quadratic",
    "gaia-linear",
    "midpoint",
    "sparg",
    # "spacetrees",  # Temporarily disabled
    "tsdate",
]


def run_inference_api(
    server_url: str,
    ts_path: Path,
    method: str,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = 600.0,
    debug: bool = False,
) -> APIResult:
    """Run inference via the ARGscape benchmark API with CPU/memory instrumentation.

    Uses the /api/benchmark/inference endpoint which provides server-side
    timing and memory measurements.

    Args:
        server_url: Base URL of the server
        ts_path: Path to input tree sequence
        method: Inference method name
        params: Optional parameters for the inference method
        timeout: Maximum time to wait for inference (seconds)
        debug: Enable debug logging

    Returns:
        APIResult with timing, memory, and output info
    """
    params = params or {}

    if method not in SUPPORTED_METHODS:
        return APIResult(
            wall_time_s=0,
            cpu_time_s=0,
            peak_memory_mb=0,
            inference_info={},
            error=f"Unknown method: {method}. Supported: {', '.join(SUPPORTED_METHODS)}",
        )

    # Upload tree sequence first
    if debug:
        logger.info(f"Uploading {ts_path.name} to server...")

    filename, upload_error = upload_tree_sequence(server_url, ts_path)
    if upload_error:
        return APIResult(
            wall_time_s=0,
            cpu_time_s=0,
            peak_memory_mb=0,
            inference_info={},
            error=upload_error,
        )

    # Build request for benchmark endpoint
    request_body = {
        "method": method,
        "filename": filename,
        "params": params,
    }
    url = f"{server_url}/api/benchmark/inference"

    if debug:
        logger.info(f"Running {method} inference via benchmark API...")

    # Run inference
    new_filename = None
    try:
        response = requests.post(url, json=request_body, timeout=timeout)

        if response.status_code == 200:
            data = response.json()

            # Extract metrics from response
            wall_time = data.get("wall_time_s", 0)
            cpu_time = data.get("cpu_time_s", 0)
            peak_memory = data.get("peak_memory_mb", 0)
            new_filename = data.get("new_filename")

            # Extract inference info (everything except metrics and status fields)
            exclude_keys = {"status", "message", "new_filename", "method",
                          "wall_time_s", "cpu_time_s", "peak_memory_mb"}
            inference_info = {
                k: v for k, v in data.items()
                if k not in exclude_keys
            }

            if debug:
                logger.info(f"Completed: {wall_time:.3f}s wall, {cpu_time:.3f}s CPU, "
                          f"{peak_memory:.1f}MB peak")

            return APIResult(
                wall_time_s=wall_time,
                cpu_time_s=cpu_time,
                peak_memory_mb=peak_memory,
                inference_info=inference_info,
                new_filename=new_filename,
                error=None,
            )
        else:
            return APIResult(
                wall_time_s=0,
                cpu_time_s=0,
                peak_memory_mb=0,
                inference_info={},
                error=f"Inference failed: {response.status_code} - {response.text}",
            )

    except requests.exceptions.Timeout:
        return APIResult(
            wall_time_s=timeout,
            cpu_time_s=0,
            peak_memory_mb=0,
            inference_info={},
            error=f"Timeout after {timeout}s",
        )
    except requests.exceptions.RequestException as e:
        return APIResult(
            wall_time_s=0,
            cpu_time_s=0,
            peak_memory_mb=0,
            inference_info={},
            error=f"Request error: {e}",
        )
    finally:
        # Clean up both uploaded file and inference output
        if filename:
            delete_tree_sequence(server_url, filename)
        if new_filename:
            delete_tree_sequence(server_url, new_filename)
