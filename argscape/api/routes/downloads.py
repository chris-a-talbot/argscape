"""
Download endpoints for tree sequence data and intermediate inference results.
"""

import logging
import os
import tempfile
import csv
import io
import json
import pickle
import base64
import zipfile
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path

import numpy as np
import pandas as pd
import tskit
from fastapi import APIRouter, HTTPException, Request, Query, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse

from argscape.api.core.dependencies import get_client_ip
from argscape.api.services import session_storage

logger = logging.getLogger(__name__)

router = APIRouter()


def extract_node_locations_csv(
    ts: tskit.TreeSequence,
    node_type: str = "all",  # "all", "samples", "internal"
    include_columns: Optional[List[str]] = None
) -> str:
    """
    Extract node locations from tree sequence and format as CSV.
    
    Args:
        ts: Tree sequence
        node_type: Type of nodes to include ("all", "samples", "internal")
        include_columns: Additional columns to include (e.g., ["time", "individual_id", "pedigree_id"])
        
    Returns:
        CSV string with node locations
    """
    if include_columns is None:
        include_columns = []
    
    rows = []
    
    # Determine which nodes to include
    if node_type == "samples":
        nodes_to_process = [node for node in ts.nodes() if node.is_sample()]
    elif node_type == "internal":
        nodes_to_process = [node for node in ts.nodes() if not node.is_sample()]
    else:  # "all"
        nodes_to_process = list(ts.nodes())
    
    # Build column names
    columns = ["node_id", "x", "y"]
    if "z" in include_columns or any("location" in col.lower() for col in include_columns):
        columns.append("z")
    if "time" in include_columns:
        columns.append("time")
    if "individual_id" in include_columns:
        columns.append("individual_id")
    if "pedigree_id" in include_columns:
        columns.append("pedigree_id")
    if "population" in include_columns:
        columns.append("population")
    if "is_sample" in include_columns:
        columns.append("is_sample")
    
    # Extract metadata schema if available
    try:
        # Try to decode individual metadata schema
        individual_metadata_schema = None
        if hasattr(ts, "individuals_metadata_schema") and ts.individuals_metadata_schema:
            try:
                individual_metadata_schema = json.loads(ts.individuals_metadata_schema)
            except:
                pass
    except:
        pass
    
    # Process each node
    for node in nodes_to_process:
        row = {"node_id": node.id}
        
        # Get location from individual
        location = None
        if node.individual != -1 and node.individual < ts.num_individuals:
            individual = ts.individual(node.individual)
            if individual.location is not None and len(individual.location) >= 2:
                location = individual.location
                
                # Try to extract metadata from individual
                if individual.metadata:
                    try:
                        if individual_metadata_schema:
                            # Decode using schema
                            import tskit
                            decoded = tskit.unpack_bytes(individual.metadata, individual_metadata_schema)
                            if isinstance(decoded, dict):
                                if "pedigree_id" in decoded and "pedigree_id" in include_columns:
                                    row["pedigree_id"] = decoded["pedigree_id"]
                                if "individual_id" in decoded and "individual_id" in include_columns:
                                    row["individual_id"] = decoded["individual_id"]
                    except:
                        # Try to decode as JSON
                        try:
                            decoded = json.loads(individual.metadata.decode('utf-8'))
                            if isinstance(decoded, dict):
                                if "pedigree_id" in decoded and "pedigree_id" in include_columns:
                                    row["pedigree_id"] = decoded["pedigree_id"]
                                if "individual_id" in decoded and "individual_id" in include_columns:
                                    row["individual_id"] = decoded["individual_id"]
                        except:
                            pass
        
        if location is None:
            continue  # Skip nodes without locations
        
        row["x"] = float(location[0])
        row["y"] = float(location[1])
        
        if "z" in columns:
            row["z"] = float(location[2]) if len(location) >= 3 else 0.0
        
        if "time" in columns:
            row["time"] = float(node.time)
        
        if "individual_id" in columns and "individual_id" not in row:
            row["individual_id"] = node.individual if node.individual != -1 else None
        
        if "population" in columns:
            row["population"] = node.population if node.population != -1 else None
        
        if "is_sample" in columns:
            row["is_sample"] = node.is_sample()
        
        rows.append(row)
    
    # Convert to CSV
    if not rows:
        return ",".join(columns) + "\n"  # Return header only
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=columns, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(rows)
    
    return output.getvalue()


