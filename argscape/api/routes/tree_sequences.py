"""
Tree sequence management endpoints.
"""

import logging
import os
import tempfile
import time
import asyncio
from datetime import datetime
from typing import Dict, Any

import numpy as np
import tskit
import tszip
import msprime
from fastapi import APIRouter, HTTPException, UploadFile, File, Request, BackgroundTasks, Query
from fastapi.responses import FileResponse

from argscape.api.core.dependencies import get_client_ip
from argscape.api.services import session_storage
from argscape.api.tskit_utils import load_tree_sequence_from_file
from argscape.api.tskit_utils.temporal import compute_temporal_info
from argscape.api.geo_utils import check_spatial_completeness
from argscape.api.services import generate_spatial_locations_for_samples
from argscape.api.models import SimulationRequest, SimplifyTreeSequenceRequest
from argscape.api.constants import (
    FILENAME_TIMESTAMP_PRECISION_MICROSECONDS,
    DEFAULT_MAX_SAMPLES_FOR_GRAPH,
    RAILWAY_SIMULATION_TIMEOUT_SECONDS,
    RAILWAY_MAX_SAMPLES,
    RAILWAY_MAX_SEQUENCE_LENGTH,
    RAILWAY_MAX_TIME,
    RAILWAY_MAX_POPULATION_SIZE,
    RAILWAY_MAX_NODES,
)

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload-tree-sequence")
async def upload_tree_sequence(request: Request, file: UploadFile = File(...)):
    """Upload and process tree sequence files."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        logger.info(f"Processing upload: {file.filename} for session {session_id}")
        
        contents = await file.read()
        
        # Store file in session
        session_storage.store_file(session_id, file.filename, contents)
        
        ts, updated_filename = load_tree_sequence_from_file(contents, file.filename)
        
        # Check if running on Railway
        # Check for actual Railway environment variables, or flags for testing Railway mode locally
        is_railway = (
            os.getenv("RAILWAY_ENVIRONMENT") is not None or 
            os.getenv("RAILWAY_PROJECT_ID") is not None or
            os.getenv("FORCE_RAILWAY_MODE", "").lower() in ("true", "1", "yes") or
            os.getenv("USE_RAILWAY_FRONTEND", "").lower() in ("true", "1", "yes")
        )
        
        # Check node count limit on Railway
        if is_railway and ts.num_nodes > RAILWAY_MAX_NODES:
            # Clean up stored files before raising error
            try:
                session_storage.delete_file(session_id, file.filename)
                session_storage.delete_file(session_id, updated_filename)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup files after node limit check: {cleanup_error}")
            
            raise HTTPException(
                status_code=400,
                detail=f"Tree sequence has {ts.num_nodes} nodes, which exceeds Railway limit ({RAILWAY_MAX_NODES}). For larger ARGs, please install ARGscape locally."
            )
        
        session_storage.store_tree_sequence(session_id, updated_filename, ts)
        
        # Use optimized temporal computation (uses numpy arrays instead of iterating nodes)
        temporal_info = compute_temporal_info(ts)
        has_temporal = temporal_info["has_temporal"]
        temporal_range = temporal_info["temporal_range"]
        spatial_info = check_spatial_completeness(ts)
        
        logger.info(f"Successfully loaded tree sequence: {ts.num_nodes} nodes, {ts.num_edges} edges")
        
        return {
            "filename": updated_filename,
            "original_filename": file.filename,
            "size": len(contents),
            "content_type": file.content_type,
            "status": "tree_sequence_loaded",
            "num_nodes": ts.num_nodes,
            "num_edges": ts.num_edges,
            "num_samples": ts.num_samples,
            "num_trees": ts.num_trees,
            "has_temporal": has_temporal,
            "temporal_range": temporal_range,
            **spatial_info
        }
    except ValueError as e:
        logger.error(f"Storage error for {file.filename}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to load tree sequence {file.filename}: {str(e)}")
        session_storage.delete_file(session_id, file.filename)
        raise HTTPException(status_code=400, detail=f"Failed to upload: {str(e)}")


@router.get("/tree-sequence-metadata/{filename}")
async def get_tree_sequence_metadata(request: Request, filename: str):
    """Get metadata for a tree sequence."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        ts = session_storage.get_tree_sequence(session_id, filename)
        if ts is None:
            raise HTTPException(status_code=404, detail=f"Tree sequence not found")
        
        # Use optimized temporal computation (uses numpy arrays instead of iterating nodes)
        temporal_info = compute_temporal_info(ts)
        has_temporal = temporal_info["has_temporal"]
        temporal_range = temporal_info["temporal_range"]
        spatial_info = check_spatial_completeness(ts)
        
        return {
            "filename": filename,
            "num_nodes": ts.num_nodes,
            "num_edges": ts.num_edges,
            "num_samples": ts.num_samples,
            "num_trees": ts.num_trees,
            "num_mutations": ts.num_mutations,
            "sequence_length": ts.sequence_length,
            "has_temporal": has_temporal,
            "temporal_range": temporal_range,
            **spatial_info
        }
    except Exception as e:
        logger.error(f"Error getting metadata for {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get metadata: {str(e)}")


