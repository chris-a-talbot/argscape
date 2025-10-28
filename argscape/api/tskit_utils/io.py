import tskit
import tempfile
import os
import tszip

def load_tree_sequence_from_file(contents: bytes, filename: str) -> tuple[tskit.TreeSequence, str]:
    """Load tree sequence from file contents.
    
    Returns:
        tuple: (TreeSequence object, updated filename with correct extension)
    """
    # Create temporary file that will persist until explicitly deleted
    suffix = ".trees.tsz" if filename.endswith(".tsz") else ".trees"
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        # Write contents and close the file handle
        temp_file.write(contents)
        temp_file.close()
        
        # Use tszip.load which handles both compressed and uncompressed files
        ts = tszip.load(temp_file.name)
        
        # Update filename to .trees since we've loaded it into memory
        updated_filename = filename
        if filename.endswith(".tsz"):
            updated_filename = filename[:-4] + ".trees"
        
        return ts, updated_filename
    finally:
        # Clean up the temporary file
        try:
            os.unlink(temp_file.name)
        except:
            pass