@router.get("/download-locations-csv/{filename}")
async def download_locations_csv(
    request: Request,
    filename: str,
    node_type: str = Query("all", regex="^(all|samples|internal)$"),
    include_columns: Optional[str] = Query(None, description="Comma-separated list of columns: time,individual_id,pedigree_id,population,is_sample,z")
):
    """
    Download node locations as CSV file.
    
    Args:
        filename: Tree sequence filename
        node_type: Type of nodes ("all", "samples", "internal")
        include_columns: Comma-separated list of additional columns to include
    """
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        ts = session_storage.get_tree_sequence(session_id, filename)
        if ts is None:
            raise HTTPException(status_code=404, detail="Tree sequence not found")
        
        # Parse include_columns
        columns_list = []
        if include_columns:
            columns_list = [col.strip() for col in include_columns.split(",")]
        
        # Generate CSV
        csv_content = extract_node_locations_csv(ts, node_type=node_type, include_columns=columns_list)
        
        # Generate filename
        base_name = filename.rsplit(".", 1)[0] if "." in filename else filename
        suffix = f"_{node_type}_locations"
        if columns_list:
            suffix += f"_{'_'.join(columns_list[:2])}"  # Add first 2 column names to filename
        download_filename = f"{base_name}{suffix}.csv"
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(csv_content.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{download_filename}"'}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating location CSV for {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV: {str(e)}")


