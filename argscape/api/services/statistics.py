"""
Population genetics statistics computation for tree sequences.
"""

import logging
import numpy as np
import tskit
from typing import Dict, Optional, Any, List, Tuple
from itertools import combinations

logger = logging.getLogger(__name__)

# Standard mutation rate (per base pair per generation)
STANDARD_MUTATION_RATE = 1e-8


def compute_population_genetics_statistics(
    ts: tskit.TreeSequence,
    mutation_rate: float = STANDARD_MUTATION_RATE
) -> Dict[str, Any]:
    """
    Compute population genetics statistics for a tree sequence.
    
    Args:
        ts: Tree sequence to analyze
        mutation_rate: Mutation rate per base pair per generation (default: 1e-8)
        
    Returns:
        Dictionary containing various population genetics statistics
    """
    stats = {}
    
    try:
        # Nucleotide diversity (π) - can be computed from branch lengths even without mutations
        # tskit.diversity() uses branch lengths by default (mode="branch")
        # We need to normalize by sequence length to get per-site values
        try:
            pi = ts.diversity(mode="branch")
            # Normalize by sequence length to get per-site diversity
            if ts.sequence_length > 0:
                pi = pi / ts.sequence_length
            stats['nucleotide_diversity'] = float(pi) if not np.isnan(pi) else None
        except Exception as e:
            logger.debug(f"Could not compute nucleotide diversity: {e}")
            stats['nucleotide_diversity'] = None
        
        # Statistics that require mutations/segregating sites
        if ts.num_mutations > 0:
            # Compute segregating sites
            # A site is segregating if it has mutations and shows variation in genotypes
            segregating_sites = 0
            try:
                # First try tskit's native method
                segregating_sites_result = ts.segregating_sites()
                # Handle both scalar and array returns
                if isinstance(segregating_sites_result, np.ndarray):
                    # If array, count sites where value > 0 (segregating sites)
                    segregating_sites = int(np.sum(segregating_sites_result > 0))
                else:
                    # Scalar return - this is the total number of segregating sites
                    segregating_sites = int(segregating_sites_result)
                
                # Validate: if tskit returns 0 but we have mutations, use fallback
                if segregating_sites == 0 and ts.num_mutations > 0:
                    logger.warning("tskit.segregating_sites() returned 0 despite mutations, using fallback")
                    raise ValueError("Segregating sites count is 0 but mutations exist")
                    
                stats['segregating_sites'] = segregating_sites if segregating_sites >= 0 else 0
            except Exception as e:
                logger.debug(f"Could not compute segregating sites using tskit method: {e}")
                # Fallback: use ts.num_sites as approximation
                # NOTE: ts.num_sites = number of sites with mutations (not necessarily segregating)
                # Segregating sites = sites with mutations that show variation in genotypes
                # In practice, most sites with mutations ARE segregating (fixed mutations are rare)
                # So ts.num_sites is usually a very close approximation to segregating sites
                try:
                    # Use num_sites as approximation (sites with mutations)
                    # This will slightly overestimate if there are fixed mutations, but is usually very close
                    segregating_sites = ts.num_sites if hasattr(ts, 'num_sites') and ts.num_sites > 0 else 0
                    if segregating_sites == 0:
                        # If num_sites not available, count sites with mutations
                        segregating_sites = sum(1 for _ in ts.sites())
                    logger.info(f"Using ts.num_sites ({segregating_sites}) as segregating sites approximation (fallback - may slightly overestimate if fixed mutations exist)")
                    stats['segregating_sites'] = int(segregating_sites) if segregating_sites > 0 else 0
                except Exception as e2:
                    logger.error(f"Fallback segregating sites computation failed: {e2}")
                    # Set to 0 but don't fail completely
                    stats['segregating_sites'] = 0
                    segregating_sites = 0
            
            # Watterson's theta (θ) - only compute if we have segregating sites
            if segregating_sites > 0:
                try:
                    n = ts.num_samples
                    # Watterson's theta per site = S / (L * sum(1/i for i in 1..n-1))
                    # where S is total number of segregating sites, L is sequence length
                    # This gives per-site theta, which is standard
                    harmonic_number = sum(1.0 / i for i in range(1, n))
                    if harmonic_number > 0 and ts.sequence_length > 0:
                        # Per-site Watterson's theta
                        theta_w = segregating_sites / (ts.sequence_length * harmonic_number)
                        stats['wattersons_theta'] = float(theta_w) if not np.isnan(theta_w) else None
                    else:
                        stats['wattersons_theta'] = None
                except Exception as e:
                    logger.debug(f"Could not compute Watterson's theta: {e}")
                    stats['wattersons_theta'] = None
            else:
                stats['wattersons_theta'] = None
            
            # Tajima's D (requires segregating sites)
            # Tajima's D compares π (nucleotide diversity) to S/a₁ (Watterson's theta)
            # Formula: D = (π - S/a₁) / sqrt(Var(π - S/a₁))
            # where S = segregating sites, a₁ = harmonic number = sum(1/i for i=1..n-1)
            # Negative D indicates excess of low-frequency variants (population expansion)
            # Positive D indicates excess of intermediate-frequency variants (balancing selection)
            # Typical range: -2 to +2, with values near 0 indicating neutrality
            if segregating_sites > 0:
                try:
                    # Use tskit's native Tajimas_D method
                    # This computes D = (π - θ_W) / sqrt(Var(π - θ_W))
                    # where θ_W = S/a₁ (Watterson's theta)
                    # tskit computes this efficiently using the tree sequence structure
                    if hasattr(ts, 'Tajimas_D'):
                        tajima_d = ts.Tajimas_D()
                    elif hasattr(ts, 'Tajima_D'):
                        tajima_d = ts.Tajima_D()
                    else:
                        raise AttributeError("TreeSequence has no Tajima's D method")
                    
                    # Handle both scalar and array returns
                    if isinstance(tajima_d, np.ndarray):
                        # If array, take the mean (or first value if single element)
                        if len(tajima_d) > 0:
                            tajima_d = float(np.mean(tajima_d))
                        else:
                            tajima_d = None
                    else:
                        tajima_d = float(tajima_d) if not np.isnan(tajima_d) else None
                    
                    # Validate the result is in reasonable range
                    # Tajima's D typically ranges from ~-2 to ~+2
                    # Values outside this range might indicate calculation issues
                    if tajima_d is not None:
                        if abs(tajima_d) > 3:
                            logger.warning(f"Tajima's D value ({tajima_d}) is outside typical range (-2 to +2), "
                                         f"may indicate calculation issue or extreme population history")
                        logger.info(f"Tajima's D computed: {tajima_d} "
                                  f"(π={stats.get('nucleotide_diversity', 'N/A')}, "
                                  f"S={segregating_sites}, n={ts.num_samples})")
                    
                    stats['tajimas_d'] = tajima_d
                except Exception as e:
                    logger.warning(f"Could not compute Tajima's D: {e}")
                    # Tajima's D can fail for very large datasets or edge cases
                    # Set to None rather than failing completely
                    stats['tajimas_d'] = None
            else:
                stats['tajimas_d'] = None
        else:
            # No mutations - cannot compute mutation-based statistics
            stats['segregating_sites'] = 0
            stats['wattersons_theta'] = None
            stats['tajimas_d'] = None
        
        # Tree topology statistics
        tree_heights = []
        tree_lengths = []
        tmrca_values = []
        
        for tree in ts.trees():
            # Tree height (TMRCA for this tree)
            if tree.num_roots == 1:
                # Single root - TMRCA is the root time
                root_time = tree.time(tree.root)
                tmrca_values.append(root_time)
                tree_heights.append(root_time)
            else:
                # Multiple roots - find the maximum root time
                root_times = [tree.time(root) for root in tree.roots]
                max_root_time = max(root_times)
                tmrca_values.append(max_root_time)
                tree_heights.append(max_root_time)
            
            # Tree length (total branch length)
            tree_length = tree.total_branch_length
            tree_lengths.append(tree_length)
        
        if tree_heights:
            stats['mean_tree_height'] = float(np.mean(tree_heights))
            stats['median_tree_height'] = float(np.median(tree_heights))
            stats['min_tree_height'] = float(np.min(tree_heights))
            stats['max_tree_height'] = float(np.max(tree_heights))
        else:
            stats['mean_tree_height'] = None
            stats['median_tree_height'] = None
            stats['min_tree_height'] = None
            stats['max_tree_height'] = None
        
        if tree_lengths:
            stats['mean_tree_length'] = float(np.mean(tree_lengths))
            stats['median_tree_length'] = float(np.median(tree_lengths))
            stats['min_tree_length'] = float(np.min(tree_lengths))
            stats['max_tree_length'] = float(np.max(tree_lengths))
        else:
            stats['mean_tree_length'] = None
            stats['median_tree_length'] = None
            stats['min_tree_length'] = None
            stats['max_tree_length'] = None
        
        # TMRCA (Time to Most Recent Common Ancestor)
        # Overall TMRCA is the maximum TMRCA across all trees
        if tmrca_values:
            stats['tmrca'] = float(np.max(tmrca_values))
            stats['mean_tmrca'] = float(np.mean(tmrca_values))
            stats['median_tmrca'] = float(np.median(tmrca_values))
        else:
            stats['tmrca'] = None
            stats['mean_tmrca'] = None
            stats['median_tmrca'] = None
        
        # Effective population size (Ne) estimation
        # Using Watterson's estimator: Ne = θ / (4 * μ)
        # where θ is Watterson's theta (per-site), μ is mutation rate per site per generation
        # Note: θ is already per-site, so we don't divide by sequence length
        # NOTE: Watterson's theta is more sensitive to low-frequency variants than π,
        # so during population expansion (negative Tajima's D), Ne(Watterson) > Ne(π)
        # This discrepancy is expected and indicates population growth/expansion
        if stats.get('wattersons_theta') is not None and mutation_rate > 0:
            theta = stats['wattersons_theta']
            ne_watterson = theta / (4 * mutation_rate)
            stats['ne_watterson'] = float(ne_watterson) if not np.isnan(ne_watterson) and ne_watterson > 0 else None
        else:
            stats['ne_watterson'] = None
        
        # Alternative Ne estimation using nucleotide diversity
        # Ne = π / (4 * μ)
        # where π is nucleotide diversity (per-site), μ is mutation rate per site per generation
        # Note: π is already per-site, so we don't divide by sequence length
        # NOTE: π-based Ne is less affected by recent population expansion than Watterson's estimator
        if stats.get('nucleotide_diversity') is not None and mutation_rate > 0:
            pi = stats['nucleotide_diversity']
            ne_pi = pi / (4 * mutation_rate)
            stats['ne_pi'] = float(ne_pi) if not np.isnan(ne_pi) and ne_pi > 0 else None
        else:
            stats['ne_pi'] = None
        
        # Recombination breakpoint density estimation
        # NOTE: This is NOT the recombination rate (r), but rather the density of 
        # recombination breakpoints in the tree sequence (number of tree boundaries per bp)
        # The actual recombination rate would require knowledge of the population history
        # Formula: breakpoint_density ≈ (num_trees - 1) / sequence_length
        # This gives breakpoints per bp, which is related to but not equal to r
        # For comparison: typical human recombination rate is ~1-2 × 10^-8 per bp per generation
        # This value will typically be much higher (often 10^-3 to 10^-5) because it represents
        # the cumulative effect of recombination over the entire genealogy
        if ts.num_trees > 1 and ts.sequence_length > 0:
            breakpoint_density = (ts.num_trees - 1) / ts.sequence_length
            stats['estimated_recombination_rate'] = float(breakpoint_density)
            logger.debug(f"Recombination breakpoint density: {breakpoint_density:.6e} breakpoints/bp "
                        f"(num_trees={ts.num_trees}, sequence_length={ts.sequence_length})")
        else:
            stats['estimated_recombination_rate'] = None
        
        # Linkage Disequilibrium (LD)
        # Compute pairwise LD if we have mutations using proper population genetics formula
        if ts.num_mutations > 1:
            try:
                # Get all sites with mutations
                sites_with_mutations = [site.id for site in ts.sites() if site.num_mutations > 0]
                
                if len(sites_with_mutations) >= 2:
                    # Sample a subset of pairs to avoid computational explosion
                    max_pairs = 1000  # Limit to 1000 pairs for performance
                    num_sites = len(sites_with_mutations)
                    
                    # Generate pairs
                    if num_sites * (num_sites - 1) / 2 <= max_pairs:
                        # Compute all pairs
                        pairs = [(sites_with_mutations[i], sites_with_mutations[j]) 
                                for i in range(len(sites_with_mutations)) 
                                for j in range(i+1, len(sites_with_mutations))]
                    else:
                        # Sample pairs
                        np.random.seed(42)  # For reproducibility
                        pairs = []
                        attempts = 0
                        while len(pairs) < max_pairs and attempts < max_pairs * 10:
                            i, j = np.random.choice(num_sites, size=2, replace=False)
                            if i < j:
                                pairs.append((sites_with_mutations[i], sites_with_mutations[j]))
                            attempts += 1
                    
                    # Compute LD using proper population genetics formula (r^2)
                    # tskit doesn't have a direct pairwise LD method, so we compute it correctly
                    ld_values = []
                    for site1_id, site2_id in pairs[:max_pairs]:
                        try:
                            # Get genotypes using tskit's variant API
                            variant1 = ts.variant(site1_id)
                            variant2 = ts.variant(site2_id)
                            
                            genotypes1 = np.array(variant1.genotypes)
                            genotypes2 = np.array(variant2.genotypes)
                            
                            if len(genotypes1) == len(genotypes2) and len(genotypes1) > 0:
                                # Compute r^2 for LD using proper population genetics formula
                                # Get allele frequencies (assuming diploid)
                                p1 = np.mean(genotypes1) / 2.0
                                p2 = np.mean(genotypes2) / 2.0
                                
                                if 0 < p1 < 1 and 0 < p2 < 1:
                                    # Compute D (linkage disequilibrium coefficient)
                                    # D = P(AB) - P(A)P(B)
                                    # where P(AB) is frequency of both derived alleles together
                                    ab_freq = np.mean((genotypes1 > 0) & (genotypes2 > 0))
                                    d = ab_freq - p1 * p2
                                    
                                    # r^2 = D^2 / (p1(1-p1) * p2(1-p2))
                                    denominator = p1 * (1 - p1) * p2 * (1 - p2)
                                    if denominator > 0:
                                        r2 = (d * d) / denominator
                                        if not np.isnan(r2) and r2 >= 0:
                                            ld_values.append(float(r2))
                        except Exception as e:
                            logger.debug(f"Could not compute LD for pair ({site1_id}, {site2_id}): {e}")
                            continue
                    
                    if ld_values:
                        stats['mean_ld_r2'] = float(np.mean(ld_values))
                        stats['median_ld_r2'] = float(np.median(ld_values))
                        stats['min_ld_r2'] = float(np.min(ld_values))
                        stats['max_ld_r2'] = float(np.max(ld_values))
                    else:
                        stats['mean_ld_r2'] = None
                        stats['median_ld_r2'] = None
                        stats['min_ld_r2'] = None
                        stats['max_ld_r2'] = None
                else:
                    stats['mean_ld_r2'] = None
                    stats['median_ld_r2'] = None
                    stats['min_ld_r2'] = None
                    stats['max_ld_r2'] = None
            except Exception as e:
                logger.debug(f"Could not compute LD: {e}")
                stats['mean_ld_r2'] = None
                stats['median_ld_r2'] = None
                stats['min_ld_r2'] = None
                stats['max_ld_r2'] = None
        else:
            stats['mean_ld_r2'] = None
            stats['median_ld_r2'] = None
            stats['min_ld_r2'] = None
            stats['max_ld_r2'] = None
        
        # Population structure statistics (Fst and divergence)
        # These require population information or sample sets
        # Skip for very large datasets to avoid freezing (can be slow)
        try:
            # Skip population structure stats for very large datasets (>100k nodes)
            # These computations can be very slow and may not be necessary for all use cases
            if ts.num_nodes > 100000:
                logger.debug(f"Skipping population structure statistics for large dataset ({ts.num_nodes} nodes)")
                stats['fst'] = None
                stats['num_populations'] = 0
                stats['mean_divergence'] = None
                stats['median_divergence'] = None
                stats['min_divergence'] = None
                stats['max_divergence'] = None
            else:
                # Check if we have population information
                # Optimize: only iterate through sample nodes for population assignment
                populations = {}
                logger.debug(f"Computing population structure statistics for {ts.num_samples} samples")
                
                # Use more efficient approach: iterate only through samples
                for node_id in ts.samples():
                    node = ts.node(node_id)
                    if node.population != tskit.NULL:
                        if node.population not in populations:
                            populations[node.population] = []
                        populations[node.population].append(node_id)
            
                # Compute Fst and divergence if we have multiple populations with samples
                if len(populations) >= 2:
                    # Filter to populations with at least 2 samples
                    valid_populations = {pop: samples for pop, samples in populations.items() 
                                       if len(samples) >= 2}
                    
                    if len(valid_populations) >= 2:
                        # Create sample sets for each population
                        sample_sets = [samples for samples in valid_populations.values()]
                        logger.debug(f"Computing Fst for {len(valid_populations)} populations")
                        
                        # Compute Fst (F-statistics) - measures population differentiation
                        # Fst ranges from 0 (no differentiation) to 1 (complete differentiation)
                        # 
                        # For multiple populations (e.g., 6 populations):
                        # - We compute a GLOBAL Fst across all populations (single value)
                        # - This represents overall differentiation: Fst = (D_bt - D_wt) / D_bt
                        #   where D_bt = average between-population divergence (across all pairs)
                        #   and D_wt = average within-population diversity
                        # - For 6 populations, this averages across all 15 pairwise comparisons
                        #
                        # Note: tskit's native Fst method may not be available in all versions
                        # or may fail for certain data conditions (e.g., insufficient samples, edge cases)
                        try:
                            if hasattr(ts, 'Fst'):
                                logger.debug(f"Using tskit.Fst() method for {len(sample_sets)} populations "
                                           f"(computing global Fst across all {len(sample_sets)} populations)")
                                fst_result = ts.Fst(sample_sets)
                            elif hasattr(ts, 'fst'):
                                logger.debug(f"Using tskit.fst() method for {len(sample_sets)} populations "
                                           f"(computing global Fst across all {len(sample_sets)} populations)")
                                fst_result = ts.fst(sample_sets)
                            else:
                                logger.debug(f"tskit native Fst method not available, computing manually")
                                # Manual Fst computation using diversity and divergence
                                # Fst = (D_bt - D_wt) / D_bt
                                # where D_bt = between-population divergence, D_wt = within-population diversity
                                logger.debug("Computing Fst manually using diversity and divergence")
                                pi_within = []
                                for idx, samples in enumerate(sample_sets):
                                    if len(samples) >= 2:
                                        logger.debug(f"Computing diversity for population {idx+1}/{len(sample_sets)} ({len(samples)} samples)")
                                        # Normalize by sequence length to get per-site diversity
                                        pi_pop = ts.diversity(samples, mode="branch")
                                        if ts.sequence_length > 0:
                                            pi_pop = pi_pop / ts.sequence_length
                                        pi_within.append(float(pi_pop) if not np.isnan(pi_pop) else 0.0)
                                
                                # Between-population divergence (average pairwise divergence)
                                # For 6 populations, this computes all 15 pairwise divergences (6 choose 2)
                                # and then averages them to get D_bt (between-population divergence)
                                # Use tskit's batch divergence method for efficiency
                                num_pairs = len(sample_sets) * (len(sample_sets) - 1) // 2
                                logger.debug(f"Computing pairwise divergence for {len(sample_sets)} populations "
                                           f"({num_pairs} pairs) using batch method")
                                index_pairs = np.array(list(combinations(range(len(sample_sets)), 2)), dtype=np.int32)
                                try:
                                    divergences = ts.divergence(sample_sets, indexes=index_pairs, mode="branch", span_normalise=True)
                                    if isinstance(divergences, np.ndarray):
                                        pi_between = [float(d) if not np.isnan(d) else 0.0 for d in divergences]
                                    else:
                                        pi_between = [float(divergences)] if not np.isnan(divergences) else []
                                except Exception as e:
                                    logger.debug(f"Batch divergence failed in Fst computation, falling back to loop: {e}")
                                    # Fallback to loop-based computation
                                    pi_between = []
                                    for i, j in index_pairs:
                                        try:
                                            div = ts.divergence([sample_sets[i], sample_sets[j]], mode="branch", span_normalise=True)
                                            pi_between.append(float(div) if not np.isnan(div) else 0.0)
                                        except Exception:
                                            pi_between.append(0.0)
                                
                                if pi_within and pi_between:
                                    # Check if divergence values need normalization
                                    # If span_normalise=True didn't work, values will be > 1.0
                                    if ts.sequence_length > 0 and len(pi_between) > 0:
                                        mean_pi_between = np.mean(pi_between)
                                        if mean_pi_between > 1.0:
                                            logger.warning(f"Divergence values seem unusually high (mean={mean_pi_between:.6e}). "
                                                         f"Expected per-site values around 1e-5. "
                                                         f"Normalizing by sequence length ({ts.sequence_length:.0f} bp)...")
                                            # Normalize by sequence length
                                            pi_between = [d / ts.sequence_length for d in pi_between]
                                    
                                    d_wt = np.mean(pi_within)  # Average within-population diversity
                                    d_bt = np.mean(pi_between)  # Average between-population divergence
                                    
                                    # Diagnostic logging
                                    logger.info(f"Fst computation: D_wt (within)={d_wt:.6e}, D_bt (between)={d_bt:.6e}, "
                                               f"sequence_length={ts.sequence_length:.0f}, "
                                               f"num_pi_within={len(pi_within)}, num_pi_between={len(pi_between)}")
                                    
                                    if d_bt > 0:
                                        fst_result = (d_bt - d_wt) / d_bt
                                        logger.info(f"Fst calculation: ({d_bt:.6e} - {d_wt:.6e}) / {d_bt:.6e} = {fst_result:.6f}")
                                        # Additional validation: Fst should be reasonable
                                        if fst_result > 0.5:
                                            logger.warning(f"Fst value ({fst_result:.4f}) is very high. "
                                                         f"This may indicate calculation issues or extreme population structure.")
                                        elif abs(fst_result) < 1e-6:
                                            logger.warning(f"Fst value ({fst_result:.6f}) is very close to zero. "
                                                         f"This may indicate calculation issues or populations are nearly identical.")
                                    else:
                                        logger.warning(f"d_bt is zero or negative ({d_bt:.6e}), cannot compute Fst")
                                        fst_result = 0.0
                                else:
                                    fst_result = None
                            
                            # Handle array/scalar returns
                            if isinstance(fst_result, np.ndarray):
                                if len(fst_result) > 0:
                                    fst_result = float(np.mean(fst_result))
                                else:
                                    fst_result = None
                            else:
                                fst_result = float(fst_result) if fst_result is not None and not np.isnan(fst_result) else None
                            
                            if fst_result is not None:
                                # Fst should be between 0 and 1
                                if fst_result < 0:
                                    logger.warning(f"Fst value ({fst_result}) is negative, clamping to 0")
                                    fst_result = 0.0
                                elif fst_result > 1:
                                    logger.warning(f"Fst value ({fst_result}) is greater than 1, clamping to 1")
                                    fst_result = 1.0
                            
                            stats['fst'] = fst_result
                            stats['num_populations'] = len(valid_populations)
                        except Exception as e:
                            # Fst computation can fail for various reasons:
                            # 1. Method doesn't exist in this tskit version
                            # 2. Insufficient samples per population
                            # 3. Edge cases (e.g., all populations identical, numerical issues)
                            # 4. Data structure issues (e.g., no mutations, invalid tree structure)
                            logger.debug(f"Could not compute Fst using native method: {e}")
                            logger.debug(f"Will attempt to compute Fst from divergence values if available")
                            stats['fst'] = None
                            stats['num_populations'] = len(valid_populations)
                            # Set pi_between to None so divergence computation doesn't try to reuse it
                            pi_between = None
                    
                    # Compute pairwise divergence between populations
                    # For 6 populations, this computes all 15 pairwise divergences (6 choose 2 = 15)
                    # The statistics (mean, median, min, max) are computed across these 15 values
                    # Reuse divergence values from Fst computation if available
                    try:
                        # If we computed pi_between for Fst, reuse it
                        if 'pi_between' in locals() and pi_between is not None and len(pi_between) > 0:
                            divergence_values = pi_between
                            num_pairs = len(divergence_values)
                            logger.debug(f"Reusing divergence values from Fst computation: {num_pairs} pairs")
                        else:
                            # Otherwise compute divergence separately using tskit's batch method
                            # This is more efficient than calling divergence() in a loop
                            num_pairs = len(sample_sets) * (len(sample_sets) - 1) // 2
                            logger.debug(f"Computing pairwise divergence for {len(sample_sets)} populations "
                                       f"({num_pairs} pairs) using batch method")
                            
                            # Generate index pairs for all population pairs
                            index_pairs = np.array(list(combinations(range(len(sample_sets)), 2)), dtype=np.int32)
                            
                            # Use tskit's native batch divergence method (more efficient)
                            # span_normalise=True should give per-site values (normalized by sequence length)
                            try:
                                divergences = ts.divergence(sample_sets, indexes=index_pairs, mode="branch", span_normalise=True)
                                # Handle both scalar and array returns
                                if isinstance(divergences, np.ndarray):
                                    divergence_values = [float(d) for d in divergences if not np.isnan(d)]
                                else:
                                    divergence_values = [float(divergences)] if not np.isnan(divergences) else []
                                
                                # Diagnostic: check if values seem reasonable
                                # If span_normalise=True is working, values should be per-site (around 1e-5 for humans)
                                # If values are > 1.0, they might be in absolute branch length units instead
                                if divergence_values and ts.sequence_length > 0:
                                    mean_div = np.mean(divergence_values)
                                    if mean_div > 1.0:
                                        logger.warning(f"Divergence values seem unusually high (mean={mean_div:.6e}). "
                                                     f"Expected per-site values around 1e-5 for humans. "
                                                     f"Sequence length: {ts.sequence_length:.0f} bp. "
                                                     f"Attempting to normalize by sequence length...")
                                        # Try manual normalization: divide by sequence length
                                        # This assumes values are in absolute branch length units
                                        divergence_values = [d / ts.sequence_length for d in divergence_values]
                                        mean_div_normalized = np.mean(divergence_values)
                                        logger.info(f"After manual normalization: mean divergence = {mean_div_normalized:.6e}")
                                        if mean_div_normalized > 1e-3:
                                            logger.warning(f"Normalized divergence still seems high. "
                                                         f"Original values may be in unexpected units.")
                            except Exception as e:
                                logger.debug(f"Batch divergence computation failed, falling back to loop: {e}")
                                # Fallback to loop-based computation if batch method fails
                                divergence_values = []
                                for i, j in index_pairs:
                                    try:
                                        div = ts.divergence([sample_sets[i], sample_sets[j]], mode="branch", span_normalise=True)
                                        if not np.isnan(div):
                                            divergence_values.append(float(div))
                                    except Exception as e2:
                                        logger.debug(f"Could not compute divergence for pair ({i}, {j}): {e2}")
                                        continue
                        
                        if divergence_values:
                            stats['mean_divergence'] = float(np.mean(divergence_values))
                            stats['median_divergence'] = float(np.median(divergence_values))
                            stats['min_divergence'] = float(np.min(divergence_values))
                            stats['max_divergence'] = float(np.max(divergence_values))
                            
                            # If Fst wasn't computed successfully but we have divergence values,
                            # try to compute Fst using the divergence values we just computed
                            if stats.get('fst') is None:
                                try:
                                    logger.debug("Fst was not computed, attempting to compute from divergence values")
                                    # Compute within-population diversity
                                    # Normalize by sequence length to get per-site diversity
                                    pi_within = []
                                    for samples in sample_sets:
                                        if len(samples) >= 2:
                                            pi_pop = ts.diversity(samples, mode="branch")
                                            if ts.sequence_length > 0:
                                                pi_pop = pi_pop / ts.sequence_length
                                            if not np.isnan(pi_pop):
                                                pi_within.append(float(pi_pop))
                                    
                                    if pi_within and divergence_values:
                                        # Check if divergence values need normalization
                                        if ts.sequence_length > 0 and len(divergence_values) > 0:
                                            mean_div = np.mean(divergence_values)
                                            if mean_div > 1.0:
                                                logger.warning(f"Divergence values seem unusually high (mean={mean_div:.6e}). "
                                                             f"Expected per-site values around 1e-5. "
                                                             f"Normalizing by sequence length ({ts.sequence_length:.0f} bp)...")
                                                # Normalize by sequence length
                                                divergence_values = [d / ts.sequence_length for d in divergence_values]
                                        
                                        d_wt = np.mean(pi_within)  # Average within-population diversity
                                        d_bt = np.mean(divergence_values)  # Average between-population divergence
                                        
                                        # Diagnostic logging
                                        logger.debug(f"Fst computation (fallback): D_wt (within)={d_wt:.6e}, "
                                                   f"D_bt (between)={d_bt:.6e}, sequence_length={ts.sequence_length:.0f}")
                                        
                                        if d_bt > 0:
                                            fst_result = (d_bt - d_wt) / d_bt
                                            # Additional validation
                                            if fst_result > 0.5:
                                                logger.warning(f"Fst value ({fst_result:.4f}) is very high. "
                                                             f"This may indicate calculation issues or extreme population structure.")
                                            # Clamp to [0, 1] range
                                            if fst_result < 0:
                                                logger.debug(f"Fst value ({fst_result}) is negative, clamping to 0")
                                                fst_result = 0.0
                                            elif fst_result > 1:
                                                logger.debug(f"Fst value ({fst_result}) is greater than 1, clamping to 1")
                                                fst_result = 1.0
                                            stats['fst'] = float(fst_result)
                                            logger.info(f"Computed Fst from divergence values: {fst_result} "
                                                      f"(D_bt={d_bt:.6e}, D_wt={d_wt:.6e})")
                                except Exception as e:
                                    logger.debug(f"Could not compute Fst from divergence values: {e}")
                        else:
                            stats['mean_divergence'] = None
                            stats['median_divergence'] = None
                            stats['min_divergence'] = None
                            stats['max_divergence'] = None
                    except Exception as e:
                        logger.debug(f"Could not compute divergence: {e}")
                        stats['mean_divergence'] = None
                        stats['median_divergence'] = None
                        stats['min_divergence'] = None
                        stats['max_divergence'] = None
                else:
                    # Not enough populations with sufficient samples
                    stats['fst'] = None
                    stats['num_populations'] = len(populations) if populations else 0
                    stats['mean_divergence'] = None
                    stats['median_divergence'] = None
                    stats['min_divergence'] = None
                    stats['max_divergence'] = None
        except Exception as e:
            logger.debug(f"Could not compute population structure statistics: {e}")
            stats['fst'] = None
            stats['num_populations'] = 0
            stats['mean_divergence'] = None
            stats['median_divergence'] = None
            stats['min_divergence'] = None
            stats['max_divergence'] = None
        
    except Exception as e:
        logger.error(f"Error computing population genetics statistics: {e}")
        # Return empty stats on error
        return {}
    
    return stats


