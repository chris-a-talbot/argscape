#!/usr/bin/env python3
"""
Startup script for ARGscape API
Handles initialization and environment setup for Railway deployment
"""

import os
import sys
import logging
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main startup function."""
    logger.info("Starting ARGscape API...")
    
    # Get port from environment (Railway sets this)
    port = int(os.getenv("PORT", 8000))
    
    # Set default environment variables if not set
    os.environ.setdefault("MAX_SESSION_AGE_HOURS", "24")
    os.environ.setdefault("MAX_FILES_PER_SESSION", "50")
    os.environ.setdefault("MAX_FILE_SIZE_MB", "100")
    os.environ.setdefault("CLEANUP_INTERVAL_MINUTES", "60")
    
    # Set CORS origins - include common domains for production
    default_origins = "https://www.argscape.com,https://argscape.com"
    os.environ.setdefault("ALLOWED_ORIGINS", default_origins)
    
    logger.info(f"Starting server on port {port}")
    logger.info(f"Session age limit: {os.getenv('MAX_SESSION_AGE_HOURS')} hours")
    logger.info(f"File size limit: {os.getenv('MAX_FILE_SIZE_MB')} MB")
    
    try:
        # Import the FastAPI app
        from main import app
        
        # Start the server
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=port,
            log_level="info",
            access_log=True
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 