"""
Python API for spatial and temporal inference on tree sequences.

Usage:
    import argscape

    result = argscape.infer(ts, method="fastgaia")
    result.ts    # Tree sequence with inferred locations
    result.info  # Inference metadata

    # Check available methods
    argscape.available_methods()
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

import tskit

from .spatial import require_spatial


@dataclass
class InferResult:
    """Result of running inference on a tree sequence.

    Attributes:
        ts: Tree sequence with inferred locations/times
        info: Dictionary with inference metadata (method, timing, parameters, etc.)
        method: Name of the inference method used
    """
    ts: tskit.TreeSequence
    info: Dict[str, Any]
    method: str


# Valid method names
# Note: SPARG and Spacetrees are available in the web app but disabled in the Python API
# due to stability/maintenance concerns. Use the web app for these methods.
SPATIAL_METHODS = ["midpoint", "fastgaia", "gaia-quadratic", "gaia-linear"]
TEMPORAL_METHODS = ["tsdate"]
ALL_METHODS = SPATIAL_METHODS + TEMPORAL_METHODS


def available_methods() -> Dict[str, bool]:
    """Return a dictionary of inference methods and their availability.

    Returns:
        Dict mapping method names to boolean availability status.

    Example:
        >>> argscape.available_methods()
        {'midpoint': True, 'fastgaia': True, 'gaia-quadratic': True, ...}

    Note:
        Requires argscape[spatial] to be installed. If spatial dependencies
        are not available, all methods will return False.
    """
    from .spatial import is_spatial_available

    if not is_spatial_available():
        # Return all False if spatial not available
        return {method: False for method in ALL_METHODS}

    try:
        from argscape.api.inference import (
            FASTGAIA_AVAILABLE,
            GEOANCESTRY_AVAILABLE,
            MIDPOINT_AVAILABLE,
            TSDATE_AVAILABLE,
        )

        return {
            "midpoint": MIDPOINT_AVAILABLE,
            "fastgaia": FASTGAIA_AVAILABLE,
            "gaia-quadratic": GEOANCESTRY_AVAILABLE,
            "gaia-linear": GEOANCESTRY_AVAILABLE,
            "tsdate": TSDATE_AVAILABLE,
        }
    except ImportError:
        # If imports fail, return all False
        return {method: False for method in ALL_METHODS}


def infer(
    ts: tskit.TreeSequence,
    method: str = "fastgaia",
    # FastGAIA options
    weight_span: bool = True,
    weight_branch_length: bool = True,
    # Midpoint options (uses different param names)
    weight_by_span: Optional[bool] = None,
    # GAIA options
    use_branch_lengths: bool = False,
    # Tsdate options
    mutation_rate: float = 1e-8,
    progress: bool = True,
    preprocess: bool = True,
    remove_telomeres: bool = False,
    minimum_gap: Optional[float] = None,
    split_disjoint: bool = True,
    filter_populations: bool = False,
    filter_individuals: bool = False,
    filter_sites: bool = False,
) -> InferResult:
    """
    Run spatial or temporal inference on a tree sequence.

    This function provides a unified interface to ARGscape inference methods,
    including spatial location inference and temporal dating.

    Args:
        ts: Input tree sequence. For spatial methods, sample nodes must have
            locations in their individual metadata. For tsdate, mutations are required.
        method: Inference method to use. One of:
            - "midpoint": Weighted midpoint inference (fast, always available)
            - "fastgaia": Fast GAIA algorithm (requires fastgaia package)
            - "gaia-quadratic": GAIA with quadratic cost (requires geoancestry)
            - "gaia-linear": GAIA with linear cost (requires geoancestry)
            - "tsdate": Temporal inference using tsdate

        FastGAIA/Midpoint options:
            weight_span: Weight by edge spans (genomic length). Default True.
            weight_branch_length: Weight by branch lengths. Default True for fastgaia,
                False for midpoint.
            weight_by_span: Alias for weight_span (midpoint compatibility).

        GAIA options:
            use_branch_lengths: Use branch lengths in parsimony. Default False.

        Tsdate options:
            mutation_rate: Mutation rate for dating. Default 1e-8.
            progress: Show progress. Default True.
            preprocess: Preprocess tree sequence. Default True.
            remove_telomeres: Remove telomeric regions. Default False.
            minimum_gap: Minimum gap for splitting.
            split_disjoint: Split disjoint trees. Default True.
            filter_populations/individuals/sites: Filter metadata. Default False.

    Returns:
        InferResult with:
            - ts: Tree sequence with inferred locations/times
            - info: Dictionary with inference metadata
            - method: Name of method used

    Raises:
        ValueError: If method is unknown or unavailable.
        RuntimeError: If required dependencies are not installed.

    Example:
        >>> import argscape
        >>> result = argscape.infer(ts, method="midpoint")
        >>> result.ts  # Tree sequence with inferred locations
        >>> result.info  # {'method': 'midpoint', 'num_inferred': 45, ...}

        >>> # With method-specific options
        >>> result = argscape.infer(ts, method="fastgaia", weight_span=True)

    Note:
        Requires argscape[spatial] to be installed:
            pip install argscape[spatial]

        SPARG and Spacetrees are available in the ARGscape web application
        but are not exposed in the Python API.
    """
    require_spatial("argscape.infer()")

    # Validate method
    method = method.lower()
    if method not in ALL_METHODS:
        raise ValueError(
            f"Unknown method '{method}'. Available methods: {', '.join(ALL_METHODS)}"
        )

    # Check availability
    methods_available = available_methods()
    if not methods_available.get(method, False):
        raise ValueError(
            f"Method '{method}' is not available. "
            f"Install the required package or check available_methods()."
        )

    # Import inference functions
    from argscape.api.inference import (
        run_fastgaia_inference,
        run_gaia_linear_inference,
        run_gaia_quadratic_inference,
        run_midpoint_inference,
        run_tsdate_inference,
    )

    # Dispatch to appropriate method
    if method == "midpoint":
        # Handle parameter aliasing
        ws = weight_by_span if weight_by_span is not None else weight_span
        ts_out, info = run_midpoint_inference(
            ts,
            weight_by_span=ws,
            weight_branch_length=weight_branch_length,
        )

    elif method == "fastgaia":
        ts_out, info = run_fastgaia_inference(
            ts,
            weight_span=weight_span,
            weight_branch_length=weight_branch_length,
        )

    elif method == "gaia-quadratic":
        ts_out, info, _ = run_gaia_quadratic_inference(
            ts,
            use_branch_lengths=use_branch_lengths,
        )

    elif method == "gaia-linear":
        ts_out, info, _ = run_gaia_linear_inference(
            ts,
            use_branch_lengths=use_branch_lengths,
        )

    elif method == "tsdate":
        ts_out, info = run_tsdate_inference(
            ts,
            mutation_rate=mutation_rate,
            progress=progress,
            preprocess=preprocess,
            remove_telomeres=remove_telomeres,
            minimum_gap=minimum_gap,
            split_disjoint=split_disjoint,
            filter_populations=filter_populations,
            filter_individuals=filter_individuals,
            filter_sites=filter_sites,
        )

    # Add method to info if not already present
    if "method" not in info:
        info["method"] = method

    return InferResult(ts=ts_out, info=info, method=method)
