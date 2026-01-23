"""Animation configuration for ARGscape visualizations."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Literal, Union, List


@dataclass
class TemporalAnimation:
    """Configure temporal (time-based) layer reveal animation.

    Args:
        mode: Animation mode - "hide" reveals layers sequentially,
              "glide" adds camera tracking (3D only), "root-to-samples"
              expands from root nodes down through time.
        rate: Playback speed in layers per second.
    """
    mode: Literal["hide", "glide", "root-to-samples"] = "glide"
    rate: float = 1.0

    def __post_init__(self):
        if self.rate <= 0:
            raise ValueError("rate must be > 0")
        if self.mode not in ("hide", "glide", "root-to-samples"):
            raise ValueError(f"mode must be 'hide', 'glide', or 'root-to-samples', got '{self.mode}'")

    def to_dict(self) -> dict:
        return {"type": "temporal", **asdict(self)}


@dataclass
class GenomicAnimation:
    """Configure genomic sliding window animation.

    Specify window size in either genomic coordinates (bp) or tree count.
    Specify step size OR overlap fraction (not both).

    Args:
        window: Window size in base pairs.
        window_trees: Window size in number of trees (alternative to window).
        step: Step size in same units as window.
        overlap: Overlap fraction 0-1 (alternative to step).
        rate: Playback speed in steps per second.
    """
    window: int | None = None
    window_trees: int | None = None
    step: int | None = None
    overlap: float | None = None
    rate: float = 1.0

    def __post_init__(self):
        # Validate window specification
        if self.window is None and self.window_trees is None:
            raise ValueError("Must specify either 'window' or 'window_trees'")
        if self.window is not None and self.window_trees is not None:
            raise ValueError("Cannot specify both 'window' and 'window_trees'")

        # Validate step/overlap specification
        if self.step is not None and self.overlap is not None:
            raise ValueError("Cannot specify both 'step' and 'overlap'")

        # Validate overlap range
        if self.overlap is not None and not (0 <= self.overlap < 1):
            raise ValueError("overlap must be in [0, 1)")

        # Validate positive values
        if self.rate <= 0:
            raise ValueError("rate must be > 0")
        if self.window is not None and self.window <= 0:
            raise ValueError("window must be > 0")
        if self.window_trees is not None and self.window_trees <= 0:
            raise ValueError("window_trees must be > 0")
        if self.step is not None and self.step <= 0:
            raise ValueError("step must be > 0")

    def to_dict(self) -> dict:
        return {"type": "genomic", **asdict(self)}


# Type alias for animation parameter
AnimationType = Union[TemporalAnimation, GenomicAnimation, List[Union[TemporalAnimation, GenomicAnimation]], None]


def normalize_animation(animation: AnimationType) -> dict | None:
    """Convert animation config to dict format for serialization.

    Args:
        animation: Single animation, list of animations, or None.

    Returns:
        Dict with 'temporal' and/or 'genomic' keys, or None.
    """
    if animation is None:
        return None

    if isinstance(animation, (TemporalAnimation, GenomicAnimation)):
        animation = [animation]

    result = {}
    for anim in animation:
        if isinstance(anim, TemporalAnimation):
            result["temporal"] = anim.to_dict()
        elif isinstance(anim, GenomicAnimation):
            result["genomic"] = anim.to_dict()
        else:
            raise TypeError(f"Expected TemporalAnimation or GenomicAnimation, got {type(anim)}")

    return result if result else None
