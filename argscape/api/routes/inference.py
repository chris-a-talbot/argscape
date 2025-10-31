"""
Location and temporal inference endpoints.
"""

import logging
import os
import asyncio

import tskit
from fastapi import APIRouter, HTTPException, UploadFile, File, Request

from argscape.api.core.dependencies import get_client_ip
from argscape.api.services import session_storage
from argscape.api.geo_utils import check_spatial_completeness, parse_location_csv, apply_custom_locations_to_tree_sequence
from argscape.api.inference import (
    run_fastgaia_inference,
    run_gaia_quadratic_inference,
    run_gaia_linear_inference,
    run_midpoint_inference,
    run_tsdate_inference,
    run_sparg_inference,
)
from argscape.api.models import (
    FastLocationInferenceRequest,
    FastGAIAInferenceRequest,
    GAIAQuadraticInferenceRequest,
    GAIALinearInferenceRequest,
    MidpointInferenceRequest,
    SpargInferenceRequest,
    TsdateInferenceRequest,
    CustomLocationRequest,
    SimplifyTreeSequenceRequest,
)
from argscape.api.constants import (
    LARGE_TREE_SEQUENCE_NODE_THRESHOLD,
    SPATIAL_CHECK_NODE_LIMIT,
    RAILWAY_INFERENCE_TIMEOUT_SECONDS,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Availability flags (will be set by main app)
FASTGAIA_AVAILABLE = False
GEOANCESTRY_AVAILABLE = False
MIDPOINT_AVAILABLE = False
SPARG_AVAILABLE = False
TSDATE_AVAILABLE = False
DISABLE_TSDATE = False

def set_availability_flags(fastgaia, geoancestry, midpoint, sparg, tsdate, disable_tsdate):
    """Set availability flags from main app initialization."""
    global FASTGAIA_AVAILABLE, GEOANCESTRY_AVAILABLE, MIDPOINT_AVAILABLE, SPARG_AVAILABLE, TSDATE_AVAILABLE, DISABLE_TSDATE
    FASTGAIA_AVAILABLE = fastgaia
    GEOANCESTRY_AVAILABLE = geoancestry
    MIDPOINT_AVAILABLE = midpoint
    SPARG_AVAILABLE = sparg
    TSDATE_AVAILABLE = tsdate
    DISABLE_TSDATE = disable_tsdate

@router.post("/infer-locations-fast")
async def infer_locations_fast(request: Request, inference_request: FastLocationInferenceRequest):
    """Infer locations using the fastgaia package for fast spatial inference."""
    if not FASTGAIA_AVAILABLE:
        raise HTTPException(status_code=503, detail="fastgaia not available")
    
    logger.info(f"Received fast location inference request for file: {inference_request.filename}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, inference_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if running on Railway
    # Also check for FORCE_RAILWAY_MODE or USE_RAILWAY_FRONTEND for local testing
    is_railway = (
        os.getenv("RAILWAY_ENVIRONMENT") is not None or 
        os.getenv("RAILWAY_PROJECT_ID") is not None or
        os.getenv("FORCE_RAILWAY_MODE", "").lower() in ("true", "1", "yes") or
        os.getenv("USE_RAILWAY_FRONTEND", "").lower() in ("true", "1", "yes")
    )
    
    async def run_inference():
        """Run inference in executor for timeout handling."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: run_fastgaia_inference(
                ts,
                weight_span=inference_request.weight_span,
                weight_branch_length=inference_request.weight_branch_length
            )
        )
    
    try:
        # Run fastgaia inference with timeout on Railway
        if is_railway:
            try:
                ts_with_locations, inference_info = await asyncio.wait_for(
                    run_inference(),
                    timeout=RAILWAY_INFERENCE_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                logger.warning(f"Fast location inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds on Railway")
                raise HTTPException(
                    status_code=504,
                    detail=f"Spatial inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds. For larger ARGs, please install ARGscape locally."
                )
        else:
            ts_with_locations, inference_info = await run_inference()
        
        # Generate new filename
        new_filename = f"{inference_request.filename.rsplit('.', 1)[0]}_fastgaia.trees"
        
        # Store the result
        session_storage.store_tree_sequence(session_id, new_filename, ts_with_locations)
        
        # Check spatial completeness
        spatial_info = check_spatial_completeness(ts_with_locations)
        
        return {
            "status": "success",
            "message": "Fast location inference completed successfully",
            "original_filename": inference_request.filename,
            "new_filename": new_filename,
            "num_nodes": ts_with_locations.num_nodes,
            "num_samples": ts_with_locations.num_samples,
            **spatial_info,
            **inference_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during fast location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/infer-locations-gaia")
async def infer_locations_gaia(request: Request, inference_request: FastGAIAInferenceRequest):
    """Infer locations using the GAIA R package for high-accuracy spatial inference."""
    if infer_locations_with_gaia is None or not check_gaia_availability():
        raise HTTPException(status_code=503, detail="GAIA not available")
    
    logger.info(f"Received GAIA location inference request for file: {inference_request.filename}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, inference_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if tree sequence has sample locations
    spatial_info = check_spatial_completeness(ts)
    if not spatial_info.get("has_sample_spatial", False):
        raise HTTPException(
            status_code=400, 
            detail="GAIA requires tree sequences with location data for all sample nodes"
        )
    
    try:
        logger.info(f"Running GAIA inference for {ts.num_nodes} nodes...")
        
        # Run GAIA inference
        ts_with_locations, inference_info = infer_locations_with_gaia(ts, inference_request.filename)
        
        # Store the result with new filename
        new_filename = inference_info["new_filename"]
        session_storage.store_tree_sequence(session_id, new_filename, ts_with_locations)
        
        # Update spatial info for the new tree sequence
        updated_spatial_info = check_spatial_completeness(ts_with_locations)
        
        return {
            "status": "success",
            "message": "GAIA location inference completed successfully",
            **inference_info,
            **updated_spatial_info
        }
        
    except Exception as e:
        logger.error(f"Error during GAIA location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"GAIA location inference failed: {str(e)}")


@router.post("/infer-locations-gaia-quadratic")
async def infer_locations_gaia_quadratic(request: Request, inference_request: GAIAQuadraticInferenceRequest):
    """Infer locations using the GAIA quadratic parsimony algorithm (geoancestry package)."""
    if not GEOANCESTRY_AVAILABLE:
        raise HTTPException(status_code=503, detail="gaiapy package not available")
    
    logger.info(f"Received GAIA quadratic location inference request for file: {inference_request.filename}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, inference_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if tree sequence has sample locations
    spatial_info = check_spatial_completeness(ts)
    if not spatial_info.get("has_sample_spatial", False):
        raise HTTPException(
            status_code=400, 
            detail="GAIA quadratic inference requires tree sequences with location data for all sample nodes"
        )
    
    # Check if running on Railway
    # Also check for FORCE_RAILWAY_MODE or USE_RAILWAY_FRONTEND for local testing
    is_railway = (
        os.getenv("RAILWAY_ENVIRONMENT") is not None or 
        os.getenv("RAILWAY_PROJECT_ID") is not None or
        os.getenv("FORCE_RAILWAY_MODE", "").lower() in ("true", "1", "yes") or
        os.getenv("USE_RAILWAY_FRONTEND", "").lower() in ("true", "1", "yes")
    )
    
    async def run_inference():
        """Run inference in executor for timeout handling."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: run_gaia_quadratic_inference(ts))
    
    try:
        # Run GAIA quadratic inference with timeout on Railway
        if is_railway:
            try:
                ts_with_locations, inference_info = await asyncio.wait_for(
                    run_inference(),
                    timeout=RAILWAY_INFERENCE_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                logger.warning(f"GAIA quadratic inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds on Railway")
                raise HTTPException(
                    status_code=504,
                    detail=f"Spatial inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds. For larger ARGs, please install ARGscape locally."
                )
        else:
            ts_with_locations, inference_info = await run_inference()
        
        # Generate new filename
        base_filename = inference_request.filename
        if base_filename.endswith('.trees'):
            new_filename = base_filename[:-6] + '_gaia_quad.trees'
        elif base_filename.endswith('.tsz'):
            new_filename = base_filename[:-4] + '_gaia_quad.tsz'
        else:
            new_filename = base_filename + '_gaia_quad.trees'
        
        # Store the result
        session_storage.store_tree_sequence(session_id, new_filename, ts_with_locations)
        
        # Update spatial info for the new tree sequence
        updated_spatial_info = check_spatial_completeness(ts_with_locations)
        
        logger.info(f"GAIA quadratic inference completed successfully: {new_filename}")
        
        return {
            "status": "success",
            "message": "GAIA quadratic location inference completed successfully",
            "new_filename": new_filename,
            **inference_info,
            **updated_spatial_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during GAIA quadratic location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"GAIA quadratic location inference failed: {str(e)}")


@router.post("/infer-locations-gaia-linear")
async def infer_locations_gaia_linear(request: Request, inference_request: GAIALinearInferenceRequest):
    """Infer locations using the GAIA linear parsimony algorithm (geoancestry package)."""
    if not GEOANCESTRY_AVAILABLE:
        raise HTTPException(status_code=503, detail="gaiapy package not available")
    
    logger.info(f"Received GAIA linear location inference request for file: {inference_request.filename}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, inference_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if tree sequence has sample locations
    spatial_info = check_spatial_completeness(ts)
    if not spatial_info.get("has_sample_spatial", False):
        raise HTTPException(
            status_code=400, 
            detail="GAIA linear inference requires tree sequences with location data for all sample nodes"
        )
    
    # Check if running on Railway
    # Also check for FORCE_RAILWAY_MODE or USE_RAILWAY_FRONTEND for local testing
    is_railway = (
        os.getenv("RAILWAY_ENVIRONMENT") is not None or 
        os.getenv("RAILWAY_PROJECT_ID") is not None or
        os.getenv("FORCE_RAILWAY_MODE", "").lower() in ("true", "1", "yes") or
        os.getenv("USE_RAILWAY_FRONTEND", "").lower() in ("true", "1", "yes")
    )
    
    async def run_inference():
        """Run inference in executor for timeout handling."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: run_gaia_linear_inference(ts))
    
    try:
        # Run GAIA linear inference with timeout on Railway
        if is_railway:
            try:
                ts_with_locations, inference_info = await asyncio.wait_for(
                    run_inference(),
                    timeout=RAILWAY_INFERENCE_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                logger.warning(f"GAIA linear inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds on Railway")
                raise HTTPException(
                    status_code=504,
                    detail=f"Spatial inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds. For larger ARGs, please install ARGscape locally."
                )
        else:
            ts_with_locations, inference_info = await run_inference()
        
        # Generate new filename
        base_filename = inference_request.filename
        if base_filename.endswith('.trees'):
            new_filename = base_filename[:-6] + '_gaia_linear.trees'
        elif base_filename.endswith('.tsz'):
            new_filename = base_filename[:-4] + '_gaia_linear.tsz'
        else:
            new_filename = base_filename + '_gaia_linear.trees'
        
        # Store the result
        session_storage.store_tree_sequence(session_id, new_filename, ts_with_locations)
        
        # Update spatial info for the new tree sequence
        updated_spatial_info = check_spatial_completeness(ts_with_locations)
        
        logger.info(f"GAIA linear inference completed successfully: {new_filename}")
        
        return {
            "status": "success",
            "message": "GAIA linear location inference completed successfully",
            "new_filename": new_filename,
            **inference_info,
            **updated_spatial_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during GAIA linear location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"GAIA linear location inference failed: {str(e)}")


@router.post("/infer-locations-midpoint")
async def infer_locations_midpoint(request: Request, inference_request: MidpointInferenceRequest):
    """Infer locations using weighted midpoint method."""
    if not MIDPOINT_AVAILABLE:
        raise HTTPException(status_code=503, detail="Midpoint inference not available")
    
    logger.info(f"Received midpoint location inference request for file: {inference_request.filename}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, inference_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if tree sequence has sample locations
    spatial_info = check_spatial_completeness(ts)
    if not spatial_info.get("has_sample_spatial", False):
        raise HTTPException(
            status_code=400, 
            detail="Midpoint inference requires tree sequences with location data for all sample nodes"
        )
    
    # Check if running on Railway
    # Also check for FORCE_RAILWAY_MODE or USE_RAILWAY_FRONTEND for local testing
    is_railway = (
        os.getenv("RAILWAY_ENVIRONMENT") is not None or 
        os.getenv("RAILWAY_PROJECT_ID") is not None or
        os.getenv("FORCE_RAILWAY_MODE", "").lower() in ("true", "1", "yes") or
        os.getenv("USE_RAILWAY_FRONTEND", "").lower() in ("true", "1", "yes")
    )
    
    async def run_inference():
        """Run inference in executor for timeout handling."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: run_midpoint_inference(ts))
    
    try:
        # Run midpoint inference with timeout on Railway
        if is_railway:
            try:
                ts_with_locations, inference_info = await asyncio.wait_for(
                    run_inference(),
                    timeout=RAILWAY_INFERENCE_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                logger.warning(f"Midpoint inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds on Railway")
                raise HTTPException(
                    status_code=504,
                    detail=f"Spatial inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds. For larger ARGs, please install ARGscape locally."
                )
        else:
            ts_with_locations, inference_info = await run_inference()
        
        # Generate new filename
        base_filename = inference_request.filename
        if base_filename.endswith('.trees'):
            new_filename = base_filename[:-6] + '_midpoint.trees'
        elif base_filename.endswith('.tsz'):
            new_filename = base_filename[:-4] + '_midpoint.tsz'
        else:
            new_filename = base_filename + '_midpoint.trees'
        
        # Store the result
        session_storage.store_tree_sequence(session_id, new_filename, ts_with_locations)
        
        # Update spatial info for the new tree sequence
        updated_spatial_info = check_spatial_completeness(ts_with_locations)
        
        logger.info(f"Midpoint inference completed successfully: {new_filename}")
        
        return {
            "status": "success",
            "message": "Midpoint location inference completed successfully",
            "new_filename": new_filename,
            **inference_info,
            **updated_spatial_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during midpoint location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Midpoint location inference failed: {str(e)}")


@router.post("/upload-location-csv")
async def upload_location_csv(request: Request, csv_type: str, file: UploadFile = File(...)):
    """Upload CSV files containing node locations."""
    if csv_type not in ["sample_locations", "node_locations"]:
        raise HTTPException(status_code=400, detail="csv_type must be 'sample_locations' or 'node_locations'")
    
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")
    
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Validate CSV format by parsing it
        try:
            locations = parse_location_csv(contents, file.filename)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Store the CSV file in session storage
        csv_filename = f"{csv_type}_{file.filename}"
        session_storage.store_file(session_id, csv_filename, contents)
        
        logger.info(f"Uploaded {csv_type} CSV: {file.filename} with {len(locations)} locations")
        
        return {
            "status": "success",
            "csv_type": csv_type,
            "filename": csv_filename,
            "original_filename": file.filename,
            "location_count": len(locations),
            "node_ids": sorted(locations.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading location CSV {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload CSV: {str(e)}")


@router.post("/update-tree-sequence-locations")
async def update_tree_sequence_locations(request: Request, location_request: CustomLocationRequest):
    """Update tree sequence with custom locations from CSV files."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        # Load the original tree sequence
        ts = session_storage.get_tree_sequence(session_id, location_request.tree_sequence_filename)
        if ts is None:
            raise HTTPException(status_code=404, detail="Tree sequence not found")
        
        # Load and parse sample locations CSV
        sample_csv_data = session_storage.get_file_data(session_id, location_request.sample_locations_filename)
        if sample_csv_data is None:
            raise HTTPException(status_code=404, detail="Sample locations CSV not found")
        
        # Load and parse node locations CSV
        node_csv_data = session_storage.get_file_data(session_id, location_request.node_locations_filename)
        if node_csv_data is None:
            raise HTTPException(status_code=404, detail="Node locations CSV not found")
        
        try:
            sample_locations = parse_location_csv(sample_csv_data, location_request.sample_locations_filename)
            node_locations = parse_location_csv(node_csv_data, location_request.node_locations_filename)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Apply custom locations to tree sequence
        try:
            updated_ts = apply_custom_locations_to_tree_sequence(ts, sample_locations, node_locations)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Generate new filename with suffix
        base_filename = location_request.tree_sequence_filename
        if base_filename.endswith('.trees'):
            new_filename = base_filename[:-6] + '_custom_xy.trees'
        elif base_filename.endswith('.tsz'):
            new_filename = base_filename[:-4] + '_custom_xy.tsz'
        else:
            new_filename = base_filename + '_custom_xy.trees'
        
        # Calculate response data before cleanup
        non_sample_node_ids = set(node.id for node in ts.nodes() if not node.is_sample())
        node_locations_applied_count = len(set(node_locations.keys()) & non_sample_node_ids)
        sample_locations_applied_count = len(sample_locations)
        
        # Store the updated tree sequence
        session_storage.store_tree_sequence(session_id, new_filename, updated_ts)
        
        # Clean up CSV files
        session_storage.delete_file(session_id, location_request.sample_locations_filename)
        session_storage.delete_file(session_id, location_request.node_locations_filename)
        
        # Clean up large dictionaries to free memory
        del sample_locations
        del node_locations
        
        # Check spatial completeness (simplified for large tree sequences)
        if updated_ts.num_nodes > LARGE_TREE_SEQUENCE_NODE_THRESHOLD:
            # For large tree sequences, assume spatial completeness based on our work
            spatial_info = {
                "has_sample_spatial": True,
                "has_all_spatial": True,
                "spatial_status": "all"
            }
            logger.info("Skipping detailed spatial check for large tree sequence")
        else:
            spatial_info = check_spatial_completeness(updated_ts)
        
        # Quick temporal check (limit to first few non-sample nodes)
        has_temporal = False
        non_sample_count = 0
        for node in updated_ts.nodes():
            if not (node.flags & tskit.NODE_IS_SAMPLE):
                if node.time != 0:
                    has_temporal = True
                    break
                non_sample_count += 1
                if non_sample_count > SPATIAL_CHECK_NODE_LIMIT:  # Check only first few non-sample nodes
                    break
        
        logger.info(f"Successfully updated tree sequence with custom locations: {new_filename}")
        
        response_data = {
            "status": "success",
            "original_filename": location_request.tree_sequence_filename,
            "new_filename": new_filename,
            "num_nodes": updated_ts.num_nodes,
            "num_edges": updated_ts.num_edges,
            "num_samples": updated_ts.num_samples,
            "num_trees": updated_ts.num_trees,
            "has_temporal": has_temporal,
            "sample_locations_applied": sample_locations_applied_count,
            "node_locations_applied": node_locations_applied_count,
            **spatial_info
        }
        
        logger.info(f"Returning response for {new_filename}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating tree sequence with custom locations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update tree sequence: {str(e)}")


@router.post("/infer-locations-sparg")
async def infer_locations_sparg(request: Request, inference_request: SpargInferenceRequest):
    """Infer locations using the sparg package."""
    if not SPARG_AVAILABLE:
        raise HTTPException(status_code=503, detail="sparg not available")
    
    logger.info(f"Received sparg location inference request for file: {inference_request.filename}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, inference_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if tree sequence has sample locations
    spatial_info = check_spatial_completeness(ts)
    if not spatial_info.get("has_sample_spatial", False):
        raise HTTPException(
            status_code=400, 
            detail="sparg requires tree sequences with location data for all sample nodes"
        )
    
    # Check if running on Railway
    # Also check for FORCE_RAILWAY_MODE or USE_RAILWAY_FRONTEND for local testing
    is_railway = (
        os.getenv("RAILWAY_ENVIRONMENT") is not None or 
        os.getenv("RAILWAY_PROJECT_ID") is not None or
        os.getenv("FORCE_RAILWAY_MODE", "").lower() in ("true", "1", "yes") or
        os.getenv("USE_RAILWAY_FRONTEND", "").lower() in ("true", "1", "yes")
    )
    
    async def run_inference():
        """Run inference in executor for timeout handling."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, lambda: run_sparg_inference(ts))
    
    try:
        # Run sparg inference with timeout on Railway
        if is_railway:
            try:
                ts_with_locations, inference_info = await asyncio.wait_for(
                    run_inference(),
                    timeout=RAILWAY_INFERENCE_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                logger.warning(f"sparg inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds on Railway")
                raise HTTPException(
                    status_code=504,
                    detail=f"Spatial inference timed out after {RAILWAY_INFERENCE_TIMEOUT_SECONDS} seconds. For larger ARGs, please install ARGscape locally."
                )
        else:
            ts_with_locations, inference_info = await run_inference()
        
        # Generate new filename
        base_filename = inference_request.filename
        if base_filename.endswith('.trees'):
            new_filename = base_filename[:-6] + '_sparg.trees'
        elif base_filename.endswith('.tsz'):
            new_filename = base_filename[:-4] + '_sparg.tsz'
        else:
            new_filename = base_filename + '_sparg.trees'
        
        # Store the result
        session_storage.store_tree_sequence(session_id, new_filename, ts_with_locations)
        
        # Update spatial info for the new tree sequence
        updated_spatial_info = check_spatial_completeness(ts_with_locations)
        
        logger.info(f"sparg inference completed successfully: {new_filename}")
        
        return {
            "status": "success",
            "message": "sparg location inference completed successfully",
            "new_filename": new_filename,
            **inference_info,
            **updated_spatial_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during sparg inference: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/infer-times-tsdate")
async def infer_times_tsdate(request: Request, inference_request: TsdateInferenceRequest):
    """Infer node times using tsdate."""
    if DISABLE_TSDATE:
        raise HTTPException(status_code=503, detail="Temporal inference is disabled. Set DISABLE_TSDATE=0 to enable.")
    
    if not TSDATE_AVAILABLE:
        raise HTTPException(status_code=503, detail="tsdate package is not available")
    
    logger.info(f"Received tsdate temporal inference request for file: {inference_request.filename}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, inference_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Run tsdate inference
        ts_with_times, inference_info = run_tsdate_inference(
            ts,
            mutation_rate=inference_request.mutation_rate,
            progress=True,
            preprocess=inference_request.preprocess,
            remove_telomeres=inference_request.remove_telomeres,
            minimum_gap=inference_request.minimum_gap,
            split_disjoint=inference_request.split_disjoint,
            filter_populations=inference_request.filter_populations,
            filter_individuals=inference_request.filter_individuals,
            filter_sites=inference_request.filter_sites
        )
        
        # Generate new filename
        base_filename = inference_request.filename
        if base_filename.endswith('.trees'):
            new_filename = base_filename[:-6] + '_tsdate.trees'
        elif base_filename.endswith('.tsz'):
            new_filename = base_filename[:-4] + '_tsdate.tsz'
        else:
            new_filename = base_filename + '_tsdate.trees'
        
        # Store the result
        session_storage.store_tree_sequence(session_id, new_filename, ts_with_times)
        
        # Get temporal info for the new tree sequence
        has_temporal = True  # tsdate always adds temporal info
        
        logger.info(f"tsdate inference completed successfully: {new_filename}")
        
        return {
            "status": "success",
            "message": "tsdate temporal inference completed successfully",
            "new_filename": new_filename,
            "has_temporal": has_temporal,
            **inference_info
        }
        
    except ValueError as e:
        logger.warning(f"tsdate validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Error during tsdate temporal inference", exc_info=True)
        raise HTTPException(status_code=500, detail=f"tsdate temporal inference failed: {str(e)}")

@router.post("/simplify-tree-sequence")
async def simplify_tree_sequence(request: Request, simplify_request: SimplifyTreeSequenceRequest):
    """Simplify tree sequence using tskit's simplify function."""
    logger.info(f"Received simplify request for file: {simplify_request.filename}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, simplify_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Prepare samples list - if not provided, use all samples
        samples = simplify_request.samples
        if samples is None:
            samples = ts.samples()
        else:
            # Convert to numpy array and validate
            samples = np.array(samples, dtype=np.int32)
            # Validate that all samples are valid node IDs
            if not all(0 <= s < ts.num_nodes for s in samples):
                raise HTTPException(status_code=400, detail="Invalid sample node IDs provided")
        
        logger.info(f"Simplifying with {len(samples)} samples")
        
        # Run simplification
        new_ts = ts.simplify(
            samples=samples,
            map_nodes=simplify_request.map_nodes,
            reduce_to_site_topology=simplify_request.reduce_to_site_topology,
            filter_populations=simplify_request.filter_populations,
            filter_individuals=simplify_request.filter_individuals,
            filter_sites=simplify_request.filter_sites,
            filter_nodes=simplify_request.filter_nodes,
            update_sample_flags=simplify_request.update_sample_flags,
            keep_unary=simplify_request.keep_unary,
            keep_unary_in_individuals=simplify_request.keep_unary_in_individuals,
            keep_input_roots=simplify_request.keep_input_roots,
            record_provenance=simplify_request.record_provenance
        )
        
        # Check spatial completeness of the simplified tree sequence
        spatial_info = check_spatial_completeness(new_ts)
        has_sample_spatial = spatial_info["has_sample_spatial"]
        has_all_spatial = spatial_info["has_all_spatial"]
        spatial_status = spatial_info["spatial_status"]
        
        # Generate new filename
        base_filename = simplify_request.filename
        if base_filename.endswith('.trees'):
            new_filename = base_filename[:-6] + '_simplified.trees'
        elif base_filename.endswith('.tsz'):
            new_filename = base_filename[:-4] + '_simplified.tsz'
        else:
            new_filename = base_filename + '_simplified.trees'
        
        # Store the simplified tree sequence
        session_storage.store_tree_sequence(session_id, new_filename, new_ts)
        
        # Check if mutations are present
        has_mutations = bool(new_ts.num_mutations > 0)
        has_temporal = bool(np.any(new_ts.nodes_time > 0))
        
        logger.info(f"Simplification completed: {new_ts.num_samples} samples, {new_ts.num_nodes} nodes")
        
        # Return results with full metadata
        return {
            "status": "success",
            "message": "Tree sequence simplified successfully",
            "new_filename": new_filename,
            "num_samples": int(new_ts.num_samples),
            "num_nodes": int(new_ts.num_nodes),
            "num_edges": int(new_ts.num_edges),
            "num_trees": int(new_ts.num_trees),
            "num_mutations": int(new_ts.num_mutations),
            "has_temporal": has_temporal,
            "has_sample_spatial": bool(has_sample_spatial),
            "has_all_spatial": bool(has_all_spatial),
            "spatial_status": spatial_status,
            "has_mutations": has_mutations,
            "original_samples": int(ts.num_samples),
            "original_nodes": int(ts.num_nodes),
            "samples_simplified": int(len(samples))
        }
        
    except Exception as e:
        logger.error(f"Tree sequence simplification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Tree sequence simplification failed: {str(e)}")