def compute_windowed_statistics(
    ts: tskit.TreeSequence,
    window_size: float,
    window_step: Optional[float] = None,
    mutation_rate: float = STANDARD_MUTATION_RATE
) -> List[Dict[str, Any]]:
    """
    Compute population genetics statistics in sliding windows across the sequence.
    
    This is useful for visualizing how statistics vary along the genome, which can reveal
    regions under selection, recombination hotspots, or demographic events.
    
    Args:
        ts: Tree sequence to analyze
        window_size: Size of each window in base pairs
        window_step: Step size between windows (default: window_size for non-overlapping)
        mutation_rate: Mutation rate per base pair per generation (default: 1e-8)
        
    Returns:
        List of dictionaries, each containing statistics for one window.
        Each dictionary includes 'start', 'end', 'midpoint', and all statistics from
        compute_population_genetics_statistics().
    """
    if window_step is None:
        window_step = window_size
    
    if window_size <= 0 or window_step <= 0:
        raise ValueError("window_size and window_step must be positive")
    
    if window_size > ts.sequence_length:
        # Single window covering entire sequence
        windowed_stats = compute_population_genetics_statistics(ts, mutation_rate)
        windowed_stats['start'] = 0.0
        windowed_stats['end'] = ts.sequence_length
        windowed_stats['midpoint'] = ts.sequence_length / 2.0
        return [windowed_stats]
    
    windows = []
    start = 0.0
    
    while start < ts.sequence_length:
        end = min(start + window_size, ts.sequence_length)
        
        # Extract window using delete_intervals
        intervals_to_delete = []
        if start > 0:
            intervals_to_delete.append([0, start])
        if end < ts.sequence_length:
            intervals_to_delete.append([end, ts.sequence_length])
        
        try:
            if intervals_to_delete:
                ts_window = ts.delete_intervals(intervals_to_delete, simplify=True)
            else:
                ts_window = ts
            
            # Compute statistics for this window
            window_stats = compute_population_genetics_statistics(ts_window, mutation_rate)
            window_stats['start'] = float(start)
            window_stats['end'] = float(end)
            window_stats['midpoint'] = float((start + end) / 2.0)
            windows.append(window_stats)
        except Exception as e:
            logger.warning(f"Could not compute statistics for window [{start}, {end}]: {e}")
            # Add empty window entry
            windows.append({
                'start': float(start),
                'end': float(end),
                'midpoint': float((start + end) / 2.0),
                'error': str(e)
            })
        
        start += window_step
        
        # Avoid infinite loop
        if start >= ts.sequence_length:
            break
    
    return windows


