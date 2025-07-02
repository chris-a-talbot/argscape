"""
ARGscape API - FastAPI Backend
Main API endpoints for tree sequence visualization and analysis
"""

import logging
import os
import tempfile
import time
import re
from typing import Dict, Optional
from datetime import datetime

import numpy as np
import tskit
import tszip
import uvicorn
import msprime
from fastapi import FastAPI, File, HTTPException, UploadFile, Request, BackgroundTasks, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from argscape.backend.tskit_utils import load_tree_sequence_from_file
from pathlib import Path

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Development storage setup for Windows
try:
    from argscape.backend.dev_storage_override import ensure_dev_storage_dir
    ensure_dev_storage_dir()
except ImportError:
    pass  # File doesn't exist, that's fine

# Try to import optional dependencies
try:
    from fastgaia import infer_locations
    logger.info("fastgaia successfully imported")
except ImportError:
    infer_locations = None
    logger.warning("fastgaia not available - fast location inference disabled")

# Import sparg utilities
try:
    from argscape.backend.sparg_inference import run_sparg_inference, SPARG_AVAILABLE
    logger.info("sparg successfully imported")
except ImportError:
    run_sparg_inference = None
    SPARG_AVAILABLE = False
    logger.warning("sparg not available - sparg inference disabled")

# Import geoancestry (gaiapy) utilities
try:
    import gaiapy as gp
    logger.info("gaiapy successfully imported")
    GEOANCESTRY_AVAILABLE = True
except ImportError:
    gp = None
    logger.warning("gaiapy not available - GAIA quadratic location inference disabled")
    GEOANCESTRY_AVAILABLE = False

# Spatial generation utilities
from argscape.backend.spatial_generation import generate_spatial_locations_for_samples
logger.info("Spatial location generation utilities successfully imported")

# Session storage utilities
try:
    from argscape.backend.session_storage import session_storage
    logger.info("Session storage utilities successfully imported")
except ImportError:
    logger.warning("Session storage utilities not available - session storage disabled")

# Geographic utilities
try:
    from argscape.backend.geo_utils import (
        get_builtin_shapes,
        process_shapefile,
        generate_grid_outline,
        validate_coordinates_in_shape,
        transform_coordinates,
        check_spatial_completeness,
        apply_inferred_locations_to_tree_sequence,
        apply_gaia_quadratic_locations_to_tree_sequence,
        apply_custom_locations_to_tree_sequence,
        parse_location_csv
    )
    from argscape.backend.geo_utils.crs import BUILTIN_CRS
    logger.info("Geographic utilities successfully imported")
except ImportError as e:
    logger.warning(f"Geographic utilities not available - geographic utilities disabled: {str(e)}")
    raise  # Re-raise to see the full error during development

# Import constants and utilities
from argscape.backend.constants import (
    DEFAULT_API_VERSION,
    REQUEST_TIMEOUT_SECONDS,
    FILENAME_TIMESTAMP_PRECISION_MICROSECONDS,
    MAX_SAMPLES_FOR_PERFORMANCE,
    MAX_LOCAL_TREES_FOR_PERFORMANCE,
    MAX_TIME_FOR_PERFORMANCE,
    MINIMUM_SAMPLES_REQUIRED,
    LARGE_TREE_SEQUENCE_NODE_THRESHOLD,
    SPATIAL_CHECK_NODE_LIMIT,
    DEFAULT_MAX_SAMPLES_FOR_GRAPH,
    RECOMBINATION_RATE_HIGH,
    VALIDATION_PERCENTAGE_MULTIPLIER,
    RATE_LIMIT_SESSION_CREATE,
)

# Import location inference functionality
try:
    from argscape.backend.location_inference import (
        run_fastgaia_inference,
        run_gaia_quadratic_inference,
        run_gaia_linear_inference,
        run_midpoint_inference,
        FASTGAIA_AVAILABLE,
        GEOANCESTRY_AVAILABLE,
        MIDPOINT_AVAILABLE
    )
    logger.info("Location inference utilities successfully imported")
except ImportError as e:
    logger.warning(f"Location inference utilities not available: {str(e)}")
    FASTGAIA_AVAILABLE = False
    GEOANCESTRY_AVAILABLE = False
    MIDPOINT_AVAILABLE = False

