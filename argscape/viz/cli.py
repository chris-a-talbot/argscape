"""Command-line interface for ARGscape visualization."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from argparse import Namespace


def parse_range(value: str | None) -> tuple[float, float] | None:
    """Parse a comma-separated range string into a tuple of floats."""
    if value is None or value == "":
        return None

    parts = value.split(",")
    if len(parts) != 2:
        raise ValueError(
            f"Invalid range format: '{value}'. Expected 'START,END' (e.g., '0,50000')"
        )

    try:
        start = float(parts[0].strip())
        end = float(parts[1].strip())
    except ValueError:
        raise ValueError(
            f"Invalid range values: '{value}'. Both values must be numbers."
        )

    return (start, end)


def create_parser() -> argparse.ArgumentParser:
    """Create the argument parser for the argscape_viz CLI."""
    parser = argparse.ArgumentParser(
        prog="argscape_viz",
        description="Visualize tree sequences (ARGs) with ARGscape.",
        epilog="Example: argscape_viz input.trees -o output.png --theme liquid",
    )

    # Required: input file
    parser.add_argument(
        "input",
        type=str,
        help="Input tree sequence file (.trees, .ts, .tsz)",
    )

    # Output options
    output_group = parser.add_argument_group("Output options")
    output_group.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Output file path (png, svg, or pdf). If not specified, opens in browser.",
    )
    output_group.add_argument(
        "--format",
        type=str,
        choices=["png", "svg", "pdf"],
        default=None,
        help="Output format (default: inferred from output filename)",
    )
    output_group.add_argument(
        "--dpi",
        type=int,
        default=150,
        help="DPI for raster output (default: 150)",
    )

    # Mode options
    mode_group = parser.add_argument_group("Mode options")
    mode_group.add_argument(
        "-m", "--mode",
        type=str,
        choices=["force_graph", "spatial_3d"],
        default="force_graph",
        help="Visualization mode (default: force_graph)",
    )
    mode_group.add_argument(
        "--interactive",
        action="store_true",
        help="Open visualization in browser for interactive exploration",
    )

    # Sizing options
    sizing_group = parser.add_argument_group("Sizing options")
    sizing_group.add_argument(
        "-W", "--width",
        type=int,
        default=1200,
        help="Visualization width in pixels (default: 1200)",
    )
    sizing_group.add_argument(
        "-H", "--height",
        type=int,
        default=800,
        help="Visualization height in pixels (default: 800)",
    )

    # Theme options
    theme_group = parser.add_argument_group("Theme options")
    theme_group.add_argument(
        "--theme",
        type=str,
        default="tskit",
        choices=["tskit", "liquid", "grayscale", "paper"],
        help="Color theme (default: tskit)",
    )

    # Subsetting options
    subset_group = parser.add_argument_group("Subsetting options")
    subset_group.add_argument(
        "--max-samples",
        type=int,
        default=None,
        help="Maximum number of samples to include",
    )
    subset_group.add_argument(
        "--subset-mode",
        type=str,
        choices=["even", "random"],
        default="even",
        help="Sample selection method when subsetting (default: even)",
    )
    subset_group.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducibility (used with --subset-mode random)",
    )

    # Filtering options
    filter_group = parser.add_argument_group("Filtering options")
    filter_group.add_argument(
        "--genomic-range",
        type=str,
        default=None,
        help="Genomic position range as 'START,END' (e.g., '0,50000')",
    )
    filter_group.add_argument(
        "--temporal-range",
        type=str,
        default=None,
        help="Temporal range as 'MIN_TIME,MAX_TIME' (e.g., '0,1000')",
    )

    # Node options
    node_group = parser.add_argument_group("Node options")
    node_group.add_argument(
        "--sample-node-size",
        type=int,
        default=8,
        help="Size of sample nodes in pixels (default: 8)",
    )
    node_group.add_argument(
        "--internal-node-size",
        type=int,
        default=4,
        help="Size of internal nodes in pixels (default: 4)",
    )
    node_group.add_argument(
        "--root-node-size",
        type=int,
        default=6,
        help="Size of root nodes in pixels (default: 6)",
    )
    node_group.add_argument(
        "--show-sample-ids",
        action="store_true",
        help="Show labels on sample nodes",
    )
    node_group.add_argument(
        "--show-internal-ids",
        action="store_true",
        help="Show labels on internal nodes",
    )
    node_group.add_argument(
        "--show-root-ids",
        action="store_true",
        help="Show labels on root nodes",
    )

    # Edge options
    edge_group = parser.add_argument_group("Edge options")
    edge_group.add_argument(
        "--edge-width",
        type=float,
        default=1.0,
        help="Edge line width (default: 1.0)",
    )
    edge_group.add_argument(
        "--edge-opacity",
        type=float,
        default=0.6,
        help="Edge opacity 0-1 (default: 0.6)",
    )
    edge_group.add_argument(
        "--show-edge-labels",
        action="store_true",
        help="Show labels on edges",
    )

    # Mutation options
    mutation_group = parser.add_argument_group("Mutation options")
    mutation_group.add_argument(
        "--show-mutations",
        action="store_true",
        help="Show mutation markers on edges",
    )
    mutation_group.add_argument(
        "--mutation-size",
        type=int,
        default=6,
        help="Size of mutation markers (default: 6)",
    )

    # Layout options (2D)
    layout_group = parser.add_argument_group("Layout options (2D)")
    layout_group.add_argument(
        "--sample-order",
        type=str,
        choices=["numeric", "first_minlex", "center_minlex", "consensus_minlex", "dagre"],
        default="consensus_minlex",
        help="Sample ordering algorithm (default: consensus_minlex)",
    )
    layout_group.add_argument(
        "--temporal-spacing",
        type=str,
        choices=["equal", "linear", "log"],
        default="linear",
        help="Temporal spacing mode (default: linear)",
    )
    layout_group.add_argument(
        "--vertical-spacing",
        type=float,
        default=100.0,
        help="Vertical spacing percentage 0-100 (default: 100.0)",
    )
    layout_group.add_argument(
        "--horizontal-spacing",
        type=float,
        default=100.0,
        help="Horizontal spacing percentage 0-100 (default: 100.0)",
    )

    # Spatial options (3D)
    spatial_group = parser.add_argument_group("Spatial options (3D)")
    spatial_group.add_argument(
        "--geo-base",
        type=str,
        choices=["unit_grid", "eastern_hemisphere"],
        default="unit_grid",
        help="Geographic base for 3D visualization (default: unit_grid)",
    )
    spatial_group.add_argument(
        "--temporal-multiplier",
        type=float,
        default=1.0,
        help="Z-axis scaling for 3D (default: 1.0)",
    )
    spatial_group.add_argument(
        "--spatial-multiplier",
        type=float,
        default=100.0,
        help="X-Y scaling for 3D (default: 100.0)",
    )

    return parser


def run(args: Namespace) -> int:
    """Execute the visualization based on parsed arguments."""
    import tskit

    from argscape import visualize
    from argscape.spatial import is_spatial_available

    # Check if 3D mode requested without spatial
    if args.mode == "spatial_3d" and not is_spatial_available():
        print(
            "Error: 3D spatial visualization requires spatial dependencies.\n"
            "Install with: pip install argscape[spatial]\n"
            "Or use 2D mode: argscape_viz input.trees --mode force_graph",
            file=sys.stderr
        )
        return 1

    # Validate input file
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        return 1

    # Load tree sequence
    try:
        if str(input_path).endswith(".tsz"):
            import tszip
            ts = tszip.decompress(str(input_path))
        else:
            ts = tskit.load(str(input_path))
    except Exception as e:
        print(f"Error loading tree sequence: {e}", file=sys.stderr)
        return 1

    # Parse filtering ranges
    genomic_range = parse_range(args.genomic_range)
    temporal_range = parse_range(args.temporal_range)

    # Create visualization with flat kwargs
    try:
        viz = visualize(
            ts,
            mode=args.mode,
            max_samples=args.max_samples,
            subset_mode=args.subset_mode,
            subset_seed=args.seed,
            genomic_range=genomic_range,
            temporal_range=temporal_range,
            theme=args.theme,
            width=args.width,
            height=args.height,
            sample_node_size=args.sample_node_size,
            internal_node_size=args.internal_node_size,
            root_node_size=args.root_node_size,
            show_sample_ids=args.show_sample_ids,
            show_internal_ids=args.show_internal_ids,
            show_root_ids=args.show_root_ids,
            edge_width=args.edge_width,
            edge_opacity=args.edge_opacity,
            show_edge_labels=args.show_edge_labels,
            show_mutations=args.show_mutations,
            mutation_size=args.mutation_size,
            sample_order=args.sample_order,
            temporal_spacing=args.temporal_spacing,
            vertical_spacing=args.vertical_spacing,
            horizontal_spacing=args.horizontal_spacing,
            geo_base=args.geo_base,
            temporal_multiplier=args.temporal_multiplier,
            spatial_multiplier=args.spatial_multiplier,
        )
    except Exception as e:
        print(f"Error creating visualization: {e}", file=sys.stderr)
        return 1

    # Handle output
    if args.output is not None:
        # Export to file
        try:
            viz.export(args.output, format=args.format, dpi=args.dpi)
            print(f"Visualization saved to: {args.output}")
        except Exception as e:
            print(f"Error exporting visualization: {e}", file=sys.stderr)
            return 1
    else:
        # Open in browser
        try:
            viz.show()
            print("Opened visualization in browser")
        except Exception as e:
            print(f"Error opening visualization: {e}", file=sys.stderr)
            return 1

    return 0


def main(argv: list[str] | None = None) -> int:
    """Entry point for argscape_viz command."""
    parser = create_parser()
    args = parser.parse_args(argv)
    return run(args)


if __name__ == "__main__":
    sys.exit(main())
