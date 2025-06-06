"""
Development override for session storage
Creates a simple local directory for Windows development
"""

import os
import tempfile

def ensure_dev_storage_dir():
    """Ensure storage directory exists for development."""
    # Use current directory for development storage
    storage_dir = os.path.join(os.getcwd(), "dev_storage")
    
    if not os.path.exists(storage_dir):
        os.makedirs(storage_dir, exist_ok=True)
        print(f"Created development storage directory: {storage_dir}")
    
    # Set environment variable so session_storage uses this
    os.environ["TEMP_STORAGE_PATH"] = storage_dir
    return storage_dir

if __name__ == "__main__":
    ensure_dev_storage_dir() 