# Import graph utilities
from argscape.backend.graph_utils import convert_tree_sequence_to_graph_data

# Import temporal inference functionality - disabled by DISABLE_TSDATE env var
DISABLE_TSDATE = os.getenv("DISABLE_TSDATE", "0").lower() in ("1", "true", "yes")
if not DISABLE_TSDATE:
    from argscape.backend.temporal_inference import (
        run_tsdate_inference,
        check_mutations_present,
        TSDATE_AVAILABLE
    )
    logger.info("Temporal inference utilities successfully imported")
else:
    run_tsdate_inference = None
    check_mutations_present = None
    TSDATE_AVAILABLE = False
    logger.info("Temporal inference disabled by configuration")

# FastAPI app instance
app = FastAPI(
    title="ARGscape API",
    description="API for interactive ARG visualization and analysis",
    version=DEFAULT_API_VERSION
)

# CORS middleware - make it more permissive for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a separate router for API endpoints
api_router = APIRouter(prefix="/api")

# Pydantic models
class FastLocationInferenceRequest(BaseModel):
    filename: str
    weight_span: bool = True
    weight_branch_length: bool = True

class FastGAIAInferenceRequest(BaseModel):
    filename: str

class GAIAQuadraticInferenceRequest(BaseModel):
    filename: str

class GAIALinearInferenceRequest(BaseModel):
    filename: str

class SimulationRequest(BaseModel):
    num_samples: int = 50
    sequence_length: int = 1_000_000  # in base pairs
    max_time: int = 20
    population_size: Optional[int] = None
    random_seed: Optional[int] = None
    model: str = "dtwf"
    filename_prefix: str = "simulated"
    crs: Optional[str] = "unit_grid"  # Coordinate reference system for simulation
    mutation_rate: Optional[float] = 1e-8  # Mutation rate for simulation
    recombination_rate: Optional[float] = 1e-8  # Recombination rate for simulation

class CoordinateTransformRequest(BaseModel):
    filename: str
    source_crs: str
    target_crs: str

class SpatialValidationRequest(BaseModel):
    filename: str
    shape_name: Optional[str] = None  # Built-in shape name
    shape_data: Optional[Dict] = None  # Custom shape data

class CustomLocationRequest(BaseModel):
    tree_sequence_filename: str
    sample_locations_filename: str
    node_locations_filename: str

class MidpointInferenceRequest(BaseModel):
    filename: str

class SpargInferenceRequest(BaseModel):
    filename: str

class TsdateInferenceRequest(BaseModel):
    filename: str
    mutation_rate: float = 1e-8
    preprocess: bool = True
    remove_telomeres: bool = False
    minimum_gap: Optional[float] = None
    split_disjoint: bool = True
    filter_populations: bool = False
    filter_individuals: bool = False
    filter_sites: bool = False

#### Utility functions ####

def get_client_ip(request: Request) -> str:
    """Get client IP from request, handling various proxy scenarios."""
    # Try X-Forwarded-For first (standard proxy header)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Get the first IP in the chain
        return forwarded_for.split(",")[0].strip()
    
    # Try X-Real-IP (used by some proxies)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fall back to direct client IP
    client_host = request.client.host if request.client else "127.0.0.1"
    return client_host

#### API endpoints ####

@app.middleware("http")
async def remove_double_slash_middleware(request: Request, call_next):
    scope = request.scope
    if "//" in scope["path"]:
        scope["path"] = scope["path"].replace("//", "/")
    return await call_next(request)


print("🔥 MAIN BACKEND FILE LOADED")
print("🔥 APP INSTANCE:", app)

@api_router.get("/")
async def api_root():
    """API root endpoint."""
    return {
        "status": "ok",
        "version": DEFAULT_API_VERSION,
        "endpoints": {
            "session_storage": "ok",
            "location_inference": {
                "fastgaia": FASTGAIA_AVAILABLE,
                "geoancestry": GEOANCESTRY_AVAILABLE,
                "midpoint": MIDPOINT_AVAILABLE,
                "sparg": SPARG_AVAILABLE
            }
        }
    }

@api_router.get("/health")
async def health_check():
    """Basic health check to verify backend is running."""
    return {
        "status": "healthy",
        "message": "Backend is running"
    }


