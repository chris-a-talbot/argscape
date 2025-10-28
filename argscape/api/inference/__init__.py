"""
Inference algorithms for location and temporal data.
"""

from .location_inference import (
    run_fastgaia_inference,
    run_gaia_quadratic_inference,
    run_gaia_linear_inference,
    FASTGAIA_AVAILABLE,
    GEOANCESTRY_AVAILABLE,
)
from .midpoint_inference import run_midpoint_inference, MIDPOINT_AVAILABLE
from .sparg_inference import run_sparg_inference, SPARG_AVAILABLE
from .temporal_inference import run_tsdate_inference, TSDATE_AVAILABLE

__all__ = [
    "run_fastgaia_inference",
    "run_gaia_quadratic_inference",
    "run_gaia_linear_inference",
    "run_midpoint_inference",
    "run_sparg_inference",
    "run_tsdate_inference",
    "FASTGAIA_AVAILABLE",
    "GEOANCESTRY_AVAILABLE",
    "MIDPOINT_AVAILABLE",
    "SPARG_AVAILABLE",
    "TSDATE_AVAILABLE",
]