@router.get("/download-intermediate-data/{filename}")
async def download_intermediate_data(
    request: Request,
    filename: str,
    background_tasks: BackgroundTasks,
    data_type: str = Query(..., description="Type of intermediate data: mpr_result, spatial_arg, dispersal_params, ancestor_locations"),
    format: str = Query("pkl", regex="^(pkl|csv|npy|zip)$", description="Export format: pkl (pickle), csv (CSV files), npy (NumPy arrays), zip (all as zip)")
):
    """
    Download intermediate inference data objects.
    
    Args:
        filename: Tree sequence filename (the one that was created by inference)
        data_type: Type of intermediate data to download
        format: Export format - pkl (pickle), csv (CSV files), npy (NumPy arrays), or zip (all formats)
    """
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        # Check if intermediate data exists for this filename
        intermediate_data = session_storage.get_intermediate_data(session_id, filename, data_type)
        if intermediate_data is None:
            raise HTTPException(
                status_code=404, 
                detail=f"Intermediate data of type '{data_type}' not found for {filename}. "
                       f"This data is only available for tree sequences created by inference methods."
            )
        
        # Generate appropriate filename
        base_name = filename.rsplit(".", 1)[0] if "." in filename else filename
        download_filename = f"{base_name}_{data_type}"
        
        # Add format suffix for non-pkl formats
        if data_type == "mpr_result" and format != "pkl":
            if format == "csv":
                download_filename = f"{base_name}_{data_type}_csv"
            elif format == "npy":
                download_filename = f"{base_name}_{data_type}_npy"
            # zip format already handled in the code below
        
        # Serialize and return based on data type
        if data_type == "mpr_result":
            # MPRResult object - support multiple export formats
            if format == "pkl":
                # Original pickle format
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pkl")
                try:
                    pickle.dump(intermediate_data, temp_file)
                    temp_file.close()
                    
                    def cleanup():
                        try:
                            os.unlink(temp_file.name)
                        except:
                            pass
                    
                    background_tasks.add_task(cleanup)
                    
                    return FileResponse(
                        path=temp_file.name,
                        filename=f"{download_filename}.pkl",
                        media_type="application/octet-stream"
                    )
                except Exception as e:
                    try:
                        os.unlink(temp_file.name)
                    except:
                        pass
                    raise HTTPException(status_code=500, detail=f"Failed to serialize MPRResult: {str(e)}")
            
            elif format in ("csv", "npy", "zip"):
                # Export as CSV or NumPy arrays
                # Extract arrays from MPRResult object
                mpr_arrays = {}
                try:
                    # Try to access common MPRResult attributes
                    if hasattr(intermediate_data, 'mpr_matrix'):
                        mpr_arrays['mpr_matrix'] = intermediate_data.mpr_matrix
                    if hasattr(intermediate_data, 'tree_lengths'):
                        mpr_arrays['tree_lengths'] = intermediate_data.tree_lengths
                    if hasattr(intermediate_data, 'node_weights'):
                        mpr_arrays['node_weights'] = intermediate_data.node_weights
                    if hasattr(intermediate_data, 'sample_locations'):
                        mpr_arrays['sample_locations'] = intermediate_data.sample_locations
                    if hasattr(intermediate_data, 'sample_node_ids'):
                        mpr_arrays['sample_node_ids'] = intermediate_data.sample_node_ids
                    if hasattr(intermediate_data, 'mean_tree_length'):
                        mpr_arrays['mean_tree_length'] = np.array([intermediate_data.mean_tree_length])
                except Exception as e:
                    logger.warning(f"Could not extract all MPRResult attributes: {e}")
                
                if not mpr_arrays:
                    raise HTTPException(
                        status_code=500, 
                        detail="Could not extract arrays from MPRResult object. Use format=pkl to download the full object."
                    )
                
                if format == "zip":
                    # Create a zip file with both CSV and NPY files
                    temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
                    temp_files_to_cleanup = [temp_zip.name]
                    
                    try:
                        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                            # Add CSV files
                            for name, arr in mpr_arrays.items():
                                csv_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix=".csv")
                                temp_files_to_cleanup.append(csv_file.name)
                                np.savetxt(csv_file.name, arr, delimiter=',', fmt='%.10e')
                                csv_file.close()
                                zipf.write(csv_file.name, f"{name}.csv")
                            
                            # Add NPY files
                            for name, arr in mpr_arrays.items():
                                npy_file = tempfile.NamedTemporaryFile(delete=False, suffix=".npy")
                                temp_files_to_cleanup.append(npy_file.name)
                                np.save(npy_file.name, arr)
                                npy_file.close()
                                zipf.write(npy_file.name, f"{name}.npy")
                        
                        temp_zip.close()
                        
                        def cleanup():
                            for f in temp_files_to_cleanup:
                                try:
                                    os.unlink(f)
                                except:
                                    pass
                        
                        background_tasks.add_task(cleanup)
                        
                        return FileResponse(
                            path=temp_zip.name,
                            filename=f"{download_filename}.zip",
                            media_type="application/zip"
                        )
                    except Exception as e:
                        for f in temp_files_to_cleanup:
                            try:
                                os.unlink(f)
                            except:
                                pass
                        raise HTTPException(status_code=500, detail=f"Failed to create zip file: {str(e)}")
                
                elif format == "csv":
                    # Create a zip file with CSV files
                    temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
                    temp_files_to_cleanup = [temp_zip.name]
                    
                    try:
                        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                            for name, arr in mpr_arrays.items():
                                csv_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix=".csv")
                                temp_files_to_cleanup.append(csv_file.name)
                                np.savetxt(csv_file.name, arr, delimiter=',', fmt='%.10e')
                                csv_file.close()
                                zipf.write(csv_file.name, f"{name}.csv")
                        
                        temp_zip.close()
                        
                        def cleanup():
                            for f in temp_files_to_cleanup:
                                try:
                                    os.unlink(f)
                                except:
                                    pass
                        
                        background_tasks.add_task(cleanup)
                        
                        return FileResponse(
                            path=temp_zip.name,
                            filename=f"{base_name}_{data_type}_csv.zip",
                            media_type="application/zip"
                        )
                    except Exception as e:
                        for f in temp_files_to_cleanup:
                            try:
                                os.unlink(f)
                            except:
                                pass
                        raise HTTPException(status_code=500, detail=f"Failed to create CSV zip file: {str(e)}")
                
                elif format == "npy":
                    # Create a zip file with NPY files
                    temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
                    temp_files_to_cleanup = [temp_zip.name]
                    
                    try:
                        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                            for name, arr in mpr_arrays.items():
                                npy_file = tempfile.NamedTemporaryFile(delete=False, suffix=".npy")
                                temp_files_to_cleanup.append(npy_file.name)
                                np.save(npy_file.name, arr)
                                npy_file.close()
                                zipf.write(npy_file.name, f"{name}.npy")
                        
                        temp_zip.close()
                        
                        def cleanup():
                            for f in temp_files_to_cleanup:
                                try:
                                    os.unlink(f)
                                except:
                                    pass
                        
                        background_tasks.add_task(cleanup)
                        
                        return FileResponse(
                            path=temp_zip.name,
                            filename=f"{base_name}_{data_type}_npy.zip",
                            media_type="application/zip"
                        )
                    except Exception as e:
                        for f in temp_files_to_cleanup:
                            try:
                                os.unlink(f)
                            except:
                                pass
                        raise HTTPException(status_code=500, detail=f"Failed to create NPY zip file: {str(e)}")
        
        elif data_type == "spatial_arg":
            # SpatialARG object - serialize as pickle
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pkl")
            try:
                pickle.dump(intermediate_data, temp_file)
                temp_file.close()
                
                def cleanup():
                    try:
                        os.unlink(temp_file.name)
                    except:
                        pass
                
                background_tasks.add_task(cleanup)
                
                return FileResponse(
                    path=temp_file.name,
                    filename=f"{download_filename}.pkl",
                    media_type="application/octet-stream"
                )
            except Exception as e:
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
                raise HTTPException(status_code=500, detail=f"Failed to serialize SpatialARG: {str(e)}")
        
        elif data_type == "dispersal_params":
            # Dispersal parameters - return as JSON
            if isinstance(intermediate_data, np.ndarray):
                data_dict = {
                    "dispersal_rate": intermediate_data.tolist(),
                    "shape": list(intermediate_data.shape)
                }
            elif isinstance(intermediate_data, dict):
                data_dict = intermediate_data
            else:
                data_dict = {"data": str(intermediate_data)}
            
            return StreamingResponse(
                io.BytesIO(json.dumps(data_dict, indent=2).encode('utf-8')),
                media_type="application/json",
                headers={"Content-Disposition": f'attachment; filename="{download_filename}.json"'}
            )
        
        elif data_type == "ancestor_locations":
            # DataFrame - return as CSV
            if isinstance(intermediate_data, pd.DataFrame):
                csv_content = intermediate_data.to_csv(index=False)
                return StreamingResponse(
                    io.BytesIO(csv_content.encode('utf-8')),
                    media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="{download_filename}.csv"'}
                )
            else:
                raise HTTPException(status_code=500, detail="ancestor_locations data is not a DataFrame")
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown data type: {data_type}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading intermediate data for {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download intermediate data: {str(e)}")


@router.get("/list-intermediate-data/{filename}")
async def list_intermediate_data(request: Request, filename: str):
    """
    List available intermediate data types for a tree sequence.
    
    Args:
        filename: Tree sequence filename
    """
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        available_data = session_storage.list_intermediate_data(session_id, filename)
        
        return {
            "filename": filename,
            "available_data_types": available_data
        }
        
    except Exception as e:
        logger.error(f"Error listing intermediate data for {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list intermediate data: {str(e)}")


@router.get("/download-statistics-csv/{filename}")
async def download_statistics_csv(request: Request, filename: str):
    """
    Download statistics for a tree sequence as CSV.
    
    Args:
        filename: Tree sequence filename
    """
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        ts = session_storage.get_tree_sequence(session_id, filename)
        if ts is None:
            raise HTTPException(status_code=404, detail=f"Tree sequence not found")
        
        # Get statistics from metadata endpoint logic
        from argscape.api.services.statistics import compute_population_genetics_statistics
        
        try:
            statistics = compute_population_genetics_statistics(ts)
        except Exception as e:
            logger.warning(f"Could not compute statistics for {filename}: {e}")
            statistics = {}
        
        # Convert statistics to CSV format
        # Create a list of rows: [statistic_name, value]
        rows = []
        rows.append(["Statistic", "Value"])
        rows.append([])  # Empty row for readability
        
        # Group statistics by category
        categories = {
            "Diversity": [
                ("nucleotide_diversity", "Nucleotide Diversity (π)"),
                ("wattersons_theta", "Watterson's Theta (θ)"),
                ("tajimas_d", "Tajima's D"),
                ("segregating_sites", "Segregating Sites")
            ],
            "Tree Topology": [
                ("mean_tree_height", "Mean Tree Height"),
                ("median_tree_height", "Median Tree Height"),
                ("mean_tree_length", "Mean Tree Length"),
                ("median_tree_length", "Median Tree Length"),
                ("tmrca", "TMRCA (Time to Most Recent Common Ancestor)"),
                ("mean_tmrca", "Mean TMRCA"),
                ("median_tmrca", "Median TMRCA")
            ],
            "Demography": [
                ("ne_watterson", "Effective Population Size (Ne, Watterson)"),
                ("ne_pi", "Effective Population Size (Ne, π)"),
                ("estimated_recombination_rate", "Estimated Recombination Rate")
            ],
            "Linkage Disequilibrium": [
                ("mean_ld_r2", "Mean LD R²"),
                ("median_ld_r2", "Median LD R²"),
                ("min_ld_r2", "Min LD R²"),
                ("max_ld_r2", "Max LD R²")
            ],
            "Population Structure": [
                ("fst", "Fst"),
                ("num_populations", "Number of Populations"),
                ("mean_divergence", "Mean Divergence"),
                ("median_divergence", "Median Divergence"),
                ("min_divergence", "Min Divergence"),
                ("max_divergence", "Max Divergence")
            ]
        }
        
        for category, stats_list in categories.items():
            rows.append([category, ""])  # Category header
            for stat_key, stat_label in stats_list:
                value = statistics.get(stat_key)
                if value is not None:
                    # Format the value appropriately
                    if isinstance(value, (int, float)):
                        if abs(value) < 0.001 or abs(value) > 1000000:
                            formatted_value = f"{value:.6e}"
                        else:
                            formatted_value = f"{value:.6f}"
                    else:
                        formatted_value = str(value)
                    rows.append([stat_label, formatted_value])
            rows.append([])  # Empty row between categories
        
        # Add basic tree sequence info at the top
        info_rows = [
            ["Tree Sequence Information", ""],
            ["Filename", filename],
            ["Number of Samples", str(ts.num_samples)],
            ["Number of Nodes", str(ts.num_nodes)],
            ["Number of Edges", str(ts.num_edges)],
            ["Number of Trees", str(ts.num_trees)],
            ["Number of Mutations", str(ts.num_mutations)],
            ["Sequence Length", str(ts.sequence_length)],
            []
        ]
        rows = info_rows + rows
        
        # Convert to CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerows(rows)
        csv_content = output.getvalue()
        output.close()
        
        # Generate filename
        base_name = filename.rsplit(".", 1)[0] if "." in filename else filename
        download_filename = f"{base_name}_statistics.csv"
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{download_filename}"'}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating statistics CSV for {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate statistics CSV: {str(e)}")


