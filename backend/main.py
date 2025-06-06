# main.py
"""
ARGscape API - FastAPI Backend
Main API endpoints for tree sequence visualization and analysis
"""

import logging
import os
import tempfile
import time
import re
from typing import Dict, List, Optional

import numpy as np
import tskit
import tszip
import uvicorn
import msprime
from fastapi import FastAPI, File, HTTPException, UploadFile, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Development storage setup for Windows
try:
    from dev_storage_override import ensure_dev_storage_dir
    ensure_dev_storage_dir()
except ImportError:
    pass  # File doesn't exist, that's fine

# Try to import optional dependencies
try:
    from fastgaia import infer_locations
    logger.info("fastgaia successfully imported")
except ImportError:
    infer_locations = None
    logger.warning("fastgaia not available - location inference disabled")

# Import GAIA utilities
try:
    from gaia_utils import infer_locations_with_gaia, check_gaia_availability
    logger.info("GAIA utilities successfully imported")
except ImportError:
    infer_locations_with_gaia = None
    check_gaia_availability = lambda: False
    logger.warning("GAIA utilities not available - GAIA inference disabled")

# Import constants and utilities
from constants import (
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
    RATE_LIMIT_UPLOAD,
    RATE_LIMIT_SESSION_CREATE,
    RATE_LIMIT_LOCATION_INFERENCE,
    RATE_LIMIT_SIMULATION,
    RATE_LIMIT_CSV_UPLOAD,
    RATE_LIMIT_LOCATION_UPDATE,
    RATE_LIMIT_STORAGE_STATS,
    RATE_LIMIT_SHAPEFILE_UPLOAD,
    RATE_LIMIT_COORDINATE_TRANSFORM
)

# Import spatial generation utilities
from spatial_generation import generate_spatial_locations_for_samples

# FastAPI app instance
app = FastAPI(
    title="ARGscape API",
    description="API for interactive ARG visualization and tree sequence analysis",
    version=DEFAULT_API_VERSION
)

# Mount static files (frontend)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    # Mount assets directory for Vite build output
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        logger.info(f"Serving assets from {assets_dir}")
    
    # Mount other static files (like vite.svg, favicon, etc.)
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    logger.info(f"Serving static files from {static_dir}")
else:
    logger.warning(f"Static directory not found: {static_dir}")

# Logging already configured above



# Import session-based storage
from session_storage import session_storage

# Import geographic utilities
from geographic_utils import (
    BUILTIN_CRS, 
    get_builtin_shapes,
    process_shapefile,
    transform_coordinates,
    normalize_coordinates_to_unit_space,
    generate_grid_outline,
    validate_coordinates_in_shape,
    detect_coordinate_system,
    get_suggested_geographic_mode,
    GEOSPATIAL_AVAILABLE
)

# CORS middleware (moved here to avoid middleware ordering issues)
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = allowed_origins_str.split(",") if allowed_origins_str != "*" else ["*"]

# If we have specific origins and credentials, we need to be explicit
# If wildcard, we disable credentials for broader compatibility
allow_credentials = allowed_origins != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting disabled for Railway deployment compatibility
class DummyLimiter:
    def limit(self, rate_string):
        def decorator(func):
            return func
        return decorator

limiter = DummyLimiter()

# Pydantic models
class FastLocationInferenceRequest(BaseModel):
    filename: str
    weight_span: bool = True
    weight_branch_length: bool = True

class GAIALocationInferenceRequest(BaseModel):
    filename: str

class SimulationRequest(BaseModel):
    num_samples: int = 50
    num_local_trees: int = 10
    max_time: int = 20
    population_size: Optional[int] = None
    random_seed: Optional[int] = None
    model: str = "dtwf"
    filename_prefix: str = "simulated"
    crs: Optional[str] = "unit_grid"  # Coordinate reference system for simulation

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

