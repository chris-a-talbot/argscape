"""
Structured error handling for inference endpoints.

Provides user-friendly error messages with actionable suggestions
instead of raw exception strings.
"""

import re
from dataclasses import dataclass
from typing import Optional


# Error codes
class ErrorCode:
    MISSING_SPATIAL_DATA = "MISSING_SPATIAL_DATA"
    PACKAGE_UNAVAILABLE = "PACKAGE_UNAVAILABLE"
    TIMEOUT = "TIMEOUT"
    SPARG_MULTIPLE_PARENTS = "SPARG_MULTIPLE_PARENTS"
    SPARG_MULTIPLE_ROOTS = "SPARG_MULTIPLE_ROOTS"
    SPACETREES_NO_COMMON_ANCESTOR = "SPACETREES_NO_COMMON_ANCESTOR"
    TSDATE_INSUFFICIENT_MUTATIONS = "TSDATE_INSUFFICIENT_MUTATIONS"
    TSDATE_ASSERTION_ERROR = "TSDATE_ASSERTION_ERROR"
    NUMERICAL_ERROR = "NUMERICAL_ERROR"
    MEMORY_ERROR = "MEMORY_ERROR"
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    UNKNOWN = "UNKNOWN"


@dataclass
class InferenceError:
    """Structured error response for inference failures."""
    code: str
    message: str
    status_code: int = 500
    details: Optional[str] = None
    suggestion: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        result = {
            "error": {
                "code": self.code,
                "message": self.message,
            }
        }
        if self.details:
            result["error"]["details"] = self.details
        if self.suggestion:
            result["error"]["suggestion"] = self.suggestion
        return result


# Package name mappings for user-friendly messages
PACKAGE_NAMES = {
    "fastgaia": "fastgaia",
    "gaia_quadratic": "gaiapy",
    "gaia_linear": "gaiapy",
    "midpoint": "tskit",
    "sparg": "sparg",
    "spacetrees": "spacetrees",
    "tsdate": "tsdate",
}

METHOD_DISPLAY_NAMES = {
    "fastgaia": "FastGAIA",
    "gaia_quadratic": "GAIA Quadratic",
    "gaia_linear": "GAIA Linear",
    "midpoint": "Midpoint",
    "sparg": "SPARG",
    "spacetrees": "Spacetrees",
    "tsdate": "Tsdate",
}


