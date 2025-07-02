#!/usr/bin/env python3
"""
Script to add spatial locations to bottleneck_diploid_balanced.trees using WGS84 coordinates.
Uses the same spatial generation method as the backend.
"""

import sys
import os
from pathlib import Path
import tskit
import numpy as np

# Add the argscape package to the path so we can import from backend
# Since we're in demo/, we need to go up one level to find argscape/
sys.path.insert(0, str(Path(__file__).parent.parent))

from argscape.backend.spatial_generation import generate_spatial_locations_for_samples

def main():
    """Generate spatial locations for the demo tree sequence."""
    
    # Determine the correct paths based on where the script is run from
    script_dir = Path(__file__).parent  # This is the demo directory
    
    # Input and output file paths (always relative to the demo directory)
    input_file = script_dir / "trees" / "exaggerated_split_bottleneck.trees"
    output_file = script_dir / "trees" / "exaggerated_split_bottleneck_spatial.trees"
    
    # Check if input file exists
    if not input_file.exists():
        print(f"Error: Input file {input_file} does not exist.")
        return 1
    
    print(f"Loading tree sequence from {input_file}")
    
    try:
        # Load the original tree sequence
        ts = tskit.load(input_file)
        
        print(f"Loaded tree sequence with:")
        print(f"  - {ts.num_samples} samples")
        print(f"  - {ts.num_nodes} nodes")
        print(f"  - {ts.num_edges} edges")
        print(f"  - {ts.num_trees} trees")
        print(f"  - {ts.num_individuals} individuals")
        print(f"  - {ts.num_populations} populations")
        print(f"  - sequence length: {ts.sequence_length}")
        
        # Check individual assignments
        sample_nodes = ts.samples()
        nodes_with_individuals = sum(1 for node_id in sample_nodes if ts.node(node_id).individual != -1)
        print(f"  - {nodes_with_individuals}/{ts.num_samples} sample nodes have individual assignments")
        
        # Check if it already has spatial data
        has_spatial = any(
            node.individual != -1 and 
            ts.individual(node.individual).location is not None and 
            len(ts.individual(node.individual).location) >= 2
            for node in ts.nodes() if node.is_sample()
        )
        
        if has_spatial:
            print("Warning: Tree sequence already has spatial data - will be replaced")
        else:
            print("No existing spatial data found")
        
        # Generate spatial locations using WGS84 coordinates (EPSG:4326)
        print("\nGenerating spatial locations using WGS84 coordinates...")
        print("This uses genealogical distances and multidimensional scaling")
        print("Points will be placed on actual land masses using the Eastern Hemisphere land mask")
        
        # Set a random seed for reproducible results
        random_seed = 42
        
        ts_with_spatial = generate_spatial_locations_for_samples(
            ts, 
            random_seed=random_seed, 
            crs="EPSG:4326"  # WGS84 coordinates
        )
        
        print(f"Successfully generated spatial locations for {ts_with_spatial.num_samples} samples")
        
        # Verify individual/population handling and spatial data
        print(f"\nPost-generation verification:")
        print(f"  - {ts_with_spatial.num_individuals} individuals created")
        print(f"  - {ts_with_spatial.num_populations} populations preserved")
        
        # Check individual-node relationships
        sample_nodes_after = ts_with_spatial.samples()
        nodes_with_individuals_after = sum(1 for node_id in sample_nodes_after if ts_with_spatial.node(node_id).individual != -1)
        print(f"  - {nodes_with_individuals_after}/{ts_with_spatial.num_samples} sample nodes assigned to individuals")
        
        # Verify spatial data was added
        spatial_samples = 0
        unique_locations = set()
        min_lon, max_lon = float('inf'), float('-inf')
        min_lat, max_lat = float('inf'), float('-inf')
        
        for node in ts_with_spatial.nodes():
            if node.is_sample() and node.individual != -1:
                individual = ts_with_spatial.individual(node.individual)
                if individual.location is not None and len(individual.location) >= 2:
                    spatial_samples += 1
                    lon, lat = individual.location[0], individual.location[1]
                    unique_locations.add((round(lon, 6), round(lat, 6)))  # Round for uniqueness check
                    min_lon = min(min_lon, lon)
                    max_lon = max(max_lon, lon)
                    min_lat = min(min_lat, lat)
                    max_lat = max(max_lat, lat)
        
        print(f"\nSpatial data summary:")
        print(f"  - {spatial_samples} samples with spatial locations")
        print(f"  - {len(unique_locations)} unique spatial locations (individuals)")
        print(f"  - Longitude range: {min_lon:.6f} to {max_lon:.6f}")
        print(f"  - Latitude range: {min_lat:.6f} to {max_lat:.6f}")
        print(f"  - All coordinates are guaranteed to be on land")
        
        # Verify diploid pairing if applicable
        if ts_with_spatial.num_individuals * 2 == ts_with_spatial.num_samples:
            print(f"  - Diploid pairing detected: {ts_with_spatial.num_individuals} individuals × 2 = {ts_with_spatial.num_samples} samples")
        
        # Save the result
        print(f"\nSaving tree sequence with spatial data to {output_file}")
        ts_with_spatial.dump(output_file)
        
        print(f"Successfully saved tree sequence to {output_file}")
        print(f"File size: {output_file.stat().st_size / 1024:.1f} KB")
        
        return 0
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main()) 