"""Graph data extraction from tree sequences.

Single responsibility: convert tskit.TreeSequence -> GraphData dict.
No API concerns, no session handling, no web framework dependencies.
"""

from __future__ import annotations
from collections import defaultdict
from dataclasses import dataclass, asdict
from typing import Any, Literal
import math

import numpy as np
import tskit


# Sample ordering type
SampleOrderType = Literal[
    "numeric",
    "first_minlex",
    "center_minlex",
    "consensus_minlex",
    "ancestral_path",
    "coalescence",
    "dagre",
]


@dataclass(frozen=True)
class GraphNode:
    """A node in the ARG visualization graph."""

    id: int
    time: float
    is_sample: bool
    is_root: bool
    population: int | None
    location: tuple[float, float] | tuple[float, float, float] | None
    order_position: int | None = None  # Position in sample ordering (samples only)


@dataclass(frozen=True)
class GraphEdge:
    """An edge in the ARG visualization graph."""

    source: int
    target: int
    left: float
    right: float
    has_mutations: bool = False
    mutations: list[dict[str, Any]] | None = None


@dataclass
class GraphData:
    """Complete graph data for visualization."""

    nodes: list[GraphNode]
    edges: list[GraphEdge]
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        """Serialize for JSON embedding."""
        return {
            "nodes": [asdict(n) for n in self.nodes],
            "edges": [asdict(e) for e in self.edges],
            "metadata": self.metadata,
        }


# Sample ordering algorithms

def _get_sample_order_numeric(ts: tskit.TreeSequence) -> list[int]:
    """Get sample order in numeric order (0, 1, 2, etc.)."""
    sample_nodes = [node.id for node in ts.nodes() if node.is_sample()]
    return sorted(sample_nodes)


def _get_sample_order_minlex_postorder(
    ts: tskit.TreeSequence,
    position: float,
    ignore_unattached_nodes: bool = True
) -> list[int]:
    """Get sample order using minlex postorder traversal at given genomic position."""
    in_edges = np.unique(np.append(ts.edges_parent, ts.edges_child))
    samples = []
    tree = ts.at(position)
    order = tree.nodes(order="minlex_postorder")
    for n in order:
        if ts.node(n).is_sample():
            if ignore_unattached_nodes and n not in in_edges:
                continue
            samples.append(n)
    return samples


def _get_sample_order_first_tree(ts: tskit.TreeSequence) -> list[int]:
    """Get sample order using minlex postorder of first tree."""
    return _get_sample_order_minlex_postorder(ts, 0.0)


def _get_sample_order_center_tree(ts: tskit.TreeSequence) -> list[int]:
    """Get sample order using minlex postorder at center of tree sequence."""
    center_position = ts.sequence_length / 2
    return _get_sample_order_minlex_postorder(ts, center_position)


def _get_sample_order_consensus(ts: tskit.TreeSequence) -> list[int]:
    """Get sample order using consensus algorithm based on majority voting.

    Implements the TipSampleOrdering consensus approach:
    - Extracts K sample orders from local trees spread across the genome.
    - Uses pairwise majority voting to determine a consensus sample order.
    - K is selected based on the number of trees, capped at 50.
    """
    samples = {node.id for node in ts.nodes() if node.is_sample()}

    if len(samples) <= 1:
        return list(samples)

    num_trees = ts.num_trees

    # Choose K (number of trees to use for voting)
    if num_trees <= 20:
        k_trees = num_trees
    else:
        k_trees = int(20 + (num_trees / 4))
        k_trees = min(k_trees, 50)

    # Choose K evenly spaced genomic positions
    positions = []
    if k_trees == 1:
        positions = [ts.sequence_length / 2]
    else:
        for i in range(k_trees):
            pos = i * ts.sequence_length / k_trees
            pos = min(pos, ts.sequence_length - 1e-10)
            positions.append(pos)

    # Get sample orders from the selected positions
    orders = []
    for pos in positions:
        order = _get_sample_order_minlex_postorder(ts, pos, ignore_unattached_nodes=True)
        orders.append(order)

    # Pairwise voting
    sample_list = list(samples)
    n_samples = len(sample_list)
    vote_matrix = np.zeros((n_samples, n_samples))

    for order in orders:
        if len(order) < 2:
            continue
        pos_map = {sample_id: idx for idx, sample_id in enumerate(order)}
        for i, sample_a in enumerate(sample_list):
            for j, sample_b in enumerate(sample_list):
                if sample_a in pos_map and sample_b in pos_map:
                    if pos_map[sample_a] < pos_map[sample_b]:
                        vote_matrix[i, j] += 1

    # Aggregate votes
    total_votes = np.sum(vote_matrix, axis=1)
    sorted_indices = np.argsort(-total_votes)

    return [sample_list[i] for i in sorted_indices]


