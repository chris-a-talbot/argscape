"""
Common dependencies for API routes.
"""

from fastapi import Request


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
