"""
Error handling for inference endpoints.

Simple approach: return plain string error messages.
- ARGscape-side errors get structured messages with suggestions
- Inference tool errors are passed through with attribution
"""

from typing import Optional


# Display names for inference methods
METHOD_DISPLAY_NAMES = {
    "fastgaia": "FastGAIA",
    "gaia_quadratic": "GAIA Quadratic",
    "gaia_linear": "GAIA Linear",
    "midpoint": "Midpoint",
    "sparg": "SPARG",
    "spacetrees": "Spacetrees",
    "tsdate": "Tsdate",
}

# Package names for installation messages
PACKAGE_NAMES = {
    "fastgaia": "fastgaia",
    "gaia_quadratic": "gaiapy",
    "gaia_linear": "gaiapy",
    "midpoint": "tskit",
    "sparg": "sparg",
    "spacetrees": "spacetrees",
    "tsdate": "tsdate",
}


def get_inference_error_message(
    exception: Exception,
    method: str,
) -> tuple[str, int]:
    """
    Get a user-friendly error message for an inference failure.

    Returns:
        tuple of (message, status_code)
    """
    error_str = str(exception).lower()
    original_error = str(exception)
    display_name = METHOD_DISPLAY_NAMES.get(method, method)
    package_name = PACKAGE_NAMES.get(method, method)

    # === ARGscape-side errors ===

    # Memory errors
    if isinstance(exception, MemoryError) or "memoryerror" in error_str:
        return (
            "Not enough memory to process this tree sequence.\n\n"
            "Try reducing the number of samples or run locally with more RAM.",
            500
        )

    # Package unavailable
    if "not available" in error_str or "not installed" in error_str or "no module named" in error_str:
        return (
            f"{display_name} requires the '{package_name}' package which isn't installed.\n\n"
            f"Install with: pip install {package_name}",
            503
        )

    # Missing spatial data
    if "no sample locations" in error_str or "missing locations" in error_str or "location data" in error_str:
        return (
            "Your tree sequence doesn't have location data for samples.\n\n"
            "Upload a CSV with sample coordinates, or use a tree sequence that includes spatial data.",
            400
        )

    # === Inference tool errors - pass through with attribution ===

    return (
        f"Error from {display_name}:\n\n{original_error}",
        500
    )


def get_timeout_error_message(method: str, timeout_seconds: int) -> tuple[str, int]:
    """Get error message for inference timeout."""
    display_name = METHOD_DISPLAY_NAMES.get(method, method)
    return (
        f"{display_name} inference timed out after {timeout_seconds} seconds.\n\n"
        "For larger tree sequences, install ARGscape locally where there are no time limits.",
        504
    )


def get_file_not_found_message() -> tuple[str, int]:
    """Get error message for file not found."""
    return (
        "The requested tree sequence file was not found.\n\n"
        "The file may have expired. Please upload it again.",
        404
    )
