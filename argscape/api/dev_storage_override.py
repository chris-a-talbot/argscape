"""
Development storage setup for Windows environments
"""

import os
from pathlib import Path

def ensure_dev_storage_dir():
    """
    Ensure development storage directory exists and set environment variable
    """
    # Get the project root directory (two levels up from this file)
    project_root = Path(__file__).resolve().parent.parent.parent
    
    # Create dev_storage directory in project root
    storage_dir = project_root / "dev_storage"
    storage_dir.mkdir(exist_ok=True)
    
    # Set environment variable for session storage
    os.environ["PERSISTENT_SESSION_PATH"] = str(storage_dir)
    
    return storage_dir

if __name__ == "__main__":
    ensure_dev_storage_dir() 