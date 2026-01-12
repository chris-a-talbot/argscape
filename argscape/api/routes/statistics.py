"""
Statistics endpoints for computing population genetics statistics on tree sequences.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request

from argscape.api.services import session_storage
from argscape.api.services.statistics import compute_statistics_for_range
from argscape.api.core.dependencies import get_client_ip

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/statistics/window/{filename}")
async def get_window_statistics(
    filename: str,
    request: Request,
    start: Optional[float] = Query(None, description="Genomic start position (bp)"),
    end: Optional[float] = Query(None, description="Genomic end position (bp)"),
    tree_start_idx: Optional[int] = Query(None, description="Start tree index"),
    tree_end_idx: Optional[int] = Query(None, description="End tree index"),
):
    """
    Compute population genetics statistics for a specific genomic window.

    This endpoint is used by the visualizers to show statistics for the
    currently filtered genomic region, allowing users to compare window
    statistics with full-sequence statistics.

    Either genomic positions (start/end) or tree indices (tree_start_idx/tree_end_idx)
    can be used to specify the window.
    """
    try:
        # Get session from client IP
        client_ip = get_client_ip(request)
        session_id = session_storage.get_or_create_session(client_ip)

        # Get tree sequence from storage
        ts = session_storage.get_tree_sequence(session_id, filename)
        if ts is None:
            raise HTTPException(
                status_code=404,
                detail=f"Tree sequence not found: {filename}"
            )

        # Compute statistics for the specified range
        stats = compute_statistics_for_range(
            ts,
            genomic_start=start,
            genomic_end=end,
            tree_start_idx=tree_start_idx,
            tree_end_idx=tree_end_idx
        )

        return stats

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error computing window statistics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute statistics: {str(e)}"
        )
