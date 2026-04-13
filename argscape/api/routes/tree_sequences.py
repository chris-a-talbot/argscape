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
from argscape.api.services.statistics import (
    compute_population_genetics_statistics,
    compute_statistics_for_range,
    compute_windowed_statistics,
    STANDARD_MUTATION_RATE
)
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
            "sequence_length": ts.sequence_length,
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
        
        # Compute population genetics statistics
        try:
            statistics = compute_population_genetics_statistics(ts)
        except Exception as e:
            logger.warning(f"Could not compute statistics for {filename}: {e}")
            statistics = {}
        
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
            "statistics": statistics,
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
    format: str = Query("trees", pattern="^(trees|tsz)$")
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
    keep_unary: bool = False,  # Deprecated, use unary_retention_percent
    unary_retention_percent: float = 0.0,
    # Pagination parameters
    page: int = None,
    page_size: int = None,
    nodes_only: bool = False,
    edges_only: bool = False,
    # Sample subsetting parameters
    sample_subset_mode: str = "even",  # "even" | "random" | "ids" | "range" | "population"
    sample_ids: str = None,  # comma-separated IDs for "ids" mode
    sample_range_start: int = None,  # for "range" mode
    sample_range_end: int = None,  # for "range" mode
    random_seed: int = None,  # for reproducible "random" mode
    sample_populations: str = None,  # comma-separated population IDs for "population" mode
):
    """Get graph data for visualization.
    
    Can filter by either:
    - Genomic range: genomic_start and genomic_end
    - Tree index range: tree_start_idx and tree_end_idx (inclusive)
    - Temporal range: temporal_start and temporal_end (accepted for URL compatibility;
      current visualizers apply temporal filtering client-side)
    
    Pagination support:
    - page: Page number (0-indexed, default: None = return all)
    - page_size: Number of nodes/edges per page (default: None = no pagination)
    - nodes_only: Return only nodes (no edges) for metadata queries
    - edges_only: Return only edges (assumes nodes already fetched)
    
    Tree index filtering takes precedence if both are provided.
    """
    logger.info(f"Requesting graph data for file: {filename} with max_samples: {max_samples}, "
               f"pagination: page={page}, page_size={page_size}")

    # Log sample subsetting parameters for ID-mapping debugging
    logger.info(f"SAMPLE SUBSETTING PARAMS: mode={sample_subset_mode}, ids={sample_ids}, "
               f"range=[{sample_range_start}, {sample_range_end}], seed={random_seed}, pops={sample_populations}")

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

        # Temporal filtering is handled purely client-side (opacity-based dimming)
        # to avoid breaking tree structure by severing sample-parent edges.
        # The temporalStart/temporalEnd params are accepted but ignored server-side.

        # Apply sample subsetting last (after all other filtering)
        sample_nodes = [node for node in ts.nodes() if node.is_sample()]
        selected_sample_ids = None

        if sample_subset_mode == "ids" and sample_ids:
            # Select specific sample IDs
            try:
                requested_ids = [int(id.strip()) for id in sample_ids.split(",") if id.strip()]
                valid_sample_ids = {node.id for node in sample_nodes}
                selected_sample_ids = [id for id in requested_ids if id in valid_sample_ids]
                if not selected_sample_ids:
                    raise HTTPException(status_code=400, detail="No valid sample IDs provided")
                logger.info(f"Sample subsetting mode 'ids': selected {len(selected_sample_ids)} samples from {len(requested_ids)} requested")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid sample IDs format - must be comma-separated integers")

        elif sample_subset_mode == "range" and (sample_range_start is not None or sample_range_end is not None):
            # Select contiguous range of samples
            start_idx = sample_range_start if sample_range_start is not None else 0
            end_idx = sample_range_end if sample_range_end is not None else len(sample_nodes) - 1

            if start_idx < 0 or end_idx >= len(sample_nodes) or start_idx > end_idx:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid sample range: [{start_idx}, {end_idx}] for {len(sample_nodes)} samples"
                )

            selected_sample_ids = [sample_nodes[i].id for i in range(start_idx, end_idx + 1)]
            logger.info(f"Sample subsetting mode 'range': selected samples {start_idx}-{end_idx} ({len(selected_sample_ids)} samples)")

        elif sample_subset_mode == "population" and sample_populations:
            # Select samples by population membership
            try:
                requested_pops = [int(p.strip()) for p in sample_populations.split(",") if p.strip()]
                selected_sample_ids = []
                for node in sample_nodes:
                    # Get population from individual if available, otherwise from node
                    pop = None
                    if node.individual != -1:
                        ind = ts.individual(node.individual)
                        if hasattr(ind, 'population') and ind.population is not None:
                            pop = ind.population
                    if pop is None:
                        pop = node.population
                    if pop in requested_pops:
                        selected_sample_ids.append(node.id)

                if not selected_sample_ids:
                    raise HTTPException(status_code=400, detail="No samples found in specified populations")
                logger.info(f"Sample subsetting mode 'population': selected {len(selected_sample_ids)} samples from populations {requested_pops}")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid population IDs format - must be comma-separated integers")

        elif sample_subset_mode == "random" and ts.num_samples > max_samples:
            # Random selection with optional seed
            import random
            if random_seed is not None:
                random.seed(random_seed)
            sample_ids_list = [node.id for node in sample_nodes]
            selected_sample_ids = random.sample(sample_ids_list, max_samples)
            logger.info(f"Sample subsetting mode 'random': selected {max_samples} random samples" +
                       (f" with seed {random_seed}" if random_seed is not None else ""))

        elif ts.num_samples > max_samples:
            # Default "even" mode: evenly distributed
            indices = [int(i * (len(sample_nodes) - 1) / (max_samples - 1)) for i in range(max_samples)]
            selected_sample_ids = [sample_nodes[i].id for i in indices]
            logger.info(f"Sample subsetting mode 'even': selected {max_samples} evenly distributed samples")

        # Apply simplification if samples were selected
        node_id_mapping = None
        logger.info(f"SIMPLIFICATION CHECK: selected_sample_ids={'None' if selected_sample_ids is None else f'{len(selected_sample_ids)} ids: {selected_sample_ids[:10] if len(selected_sample_ids) > 10 else selected_sample_ids}'}, ts.num_samples={ts.num_samples}")
        if selected_sample_ids is not None and len(selected_sample_ids) < ts.num_samples:
            ts, raw_mapping = ts.simplify(samples=selected_sample_ids, map_nodes=True)
            # Convert tskit mapping format (orig_id -> new_id) to our format (new_id -> orig_id)
            node_id_mapping = np.full(ts.num_nodes, -1, dtype=int)
            for orig_id, new_id in enumerate(raw_mapping):
                if new_id >= 0 and new_id < len(node_id_mapping):
                    node_id_mapping[new_id] = orig_id
            logger.info(f"Simplified to {len(selected_sample_ids)} samples: {ts.num_nodes} nodes, {ts.num_edges} edges")
            logger.info(f"Raw tskit mapping: {raw_mapping}")
            logger.info(f"Converted node_id_mapping: {node_id_mapping}")
            logger.info(f"Sample nodes in simplified tree: {[n.id for n in ts.nodes() if n.is_sample()]}")

        logger.info(f"Converting tree sequence to graph data: {ts.num_nodes} nodes, {ts.num_edges} edges")
        logger.info(f"BEFORE recomb flagging: node_id_mapping is {'None' if node_id_mapping is None else f'array of len {len(node_id_mapping)}, first 10: {node_id_mapping[:min(10, len(node_id_mapping))]}'}")

        # Apply recombination flagging before conversion to ensure frontend can detect recombination nodes
        # Use unary_retention_percent if provided, otherwise fall back to keep_unary for backward compatibility
        retention_percent = unary_retention_percent if unary_retention_percent is not None else (100.0 if keep_unary else 0.0)
        logger.info(f"Applying recombination node flagging (unary_retention_percent={retention_percent}%)...")
        ts_with_recomb_flags, node_id_mapping = simplify_with_recombination(ts, flag_recomb=True, keep_unary=keep_unary, unary_retention_percent=retention_percent, input_node_mapping=node_id_mapping)
        logger.info(f"AFTER recomb flagging: node_id_mapping is {'None' if node_id_mapping is None else f'array of len {len(node_id_mapping)}, first 10: {node_id_mapping[:min(10, len(node_id_mapping))]}'}")
        logger.info(f"Recombination flagging complete: {ts_with_recomb_flags.num_nodes} nodes, {ts_with_recomb_flags.num_edges} edges")
        
        # Pass expected tree count if we filtered by tree indices and sample ordering
        # Use graph cache with filename as key prefix (disabled on Railway)
        # Note: Cache key includes pagination params if used
        cache_key = filename
        if page is not None or page_size is not None:
            cache_key = f"{filename}_page{page}_size{page_size}"

        logger.info(f"CALLING convert_to_graph_data with node_id_mapping={'None' if node_id_mapping is None else f'len={len(node_id_mapping)}'}")

        graph_data = convert_to_graph_data(
            ts_with_recomb_flags,
            expected_tree_count,
            sample_order,
            use_cache=True,
            cache_key_prefix=cache_key,
            node_id_mapping=node_id_mapping
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


@router.get("/statistics/range/{filename}")
async def get_statistics_for_range(
    request: Request,
    filename: str,
    genomic_start: float = Query(None, description="Start position for genomic filtering"),
    genomic_end: float = Query(None, description="End position for genomic filtering"),
    temporal_start: float = Query(None, description="Start time for temporal filtering"),
    temporal_end: float = Query(None, description="End time for temporal filtering"),
    tree_start_idx: int = Query(None, description="Start tree index for filtering"),
    tree_end_idx: int = Query(None, description="End tree index for filtering"),
    mutation_rate: float = Query(STANDARD_MUTATION_RATE, description="Mutation rate per base pair per generation")
):
    """Get population genetics statistics for a filtered genomic and/or temporal range."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        ts = session_storage.get_tree_sequence(session_id, filename)
        if ts is None:
            raise HTTPException(status_code=404, detail=f"Tree sequence not found")
        
        # Validate parameters
        if genomic_start is not None and genomic_end is not None:
            if genomic_start >= genomic_end:
                raise HTTPException(status_code=400, detail="genomic_start must be less than genomic_end")
            if genomic_start < 0 or genomic_end > ts.sequence_length:
                raise HTTPException(status_code=400, detail="Genomic range must be within sequence bounds")
        
        if temporal_start is not None and temporal_end is not None:
            if temporal_start >= temporal_end:
                raise HTTPException(status_code=400, detail="temporal_start must be less than temporal_end")
        
        if tree_start_idx is not None and tree_end_idx is not None:
            if tree_start_idx < 0 or tree_end_idx >= ts.num_trees:
                raise HTTPException(status_code=400, detail="Tree indices must be within valid range")
            if tree_start_idx >= tree_end_idx:
                raise HTTPException(status_code=400, detail="tree_start_idx must be less than tree_end_idx")
        
        # Compute statistics for the filtered range
        try:
            result = compute_statistics_for_range(
                ts,
                genomic_start=genomic_start,
                genomic_end=genomic_end,
                temporal_start=temporal_start,
                temporal_end=temporal_end,
                tree_start_idx=tree_start_idx,
                tree_end_idx=tree_end_idx,
                mutation_rate=mutation_rate
            )
            return result
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Error computing statistics for range: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to compute statistics: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting statistics for range: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@router.get("/statistics/windowed/{filename}")
async def get_windowed_statistics(
    request: Request,
    filename: str,
    window_size: float = Query(..., description="Size of each window in base pairs"),
    window_step: float = Query(None, description="Step size between windows (default: window_size)"),
    mutation_rate: float = Query(STANDARD_MUTATION_RATE, description="Mutation rate per base pair per generation")
):
    """Get windowed population genetics statistics across the sequence."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        ts = session_storage.get_tree_sequence(session_id, filename)
        if ts is None:
            raise HTTPException(status_code=404, detail=f"Tree sequence not found")
        
        # Validate parameters
        if window_size <= 0:
            raise HTTPException(status_code=400, detail="window_size must be positive")
        if window_step is not None and window_step <= 0:
            raise HTTPException(status_code=400, detail="window_step must be positive")
        
        # Limit number of windows to prevent excessive computation
        # Estimate number of windows
        if window_step is None:
            window_step = window_size
        estimated_windows = int((ts.sequence_length + window_step - 1) / window_step)
        max_windows = 100  # Limit to 100 windows for performance
        
        if estimated_windows > max_windows:
            # Adjust window_size to stay within limit
            adjusted_window_size = ts.sequence_length / max_windows
            logger.warning(f"Requested windowing would create {estimated_windows} windows, "
                         f"adjusting window_size to {adjusted_window_size:.0f} bp to limit to {max_windows} windows")
            window_size = adjusted_window_size
            window_step = window_size
        
        # Compute windowed statistics
        try:
            windows = compute_windowed_statistics(
                ts,
                window_size=window_size,
                window_step=window_step,
                mutation_rate=mutation_rate
            )
            return {
                "windows": windows,
                "window_size": window_size,
                "window_step": window_step,
                "num_windows": len(windows)
            }
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Error computing windowed statistics: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to compute windowed statistics: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting windowed statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get windowed statistics: {str(e)}")

