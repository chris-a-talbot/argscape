"""
Session management endpoints.
"""

import logging
from fastapi import APIRouter, HTTPException, Request

from argscape.api.core.dependencies import get_client_ip
from argscape.api.services import session_storage

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/create-session")
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


@router.get("/session")
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


@router.get("/session-stats/{session_id}")
async def get_session_stats(session_id: str):
    """Get statistics for a specific session."""
    stats = session_storage.get_session_stats(session_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    return stats


@router.get("/admin/storage-stats")
async def get_storage_stats(request: Request):
    """Get global storage statistics (admin endpoint)."""
    return session_storage.get_global_stats()


@router.get("/uploaded-files/")
async def list_uploaded_files_current(request: Request):
    """List uploaded files for current client IP session."""
    try:
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)
        return {"uploaded_tree_sequences": session_storage.get_file_list(session_id)}
    except Exception as e:
        logger.error(f"Error getting uploaded files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get files: {str(e)}")

