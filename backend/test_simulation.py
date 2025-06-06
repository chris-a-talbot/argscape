#!/usr/bin/env python3
"""
Test script for tree sequence simulation with different parameters
"""

import msprime

def test_simulation_parameters():
    """Test different simulation parameters to verify recombination rate calculation"""
    
    test_cases = [
        {"num_local_trees": 10, "expected_trees": "10"},
        {"num_local_trees": 5, "expected_trees": "5"},
        {"num_local_trees": 1, "expected_trees": "1"},
        {"num_local_trees": 20, "expected_trees": "20"},
    ]
    
    for i, case in enumerate(test_cases):
        print(f"\n--- Test Case {i+1} ---")
        print(f"Target local trees: {case['num_local_trees']}")
        print(f"Expected trees: {case['expected_trees']}")
        
        # Calculate parameters using our new approach
        sequence_length = float(case['num_local_trees'])
        if case['num_local_trees'] > 1:
            recombination_rate = 100.0  # High rate to ensure breakpoints
        else:
            recombination_rate = 0.0
            
        print(f"Sequence length: {sequence_length}")
        print(f"Recombination rate: {recombination_rate}")
        
        # Simulate
        try:
            ts = msprime.sim_ancestry(
                samples=50,
                recombination_rate=recombination_rate,
                sequence_length=sequence_length,
                population_size=100,
                discrete_genome=True,  # Use discrete genome
                model="dtwf",
                random_seed=42,
                end_time=20
            )
            
            print(f"Actual trees generated: {ts.num_trees}")
            print(f"Success: {'✓' if ts.num_trees == case['num_local_trees'] else '✗'}")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_simulation_parameters() 