@router.get("/download-diff-statistics/{first_filename}")
async def download_diff_statistics(
    request: Request,
    first_filename: str,
    second_filename: str = Query(..., description="Second tree sequence filename for comparison"),
    format: str = Query("csv", regex="^(csv|json)$", description="Export format: csv (full node locations) or json (average statistics)")
):
    """
    Download diff statistics between two tree sequences.
    
    Args:
        first_filename: First tree sequence filename
        second_filename: Second tree sequence filename
        format: Export format - csv (full node locations) or json (average statistics)
    """
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        ts1 = session_storage.get_tree_sequence(session_id, first_filename)
        ts2 = session_storage.get_tree_sequence(session_id, second_filename)
        
        if ts1 is None:
            raise HTTPException(status_code=404, detail=f"First tree sequence '{first_filename}' not found")
        if ts2 is None:
            raise HTTPException(status_code=404, detail=f"Second tree sequence '{second_filename}' not found")
        
        # Extract node locations from both tree sequences
        def extract_node_locations(ts: tskit.TreeSequence) -> Dict[int, Tuple[float, float]]:
            """Extract node locations as dict: node_id -> (x, y)"""
            locations = {}
            for node in ts.nodes():
                # Locations are stored in the individual table
                if node.individual != -1 and node.individual < ts.num_individuals:
                    individual = ts.individual(node.individual)
                    if individual.location is not None and len(individual.location) >= 2:
                        locations[node.id] = (float(individual.location[0]), float(individual.location[1]))
            return locations
        
        locations1 = extract_node_locations(ts1)
        locations2 = extract_node_locations(ts2)
        
        if not locations1 or not locations2:
            raise HTTPException(
                status_code=400,
                detail="Both tree sequences must have spatial location data for all nodes"
            )
        
        # Find common nodes
        common_node_ids = set(locations1.keys()) & set(locations2.keys())
        if not common_node_ids:
            raise HTTPException(
                status_code=400,
                detail="No common nodes found between the two tree sequences"
            )
        
        # Calculate distances for all common nodes
        distances = []
        node_data = []
        
        for node_id in common_node_ids:
            x1, y1 = locations1[node_id]
            x2, y2 = locations2[node_id]
            dx = x2 - x1
            dy = y2 - y1
            distance = np.sqrt(dx * dx + dy * dy)
            distances.append(distance)
            node_data.append({
                'node_id': node_id,
                'tree_1_x': x1,
                'tree_2_x': x2,
                'tree_1_y': y1,
                'tree_2_y': y2,
                'diff': distance
            })
        
        if not distances:
            raise HTTPException(
                status_code=400,
                detail="No valid node pairs found for comparison"
            )
        
        # Calculate max_diff: maximum distance between any two samples in either tree sequence
        def get_max_sample_distance(ts: tskit.TreeSequence, locations: Dict[int, Tuple[float, float]]) -> float:
            """Calculate maximum distance between any two samples"""
            sample_ids = list(ts.samples())
            sample_locations = [(locations.get(sid, (0, 0))) for sid in sample_ids if sid in locations]
            
            if len(sample_locations) < 2:
                return 1.0  # Default to 1.0 if not enough samples
            
            max_dist = 0.0
            for i, (x1, y1) in enumerate(sample_locations):
                for j, (x2, y2) in enumerate(sample_locations[i+1:], start=i+1):
                    dx = x2 - x1
                    dy = y2 - y1
                    dist = np.sqrt(dx * dx + dy * dy)
                    max_dist = max(max_dist, dist)
            
            return max_dist if max_dist > 0 else 1.0
        
        max_diff1 = get_max_sample_distance(ts1, locations1)
        max_diff2 = get_max_sample_distance(ts2, locations2)
        max_diff = max(max_diff1, max_diff2)
        
        # Add normalized_diff to node_data
        for data in node_data:
            data['normalized_diff'] = data['diff'] / max_diff if max_diff > 0 else 0.0
        
        if format == "json":
            # Return average statistics
            avg_distance = np.mean(distances)
            max_distance = np.max(distances)
            min_distance = np.min(distances)
            median_distance = np.median(distances)
            std_distance = np.std(distances)
            
            stats = {
                "first_filename": first_filename,
                "second_filename": second_filename,
                "num_compared_nodes": len(common_node_ids),
                "max_sample_distance": max_diff,
                "statistics": {
                    "mean_difference": float(avg_distance),
                    "median_difference": float(median_distance),
                    "max_difference": float(max_distance),
                    "min_difference": float(min_distance),
                    "std_difference": float(std_distance)
                }
            }
            
            return StreamingResponse(
                io.BytesIO(json.dumps(stats, indent=2).encode('utf-8')),
                media_type="application/json",
                headers={"Content-Disposition": f'attachment; filename="{first_filename.rsplit(".", 1)[0]}_vs_{second_filename.rsplit(".", 1)[0]}_diff_stats.json"'}
            )
        
        else:  # format == "csv"
            # Return full node locations CSV
            rows = []
            rows.append(["node_ID", "tree_1_x", "tree_2_x", "tree_1_y", "tree_2_y", "diff", "normalized_diff"])
            
            for data in sorted(node_data, key=lambda x: x['node_id']):
                rows.append([
                    str(data['node_id']),
                    f"{data['tree_1_x']:.10e}",
                    f"{data['tree_2_x']:.10e}",
                    f"{data['tree_1_y']:.10e}",
                    f"{data['tree_2_y']:.10e}",
                    f"{data['diff']:.10e}",
                    f"{data['normalized_diff']:.10e}"
                ])
            
            # Convert to CSV
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerows(rows)
            csv_content = output.getvalue()
            output.close()
            
            # Generate filename
            base_name1 = first_filename.rsplit(".", 1)[0] if "." in first_filename else first_filename
            base_name2 = second_filename.rsplit(".", 1)[0] if "." in second_filename else second_filename
            download_filename = f"{base_name1}_vs_{base_name2}_diff_locations.csv"
            
            return StreamingResponse(
                io.BytesIO(csv_content.encode('utf-8')),
                media_type="text/csv",
                headers={"Content-Disposition": f'attachment; filename="{download_filename}"'}
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating diff statistics for {first_filename} vs {second_filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate diff statistics: {str(e)}")