@api_router.get("/download-environment")
async def download_environment_file():
    """Download the environment.yml file for local installation"""
    try:
        # Try multiple locations for the environment.yml file
        current_dir = Path(__file__).parent
        possible_paths = [
            current_dir / "environment.yml",  # Direct relative path
            current_dir.parent / "backend" / "environment.yml",  # If running from argscape root
            Path.cwd() / "argscape" / "backend" / "environment.yml",  # Development setup
        ]
        
        logger.info(f"Looking for environment.yml file. Current dir: {current_dir}")
        logger.info(f"Checking paths: {[str(p) for p in possible_paths]}")
        
        environment_file = None
        for path in possible_paths:
            logger.info(f"Checking path: {path}, exists: {path.exists()}")
            if path.exists():
                environment_file = path
                logger.info(f"Found environment.yml at: {environment_file}")
                break
        
        if environment_file is None:
            logger.warning(f"Environment file not found in any of the expected locations: {[str(p) for p in possible_paths]}")
            # Instead of failing, redirect to GitHub
            github_url = "https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/argscape/backend/environment.yml"
            logger.info(f"Redirecting to GitHub: {github_url}")
            return RedirectResponse(url=github_url)
        
        logger.info(f"Serving environment.yml from: {environment_file}")
        
        # Return the file as a response
        return FileResponse(
            path=str(environment_file),
            filename="environment.yml",
            media_type="text/yaml"
        )
    except Exception as e:
        logger.error(f"Failed to serve environment.yml: {str(e)}", exc_info=True)
        # Fallback to GitHub redirect
        github_url = "https://raw.githubusercontent.com/chris-a-talbot/argscape/dev/argscape/backend/environment.yml"
        logger.info(f"Falling back to GitHub redirect: {github_url}")
        return RedirectResponse(url=github_url)


@api_router.get("/debug/geoancestry-status")
async def debug_geoancestry_status():
    """Debug endpoint to check geoancestry availability."""
    import sys
    import subprocess
    
    try:
        import gaiapy as gp_debug
        geoancestry_info = {
            "gaiapy_available": True,
            "GEOANCESTRY_AVAILABLE": GEOANCESTRY_AVAILABLE,
            "gp_is_none": gp is None,
            "gaiapy_version": getattr(gp_debug, '__version__', 'unknown'),
            "available_functions": [func for func in dir(gp_debug) if not func.startswith('_')],
        }
    except ImportError as e:
        geoancestry_info = {
            "gaiapy_available": False,
            "GEOANCESTRY_AVAILABLE": GEOANCESTRY_AVAILABLE,
            "gp_is_none": gp is None,
            "import_error": str(e),
        }
    
    # Get pip list to see if geoancestry is installed
    try:
        pip_result = subprocess.run([sys.executable, "-m", "pip", "list"], 
                                  capture_output=True, text=True, timeout=10)
        pip_packages = pip_result.stdout if pip_result.returncode == 0 else "Error getting pip list"
    except Exception as e:
        pip_packages = f"Error running pip list: {str(e)}"
    
    return {
        **geoancestry_info,
        "python_executable": sys.executable,
        "python_version": sys.version,
        "python_path": sys.path[:5],  # First 5 entries to avoid too much data
        "pip_packages_geoancestry": [line for line in pip_packages.split('\n') if 'geoancestry' in line.lower()] if isinstance(pip_packages, str) else [],
        "current_working_directory": os.getcwd(),
    }


@api_router.post("/create-session")
async def create_session(request: Request):
    """Get or create a persistent session for the client IP."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        stats = session_storage.get_session_stats(session_id)
        
        return {
            "session_id": session_id,
            "message": "Session ready",
            "session_info": stats
        }
    except Exception as e:
        logger.error(f"Error getting/creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")


@api_router.get("/session")
async def get_current_session(request: Request):
    """Get or create the current session for this client IP."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        stats = session_storage.get_session_stats(session_id)
        
        return {
            "session_id": session_id,
            "session_info": stats
        }
    except Exception as e:
        logger.error(f"Error getting current session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")