# Utility functions
def check_spatial_completeness(ts: tskit.TreeSequence) -> Dict[str, bool]:
    """Check spatial information completeness in tree sequence."""
    logger.info(f"Checking spatial info for {ts.num_individuals} individuals, {ts.num_nodes} nodes")
    
    # Fast path: if no individuals, then no spatial data
    if ts.num_individuals == 0:
        return {
            "has_sample_spatial": False,
            "has_all_spatial": False,
            "spatial_status": "none"
        }
    
    # Check individuals directly instead of iterating through all nodes
    sample_nodes_with_individuals = 0
    sample_nodes_total = 0
    all_nodes_with_individuals = 0
    all_nodes_total = ts.num_nodes
    
    # First pass: count nodes with individuals
    for node in ts.nodes():
        if node.individual != -1:
            all_nodes_with_individuals += 1
            if node.flags & tskit.NODE_IS_SAMPLE:
                sample_nodes_with_individuals += 1
        
        if node.flags & tskit.NODE_IS_SAMPLE:
            sample_nodes_total += 1
    
    # Quick check: if no nodes have individuals, no spatial data
    if all_nodes_with_individuals == 0:
        return {
            "has_sample_spatial": False,
            "has_all_spatial": False,
            "spatial_status": "none"
        }
    
    # Check if individuals actually have valid locations
    sample_has_spatial = True
    all_has_spatial = True
    
    # Only check individuals that actually exist, and do it efficiently
    for individual in ts.individuals():
        has_valid_location = (individual.location is not None and len(individual.location) >= 2)
        
        if not has_valid_location:
            all_has_spatial = False
            # Check if this individual belongs to a sample node
            for node in ts.nodes():
                if node.individual == individual.id and (node.flags & tskit.NODE_IS_SAMPLE):
                    sample_has_spatial = False
                    break
    
    # Final check: if not all sample nodes have individuals, samples don't have spatial
    if sample_nodes_with_individuals < sample_nodes_total:
        sample_has_spatial = False
    
    # If not all nodes have individuals, not all have spatial
    if all_nodes_with_individuals < all_nodes_total:
        all_has_spatial = False
    
    spatial_status = "all" if all_has_spatial else ("sample_only" if sample_has_spatial else "none")
    
    logger.info(f"Spatial check completed: {spatial_status}")
    
    return {
        "has_sample_spatial": sample_has_spatial,
        "has_all_spatial": all_has_spatial,
        "spatial_status": spatial_status
    }

def load_tree_sequence_from_file(contents: bytes, filename: str) -> tskit.TreeSequence:
    """Load tree sequence from file contents."""
    if filename.endswith(".tsz"):
        import io
        with io.BytesIO(contents) as tsz_stream:
            with tszip.open(tsz_stream, "rb") as decompressed:
                with tempfile.NamedTemporaryFile(suffix=".trees", delete=False) as tmp:
                    try:
                        tmp.write(decompressed.read())
                        tmp.close()
                        return tskit.load(tmp.name)
                    finally:
                        os.unlink(tmp.name)
    elif filename.endswith(".trees"):
        with tempfile.NamedTemporaryFile(suffix=".trees", delete=False) as tmp:
            try:
                tmp.write(contents)
                tmp.close()
                return tskit.load(tmp.name)
            finally:
                os.unlink(tmp.name)
    else:
        raise ValueError("Unsupported file type. Please upload a .trees or .tsz file.")

# The large generate_spatial_locations_for_samples function has been moved to spatial_generation.py

# API endpoints
@app.get("/api")
async def api_root():
    return {"message": "ARGscape API", "status": "running"}

# Serve the frontend
@app.get("/")
async def serve_frontend():
    """Serve the React frontend."""
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    index_file = os.path.join(static_dir, "index.html")
    
    if os.path.exists(index_file):
        return FileResponse(index_file)
    else:
        return {"message": "ARGscape API", "status": "running", "note": "Frontend not built"}

