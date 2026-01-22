"""Color themes for ARGview visualizations.

Themes define all colors used in rendering. Each theme is a frozen
dataclass ensuring immutability and type safety.

Colors are designed to match the ARGscape web application exactly.
"""

from dataclasses import dataclass, asdict
from typing import Any


@dataclass(frozen=True)
class NodeColors:
    """Color scheme for nodes."""

    sample: str
    internal: str
    root: str
    cluster: str
    selected: str


@dataclass(frozen=True)
class EdgeColors:
    """Color scheme for edges."""

    default: str
    highlight: str
    dimmed: str


@dataclass(frozen=True)
class Theme:
    """Complete color theme for visualization."""

    name: str
    background: str
    nodes: NodeColors
    edges: EdgeColors
    text: str
    text_secondary: str
    grid: str
    mutation: str
    mutation_unknown: str

    def to_dict(self) -> dict[str, Any]:
        """Serialize theme to dictionary for JSON embedding."""
        return {
            "name": self.name,
            "background": self.background,
            "nodes": asdict(self.nodes),
            "edges": asdict(self.edges),
            "text": self.text,
            "text_secondary": self.text_secondary,
            "grid": self.grid,
            "mutation": self.mutation,
            "mutation_unknown": self.mutation_unknown,
        }


# Built-in themes - colors match ARGscape web application

# tskit theme - dark theme with cyan/green accents (original ARGscape look)
TSKIT = Theme(
    name="tskit",
    background="#03303E",  # Dark teal
    nodes=NodeColors(
        sample="#14E2A8",   # Pale green (ARGscape signature)
        internal="#60A0B7", # Light blue
        root="#38BDF8",     # Cyan
        cluster="#9333EA",  # Purple (with transparency in rendering)
        selected="#ffffff",
    ),
    edges=EdgeColors(
        default="#999999",  # Gray (rendered with 0.4 opacity)
        highlight="#ffffff",
        dimmed="#4a5568",
    ),
    text="#ffffff",
    text_secondary="#14E2A8",
    grid="#14E2A8",
    mutation="#4F46E5",     # Indigo
    mutation_unknown="#6366F1",
)

# Liquid theme - light Apple-inspired theme with glass effects
LIQUID = Theme(
    name="liquid",
    background="#f5f5f7",   # Apple's light gray
    nodes=NodeColors(
        sample="#14E2A8",   # ARGscape green
        internal="#94A3B8", # Slate 400
        root="#14E2A8",     # ARGscape green
        cluster="#94A3B8",
        selected="#14E2A8",
    ),
    edges=EdgeColors(
        default="#94A3B8",  # Slate 400 (rendered with opacity)
        highlight="#14E2A8",
        dimmed="#CBD5E1",
    ),
    text="#1d1d1f",         # Apple's near-black
    text_secondary="#6e6e73",
    grid="#14E2A8",
    mutation="#4F46E5",     # Indigo
    mutation_unknown="#6366F1",
)

# Grayscale theme - publication-ready, no colors
GRAYSCALE = Theme(
    name="grayscale",
    background="#ffffff",
    nodes=NodeColors(
        sample="#464646",   # Darker gray for samples
        internal="#646464", # Medium gray
        root="#323232",     # Dark gray for roots
        cluster="#505050",
        selected="#000000",
    ),
    edges=EdgeColors(
        default="#8C8C8C",  # Light gray
        highlight="#282828",
        dimmed="#cccccc",
    ),
    text="#212529",
    text_secondary="#6c757d",
    grid="#8C8C8C",
    mutation="#4a4a4a",
    mutation_unknown="#6a6a6a",
)

# Paper theme - optimized for publication figures
# High contrast, clean lines, print-friendly colors
PAPER = Theme(
    name="paper",
    background="#ffffff",
    nodes=NodeColors(
        sample="#2563eb",      # Blue - distinct, prints well
        internal="#6b7280",    # Gray - subtle but visible
        root="#dc2626",        # Red - stands out for roots
        cluster="#9ca3af",
        selected="#f59e0b",    # Amber for selection
    ),
    edges=EdgeColors(
        default="#374151",     # Dark gray - good contrast
        highlight="#2563eb",
        dimmed="#d1d5db",
    ),
    text="#111827",            # Near-black for readability
    text_secondary="#4b5563",
    grid="#e5e7eb",
    mutation="#ea580c",        # Orange
    mutation_unknown="#f97316",
)

THEMES: dict[str, Theme] = {
    "tskit": TSKIT,
    "liquid": LIQUID,
    "grayscale": GRAYSCALE,
    "paper": PAPER,
}


def get_theme(name: str) -> Theme:
    """Get a theme by name.

    Args:
        name: Theme name ("tskit", "liquid", "grayscale", or "paper")

    Returns:
        Theme object

    Raises:
        ValueError: If theme name is unknown
    """
    if name not in THEMES:
        available = ", ".join(THEMES.keys())
        raise ValueError(f"Unknown theme: {name}. Available: {available}")
    return THEMES[name]


def list_themes() -> list[str]:
    """Return list of available theme names."""
    return list(THEMES.keys())