def _get_sample_order_dagre(ts: tskit.TreeSequence) -> list[int]:
    """Get sample order using dagre-style layer optimization.

    This orders samples to minimize edge crossings by considering
    the graph structure. Uses a barycenter heuristic.
    """
    samples = [node.id for node in ts.nodes() if node.is_sample()]

    if len(samples) <= 1:
        return samples

    # Build adjacency: for each sample, find its immediate ancestors
    sample_parents = defaultdict(set)
    for edge in ts.edges():
        if edge.child in samples:
            sample_parents[edge.child].add(edge.parent)

    # For each parent, track which samples it connects to
    parent_samples = defaultdict(list)
    for sample, parents in sample_parents.items():
        for parent in parents:
            parent_samples[parent].append(sample)

    # Compute barycenter for each sample based on shared ancestry
    # Samples with shared parents should be close together
    sample_positions = {}

    # Initial positions based on numeric order
    for i, s in enumerate(sorted(samples)):
        sample_positions[s] = i

    # Iterate to improve positions (barycenter method)
    for _ in range(10):  # 10 iterations usually sufficient
        new_positions = {}
        for sample in samples:
            # Get positions of samples that share parents with this one
            neighbors = []
            for parent in sample_parents[sample]:
                for neighbor in parent_samples[parent]:
                    if neighbor != sample:
                        neighbors.append(sample_positions.get(neighbor, 0))

            if neighbors:
                # Barycenter: average position of neighbors
                new_positions[sample] = sum(neighbors) / len(neighbors)
            else:
                new_positions[sample] = sample_positions[sample]

        sample_positions = new_positions

    # Sort by computed positions
    ordered = sorted(samples, key=lambda s: sample_positions.get(s, s))
    return ordered


def _compute_sample_ordering(
    ts: tskit.TreeSequence,
    sample_order: SampleOrderType,
) -> dict[int, int]:
    """Compute sample ordering and return mapping from sample ID to position.

    Args:
        ts: The tree sequence
        sample_order: The ordering algorithm to use

    Returns:
        Dictionary mapping sample node ID to its position in the ordering
    """
    if sample_order == "numeric":
        ordered_samples = _get_sample_order_numeric(ts)
    elif sample_order == "first_minlex":
        ordered_samples = _get_sample_order_first_tree(ts)
    elif sample_order == "center_minlex":
        ordered_samples = _get_sample_order_center_tree(ts)
    elif sample_order == "consensus_minlex":
        ordered_samples = _get_sample_order_consensus(ts)
    elif sample_order == "dagre":
        ordered_samples = _get_sample_order_dagre(ts)
    elif sample_order in ("ancestral_path", "coalescence"):
        # These are computed client-side; use consensus as backend fallback
        ordered_samples = _get_sample_order_consensus(ts)
    else:
        # Default to consensus
        ordered_samples = _get_sample_order_consensus(ts)

    return {sample_id: i for i, sample_id in enumerate(ordered_samples)}