@api_router.get("/session-stats/{session_id}")
async def get_session_stats(session_id: str):
    """Get statistics for a specific session."""
    stats = session_storage.get_session_stats(session_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    return stats


@api_router.get("/admin/storage-stats")
async def get_storage_stats(request: Request):
    """Get global storage statistics (admin endpoint)."""
    return session_storage.get_global_stats()


@api_router.get("/uploaded-files/")
async def list_uploaded_files_current(request: Request):
    """List uploaded files for current client IP session."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        return {"uploaded_tree_sequences": session_storage.get_file_list(session_id)}
    except Exception as e:
        logger.error(f"Error getting uploaded files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get files: {str(e)}")

#### Tree sequence API endpoints ####

@api_router.post("/upload-tree-sequence")
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
        session_storage.store_tree_sequence(session_id, updated_filename, ts)
        
        has_temporal = any(node.time != 0 for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE == 0)
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
            **spatial_info
        }
    except ValueError as e:
        logger.error(f"Storage error for {file.filename}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to load tree sequence {file.filename}: {str(e)}")
        session_storage.delete_file(session_id, file.filename)
        raise HTTPException(status_code=400, detail=f"Failed to upload: {str(e)}")


@api_router.get("/tree-sequence-metadata/{filename}")
async def get_tree_sequence_metadata(request: Request, filename: str):
    """Get metadata for a tree sequence."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        ts = session_storage.get_tree_sequence(session_id, filename)
        if ts is None:
            raise HTTPException(status_code=404, detail=f"Tree sequence not found")
        
        has_temporal = any(node.time != 0 for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE == 0)
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
            **spatial_info
        }
    except Exception as e:
        logger.error(f"Error getting metadata for {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get metadata: {str(e)}")


@api_router.delete("/tree-sequence/{filename}")
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


@api_router.get("/download-tree-sequence/{filename}")
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


@api_router.get("/graph-data/{filename}")
async def get_graph_data(
    request: Request,
    filename: str, 
    max_samples: int = DEFAULT_MAX_SAMPLES_FOR_GRAPH,
    genomic_start: float = None,
    genomic_end: float = None,
    tree_start_idx: int = None,
    tree_end_idx: int = None,
    sample_order: str = "custom"
):
    """Get graph data for visualization.
    
    Can filter by either:
    - Genomic range: genomic_start and genomic_end
    - Tree index range: tree_start_idx and tree_end_idx (inclusive)
    
    Tree index filtering takes precedence if both are provided.
    """
    logger.info(f"Requesting graph data for file: {filename} with max_samples: {max_samples}")
    
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
        from argscape.backend.graph_utils import convert_to_graph_data, filter_by_tree_indices
        from argscape.backend.sparg import simplify_with_recombination
        
        expected_tree_count = None
        
        # Apply filtering - tree index filtering takes precedence
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
            # Apply genomic filtering if tree index filtering not specified
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
        graph_data = convert_to_graph_data(ts_with_recomb_flags, expected_tree_count, sample_order)
        
        return graph_data
    except Exception as e:
        logger.error(f"Error generating graph data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate graph data: {str(e)}")


@api_router.post("/simulate-tree-sequence/")  # Original version with trailing slash
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
        
        # Log simulation parameters
        logger.info(f"Simulating tree sequence with parameters: {simulation_request.dict()}")
        
        # Simulate the tree sequence
        try:
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
            
            # Generate a unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{simulation_request.filename_prefix}_{timestamp}.trees"
            
            # Store in session (this will handle saving to disk)
            session_storage.store_tree_sequence(session_id, filename, ts)
            logger.info(f"Successfully simulated and saved tree sequence to {filename}")
            
            return {
                "message": "Tree sequence simulated successfully",
                "filename": filename,
                "num_samples": ts.num_samples,
                "num_trees": ts.num_trees,
                "num_mutations": ts.num_mutations if simulation_request.mutation_rate is not None else 0,
                "sequence_length": ts.sequence_length,
                "crs": simulation_request.crs
            }
            
        except Exception as e:
            logger.error(f"Error during tree sequence simulation: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in simulate_tree_sequence: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to simulate tree sequence: {str(e)}")


@api_router.post("/infer-locations-fast")
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
    
    try:
        # Run fastgaia inference
        ts_with_locations, inference_info = run_fastgaia_inference(
            ts,
            weight_span=inference_request.weight_span,
            weight_branch_length=inference_request.weight_branch_length
        )
        
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
        
    except Exception as e:
        logger.error(f"Error during fast location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/infer-locations-gaia")
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