@router.delete("/tree-sequence/{filename}")
async def delete_tree_sequence(request: Request, filename: str):
    """Delete a tree sequence file."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        ts = session_storage.get_tree_sequence(session_id, filename)
        if ts is None:
            raise HTTPException(status_code=404, detail="File not found")
        
        session_storage.delete_file(session_id, filename)
        logger.info(f"Deleted tree sequence: {filename} from session {session_id}")
        return {"message": f"Successfully deleted {filename}"}
    except Exception as e:
        logger.error(f"Error deleting file {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.get("/download-tree-sequence/{filename}")
async def download_tree_sequence(
    request: Request, 
    filename: str, 
    background_tasks: BackgroundTasks,
    format: str = Query("trees", regex="^(trees|tsz)$")
):
    """Download a tree sequence file in either .trees or .tsz format."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        # Get the tree sequence object
        ts = session_storage.get_tree_sequence(session_id, filename)
        if ts is None:
            raise HTTPException(status_code=404, detail="Tree sequence not found")
        
        # Create a more unique temporary filename to avoid conflicts
        timestamp = int(time.time() * FILENAME_TIMESTAMP_PRECISION_MICROSECONDS)
        safe_filename = filename.replace("/", "_").replace("\\", "_")
        base_filename = safe_filename.rsplit(".", 1)[0]
        
        # Create temporary file that will persist until explicitly deleted
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=f"_{timestamp}_{safe_filename}.{format}"
        )
        try:
            # Close the file handle so tszip can write to it on Windows
            temp_file.close()
            
            if format == "tsz":
                # Use tszip to compress the tree sequence
                tszip.compress(ts, temp_file.name)
            else:  # format == "trees"
                # Save as uncompressed .trees file
                ts.dump(temp_file.name)
            
            download_filename = f"{base_filename}.{format}"
            
            # Add cleanup task to remove temp file after response is sent
            def cleanup_temp_file(temp_path: str):
                try:
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                        logger.debug(f"Cleaned up temp file: {temp_path}")
                except Exception as cleanup_error:
                    logger.warning(f"Failed to clean up temp file {temp_path}: {cleanup_error}")
            
            background_tasks.add_task(cleanup_temp_file, temp_file.name)
            
            return FileResponse(
                path=temp_file.name,
                filename=download_filename,
                media_type='application/octet-stream'
            )
            
        except Exception as e:
            # Clean up the temp file if an error occurs
            try:
                os.unlink(temp_file.name)
            except:
                pass
            logger.error(f"Error downloading file {filename}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")
    except Exception as e:
        logger.error(f"Error downloading file {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")