def _compute_all_sample_orderings(ts: tskit.TreeSequence) -> dict[str, dict[int, int]]:
    """Compute ALL sample orderings for dynamic switching in frontend.

    Args:
        ts: The tree sequence

    Returns:
        Dictionary mapping ordering name to {sample_id: position} dict
    """
    orderings: dict[str, dict[int, int]] = {}

    # Numeric is fast
    numeric_samples = _get_sample_order_numeric(ts)
    orderings["numeric"] = {s: i for i, s in enumerate(numeric_samples)}

    # First tree minlex
    first_samples = _get_sample_order_first_tree(ts)
    orderings["first_minlex"] = {s: i for i, s in enumerate(first_samples)}

    # Center tree minlex
    center_samples = _get_sample_order_center_tree(ts)
    orderings["center_minlex"] = {s: i for i, s in enumerate(center_samples)}

    # Consensus (most expensive but most useful)
    consensus_samples = _get_sample_order_consensus(ts)
    orderings["consensus_minlex"] = {s: i for i, s in enumerate(consensus_samples)}

    # Dagre
    dagre_samples = _get_sample_order_dagre(ts)
    orderings["dagre"] = {s: i for i, s in enumerate(dagre_samples)}

    return orderings


# Mutation extraction

def _extract_mutations(ts: tskit.TreeSequence) -> dict[tuple[int, int], list[dict[str, Any]]]:
    """Extract mutations and map them to edges.

    Returns a dictionary mapping (parent, child) edge keys to lists of mutations.
    """
    if ts.num_mutations == 0:
        return {}

    # Build edge lookup: (parent, child) -> list of (left, right) spans
    edge_spans = defaultdict(list)
    for edge in ts.edges():
        edge_spans[(edge.parent, edge.child)].append((edge.left, edge.right))

    # Cache trees at mutation positions
    position_to_tree = {}

    # Map mutations to edges
    edge_mutations: dict[tuple[int, int], list[dict[str, Any]]] = defaultdict(list)

    for mutation in ts.mutations():
        site = ts.site(mutation.site)
        position = site.position

        # Get tree at this position
        if position not in position_to_tree:
            position_to_tree[position] = ts.at(position)
        tree = position_to_tree[position]

        # Find parent of mutation node in this tree
        mutation_node = mutation.node
        parent_node = tree.parent(mutation_node)

        if parent_node == tskit.NULL:
            continue

        # Check if this parent-child pair has an edge spanning this position
        edge_key = (parent_node, mutation_node)
        if edge_key in edge_spans:
            for left, right in edge_spans[edge_key]:
                if left <= position < right:
                    # Determine previous state
                    previous_state = site.ancestral_state
                    if mutation.parent != -1:
                        parent_mut = ts.mutation(mutation.parent)
                        previous_state = parent_mut.derived_state

                    mutation_time = mutation.time if math.isfinite(mutation.time) else None

                    mutation_data = {
                        'id': f"{previous_state}{int(position)}{mutation.derived_state}",
                        'site': int(mutation.site),
                        'position': float(position),
                        'node': int(mutation_node),
                        'time': mutation_time,
                        'ancestral_state': site.ancestral_state,
                        'previous_state': previous_state,
                        'derived_state': mutation.derived_state,
                    }
                    edge_mutations[edge_key].append(mutation_data)
                    break

    # Sort mutations on each edge by position
    for key in edge_mutations:
        edge_mutations[key].sort(key=lambda m: m['position'])

    return dict(edge_mutations)


def _subset_samples(
    ts: tskit.TreeSequence,
    max_samples: int,
    mode: Literal["even", "random"],
    seed: int | None,
) -> tskit.TreeSequence:
    """Subset tree sequence to max_samples using specified mode.

    Args:
        ts: The tree sequence to subset
        max_samples: Maximum number of samples to keep
        mode: "even" for evenly spaced samples, "random" for random selection
        seed: Random seed for reproducibility (only used in "random" mode)

    Returns:
        A simplified tree sequence with at most max_samples samples
    """
    sample_ids = ts.samples()
    num_samples = len(sample_ids)

    if num_samples <= max_samples:
        return ts

    if mode == "even":
        # Select evenly spaced samples using linspace indices
        indices = np.linspace(0, num_samples - 1, max_samples, dtype=int)
        selected_samples = sample_ids[indices]
    else:  # random
        rng = np.random.default_rng(seed)
        selected_samples = rng.choice(sample_ids, size=max_samples, replace=False)

    return ts.simplify(samples=selected_samples)