@api_router.post("/infer-locations-gaia-quadratic")
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
    
    try:
        # Run GAIA quadratic inference
        ts_with_locations, inference_info = run_gaia_quadratic_inference(ts)
        
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
        
    except Exception as e:
        logger.error(f"Error during GAIA quadratic location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"GAIA quadratic location inference failed: {str(e)}")


@api_router.post("/infer-locations-gaia-linear")
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
    
    try:
        # Run GAIA linear inference
        ts_with_locations, inference_info = run_gaia_linear_inference(ts)
        
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
        
    except Exception as e:
        logger.error(f"Error during GAIA linear location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"GAIA linear location inference failed: {str(e)}")


@api_router.post("/infer-locations-midpoint")
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
    
    try:
        # Run midpoint inference
        ts_with_locations, inference_info = run_midpoint_inference(ts)
        
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
        
    except Exception as e:
        logger.error(f"Error during midpoint location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Midpoint location inference failed: {str(e)}")


@api_router.post("/upload-location-csv")
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


@api_router.post("/update-tree-sequence-locations")
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


@api_router.post("/infer-locations-sparg")
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
    
    try:
        # Run sparg inference
        ts_with_locations, inference_info = run_sparg_inference(ts)
        
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
        
    except Exception as e:
        logger.error(f"Error during sparg inference: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/infer-times-tsdate")
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

#### Geographic API endpoints ####

@api_router.get("/geographic/crs")
async def get_available_crs():
    """Get list of available coordinate reference systems."""
    return {
        "builtin_crs": {key: crs.to_dict() for key, crs in BUILTIN_CRS.items()}
}


@api_router.get("/geographic/shapes")
async def get_available_shapes():
    """Get list of built-in geographic shapes."""
    try:
        builtin_shapes = get_builtin_shapes()
        return {
            "builtin_shapes": builtin_shapes,
        }
    except Exception as e:
        logger.error(f"Error getting built-in shapes: {e}")
        raise HTTPException(status_code=500, detail=f"Could not get shapes: {str(e)}")


@api_router.post("/geographic/upload-shapefile")
async def upload_shapefile(request: Request, file: UploadFile = File(...)):
    """Upload and process a shapefile."""
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    
    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Process the shapefile
        shape_data = process_shapefile(contents, file.filename)
        
        # Store the shape data in session storage
        # We'll extend session storage to handle shapes later
        shape_id = f"uploaded_{file.filename}_{int(time.time())}"
        
        return {
            "status": "success",
            "shape_id": shape_id,
            "shape_name": shape_data["name"],
            "bounds": shape_data["bounds"],
            "feature_count": shape_data["feature_count"],
            "crs": shape_data["crs"]
        }
        
    except Exception as e:
        logger.error(f"Error uploading shapefile: {e}")
        raise HTTPException(status_code=500, detail=f"Could not process shapefile: {str(e)}")


@api_router.get("/geographic/shape/{shape_name}")
async def get_shape_data(shape_name: str):
    """Get geometric data for a built-in shape."""
    try:
        builtin_shapes = get_builtin_shapes()
        if shape_name in builtin_shapes:
            return builtin_shapes[shape_name]
        elif shape_name == "unit_grid":
            return generate_grid_outline(10)
        else:
            raise HTTPException(status_code=404, detail=f"Shape '{shape_name}' not found")
    except Exception as e:
        logger.error(f"Error getting shape data for {shape_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Could not get shape data: {str(e)}")


@api_router.post("/geographic/transform-coordinates")
async def transform_tree_sequence_coordinates(request: Request, transform_request: CoordinateTransformRequest):
    """Transform coordinates of a tree sequence between CRS."""
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, transform_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Extract coordinates from the tree sequence
        coordinates = []
        node_ids = []
        
        for node in ts.nodes():
            if node.individual != -1:
                individual = ts.individual(node.individual)
                if individual.location is not None and len(individual.location) >= 2:
                    coordinates.append((individual.location[0], individual.location[1]))
                    node_ids.append(node.id)
        
        if not coordinates:
            raise HTTPException(status_code=400, detail="No spatial coordinates found in tree sequence")
        
        # Transform coordinates
        transformed_coords = transform_coordinates(
            coordinates, 
            transform_request.source_crs, 
            transform_request.target_crs
        )
        
        # Create new tree sequence with transformed coordinates
        tables = ts.dump_tables()
        
        # Update individual locations
        coord_map = dict(zip(node_ids, transformed_coords))
        new_individuals = tables.individuals.copy()
        new_individuals.clear()
        
        for individual in ts.individuals():
            if individual.location is not None and len(individual.location) >= 2:
                # Find a node with this individual to get the transformed coordinates
                node_with_individual = None
                for node in ts.nodes():
                    if node.individual == individual.id:
                        node_with_individual = node.id
                        break
                
                if node_with_individual in coord_map:
                    new_x, new_y = coord_map[node_with_individual]
                    new_location = np.array([new_x, new_y] + list(individual.location[2:]))
                else:
                    new_location = individual.location
            else:
                new_location = individual.location
            
            new_individuals.add_row(
                flags=individual.flags,
                location=new_location,
                parents=individual.parents,
                metadata=individual.metadata
            )
        
        tables.individuals.replace_with(new_individuals)
        transformed_ts = tables.tree_sequence()
        
        # Store the transformed tree sequence
        new_filename = f"{transform_request.filename.rsplit('.', 1)[0]}_transformed_{transform_request.target_crs.replace(':', '_')}.trees"
        session_storage.store_tree_sequence(session_id, new_filename, transformed_ts)
        
        return {
            "status": "success",
            "original_filename": transform_request.filename,
            "new_filename": new_filename,
            "source_crs": transform_request.source_crs,
            "target_crs": transform_request.target_crs,
            "transformed_coordinates": len(transformed_coords)
        }
        
    except Exception as e:
        logger.error(f"Error transforming coordinates: {e}")
        raise HTTPException(status_code=500, detail=f"Coordinate transformation failed: {str(e)}")


@api_router.post("/geographic/validate-spatial")
async def validate_spatial_data(request: Request, validation_request: SpatialValidationRequest):
    """Validate that spatial coordinates fall within a given shape."""
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, validation_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Get shape data
        if validation_request.shape_name:
            if validation_request.shape_name == "unit_grid":
                shape_data = generate_grid_outline(10)
            else:
                builtin_shapes = get_builtin_shapes()
                if validation_request.shape_name not in builtin_shapes:
                    raise HTTPException(status_code=404, detail=f"Shape '{validation_request.shape_name}' not found")
                shape_data = builtin_shapes[validation_request.shape_name]
        elif validation_request.shape_data:
            shape_data = validation_request.shape_data
        else:
            raise HTTPException(status_code=400, detail="Must provide either shape_name or shape_data")
        
        # Extract coordinates
        coordinates = []
        for node in ts.nodes():
            if node.individual != -1:
                individual = ts.individual(node.individual)
                if individual.location is not None and len(individual.location) >= 2:
                    coordinates.append((individual.location[0], individual.location[1]))
        
        if not coordinates:
            raise HTTPException(status_code=400, detail="No spatial coordinates found in tree sequence")
        
        # Validate coordinates
        validation_results = validate_coordinates_in_shape(coordinates, shape_data)
        
        valid_count = sum(validation_results)
        total_count = len(validation_results)
        
        return {
            "status": "success",
            "filename": validation_request.filename,
            "shape_name": validation_request.shape_name,
            "total_coordinates": total_count,
            "valid_coordinates": valid_count,
            "invalid_coordinates": total_count - valid_count,
            "validation_percentage": (valid_count / total_count * VALIDATION_PERCENTAGE_MULTIPLIER) if total_count > 0 else 0,
            "all_valid": all(validation_results)
        }
        
    except Exception as e:
        logger.error(f"Error validating spatial data: {e}")
        raise HTTPException(status_code=500, detail=f"Spatial validation failed: {str(e)}")

# Mount the API router FIRST
app.include_router(api_router)

# Mount static files AFTER API router
frontend_dist = Path(__file__).resolve().parent.parent / "frontend_dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
    logger.info(f"Serving frontend from {frontend_dist}")
else:
    logger.warning(f"Frontend build directory not found: {frontend_dist}")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index_path = frontend_dist / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"detail": "index.html not found"}, 404

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)