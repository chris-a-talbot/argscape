"""
ARGscape: Interactive ARG visualization and analysis.

Basic usage (always available):
    import argscape
    viz = argscape.visualize(ts)  # 2D ForceGraph
    viz.show()

For 3D spatial visualization and inference, install with:
    pip install argscape[spatial]

Then:
    viz = argscape.visualize(ts, mode="spatial_3d")
    result = argscape.infer(ts, method="fastgaia")
"""

__version__ = "0.6.2"

from .visualize import visualize, VizResult
from .spatial import is_spatial_available, is_playwright_available
from .infer import infer, InferResult, available_methods

__all__ = [
    "visualize",
    "VizResult",
    "infer",
    "InferResult",
    "available_methods",
    "is_spatial_available",
    "is_playwright_available",
    "__version__",
]
