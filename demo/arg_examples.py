"""
arg_examples.py  – *low-Ne edition*

Generates compact ARG examples with only four sampled haploid genomes so the
whole graph is easy to visualise.  Scenarios 1 & 2 use a deliberately *low*
effective population size (Ne = 1000) to force rapid coalescence and keep
the graphs minimal.

Outputs six `.trees` files.

Dependencies
------------
msprime >= 1.3
tskit   >= 0.5
"""

import msprime
import tskit


###############################################################################
# Simulation helpers
###############################################################################

def simulate_panmixia(sample_size=4, Ne=1000, sequence_length=10_000,
                      recomb_rate=1e-8, seed=1):
    demography = msprime.Demography()
    demography.add_population(name="pop", initial_size=Ne)
    samples = [msprime.SampleSet(sample_size, ploidy=1, population="pop")]
    return msprime.sim_ancestry(
        samples=samples,
        recombination_rate=recomb_rate,
        sequence_length=sequence_length,
        demography=demography,
        random_seed=seed,
        record_migrations=True,
    )


def simulate_two_subclades(sample_size_per_pop=2, Ne=1000, sequence_length=10_000,
                           divergence_time=500, recomb_rate=1e-8, seed=2):
    demography = msprime.Demography()
    demography.add_population(name="pop1", initial_size=Ne)
    demography.add_population(name="pop2", initial_size=Ne)
    demography.add_population(name="ancestral", initial_size=Ne)
    demography.add_population_split(
        time=divergence_time,
        derived=["pop1", "pop2"],
        ancestral="ancestral",
    )
    demography.sort_events()
    samples = [
        msprime.SampleSet(sample_size_per_pop, ploidy=1, population="pop1"),
        msprime.SampleSet(sample_size_per_pop, ploidy=1, population="pop2"),
    ]
    return msprime.sim_ancestry(
        samples=samples,
        recombination_rate=recomb_rate,
        sequence_length=sequence_length,
        demography=demography,
        random_seed=seed,
        record_migrations=True,
    )


def simulate_admixture(sample_size_per_pop=2, Ne=1000, sequence_length=10_000,
                       divergence_time=1000, admixture_time=200,
                       admixture_prop=0.3, recomb_rate=1e-8, seed=3):
    demography = msprime.Demography()
    demography.add_population(name="pop1", initial_size=Ne)
    demography.add_population(name="pop2", initial_size=Ne)
    demography.add_population(name="ancestral", initial_size=Ne)
    demography.add_population_split(
        time=divergence_time,
        derived=["pop1", "pop2"],
        ancestral="ancestral",
    )
    demography.add_mass_migration(
        time=admixture_time,
        source="pop1",
        dest="pop2",
        proportion=admixture_prop,
    )
    demography.sort_events()
    samples = [
        msprime.SampleSet(sample_size_per_pop, ploidy=1, population="pop1"),
        msprime.SampleSet(sample_size_per_pop, ploidy=1, population="pop2"),
    ]
    return msprime.sim_ancestry(
        samples=samples,
        recombination_rate=recomb_rate,
        sequence_length=sequence_length,
        demography=demography,
        random_seed=seed,
        record_migrations=True,
    )


def simulate_high_Ne(sample_size=4, Ne=50_000, **kwargs):
    return simulate_panmixia(sample_size=sample_size, Ne=Ne, seed=4, **kwargs)


def simulate_low_Ne(sample_size=4, Ne=1000, **kwargs):
    return simulate_panmixia(sample_size=sample_size, Ne=Ne, seed=5, **kwargs)


###############################################################################
# Utility
###############################################################################

def save_pair(ts1, ts2, fn1, fn2, label):
    ts1.dump(fn1)
    ts2.dump(fn2)
    print(f"{label}:\n  - {fn1} ({ts1.num_nodes} nodes, {ts1.num_edges} edges)\n  - {fn2} ({ts2.num_nodes} nodes, {ts2.num_edges} edges)")


###############################################################################
# Main
###############################################################################

def main():
    # Scenario 1 – low Ne: panmixia vs. structure
    ts_pan_low = simulate_panmixia(seed=11)
    ts_struct_low = simulate_two_subclades(seed=12)
    save_pair(ts_pan_low, ts_struct_low,
              "scenario1_panmixia_lowNe.trees", "scenario1_structure_lowNe.trees",
              "Scenario 1 (low Ne)")

    # Scenario 2 – low Ne: structure w/ vs. w/out admixture
    ts_struct_no_adm = simulate_two_subclades(seed=21)
    ts_admix = simulate_admixture(seed=22)
    save_pair(ts_struct_no_adm, ts_admix,
              "scenario2_structure_no_admixture_lowNe.trees", "scenario2_with_admixture_lowNe.trees",
              "Scenario 2 (low Ne)")

    # Scenario 3 – high vs. low Ne
    ts_high = simulate_high_Ne()
    ts_low = simulate_low_Ne()
    save_pair(ts_high, ts_low,
              "scenario3_high_Ne.trees", "scenario3_low_Ne.trees",
              "Scenario 3 (contrast)")


if __name__ == "__main__":
    main()