def categorize_inference_error(
    exception: Exception,
    method: str,
    timeout_seconds: Optional[int] = None
) -> InferenceError:
    """
    Categorize an exception into a structured InferenceError with user-friendly messaging.

    Args:
        exception: The caught exception
        method: The inference method name (e.g., "fastgaia", "sparg")
        timeout_seconds: If this was a timeout, how many seconds

    Returns:
        InferenceError with appropriate code, message, and suggestion
    """
    error_str = str(exception).lower()
    original_error = str(exception)
    display_name = METHOD_DISPLAY_NAMES.get(method, method)
    package_name = PACKAGE_NAMES.get(method, method)

    # Check for specific error patterns

    # Memory errors
    if isinstance(exception, MemoryError) or "memory" in error_str:
        return InferenceError(
            code=ErrorCode.MEMORY_ERROR,
            message="Not enough memory to process this tree sequence.",
            details=original_error,
            suggestion="Try simplifying your tree sequence first, or run on a machine with more RAM.",
            status_code=500
        )

    # Package unavailable
    if "not available" in error_str or "not installed" in error_str:
        return InferenceError(
            code=ErrorCode.PACKAGE_UNAVAILABLE,
            message=f"{display_name} requires the {package_name} package which isn't installed.",
            details=original_error,
            suggestion=f"Install with `pip install {package_name}` or try a different inference method.",
            status_code=503
        )

    # Missing spatial data
    if "no sample locations" in error_str or "missing locations" in error_str:
        return InferenceError(
            code=ErrorCode.MISSING_SPATIAL_DATA,
            message="Your tree sequence doesn't have location data for samples.",
            details=original_error,
            suggestion="Upload a CSV with coordinates or use a file that includes spatial data.",
            status_code=400
        )

    # SPARG-specific errors
    if method == "sparg":
        if "more than 2 parents" in error_str:
            return InferenceError(
                code=ErrorCode.SPARG_MULTIPLE_PARENTS,
                message="This ARG contains nodes with more than 2 parents, which SPARG cannot handle.",
                details=original_error,
                suggestion="Try using FastGAIA or Midpoint inference instead.",
                status_code=400
            )
        if "multiple roots" in error_str or "single root" in error_str or "more than one root" in error_str:
            return InferenceError(
                code=ErrorCode.SPARG_MULTIPLE_ROOTS,
                message="SPARG requires trees with a single root, but your tree sequence has multiple roots.",
                details=original_error,
                suggestion="Try using FastGAIA or Midpoint inference instead, which handle multiple roots.",
                status_code=400
            )

    # Spacetrees-specific errors
    if method == "spacetrees":
        if "no trees found where all samples share" in error_str or "common ancestor" in error_str:
            return InferenceError(
                code=ErrorCode.SPACETREES_NO_COMMON_ANCESTOR,
                message="No trees in your sequence have a common ancestor for all samples.",
                details=original_error,
                suggestion="Try a different inference method or check your tree sequence structure.",
                status_code=400
            )

    # Tsdate-specific errors
    if method == "tsdate":
        # Check for minimum mutations error
        mutation_match = re.search(r"requires at least (\d+) mutations", error_str)
        if mutation_match or "insufficient mutations" in error_str:
            min_mutations = mutation_match.group(1) if mutation_match else "sufficient"
            return InferenceError(
                code=ErrorCode.TSDATE_INSUFFICIENT_MUTATIONS,
                message=f"Tsdate requires at least {min_mutations} mutations to reliably infer times.",
                details=original_error,
                suggestion="Your tree sequence has too few mutations for reliable dating.",
                status_code=400
            )
        if isinstance(exception, AssertionError) or "assertionerror" in error_str:
            return InferenceError(
                code=ErrorCode.TSDATE_ASSERTION_ERROR,
                message="Tsdate encountered an internal error (this is a known issue in some cases).",
                details=original_error,
                suggestion="Try with different parameters or a simplified tree sequence.",
                status_code=500
            )

    # Numerical errors
    numerical_patterns = [
        "singular matrix", "nan", "inf", "division by zero",
        "overflow", "underflow", "convergence", "not positive definite"
    ]
    if any(pattern in error_str for pattern in numerical_patterns):
        return InferenceError(
            code=ErrorCode.NUMERICAL_ERROR,
            message="The inference calculation encountered numerical issues.",
            details=original_error,
            suggestion="Try simplifying your tree sequence or using different parameters.",
            status_code=500
        )

    # Unknown error - pass through with context
    return InferenceError(
        code=ErrorCode.UNKNOWN,
        message=f"{display_name} inference failed: {original_error}",
        details=original_error,
        suggestion="If this error persists, please report it as an issue.",
        status_code=500
    )


def create_timeout_error(method: str, timeout_seconds: int) -> InferenceError:
    """Create a structured timeout error."""
    display_name = METHOD_DISPLAY_NAMES.get(method, method)
    return InferenceError(
        code=ErrorCode.TIMEOUT,
        message=f"{display_name} inference timed out after {timeout_seconds} seconds.",
        suggestion="For larger ARGs, please install ARGscape locally via Python.",
        status_code=504
    )


def create_file_not_found_error() -> InferenceError:
    """Create a structured file not found error."""
    return InferenceError(
        code=ErrorCode.FILE_NOT_FOUND,
        message="The requested tree sequence file was not found.",
        suggestion="The file may have expired. Please upload it again.",
        status_code=404
    )
