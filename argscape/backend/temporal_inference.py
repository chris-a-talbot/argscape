"""
Temporal inference functionality for ARGscape.
Handles tsdate-based temporal inference.
"""

import logging
import os
from typing import Dict, Tuple, Optional, Any

import numpy as np
import tskit

# Configure logging
logger = logging.getLogger(__name__)

# Import tsdate only if not explicitly disabled
DISABLE_TSDATE = os.getenv("DISABLE_TSDATE", "0").lower() in ("1", "true", "yes")
if not DISABLE_TSDATE:
    try:
        import tsdate
        TSDATE_AVAILABLE = True
        logger.info("tsdate successfully imported")
    except ImportError:
        tsdate = None
        TSDATE_AVAILABLE = False
        logger.warning("tsdate not available - temporal inference disabled")
else:
    tsdate = None
    TSDATE_AVAILABLE = False
    logger.info("tsdate import skipped - temporal inference disabled by configuration")


def check_mutations_present(ts: tskit.TreeSequence) -> bool:
    """Return True if the tree sequence contains mutations."""
    return ts.num_mutations > 0


def preprocess_tree_sequence(
    ts: tskit.TreeSequence,
    remove_telomeres: bool,
    minimum_gap: Optional[float],
    split_disjoint: bool,
    filter_populations: bool,
    filter_individuals: bool,
    filter_sites: bool
) -> tskit.TreeSequence:
    """Preprocess the tree sequence for tsdate."""
    try:
        return tsdate.preprocess_ts(
            ts,
            remove_telomeres=remove_telomeres,
            minimum_gap=minimum_gap,
            split_disjoint=split_disjoint,
            filter_populations=filter_populations,
            filter_individuals=filter_individuals,
            filter_sites=filter_sites
        )
    except Exception as e:
        logger.error(f"Preprocessing failed: {e}")
        raise RuntimeError(f"Preprocessing failed: {e}")


def run_tsdate_inference(
    ts: tskit.TreeSequence,
    mutation_rate: float = 1e-8,
    progress: bool = True,
    preprocess: bool = True,
    remove_telomeres: bool = False,
    minimum_gap: Optional[float] = None,
    split_disjoint: bool = True,
    filter_populations: bool = False,
    filter_individuals: bool = False,
    filter_sites: bool = False
) -> Tuple[tskit.TreeSequence, Dict[str, Any]]:
    """
    Run tsdate inference on a tree sequence.

    Returns:
        A tuple of (dated TreeSequence, inference metadata).
    """
    if not TSDATE_AVAILABLE:
        raise RuntimeError("tsdate package is not available.")

    if not check_mutations_present(ts):
        raise ValueError("Input tree sequence must contain mutations.")

    logger.info(f"Starting tsdate inference with mutation rate={mutation_rate}")
    ts_copy = ts.dump_tables().tree_sequence()

    if preprocess:
        logger.info("Preprocessing tree sequence...")
        ts_copy = preprocess_tree_sequence(
            ts_copy,
            remove_telomeres,
            minimum_gap,
            split_disjoint,
            filter_populations,
            filter_individuals,
            filter_sites
        )
        logger.info("Preprocessing complete.")

    try:
        ts_with_times = tsdate.date(
            ts_copy,
            mutation_rate=mutation_rate,
            progress=progress
        )
        logger.info("tsdate inference complete.")
    except Exception as e:
        logger.error(f"tsdate inference failed: {e}")
        raise RuntimeError(f"tsdate inference failed: {e}")

    num_inferred = ts_with_times.num_nodes - ts_with_times.num_samples

    inference_info = {
        "num_inferred_times": num_inferred,
        "total_nodes": ts_with_times.num_nodes,
        "mutation_rate": mutation_rate,
        "preprocessing": {
            "enabled": preprocess,
            "remove_telomeres": remove_telomeres if preprocess else None,
            "minimum_gap": minimum_gap if preprocess else None,
            "split_disjoint": split_disjoint if preprocess else None,
            "filter_populations": filter_populations if preprocess else None,
            "filter_individuals": filter_individuals if preprocess else None,
            "filter_sites": filter_sites if preprocess else None
        },
        "mutations": {
            "original": ts.num_mutations,
            "after_preprocessing": ts_copy.num_mutations if preprocess else None,
            "final": ts_with_times.num_mutations
        }
    }

    logger.info(f"Inferred times for {num_inferred} internal nodes.")
    return ts_with_times, inference_info
