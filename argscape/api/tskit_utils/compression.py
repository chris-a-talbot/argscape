"""
Utilities for tree sequence compression and decompression.
Automatically uses .tsz (compressed) format for better performance.
"""

import logging
import tempfile
import os
from pathlib import Path
from typing import Tuple

import tskit
import tszip

logger = logging.getLogger(__name__)


def compress_tree_sequence(ts: tskit.TreeSequence, output_path: str = None) -> Tuple[str, int]:
    """
    Compress a tree sequence to .tsz format.
    
    Args:
        ts: Tree sequence to compress
        output_path: Optional path for compressed file (default: temp file)
    
    Returns:
        Tuple of (compressed_file_path, compressed_size_bytes)
    """
    if output_path is None:
        # Create temp file with .tsz extension
        temp_fd, output_path = tempfile.mkstemp(suffix=".tsz")
        os.close(temp_fd)
    
    try:
        # Compress tree sequence
        tszip.compress(ts, output_path)
        
        # Get compressed size
        compressed_size = Path(output_path).stat().st_size
        
        logger.info(f"Compressed tree sequence to {compressed_size / 1024 / 1024:.2f} MB")
        return output_path, compressed_size
        
    except Exception as e:
        logger.error(f"Failed to compress tree sequence: {e}")
        # Clean up temp file on error
        if output_path and Path(output_path).exists():
            try:
                os.unlink(output_path)
            except:
                pass
        raise


def should_use_compression(ts: tskit.TreeSequence, size_threshold_mb: float = 1.0) -> bool:
    """
    Determine if tree sequence should be compressed.
    
    Always returns True for now, as compression is generally beneficial.
    Could be smarter in the future based on size, structure, etc.
    
    Args:
        ts: Tree sequence to check
        size_threshold_mb: Minimum size threshold for compression (default: 1.0 MB)
    
    Returns:
        True if compression should be used
    """
    # For now, always recommend compression
    # .tsz format is typically 5-10x smaller with fast decompression
    return True


def ensure_compressed_storage(
    ts: tskit.TreeSequence, 
    original_filename: str,
    storage_dir: Path
) -> Tuple[str, Path]:
    """
    Ensure tree sequence is stored in compressed format.
    
    Args:
        ts: Tree sequence to store
        original_filename: Original filename
        storage_dir: Directory to store compressed file
    
    Returns:
        Tuple of (updated_filename, compressed_file_path)
    """
    # Determine output filename
    if original_filename.endswith('.tsz'):
        updated_filename = original_filename
    elif original_filename.endswith('.trees'):
        updated_filename = original_filename[:-6] + '.tsz'
    else:
        updated_filename = original_filename + '.tsz'
    
    output_path = storage_dir / updated_filename
    
    # Compress tree sequence to storage location
    tszip.compress(ts, str(output_path))
    
    logger.info(f"Stored compressed tree sequence as {updated_filename}")
    return updated_filename, output_path


def load_with_auto_compression(file_data: bytes, filename: str) -> Tuple[tskit.TreeSequence, str]:
    """
    Load tree sequence, automatically handling both .trees and .tsz formats.
    
    This is a wrapper around the existing load_tree_sequence_from_file that
    ensures we're using the most efficient format.
    
    Args:
        file_data: File contents as bytes
        filename: Original filename
    
    Returns:
        Tuple of (TreeSequence, updated_filename)
    """
    # Create temp file with appropriate extension
    if filename.endswith('.tsz'):
        suffix = '.tsz'
    else:
        suffix = '.trees'
    
    temp_fd, temp_path = tempfile.mkstemp(suffix=suffix)
    try:
        # Write data to temp file
        os.write(temp_fd, file_data)
        os.close(temp_fd)
        
        # Load tree sequence (tszip.load handles both formats)
        ts = tszip.load(temp_path)
        
        # Update filename to .trees extension (in-memory format)
        # Storage will use .tsz, but internal tracking uses .trees
        if filename.endswith('.tsz'):
            updated_filename = filename[:-4] + '.trees'
        else:
            updated_filename = filename
        
        return ts, updated_filename
        
    finally:
        # Clean up temp file
        try:
            os.unlink(temp_path)
        except:
            pass

