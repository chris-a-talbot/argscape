"""
Geographic and CRS endpoints.
"""

import logging
import time

import numpy as np
import tskit
from fastapi import APIRouter, HTTPException, UploadFile, File, Request

from argscape.api.core.dependencies import get_client_ip
from argscape.api.services import session_storage
from argscape.api.geo_utils import (
    get_builtin_shapes,
    process_shapefile,
    generate_grid_outline,
    validate_coordinates_in_shape,
    transform_coordinates,
)
from argscape.api.geo_utils.crs import BUILTIN_CRS
from argscape.api.models import CoordinateTransformRequest, SpatialValidationRequest
from argscape.api.constants import VALIDATION_PERCENTAGE_MULTIPLIER

logger = logging.getLogger(__name__)

router = APIRouter()

""" Geographic API endpoints """

@router.get("/geographic/crs")
async def get_available_crs():
    """Get list of available coordinate reference systems."""
    return {
        "builtin_crs": {key: crs.to_dict() for key, crs in BUILTIN_CRS.items()}
}


@router.get("/geographic/shapes")
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


@router.post("/geographic/upload-shapefile")
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


@router.get("/geographic/shape/{shape_name}")
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


@router.post("/geographic/transform-coordinates")
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


@router.post("/geographic/validate-spatial")
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