@router.get("/graph-data/{filename}")
async def get_graph_data(
    request: Request,
    filename: str, 
    max_samples: int = DEFAULT_MAX_SAMPLES_FOR_GRAPH,
    genomic_start: float = None,
    genomic_end: float = None,
    tree_start_idx: int = None,
    tree_end_idx: int = None,
    temporal_start: float = None,
    temporal_end: float = None,
    sample_order: str = "consensus_minlex",
    # Pagination parameters
    page: int = None,
    page_size: int = None,
    nodes_only: bool = False,
    edges_only: bool = False
):
    """Get graph data for visualization.
    
    Can filter by either:
    - Genomic range: genomic_start and genomic_end
    - Tree index range: tree_start_idx and tree_end_idx (inclusive)
    - Temporal range: temporal_start and temporal_end
    
    Pagination support:
    - page: Page number (0-indexed, default: None = return all)
    - page_size: Number of nodes/edges per page (default: None = no pagination)
    - nodes_only: Return only nodes (no edges) for metadata queries
    - edges_only: Return only edges (assumes nodes already fetched)
    
    Tree index filtering takes precedence if both are provided.
    """
    logger.info(f"Requesting graph data for file: {filename} with max_samples: {max_samples}, "
               f"pagination: page={page}, page_size={page_size}")
    
    # Log filtering parameters
    if tree_start_idx is not None or tree_end_idx is not None:
        logger.info(f"Tree index filter: {tree_start_idx} - {tree_end_idx}")
    elif genomic_start is not None or genomic_end is not None:
        logger.info(f"Genomic range filter: {genomic_start} - {genomic_end}")

    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="Tree sequence not found")

    if max_samples < 2:
        raise HTTPException(status_code=400, detail="max_samples must be at least 2")

    try:
        # Import here to avoid import errors during startup
        from argscape.api.services.graph_utils import convert_to_graph_data, filter_by_tree_indices
        from argscape.api.inference.sparg import simplify_with_recombination
        
        expected_tree_count = None
        
        # Apply tree index filtering FIRST - takes precedence over other filtering
        if tree_start_idx is not None or tree_end_idx is not None:
            # Handle default values for tree index filtering
            start_idx = tree_start_idx if tree_start_idx is not None else 0
            end_idx = tree_end_idx if tree_end_idx is not None else ts.num_trees - 1
            
            # Validate tree index range
            if start_idx < 0 or end_idx >= ts.num_trees or start_idx > end_idx:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid tree index range: [{start_idx}, {end_idx}] for {ts.num_trees} trees"
                )
            
            logger.info(f"Applying tree index filter: {start_idx} - {end_idx}")
            ts, expected_tree_count = filter_by_tree_indices(ts, start_idx, end_idx)
            logger.info(f"After tree index filtering: {ts.num_nodes} nodes, {ts.num_edges} edges")
            
        elif genomic_start is not None or genomic_end is not None:
            # Apply genomic filtering only if tree index filtering not specified
            start = genomic_start if genomic_start is not None else 0
            end = genomic_end if genomic_end is not None else ts.sequence_length
            
            if start >= end:
                raise HTTPException(status_code=400, detail="genomic_start must be less than genomic_end")
            if start < 0 or end > ts.sequence_length:
                raise HTTPException(status_code=400, detail="Genomic range must be within sequence bounds")
            
            logger.info(f"Applying genomic filter: {start} - {end}")
            # Use delete_intervals approach for more precise filtering
            intervals_to_delete = []
            if start > 0:
                intervals_to_delete.append([0, start])
            if end < ts.sequence_length:
                intervals_to_delete.append([end, ts.sequence_length])
            
            if intervals_to_delete:
                logger.debug(f"Deleting intervals: {intervals_to_delete}")
                ts = ts.delete_intervals(intervals_to_delete, simplify=True)
            logger.info(f"After genomic filtering: {ts.num_nodes} nodes, {ts.num_edges} edges")

        # Apply temporal filtering AFTER genomic/tree filtering to preserve tree structure
        if temporal_start is not None or temporal_end is not None:
            start_time = temporal_start if temporal_start is not None else 0
            end_time = temporal_end if temporal_end is not None else max(node.time for node in ts.nodes())
            
            if start_time >= end_time:
                raise HTTPException(status_code=400, detail="temporal_start must be less than temporal_end")
            
            logger.info(f"Applying temporal filter: {start_time} - {end_time}")
            
            try:
                # Count nodes in temporal range
                total_internal_nodes = sum(1 for node in ts.nodes() if not node.is_sample())
                internal_nodes_in_range = sum(1 for node in ts.nodes() 
                                            if not node.is_sample() and start_time <= node.time <= end_time)
                
                if internal_nodes_in_range < total_internal_nodes:
                    logger.info(f"Temporal filtering: {internal_nodes_in_range}/{total_internal_nodes} internal nodes in range")
                    
                    # Use a table-based approach to filter by time while preserving structure
                    tables = ts.dump_tables()
                    
                    # Create new node table with only nodes in temporal range (plus all samples)
                    old_nodes = tables.nodes
                    new_nodes = old_nodes.copy()
                    new_nodes.clear()
                    
                    # Map old node IDs to new node IDs
                    old_to_new = {}
                    new_node_id = 0
                    
                    # First pass: add all samples (always keep samples)
                    for i, node in enumerate(ts.nodes()):
                        if node.is_sample():
                            old_to_new[node.id] = new_node_id
                            new_nodes.add_row(
                                flags=node.flags,
                                time=node.time,
                                population=node.population,
                                individual=node.individual,
                                metadata=node.metadata
                            )
                            new_node_id += 1
                    
                    # Second pass: add internal nodes in temporal range
                    for i, node in enumerate(ts.nodes()):
                        if not node.is_sample() and start_time <= node.time <= end_time:
                            old_to_new[node.id] = new_node_id
                            new_nodes.add_row(
                                flags=node.flags,
                                time=node.time,
                                population=node.population,
                                individual=node.individual,
                                metadata=node.metadata
                            )
                            new_node_id += 1
                    
                    # Update edges to only include edges between kept nodes
                    old_edges = tables.edges
                    new_edges = old_edges.copy()
                    new_edges.clear()
                    
                    for edge in ts.edges():
                        if edge.parent in old_to_new and edge.child in old_to_new:
                            new_edges.add_row(
                                left=edge.left,
                                right=edge.right,
                                parent=old_to_new[edge.parent],
                                child=old_to_new[edge.child],
                                metadata=edge.metadata
                            )
                    
                    # Update mutations to only include mutations on kept nodes
                    old_mutations = tables.mutations
                    new_mutations = old_mutations.copy()
                    new_mutations.clear()
                    
                    for mutation in ts.mutations():
                        if mutation.node in old_to_new:
                            new_mutations.add_row(
                                site=mutation.site,
                                node=old_to_new[mutation.node],
                                time=mutation.time,
                                derived_state=mutation.derived_state,
                                parent=mutation.parent,
                                metadata=mutation.metadata
                            )
                    
                    # Replace tables
                    tables.nodes.replace_with(new_nodes)
                    tables.edges.replace_with(new_edges)
                    tables.mutations.replace_with(new_mutations)
                    
                    # Create new tree sequence
                    ts_filtered = tables.tree_sequence()
                    
                    # Verify the filtered tree sequence has the same sequence length
                    if ts_filtered.sequence_length == ts.sequence_length and ts_filtered.num_trees > 0:
                        ts = ts_filtered
                        logger.info(f"After temporal filtering: {ts.num_nodes} nodes, {ts.num_edges} edges, {ts.num_trees} trees")
                    else:
                        logger.warning("Temporal filtering broke tree structure - keeping original")
                        
                else:
                    logger.info("No temporal filtering needed - all internal nodes within range")
                    
            except Exception as e:
                logger.warning(f"Temporal filtering failed: {e} - keeping original tree sequence")
                # On any error, continue with original tree sequence

        # Apply sample subsetting last (after all other filtering)
        if ts.num_samples > max_samples:
            sample_nodes = [node for node in ts.nodes() if node.is_sample()]
            indices = [int(i * (len(sample_nodes) - 1) / (max_samples - 1)) for i in range(max_samples)]
            selected_sample_ids = [sample_nodes[i].id for i in indices]
            ts = ts.simplify(samples=selected_sample_ids)
            logger.info(f"Simplified to {max_samples} samples: {ts.num_nodes} nodes, {ts.num_edges} edges")

        logger.info(f"Converting tree sequence to graph data: {ts.num_nodes} nodes, {ts.num_edges} edges")
        
        # Apply recombination flagging before conversion to ensure frontend can detect recombination nodes
        logger.info("Applying recombination node flagging...")
        ts_with_recomb_flags, _ = simplify_with_recombination(ts, flag_recomb=True)
        logger.info(f"Recombination flagging complete: {ts_with_recomb_flags.num_nodes} nodes, {ts_with_recomb_flags.num_edges} edges")
        
        # Pass expected tree count if we filtered by tree indices and sample ordering
        # Use graph cache with filename as key prefix (disabled on Railway)
        # Note: Cache key includes pagination params if used
        cache_key = filename
        if page is not None or page_size is not None:
            cache_key = f"{filename}_page{page}_size{page_size}"
        
        graph_data = convert_to_graph_data(
            ts_with_recomb_flags, 
            expected_tree_count, 
            sample_order,
            use_cache=True,
            cache_key_prefix=cache_key
        )
        
        # Apply pagination if requested
        if page is not None and page_size is not None:
            graph_data = _paginate_graph_data(graph_data, page, page_size, nodes_only, edges_only)
        elif nodes_only:
            # Return only nodes (for metadata/lightweight queries)
            graph_data = {
                'metadata': graph_data['metadata'],
                'nodes': graph_data['nodes'],
                'edges': []
            }
        elif edges_only:
            # Return only edges (assumes nodes already fetched)
            graph_data = {
                'metadata': graph_data['metadata'],
                'nodes': [],
                'edges': graph_data['edges']
            }
        
        return graph_data
    except Exception as e:
        logger.error(f"Error generating graph data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate graph data: {str(e)}")


