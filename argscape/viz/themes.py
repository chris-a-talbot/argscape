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


def customize_theme(
    base: str | Theme = "liquid",
    *,
    # Node colors
    sample_color: str | None = None,
    internal_color: str | None = None,
    root_color: str | None = None,
    # Edge colors
    edge_color: str | None = None,
    # Other colors
    background_color: str | None = None,
    mutation_color: str | None = None,
    text_color: str | None = None,
) -> Theme:
    """Create a custom theme by overriding colors from a base theme.

    This function allows you to create a custom theme by selectively
    overriding specific colors while keeping all other colors from
    the base theme.

    Args:
        base: Base theme name or Theme object to customize
        sample_color: Color for sample (leaf) nodes
        internal_color: Color for internal nodes
        root_color: Color for root nodes
        edge_color: Color for edges
        background_color: Background color
        mutation_color: Color for mutation markers
        text_color: Color for text labels

    Returns:
        A new Theme object with the specified overrides

    Example:
        >>> from argscape.viz.themes import customize_theme
        >>> my_theme = customize_theme(
        ...     "paper",
        ...     sample_color="#e63946",
        ...     edge_color="#457b9d"
        ... )
    """
    # Get base theme
    if isinstance(base, str):
        base_theme = get_theme(base)
    else:
        base_theme = base

    # Build node colors with overrides
    nodes = NodeColors(
        sample=sample_color if sample_color is not None else base_theme.nodes.sample,
        internal=internal_color if internal_color is not None else base_theme.nodes.internal,
        root=root_color if root_color is not None else base_theme.nodes.root,
        cluster=base_theme.nodes.cluster,
        selected=base_theme.nodes.selected,
    )

    # Build edge colors with overrides
    edges = EdgeColors(
        default=edge_color if edge_color is not None else base_theme.edges.default,
        highlight=base_theme.edges.highlight,
        dimmed=base_theme.edges.dimmed,
    )

    # Build the custom theme
    return Theme(
        name="custom",
        background=background_color if background_color is not None else base_theme.background,
        nodes=nodes,
        edges=edges,
        text=text_color if text_color is not None else base_theme.text,
        text_secondary=base_theme.text_secondary,
        grid=base_theme.grid,
        mutation=mutation_color if mutation_color is not None else base_theme.mutation,
        mutation_unknown=base_theme.mutation_unknown,
    )