def _extract_nodes(
    ts: tskit.TreeSequence,
    order_map: dict[int, int] | None = None,
) -> list[GraphNode]:
    """Extract GraphNode list from tree sequence.

    Includes location from individuals when available.
    Identifies root nodes (nodes that are never children in any edge).

    Args:
        ts: The tree sequence to extract nodes from
        order_map: Optional mapping from sample ID to order position

    Returns:
        List of GraphNode objects
    """
    # Find all nodes that are children in edges (i.e., have parents)
    child_nodes = set(ts.edges_child)

    nodes = []
    for node in ts.nodes():
        # Determine location from individual if available
        location = None
        if node.individual != tskit.NULL and node.individual < ts.num_individuals:
            individual = ts.individual(node.individual)
            if individual.location is not None and len(individual.location) >= 2:
                x, y = float(individual.location[0]), float(individual.location[1])
                if np.isfinite(x) and np.isfinite(y):
                    if len(individual.location) >= 3:
                        z = float(individual.location[2])
                        if np.isfinite(z):
                            location = (x, y, z)
                        else:
                            location = (x, y)
                    else:
                        location = (x, y)

        # Determine population
        population = node.population if node.population != tskit.NULL else None

        # A node is a root if it's never a child in any edge
        is_root = node.id not in child_nodes

        # Get order position for sample nodes
        is_sample = bool(node.flags & tskit.NODE_IS_SAMPLE)
        order_position = order_map.get(node.id) if (order_map and is_sample) else None

        nodes.append(
            GraphNode(
                id=node.id,
                time=float(node.time),
                is_sample=is_sample,
                is_root=is_root,
                population=population,
                location=location,
                order_position=order_position,
            )
        )
    return nodes


def _extract_edges(
    ts: tskit.TreeSequence,
    include_mutations: bool = False,
) -> list[GraphEdge]:
    """Extract GraphEdge list, grouping by parent-child and combining spans.

    Edges with the same parent-child relationship are grouped, with
    left/right bounds taking min(left) and max(right) respectively.

    Args:
        ts: The tree sequence to extract edges from
        include_mutations: Whether to include mutation data on edges

    Returns:
        List of GraphEdge objects
    """
    # Extract mutations if requested
    edge_mutations = _extract_mutations(ts) if include_mutations else {}

    # Group edges by (parent, child)
    edge_groups: dict[tuple[int, int], list[tskit.Edge]] = defaultdict(list)
    for edge in ts.edges():
        key = (edge.parent, edge.child)
        edge_groups[key].append(edge)

    edges = []
    for (parent, child), group in edge_groups.items():
        # Combine spans: take min left, max right
        left = min(e.left for e in group)
        right = max(e.right for e in group)

        edge_key = (parent, child)
        mutations = edge_mutations.get(edge_key, [])

        edges.append(
            GraphEdge(
                source=parent,
                target=child,
                left=float(left),
                right=float(right),
                has_mutations=len(mutations) > 0,
                mutations=mutations if mutations else None,
            )
        )

    return edges