def compute_statistics_for_range(
    ts: tskit.TreeSequence,
    genomic_start: Optional[float] = None,
    genomic_end: Optional[float] = None,
    temporal_start: Optional[float] = None,
    temporal_end: Optional[float] = None,
    tree_start_idx: Optional[int] = None,
    tree_end_idx: Optional[int] = None,
    mutation_rate: float = STANDARD_MUTATION_RATE
) -> Dict[str, Any]:
    """
    Compute statistics for a filtered genomic and/or temporal range.
    
    This is useful for visualizers where users filter to specific regions,
    allowing them to see how statistics differ in different parts of the genome
    or at different time periods.
    
    Args:
        ts: Tree sequence to analyze
        genomic_start: Start position for genomic filtering (default: 0)
        genomic_end: End position for genomic filtering (default: sequence_length)
        temporal_start: Start time for temporal filtering (default: min time)
        temporal_end: End time for temporal filtering (default: max time)
        mutation_rate: Mutation rate per base pair per generation (default: 1e-8)
        
    Returns:
        Dictionary containing statistics for the filtered range, plus metadata
        about the filtering applied.
    """
    ts_filtered = ts
    
    # Apply genomic filtering
    if genomic_start is not None or genomic_end is not None:
        start = genomic_start if genomic_start is not None else 0.0
        end = genomic_end if genomic_end is not None else ts.sequence_length
        
        if start >= end:
            raise ValueError("genomic_start must be less than genomic_end")
        if start < 0 or end > ts.sequence_length:
            raise ValueError("Genomic range must be within sequence bounds")
        
        intervals_to_delete = []
        if start > 0:
            intervals_to_delete.append([0, start])
        if end < ts.sequence_length:
            intervals_to_delete.append([end, ts.sequence_length])
        
        if intervals_to_delete:
            ts_filtered = ts_filtered.delete_intervals(intervals_to_delete, simplify=True)
    
    # Apply temporal filtering (simplified - removes nodes outside range)
    # Note: This is a simplified approach; full temporal filtering requires more complex logic
    if temporal_start is not None or temporal_end is not None:
        # Get time range from tree sequence
        node_times = np.array([node.time for node in ts_filtered.nodes()])
        min_time = float(np.min(node_times))
        max_time = float(np.max(node_times))
        
        start_time = temporal_start if temporal_start is not None else min_time
        end_time = temporal_end if temporal_end is not None else max_time
        
        if start_time >= end_time:
            raise ValueError("temporal_start must be less than temporal_end")
        
        # For now, we'll compute statistics on the filtered tree sequence
        # Full temporal filtering would require reconstructing the tree structure
        # which is complex. The genomic filtering is more straightforward.
        logger.debug(f"Temporal filtering requested [{start_time}, {end_time}], "
                    f"but full temporal filtering not yet implemented - using genomic filter only")
    
    # Apply tree index filtering by converting to genomic range
    if tree_start_idx is not None and tree_end_idx is not None:
        # Get the genomic intervals for the specified tree range
        trees = list(ts_filtered.trees())
        if tree_start_idx < len(trees) and tree_end_idx < len(trees):
            # Get the genomic span of the trees
            tree_start = trees[tree_start_idx]
            tree_end = trees[tree_end_idx]
            
            # Get the leftmost position of the first tree and rightmost position of the last tree
            genomic_start_from_trees = tree_start.interval.left
            genomic_end_from_trees = tree_end.interval.right
            
            # Apply genomic filtering to this range
            intervals_to_delete = []
            if genomic_start_from_trees > 0:
                intervals_to_delete.append([0, genomic_start_from_trees])
            if genomic_end_from_trees < ts_filtered.sequence_length:
                intervals_to_delete.append([genomic_end_from_trees, ts_filtered.sequence_length])
            
            if intervals_to_delete:
                ts_filtered = ts_filtered.delete_intervals(intervals_to_delete, simplify=True)
        else:
            raise ValueError(f"Tree indices out of range: {tree_start_idx}-{tree_end_idx} (num_trees={len(trees)})")
    
    # Compute statistics on filtered tree sequence
    stats = compute_population_genetics_statistics(ts_filtered, mutation_rate)
    
    # Add metadata about filtering
    stats['filter_metadata'] = {
        'genomic_start': genomic_start,
        'genomic_end': genomic_end,
        'temporal_start': temporal_start,
        'temporal_end': temporal_end,
        'tree_start_idx': tree_start_idx,
        'tree_end_idx': tree_end_idx,
        'filtered_sequence_length': ts_filtered.sequence_length,
        'filtered_num_nodes': ts_filtered.num_nodes,
        'filtered_num_trees': ts_filtered.num_trees
    }
    
    return stats