@router.post("/simulate-tree-sequence/")  # Original version with trailing slash
async def simulate_tree_sequence(request: Request, simulation_request: SimulationRequest):
    """Simulate a tree sequence using msprime."""
    try:
        # Get session ID from request
        session_id = session_storage.get_or_create_session(get_client_ip(request))
        
        # Validate parameters
        if simulation_request.num_samples < 2:
            raise HTTPException(status_code=400, detail="Number of samples must be at least 2")
        if simulation_request.sequence_length <= 0:
            raise HTTPException(status_code=400, detail="Sequence length must be positive")
        if simulation_request.max_time < 1:
            raise HTTPException(status_code=400, detail="Maximum time must be at least 1")
        if simulation_request.population_size is not None and simulation_request.population_size < 1:
            raise HTTPException(status_code=400, detail="Population size must be at least 1")
        if simulation_request.mutation_rate is not None and simulation_request.mutation_rate <= 0:
            raise HTTPException(status_code=400, detail="Mutation rate must be positive")
        if simulation_request.recombination_rate is not None and simulation_request.recombination_rate <= 0:
            raise HTTPException(status_code=400, detail="Recombination rate must be positive")
        
        # Check if running on Railway (by checking for environment variable or Railway-specific env vars)
        # Also check for FORCE_RAILWAY_MODE or USE_RAILWAY_FRONTEND for local testing
        is_railway = (
            os.getenv("RAILWAY_ENVIRONMENT") is not None or 
            os.getenv("RAILWAY_PROJECT_ID") is not None or
            os.getenv("FORCE_RAILWAY_MODE", "").lower() in ("true", "1", "yes") or
            os.getenv("USE_RAILWAY_FRONTEND", "").lower() in ("true", "1", "yes")
        )
        
        # Enforce Railway parameter limits to prevent memory issues
        if is_railway:
            validation_errors = []
            if simulation_request.num_samples > RAILWAY_MAX_SAMPLES:
                validation_errors.append(
                    f"Number of samples ({simulation_request.num_samples}) exceeds Railway limit ({RAILWAY_MAX_SAMPLES}). "
                    f"For larger simulations, please install ARGscape locally."
                )
            if simulation_request.sequence_length > RAILWAY_MAX_SEQUENCE_LENGTH:
                validation_errors.append(
                    f"Sequence length ({simulation_request.sequence_length}) exceeds Railway limit ({RAILWAY_MAX_SEQUENCE_LENGTH:,} bp). "
                    f"For larger simulations, please install ARGscape locally."
                )
            if simulation_request.max_time > RAILWAY_MAX_TIME:
                validation_errors.append(
                    f"Maximum time ({simulation_request.max_time}) exceeds Railway limit ({RAILWAY_MAX_TIME}). "
                    f"For larger simulations, please install ARGscape locally."
                )
            if simulation_request.population_size is not None and simulation_request.population_size > RAILWAY_MAX_POPULATION_SIZE:
                validation_errors.append(
                    f"Population size ({simulation_request.population_size}) exceeds Railway limit ({RAILWAY_MAX_POPULATION_SIZE:,}). "
                    f"For larger simulations, please install ARGscape locally."
                )
            
            if validation_errors:
                error_message = "Simulation parameters exceed Railway limits:\n\n" + "\n\n".join(validation_errors)
                logger.warning(f"Rejected simulation on Railway due to parameter limits: {simulation_request.dict()}")
                raise HTTPException(status_code=400, detail=error_message)
        
        # Log simulation parameters
        logger.info(f"Simulating tree sequence with parameters: {simulation_request.dict()}")
        
        # Simulate the tree sequence
        async def run_simulation():
            """Run the simulation in a separate function for timeout handling."""
            # Run simulation in executor to avoid blocking
            loop = asyncio.get_event_loop()
            
            def _simulate():
                # First simulate ancestry
                ts = msprime.sim_ancestry(
                    samples=simulation_request.num_samples,
                    sequence_length=simulation_request.sequence_length,
                    recombination_rate=simulation_request.recombination_rate,
                    population_size=simulation_request.population_size,
                    random_seed=simulation_request.random_seed,
                    model=simulation_request.model,
                    end_time=simulation_request.max_time
                )
                
                # Then add mutations if mutation_rate is provided
                if simulation_request.mutation_rate is not None:
                    logger.info(f"Adding mutations with rate {simulation_request.mutation_rate}")
                    ts = msprime.sim_mutations(
                        ts,
                        rate=simulation_request.mutation_rate,
                        random_seed=simulation_request.random_seed
                    )
                    logger.info(f"Added {ts.num_mutations} mutations to the tree sequence")
                
                # Generate spatial locations for samples based on genealogical relationships
                logger.info(f"Generating spatial locations for samples using CRS: {simulation_request.crs}")
                ts = generate_spatial_locations_for_samples(
                    ts,
                    random_seed=simulation_request.random_seed,
                    crs=simulation_request.crs
                )
                
                return ts
            
            return await loop.run_in_executor(None, _simulate)
        
        try:
            # Apply timeout on Railway
            if is_railway:
                try:
                    ts = await asyncio.wait_for(run_simulation(), timeout=RAILWAY_SIMULATION_TIMEOUT_SECONDS)
                except asyncio.TimeoutError:
                    logger.warning(f"Simulation timed out after {RAILWAY_SIMULATION_TIMEOUT_SECONDS} seconds on Railway")
                    raise HTTPException(
                        status_code=504,
                        detail=f"Simulation timed out after {RAILWAY_SIMULATION_TIMEOUT_SECONDS} seconds. For larger simulations, please install ARGscape locally."
                    )
            else:
                ts = await run_simulation()
            
            # Check node count limit on Railway
            if is_railway and ts.num_nodes > RAILWAY_MAX_NODES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Simulated tree sequence has {ts.num_nodes} nodes, which exceeds Railway limit ({RAILWAY_MAX_NODES}). For larger simulations, please install ARGscape locally."
                )
            
            # Generate a unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{simulation_request.filename_prefix}_{timestamp}.trees"
            
            # Store in session (this will handle saving to disk)
            session_storage.store_tree_sequence(session_id, filename, ts)
            logger.info(f"Successfully simulated and saved tree sequence to {filename}")
            
            # Get file size
            file_size_bytes = session_storage.get_file_size_bytes(session_id, filename)
            
            # Use optimized temporal computation (uses numpy arrays instead of iterating nodes)
            temporal_info = compute_temporal_info(ts)
            has_temporal = temporal_info["has_temporal"]
            temporal_range = temporal_info["temporal_range"]
            spatial_info = check_spatial_completeness(ts)
            
            response = {
                "message": "Tree sequence simulated successfully",
                "filename": filename,
                "num_samples": ts.num_samples,
                "num_trees": ts.num_trees,
                "num_mutations": ts.num_mutations if simulation_request.mutation_rate is not None else 0,
                "sequence_length": ts.sequence_length,
                "has_temporal": has_temporal,
                "temporal_range": temporal_range,
                "crs": simulation_request.crs,
                **spatial_info
            }
            
            # Add file size if available
            if file_size_bytes is not None:
                response["file_size_bytes"] = file_size_bytes
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error during tree sequence simulation: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in simulate_tree_sequence: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to simulate tree sequence: {str(e)}")