def _compute_popgen_stats(ts: tskit.TreeSequence) -> dict[str, Any]:
    """Compute population genetics statistics for a tree sequence.

    Args:
        ts: Tree sequence to analyze

    Returns:
        Dictionary containing pop gen statistics
    """
    stats: dict[str, Any] = {}

    try:
        # Nucleotide diversity (π) using branch lengths
        try:
            pi = ts.diversity(mode="branch")
            if ts.sequence_length > 0:
                pi = pi / ts.sequence_length
            stats['nucleotide_diversity'] = float(pi) if not np.isnan(pi) else None
        except Exception:
            stats['nucleotide_diversity'] = None

        # Segregating sites
        segregating_sites = 0
        if ts.num_mutations > 0:
            try:
                result = ts.segregating_sites()
                if isinstance(result, np.ndarray):
                    segregating_sites = int(np.sum(result > 0))
                else:
                    segregating_sites = int(result)
                if segregating_sites == 0 and ts.num_mutations > 0:
                    segregating_sites = ts.num_sites
            except Exception:
                segregating_sites = ts.num_sites if hasattr(ts, 'num_sites') else 0

        stats['segregating_sites'] = segregating_sites

        # Watterson's theta
        if segregating_sites > 0:
            n = ts.num_samples
            harmonic = sum(1.0 / i for i in range(1, n))
            if harmonic > 0 and ts.sequence_length > 0:
                theta_w = segregating_sites / (ts.sequence_length * harmonic)
                stats['wattersons_theta'] = float(theta_w) if not np.isnan(theta_w) else None
            else:
                stats['wattersons_theta'] = None
        else:
            stats['wattersons_theta'] = None

        # Tajima's D
        if segregating_sites > 0:
            try:
                if hasattr(ts, 'Tajimas_D'):
                    tajima_d = ts.Tajimas_D()
                elif hasattr(ts, 'Tajima_D'):
                    tajima_d = ts.Tajima_D()
                else:
                    tajima_d = None

                if tajima_d is not None:
                    if isinstance(tajima_d, np.ndarray):
                        tajima_d = float(np.mean(tajima_d)) if len(tajima_d) > 0 else None
                    else:
                        tajima_d = float(tajima_d) if not np.isnan(tajima_d) else None
                stats['tajimas_d'] = tajima_d
            except Exception:
                stats['tajimas_d'] = None
        else:
            stats['tajimas_d'] = None

        # Tree topology stats
        tree_heights = []
        tree_lengths = []
        tmrca_values = []

        for tree in ts.trees():
            if tree.num_roots == 1:
                root_time = tree.time(tree.root)
                tmrca_values.append(root_time)
                tree_heights.append(root_time)
            else:
                root_times = [tree.time(root) for root in tree.roots]
                max_root_time = max(root_times)
                tmrca_values.append(max_root_time)
                tree_heights.append(max_root_time)

            tree_lengths.append(tree.total_branch_length)

        if tree_heights:
            stats['mean_tree_height'] = float(np.mean(tree_heights))
            stats['median_tree_height'] = float(np.median(tree_heights))
        else:
            stats['mean_tree_height'] = None
            stats['median_tree_height'] = None

        if tree_lengths:
            stats['mean_tree_length'] = float(np.mean(tree_lengths))
            stats['median_tree_length'] = float(np.median(tree_lengths))
        else:
            stats['mean_tree_length'] = None
            stats['median_tree_length'] = None

        if tmrca_values:
            stats['tmrca'] = float(np.max(tmrca_values))
        else:
            stats['tmrca'] = None

        # Ne estimation using Watterson's estimator
        mutation_rate = 1e-8
        if stats.get('wattersons_theta') is not None:
            ne = stats['wattersons_theta'] / (4 * mutation_rate)
            stats['ne_watterson'] = float(ne) if not np.isnan(ne) and ne > 0 else None
        else:
            stats['ne_watterson'] = None

        # Ne using nucleotide diversity
        if stats.get('nucleotide_diversity') is not None:
            ne = stats['nucleotide_diversity'] / (4 * mutation_rate)
            stats['ne_pi'] = float(ne) if not np.isnan(ne) and ne > 0 else None
        else:
            stats['ne_pi'] = None

        # Recombination breakpoint density
        if ts.num_trees > 1 and ts.sequence_length > 0:
            stats['estimated_recombination_rate'] = float((ts.num_trees - 1) / ts.sequence_length)
        else:
            stats['estimated_recombination_rate'] = None

    except Exception:
        return {}

    return stats


