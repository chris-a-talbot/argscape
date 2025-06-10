import tskit
import tempfile
import os
import tszip

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