@app.get("/api/health")
async def health_check():
    """Comprehensive health check for Railway deployment."""
    try:
        # Test session storage
        test_session = session_storage.create_session()
        session_storage._cleanup_session(test_session)
        
        # Test imports
        import numpy as np
        import tskit
        
        return {
            "status": "healthy",
            "message": "All systems operational",
            "components": {
                "session_storage": "ok",
                "numpy": "ok", 
                "tskit": "ok",
                "fastgaia": "ok" if infer_locations else "not available",
                "gaia": "ok" if check_gaia_availability() else "not available"
            },
            "environment": {
                "max_session_age_hours": os.getenv("MAX_SESSION_AGE_HOURS"),
                "max_files_per_session": os.getenv("MAX_FILES_PER_SESSION"),
                "max_file_size_mb": os.getenv("MAX_FILE_SIZE_MB")
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    # Check for forwarded IP (Railway/proxy headers)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take the first IP if multiple are present
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    
    # Fallback to client host
    if hasattr(request.client, 'host') and request.client.host:
        return request.client.host
    
    return "unknown"

@app.post("/api/create-session")
@limiter.limit(RATE_LIMIT_SESSION_CREATE)
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

@app.get("/api/session")
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

@app.get("/api/session-stats/{session_id}")
async def get_session_stats(session_id: str):
    """Get statistics for a specific session."""
    stats = session_storage.get_session_stats(session_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    return stats

@app.get("/api/admin/storage-stats")
@limiter.limit("1/minute")
async def get_storage_stats(request: Request):
    """Get global storage statistics (admin endpoint)."""
    return session_storage.get_global_stats()



@app.get("/api/uploaded-files")
async def list_uploaded_files_current(request: Request):
    """List uploaded files for current client IP session."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        return {"uploaded_tree_sequences": session_storage.get_file_list(session_id)}
    except Exception as e:
        logger.error(f"Error getting uploaded files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get files: {str(e)}")

@app.post("/api/upload-tree-sequence")
@limiter.limit("5/minute")
async def upload_tree_sequence(request: Request, file: UploadFile = File(...)):
    """Upload and process tree sequence files."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        logger.info(f"Processing upload: {file.filename} for session {session_id}")
        
        contents = await file.read()
        
        # Store file in session
        session_storage.store_file(session_id, file.filename, contents)
        
        ts = load_tree_sequence_from_file(contents, file.filename)
        session_storage.store_tree_sequence(session_id, file.filename, ts)
        
        has_temporal = any(node.time != 0 for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE == 0)
        spatial_info = check_spatial_completeness(ts)
        
        logger.info(f"Successfully loaded tree sequence: {ts.num_nodes} nodes, {ts.num_edges} edges")
        
        return {
            "filename": file.filename,
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

@app.get("/api/tree-sequence-metadata/{filename}")
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
            "sequence_length": ts.sequence_length,
            "has_temporal": has_temporal,
            **spatial_info
        }
    except Exception as e:
        logger.error(f"Error getting metadata for {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get metadata: {str(e)}")

@app.delete("/api/tree-sequence/{filename}")
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

@app.get("/api/download-tree-sequence/{filename}")
async def download_tree_sequence(request: Request, filename: str, background_tasks: BackgroundTasks):
    """Download a tree sequence file."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        
        file_data = session_storage.get_file_data(session_id, filename)
        if file_data is None:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Create a more unique temporary filename to avoid conflicts
        timestamp = int(time.time() * FILENAME_TIMESTAMP_PRECISION_MICROSECONDS)  # microsecond precision
        safe_filename = filename.replace("/", "_").replace("\\", "_")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{timestamp}_{safe_filename}") as tmp_file:
            tmp_file.write(file_data)
            tmp_file.flush()
            
            # Add cleanup task to remove temp file after response is sent
            def cleanup_temp_file(temp_path: str):
                try:
                    import os
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                        logger.debug(f"Cleaned up temp file: {temp_path}")
                except Exception as cleanup_error:
                    logger.warning(f"Failed to clean up temp file {temp_path}: {cleanup_error}")
            
            background_tasks.add_task(cleanup_temp_file, tmp_file.name)
            
            return FileResponse(
                path=tmp_file.name,
                filename=filename,
                media_type='application/octet-stream'
            )
    except Exception as e:
        logger.error(f"Error downloading file {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

@app.get("/api/graph-data/{filename}")
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
        from graph_utils import convert_to_graph_data, filter_by_tree_indices
        
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
        # Pass expected tree count if we filtered by tree indices and sample ordering
        graph_data = convert_to_graph_data(ts, expected_tree_count, sample_order)
        
        return graph_data
    except Exception as e:
        logger.error(f"Error generating graph data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate graph data: {str(e)}")

@app.post("/api/simulate-tree-sequence")
@limiter.limit("3/minute")
async def simulate_tree_sequence(request: Request, simulation_request: SimulationRequest):
    """Simulate a tree sequence using msprime."""
    logger.info(f"Simulating tree sequence with parameters: {simulation_request}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    
    # Validate parameters
    if simulation_request.num_samples < MINIMUM_SAMPLES_REQUIRED:
        raise HTTPException(status_code=400, detail=f"num_samples must be at least {MINIMUM_SAMPLES_REQUIRED}")
    if simulation_request.num_samples > MAX_SAMPLES_FOR_PERFORMANCE:
        raise HTTPException(status_code=400, detail=f"num_samples cannot exceed {MAX_SAMPLES_FOR_PERFORMANCE} for performance reasons")
    if simulation_request.num_local_trees < 0:
        raise HTTPException(status_code=400, detail="num_local_trees cannot be negative")
    if simulation_request.num_local_trees > MAX_LOCAL_TREES_FOR_PERFORMANCE:
        raise HTTPException(status_code=400, detail=f"num_local_trees cannot exceed {MAX_LOCAL_TREES_FOR_PERFORMANCE} for performance reasons")
    if simulation_request.max_time <= 0:
        raise HTTPException(status_code=400, detail="max_time must be positive")
    if simulation_request.max_time > MAX_TIME_FOR_PERFORMANCE:
        raise HTTPException(status_code=400, detail=f"max_time cannot exceed {MAX_TIME_FOR_PERFORMANCE} for performance reasons")
    
    try:
        # Set reasonable defaults
        population_size = simulation_request.population_size or (simulation_request.num_samples * 2)
        
        # For discrete genome: set sequence_length = num_local_trees to get exactly that many trees
        # With discrete_genome=True, positions are 0, 1, 2, ..., sequence_length-1
        # This allows for sequence_length-1 breakpoints maximum, giving us sequence_length trees
        sequence_length = float(simulation_request.num_local_trees)
        
        # Use a high recombination rate to ensure we get recombination events at most positions
        if simulation_request.num_local_trees > 1:
            # High rate to maximize chance of breakpoints at each possible position
            recombination_rate = RECOMBINATION_RATE_HIGH  # Very high rate to ensure breakpoints
        else:
            recombination_rate = 0.0
        
        logger.info(f"Simulating with recombination_rate={recombination_rate}, population_size={population_size}")
        logger.info(f"Target number of local trees: {simulation_request.num_local_trees}")
        logger.info(f"Setting sequence_length to: {sequence_length}")
        
        # Simulate the tree sequence
        ts = msprime.sim_ancestry(
            samples=simulation_request.num_samples,
            recombination_rate=recombination_rate,
            sequence_length=sequence_length,
            population_size=population_size,
            discrete_genome=True,  # Use discrete genome for predictable tree count
            model=simulation_request.model,
            random_seed=simulation_request.random_seed,
            end_time=simulation_request.max_time
        )
        
        # Add spatial locations to sample nodes based on genealogical relationships
        logger.info(f"Adding spatial locations to simulated tree sequence using CRS: {simulation_request.crs}")
        ts = generate_spatial_locations_for_samples(ts, random_seed=simulation_request.random_seed, crs=simulation_request.crs or "unit_grid")
        
        # Generate filename
        # Check if the filename_prefix already includes a timestamp (indicated by 'd' followed by 10 digits)
        if re.search(r'_d\d{10}$', simulation_request.filename_prefix):
            # Filename already has a formatted timestamp, use as-is
            filename = f"{simulation_request.filename_prefix}.trees"
        else:
            # Add timestamp for backward compatibility
            timestamp = int(time.time())
            filename = f"{simulation_request.filename_prefix}_{timestamp}.trees"
        
        # Store the tree sequence
        session_storage.store_tree_sequence(session_id, filename, ts)
        
        # Check spatial and temporal information
        has_temporal = any(node.time != 0 for node in ts.nodes() if node.flags & tskit.NODE_IS_SAMPLE == 0)
        spatial_info = check_spatial_completeness(ts)
        
        logger.info(f"Successfully simulated tree sequence: {ts.num_nodes} nodes, {ts.num_edges} edges")
        logger.info(f"Actual number of trees generated: {ts.num_trees}")
        
        return {
            "filename": filename,
            "status": "tree_sequence_simulated",
            "num_nodes": ts.num_nodes,
            "num_edges": ts.num_edges,
            "num_samples": ts.num_samples,
            "num_trees": ts.num_trees,
            "sequence_length": ts.sequence_length,
            "has_temporal": has_temporal,
            **spatial_info,
            "simulation_parameters": {
                "num_samples": simulation_request.num_samples,
                "num_local_trees": simulation_request.num_local_trees,
                "actual_num_trees": ts.num_trees,
                "sequence_length": ts.sequence_length,
                "max_time": simulation_request.max_time,
                "population_size": population_size,
                "recombination_rate": recombination_rate,
                "model": simulation_request.model,
                "random_seed": simulation_request.random_seed
            }
        }
        
    except Exception as e:
        logger.error(f"Error simulating tree sequence: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to simulate tree sequence: {str(e)}")



@app.post("/api/infer-locations-fast")
@limiter.limit("2/minute")
async def infer_locations_fast(request: Request, inference_request: FastLocationInferenceRequest):
    """Infer locations using the fastgaia package for fast spatial inference."""
    if infer_locations is None:
        raise HTTPException(status_code=503, detail="fastgaia not available")
    
    logger.info(f"Received fast location inference request for file: {inference_request.filename}")
    
    client_ip = get_client_ip(request)
    session_id = session_storage.get_or_create_session(client_ip)
    ts = session_storage.get_tree_sequence(session_id, inference_request.filename)
    if ts is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_ts_path = os.path.join(temp_dir, "temp.trees")
            ts.dump(temp_ts_path)
            
            output_inferred_continuous = os.path.join(temp_dir, "inferred_locations.csv")
            output_debug = os.path.join(temp_dir, "debug_info.csv")
            
            logger.info(f"Running fastgaia inference for {ts.num_nodes} nodes...")
            
            result_summary = infer_locations(
                tree_path=temp_ts_path,
                continuous_sample_locations_path=None,
                discrete_sample_locations_path=None,
                cost_matrix_path=None,
                weight_span=inference_request.weight_span,
                weight_branch_length=inference_request.weight_branch_length,
                output_inferred_continuous=output_inferred_continuous,
                output_inferred_discrete=None,
                output_locations_continuous=None,
                output_debug=output_debug,
                verbosity=1
            )
            
            if os.path.exists(output_inferred_continuous):
                try:
                    import pandas as pd
                    locations_df = pd.read_csv(output_inferred_continuous)
                    logger.info(f"Read {len(locations_df)} inferred locations")
                except ImportError:
                    raise HTTPException(status_code=500, detail="pandas not available for location inference")
                
                ts_with_locations = apply_inferred_locations_to_tree_sequence(ts, locations_df)
                
                new_filename = f"{inference_request.filename.rsplit('.', 1)[0]}_fastgaia.trees"
                session_storage.store_tree_sequence(session_id, new_filename, ts_with_locations)
                
                spatial_info = check_spatial_completeness(ts_with_locations)
                
                return {
                    "status": "success",
                    "message": "Fast location inference completed successfully",
                    "original_filename": inference_request.filename,
                    "new_filename": new_filename,
                    "num_inferred_locations": len(locations_df),
                    "num_nodes": ts_with_locations.num_nodes,
                    "num_samples": ts_with_locations.num_samples,
                    **spatial_info,
                    "inference_parameters": {
                        "weight_span": inference_request.weight_span,
                        "weight_branch_length": inference_request.weight_branch_length
                    }
                }
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Inference completed but no output file was generated"
                )
                
    except Exception as e:
        logger.error(f"Error during fast location inference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fast location inference failed: {str(e)}")


@app.post("/api/infer-locations-gaia")
@limiter.limit("2/minute")
async def infer_locations_gaia(request: Request, inference_request: GAIALocationInferenceRequest):
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


@app.post("/api/upload-location-csv")
@limiter.limit("10/minute")
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

@app.post("/api/update-tree-sequence-locations")
@limiter.limit("5/minute")
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

def apply_inferred_locations_to_tree_sequence(ts: tskit.TreeSequence, locations_df) -> tskit.TreeSequence:
    """Apply inferred locations from fastgaia to a tree sequence."""
    logger.info("Applying inferred locations to tree sequence...")
    
    tables = ts.dump_tables()
    
    # Clear the individuals table and any metadata schema that might cause validation issues
    tables.individuals.clear()
    # Clear the individual metadata schema to avoid validation errors
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    dim_columns = [col for col in locations_df.columns if col != 'node_id']
    num_dims = len(dim_columns)
    
    logger.info(f"Found {num_dims} spatial dimensions in inferred locations")
    
    node_to_location = {}
    for _, row in locations_df.iterrows():
        node_id = int(row['node_id'])
        location_3d = np.zeros(3)
        for i, dim_col in enumerate(dim_columns):
            if i < 3:
                location_3d[i] = float(row[dim_col])
        node_to_location[node_id] = location_3d
    
    node_to_individual = {}
    for node_id, location in node_to_location.items():
        # Add individual with empty metadata (schema is now cleared)
        individual_id = tables.individuals.add_row(
            flags=0,
            location=location,
            parents=[],
            metadata=b''
        )
        node_to_individual[node_id] = individual_id
    
    new_nodes = tables.nodes.copy()
    new_nodes.clear()
    
    for node in ts.nodes():
        individual_id = node_to_individual.get(node.id, -1)
        new_nodes.add_row(
            time=node.time,
            flags=node.flags,
            population=node.population,
            individual=individual_id,
            metadata=node.metadata
        )
    
    tables.nodes.replace_with(new_nodes)
    
    result_ts = tables.tree_sequence()
    logger.info(f"Applied inferred locations to {len(node_to_location)} nodes")
    
    return result_ts

def parse_location_csv(csv_content: bytes, filename: str) -> Dict[int, tuple]:
    """Parse CSV file containing node locations."""
    try:
        import pandas as pd
        import io
        
        # Read CSV content
        csv_string = csv_content.decode('utf-8')
        df = pd.read_csv(io.StringIO(csv_string))
        
        # Validate required columns
        required_columns = ['node_id', 'x', 'y']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns in {filename}: {missing_columns}")
        
        # Convert to dictionary mapping node_id to (x, y, z) tuple
        locations = {}
        for _, row in df.iterrows():
            node_id = int(row['node_id'])
            x = float(row['x'])
            y = float(row['y'])
            z = float(row['z']) if 'z' in df.columns and pd.notna(row['z']) else 0.0
            locations[node_id] = (x, y, z)
        
        logger.info(f"Parsed {len(locations)} locations from {filename}")
        return locations
        
    except ImportError:
        raise HTTPException(status_code=500, detail="pandas not available for CSV parsing")
    except Exception as e:
        raise ValueError(f"Error parsing CSV file {filename}: {str(e)}")

def apply_custom_locations_to_tree_sequence(
    ts: tskit.TreeSequence, 
    sample_locations: Dict[int, tuple], 
    node_locations: Dict[int, tuple]
) -> tskit.TreeSequence:
    """Apply custom locations from CSV files to a tree sequence."""
    logger.info("Applying custom locations to tree sequence...")
    
    # Get sample and non-sample node IDs
    sample_node_ids = set(node.id for node in ts.nodes() if node.is_sample())
    non_sample_node_ids = set(node.id for node in ts.nodes() if not node.is_sample())
    
    # Validate sample locations
    sample_location_node_ids = set(sample_locations.keys())
    if sample_location_node_ids != sample_node_ids:
        missing_samples = sample_node_ids - sample_location_node_ids
        extra_samples = sample_location_node_ids - sample_node_ids
        error_msg = []
        if missing_samples:
            error_msg.append(f"Missing sample node IDs in sample locations: {sorted(missing_samples)}")
        if extra_samples:
            error_msg.append(f"Extra node IDs in sample locations (not samples): {sorted(extra_samples)}")
        raise ValueError("; ".join(error_msg))
    
    # Validate node locations (ignore any sample node IDs if present)
    node_location_node_ids = set(node_locations.keys())
    valid_node_location_ids = node_location_node_ids & non_sample_node_ids
    ignored_sample_ids = node_location_node_ids & sample_node_ids
    
    if ignored_sample_ids:
        logger.info(f"Ignoring {len(ignored_sample_ids)} sample node IDs in node locations file")
    
    missing_nodes = non_sample_node_ids - valid_node_location_ids
    if missing_nodes:
        raise ValueError(f"Missing non-sample node IDs in node locations: {sorted(missing_nodes)}")
    
    # Create new tree sequence with custom locations
    tables = ts.dump_tables()
    
    # Clear individuals table
    tables.individuals.clear()
    tables.individuals.metadata_schema = tskit.MetadataSchema(None)
    
    # Create individuals for all nodes with locations
    node_to_individual = {}
    
    # Add individuals for sample nodes
    for node_id in sample_node_ids:
        x, y, z = sample_locations[node_id]
        location_3d = np.array([x, y, z])
        individual_id = tables.individuals.add_row(
            flags=0,
            location=location_3d,
            parents=[],
            metadata=b''
        )
        node_to_individual[node_id] = individual_id
    
    # Add individuals for non-sample nodes
    for node_id in valid_node_location_ids:
        x, y, z = node_locations[node_id]
        location_3d = np.array([x, y, z])
        individual_id = tables.individuals.add_row(
            flags=0,
            location=location_3d,
            parents=[],
            metadata=b''
        )
        node_to_individual[node_id] = individual_id
    
    # Update nodes to reference individuals
    new_nodes = tables.nodes.copy()
    new_nodes.clear()
    
    for node in ts.nodes():
        individual_id = node_to_individual.get(node.id, -1)
        new_nodes.add_row(
            time=node.time,
            flags=node.flags,
            population=node.population,
            individual=individual_id,
            metadata=node.metadata
        )
    
    tables.nodes.replace_with(new_nodes)
    
    result_ts = tables.tree_sequence()
    logger.info(f"Applied custom locations to {len(node_to_individual)} nodes")
    
    return result_ts

# Geographic API endpoints

@app.get("/api/geographic/crs")
async def get_available_crs():
    """Get list of available coordinate reference systems."""
    return {
        "builtin_crs": {key: crs.to_dict() for key, crs in BUILTIN_CRS.items()},
        "geospatial_available": GEOSPATIAL_AVAILABLE
    }

@app.get("/api/geographic/shapes")
async def get_available_shapes():
    """Get list of built-in geographic shapes."""
    try:
        builtin_shapes = get_builtin_shapes()
        return {
            "builtin_shapes": builtin_shapes,
            "geospatial_available": GEOSPATIAL_AVAILABLE
        }
    except Exception as e:
        logger.error(f"Error getting built-in shapes: {e}")
        raise HTTPException(status_code=500, detail=f"Could not get shapes: {str(e)}")

@app.post("/api/geographic/upload-shapefile")
@limiter.limit("3/minute")
async def upload_shapefile(request: Request, file: UploadFile = File(...)):
    """Upload and process a shapefile."""
    if not GEOSPATIAL_AVAILABLE:
        raise HTTPException(status_code=503, detail="Geospatial libraries not available")
    
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

@app.get("/api/geographic/shape/{shape_name}")
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

@app.post("/api/geographic/transform-coordinates")
@limiter.limit("5/minute")
async def transform_tree_sequence_coordinates(request: Request, transform_request: CoordinateTransformRequest):
    """Transform coordinates of a tree sequence between CRS."""
    if not GEOSPATIAL_AVAILABLE:
        raise HTTPException(status_code=503, detail="Geospatial libraries not available")
    
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

@app.post("/api/geographic/validate-spatial")
@limiter.limit("5/minute")
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

# Catch-all route for React Router (must be last)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Catch-all route to serve the React SPA for client-side routing."""
    # Skip API routes, static files, and assets
    if full_path.startswith("api/") or full_path.startswith("static/") or full_path.startswith("assets/"):
        raise HTTPException(status_code=404, detail="Not found")
    
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    index_file = os.path.join(static_dir, "index.html")
    
    if os.path.exists(index_file):
        return FileResponse(index_file)
    else:
        raise HTTPException(status_code=404, detail="Frontend not available")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)