def _paginate_graph_data(
    graph_data: Dict[str, Any], 
    page: int, 
    page_size: int,
    nodes_only: bool = False,
    edges_only: bool = False
) -> Dict[str, Any]:
    """
    Paginate graph data for incremental loading.
    
    Args:
        graph_data: Full graph data dictionary
        page: Page number (0-indexed)
        page_size: Number of items per page
        nodes_only: Return only nodes
        edges_only: Return only edges
    
    Returns:
        Paginated graph data with pagination metadata
    """
    nodes = graph_data.get('nodes', [])
    edges = graph_data.get('edges', [])
    metadata = graph_data.get('metadata', {})
    
    # Add pagination metadata
    total_nodes = len(nodes)
    total_edges = len(edges)
    
    # Paginate nodes
    if not edges_only:
        node_start = page * page_size
        node_end = node_start + page_size
        paginated_nodes = nodes[node_start:node_end]
    else:
        paginated_nodes = []
    
    # Paginate edges (use same page/page_size)
    if not nodes_only:
        edge_start = page * page_size
        edge_end = edge_start + page_size
        paginated_edges = edges[edge_start:edge_end]
    else:
        paginated_edges = []
    
    # Add pagination info to metadata
    pagination_info = {
        'page': page,
        'page_size': page_size,
        'total_nodes': total_nodes,
        'total_edges': total_edges,
        'total_pages_nodes': (total_nodes + page_size - 1) // page_size if page_size > 0 else 0,
        'total_pages_edges': (total_edges + page_size - 1) // page_size if page_size > 0 else 0,
        'has_more_nodes': node_end < total_nodes if not edges_only else False,
        'has_more_edges': edge_end < total_edges if not nodes_only else False,
    }
    
    metadata_with_pagination = {**metadata, 'pagination': pagination_info}
    
    return {
        'nodes': paginated_nodes,
        'edges': paginated_edges,
        'metadata': metadata_with_pagination
    }