def _build_metadata(
    ts: tskit.TreeSequence,
    original_ts: tskit.TreeSequence | None,
    sample_order: SampleOrderType,
    sample_orderings: dict[str, dict[int, int]] | None = None,
) -> dict[str, Any]:
    """Build metadata dict with counts and flags.

    Args:
        ts: The (possibly subsetted) tree sequence
        original_ts: The original tree sequence before subsetting (or None if no subset)
        sample_order: The sample ordering algorithm used
        sample_orderings: Pre-computed sample orderings for all algorithms

    Returns:
        Metadata dictionary
    """
    is_subset = original_ts is not None and original_ts is not ts

    # Compute tree intervals for genomic filtering
    tree_intervals = []
    for i, tree in enumerate(ts.trees()):
        tree_intervals.append({
            "index": i,
            "left": tree.interval.left,
            "right": tree.interval.right,
        })

    # Compute temporal bounds from all nodes
    node_times = [node.time for node in ts.nodes()]
    min_time = min(node_times) if node_times else 0.0
    max_time = max(node_times) if node_times else 0.0

    # Compute population genetics statistics
    popgen_stats = _compute_popgen_stats(ts)

    metadata = {
        "num_nodes": ts.num_nodes,
        "num_edges": ts.num_edges,
        "num_samples": ts.num_samples,
        "num_trees": ts.num_trees,
        "num_mutations": ts.num_mutations,
        "sequence_length": ts.sequence_length,
        "is_subset": is_subset,
        "sample_order": sample_order,
        "tree_intervals": tree_intervals,
        "min_time": min_time,
        "max_time": max_time,
        "popgen_stats": popgen_stats,
    }

    if is_subset:
        metadata["original_num_samples"] = original_ts.num_samples
        metadata["original_num_nodes"] = original_ts.num_nodes

    # Include all sample orderings for dynamic switching in frontend
    if sample_orderings is not None:
        metadata["sample_orderings"] = sample_orderings

    return metadata


def extract_graph(
    ts: tskit.TreeSequence,
    *,
    max_samples: int | None = None,
    subset_mode: Literal["even", "random"] = "even",
    subset_seed: int | None = None,
    genomic_range: tuple[float, float] | None = None,
    temporal_range: tuple[float, float] | None = None,
    include_mutations: bool = False,
    sample_order: SampleOrderType = "consensus_minlex",
) -> GraphData:
    """Extract graph data from a tree sequence for visualization.

    Main function that orchestrates extraction from tskit.TreeSequence to GraphData.

    Args:
        ts: The tree sequence to extract from
        max_samples: Maximum number of samples to include (None for all)
        subset_mode: How to select samples when subsetting ("even" or "random")
        subset_seed: Random seed for reproducibility in random mode
        genomic_range: Optional (start, end) genomic positions to filter to
        temporal_range: Optional (min_time, max_time) to filter nodes by time
        include_mutations: Whether to include mutation information on edges
        sample_order: Sample ordering algorithm ("consensus_minlex" by default)

    Returns:
        GraphData containing nodes, edges, and metadata for visualization
    """
    original_ts = ts

    # Apply sample subsetting first
    if max_samples is not None:
        ts = _subset_samples(ts, max_samples, subset_mode, subset_seed)

    # Apply genomic range filter
    if genomic_range is not None:
        start, end = genomic_range
        ts = ts.keep_intervals([[start, end]]).trim()

    # Compute ALL sample orderings for dynamic switching in frontend
    all_orderings = _compute_all_sample_orderings(ts)

    # Use the requested ordering for initial node positions
    order_map = all_orderings.get(sample_order, all_orderings["consensus_minlex"])

    # Extract nodes and edges
    nodes = _extract_nodes(ts, order_map)
    edges = _extract_edges(ts, include_mutations=include_mutations)

    # Apply temporal filter post-extraction (filter nodes by time)
    if temporal_range is not None:
        min_time, max_time = temporal_range
        # Keep nodes within temporal range, but always keep sample nodes
        nodes = [
            n for n in nodes
            if n.is_sample or (min_time <= n.time <= max_time)
        ]
        # Keep only edges where both source and target are in remaining nodes
        node_ids = {n.id for n in nodes}
        edges = [
            e for e in edges
            if e.source in node_ids and e.target in node_ids
        ]

    # Build metadata with all sample orderings
    metadata = _build_metadata(
        ts,
        original_ts if max_samples is not None else None,
        sample_order,
        sample_orderings=all_orderings,
    )

    return GraphData(nodes=nodes, edges=edges, metadata=metadata)
