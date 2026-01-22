"""
Benchmark endpoints for measuring inference performance with instrumentation.
"""

import asyncio
import logging
import resource
import time
import tracemalloc
from typing import Any, Dict, Tuple

from fastapi import APIRouter, HTTPException, Request

from argscape.api.core.dependencies import get_client_ip
from argscape.api.services import session_storage
from argscape.api.geo_utils import check_spatial_completeness
from argscape.api.models import BenchmarkInferenceRequest
from argscape.api.inference import (
    run_fastgaia_inference,
    run_gaia_quadratic_inference,
    run_gaia_linear_inference,
    run_midpoint_inference,
    run_sparg_inference,
    run_spacetrees_inference,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Will be set by main app
FASTGAIA_AVAILABLE = False
GEOANCESTRY_AVAILABLE = False
MIDPOINT_AVAILABLE = False
SPARG_AVAILABLE = False
SPACETREES_AVAILABLE = False
TSDATE_AVAILABLE = False
DISABLE_TSDATE = False


def set_availability_flags(fastgaia, geoancestry, midpoint, sparg, spacetrees, tsdate, disable_tsdate):
    """Set availability flags from main app initialization."""
    global FASTGAIA_AVAILABLE, GEOANCESTRY_AVAILABLE, MIDPOINT_AVAILABLE
    global SPARG_AVAILABLE, SPACETREES_AVAILABLE, TSDATE_AVAILABLE, DISABLE_TSDATE
    FASTGAIA_AVAILABLE = fastgaia
    GEOANCESTRY_AVAILABLE = geoancestry
    MIDPOINT_AVAILABLE = midpoint
    SPARG_AVAILABLE = sparg
    SPACETREES_AVAILABLE = spacetrees
    TSDATE_AVAILABLE = tsdate
    DISABLE_TSDATE = disable_tsdate


def run_with_instrumentation(func, *args, **kwargs) -> Tuple[Any, Dict[str, float]]:
    """Run a function with CPU time and memory instrumentation.

    Args:
        func: Function to run
        *args, **kwargs: Arguments to pass to the function

    Returns:
        Tuple of (function result, metrics dict with cpu_time_s and peak_memory_mb)
    """
    # Start memory tracking
    tracemalloc.start()

    # Get starting CPU time
    start_resource = resource.getrusage(resource.RUSAGE_SELF)
    start_wall = time.perf_counter()

    try:
        result = func(*args, **kwargs)
    finally:
        # Get ending times
        end_wall = time.perf_counter()
        end_resource = resource.getrusage(resource.RUSAGE_SELF)

        # Get memory stats
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

    # Calculate metrics
    cpu_time = (end_resource.ru_utime - start_resource.ru_utime) + \
               (end_resource.ru_stime - start_resource.ru_stime)
    wall_time = end_wall - start_wall
    peak_memory_mb = peak / (1024 * 1024)

    metrics = {
        "cpu_time_s": cpu_time,
        "wall_time_s": wall_time,
        "peak_memory_mb": peak_memory_mb,
    }

    return result, metrics


async def run_with_instrumentation_async(func, *args, **kwargs) -> Tuple[Any, Dict[str, float]]:
    """Run a function with instrumentation in a thread pool executor.

    This allows long-running inference to not block the event loop while
    still measuring CPU time and memory.

    Args:
        func: Function to run
        *args, **kwargs: Arguments to pass to the function

    Returns:
        Tuple of (function result, metrics dict)
    """
    loop = asyncio.get_event_loop()

    def instrumented_call():
        return run_with_instrumentation(func, *args, **kwargs)

    return await loop.run_in_executor(None, instrumented_call)


def generate_unique_filename(session_id: str, base_filename: str, suffix: str) -> str:
    """Generate a unique filename by appending suffix and checking for collisions."""
    session = session_storage.get_session(session_id)

    if base_filename.endswith('.trees'):
        base_name = base_filename[:-6]
        extension = '.trees'
    elif base_filename.endswith('.tsz'):
        base_name = base_filename[:-4]
        extension = '.tsz'
    else:
        base_name = base_filename
        extension = '.trees'

    candidate_filename = f"{base_name}{suffix}{extension}"

    if session and session.tree_sequences and candidate_filename in session.tree_sequences:
        counter = 2
        while True:
            candidate_filename = f"{base_name}{suffix}_{counter}{extension}"
            if candidate_filename not in session.tree_sequences:
                break
            counter += 1

    return candidate_filename


@router.post("/benchmark/inference")
async def benchmark_inference(request: Request, benchmark_request: BenchmarkInferenceRequest):
    """Run inference with CPU and memory instrumentation for benchmarking.

    This endpoint wraps the inference methods with timing and memory tracking,
    returning detailed metrics along with the inference results.

    Supported methods: fastgaia, gaia-quadratic, gaia-linear, midpoint, sparg, spacetrees, tsdate
    """
    method = benchmark_request.method
    filename = benchmark_request.filename
    params = benchmark_request.params or {}

    logger.info(f"Benchmark inference request: {method} on {filename}")

    # Get session and tree sequence
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, filename)

    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")

    # Check spatial completeness for spatial methods
    spatial_methods = ["fastgaia", "gaia-quadratic", "gaia-linear", "midpoint", "sparg", "spacetrees"]
    if method in spatial_methods:
        spatial_info = check_spatial_completeness(ts)
        if not spatial_info.get("has_sample_spatial", False):
            raise HTTPException(
                status_code=400,
                detail=f"{method} requires tree sequences with location data for all sample nodes"
            )

    # Check method availability and run with instrumentation
    try:
        if method == "fastgaia":
            if not FASTGAIA_AVAILABLE:
                raise HTTPException(status_code=503, detail="fastgaia not available")

            def run_fastgaia():
                return run_fastgaia_inference(
                    ts,
                    weight_span=params.get("weight_span", True),
                    weight_branch_length=params.get("weight_branch_length", False),
                )

            (ts_out, inference_info), metrics = await run_with_instrumentation_async(run_fastgaia)
            suffix = "_fastgaia"

        elif method == "gaia-quadratic":
            if not GEOANCESTRY_AVAILABLE:
                raise HTTPException(status_code=503, detail="gaiapy package not available")

            def run_gaia_quad():
                return run_gaia_quadratic_inference(
                    ts,
                    use_branch_lengths=params.get("use_branch_lengths", True),
                )

            (ts_out, inference_info, _), metrics = await run_with_instrumentation_async(run_gaia_quad)
            suffix = "_gaia_quad"

        elif method == "gaia-linear":
            if not GEOANCESTRY_AVAILABLE:
                raise HTTPException(status_code=503, detail="gaiapy package not available")

            def run_gaia_lin():
                return run_gaia_linear_inference(
                    ts,
                    use_branch_lengths=params.get("use_branch_lengths", True),
                )

            (ts_out, inference_info, _), metrics = await run_with_instrumentation_async(run_gaia_lin)
            suffix = "_gaia_linear"

        elif method == "midpoint":
            if not MIDPOINT_AVAILABLE:
                raise HTTPException(status_code=503, detail="Midpoint inference not available")

            weight_by_span = params.get("weighted", params.get("weight_by_span", True))
            weight_branch_length = params.get("weight_branch_length", False)

            def run_midpoint():
                return run_midpoint_inference(
                    ts,
                    weight_by_span=weight_by_span,
                    weight_branch_length=weight_branch_length,
                )

            (ts_out, inference_info), metrics = await run_with_instrumentation_async(run_midpoint)

            # Determine suffix based on weighting
            if not weight_by_span and not weight_branch_length:
                suffix = "_midpoint"
            elif weight_by_span and weight_branch_length:
                suffix = "_midpoint_weighted"
            elif weight_by_span:
                suffix = "_midpoint_edge"
            else:
                suffix = "_midpoint_branch"

        elif method == "sparg":
            if not SPARG_AVAILABLE:
                raise HTTPException(status_code=503, detail="sparg not available")

            def run_sparg():
                return run_sparg_inference(ts)

            (ts_out, inference_info, _), metrics = await run_with_instrumentation_async(run_sparg)
            suffix = "_sparg"

        elif method == "spacetrees":
            if not SPACETREES_AVAILABLE:
                raise HTTPException(status_code=503, detail="spacetrees not available")

            def run_spacetrees():
                return run_spacetrees_inference(
                    ts,
                    time_cutoff=params.get("time_cutoff"),
                    ancestor_times=params.get("ancestor_times"),
                    use_importance_sampling=params.get("use_importance_sampling", True),
                    require_common_ancestor=params.get("require_common_ancestor", True),
                    use_blup=params.get("use_blup", False),
                    blup_var=params.get("blup_var"),
                    Ne=params.get("ne"),
                    Ne_epochs=params.get("ne_epochs"),
                    Nes=params.get("nes"),
                    num_loci=params.get("num_loci"),
                    locus_size=params.get("locus_size"),
                    quiet=True,
                )

            (ts_out, inference_info, _), metrics = await run_with_instrumentation_async(run_spacetrees)
            suffix = "_spacetrees"

        elif method == "tsdate":
            if DISABLE_TSDATE:
                raise HTTPException(status_code=503, detail="Temporal inference is disabled")
            if not TSDATE_AVAILABLE:
                raise HTTPException(status_code=503, detail="tsdate package not available")

            # Import here to avoid loading if disabled
            from argscape.api.inference import run_tsdate_inference

            def run_tsdate():
                return run_tsdate_inference(
                    ts,
                    mutation_rate=params.get("mutation_rate"),
                    progress=False,
                    preprocess=params.get("preprocess", True),
                    remove_telomeres=params.get("remove_telomeres", False),
                    minimum_gap=params.get("minimum_gap"),
                    split_disjoint=params.get("split_disjoint", True),
                    filter_populations=params.get("filter_populations", True),
                    filter_individuals=params.get("filter_individuals", True),
                    filter_sites=params.get("filter_sites", True),
                )

            (ts_out, inference_info), metrics = await run_with_instrumentation_async(run_tsdate)
            suffix = "_tsdate"

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown method: {method}. Supported: fastgaia, gaia-quadratic, gaia-linear, midpoint, sparg, spacetrees, tsdate"
            )

        # Generate unique filename and store result
        new_filename = generate_unique_filename(session_id, filename, suffix)
        session_storage.store_tree_sequence(session_id, new_filename, ts_out)

        # Get spatial info for result
        updated_spatial_info = check_spatial_completeness(ts_out)

        logger.info(f"Benchmark {method} completed: {metrics['wall_time_s']:.3f}s wall, "
                   f"{metrics['cpu_time_s']:.3f}s CPU, {metrics['peak_memory_mb']:.1f}MB peak")

        return {
            "status": "success",
            "method": method,
            "new_filename": new_filename,
            "cpu_time_s": metrics["cpu_time_s"],
            "wall_time_s": metrics["wall_time_s"],
            "peak_memory_mb": metrics["peak_memory_mb"],
            **inference_info,
            **updated_spatial_info,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Benchmark inference error for {method}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
