"""
Graph data caching system for ARGscape.
Caches converted graph data to disk to avoid re-converting tree sequences.
Only enabled when not running on Railway (to avoid filling disk space).
"""

import os
import json
import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import time

logger = logging.getLogger(__name__)


class GraphCache:
    """Disk-based cache for converted graph data."""
    
    def __init__(self, cache_dir: Optional[str] = None, enabled: bool = True):
        """
        Initialize graph cache.
        
        Args:
            cache_dir: Directory to store cached graph data (default: temp/argscape_graph_cache)
            enabled: Whether caching is enabled (default: True, but disabled on Railway)
        """
        # Disable cache on Railway to avoid disk space issues
        is_railway = (
            os.getenv("RAILWAY_ENVIRONMENT") is not None or 
            os.getenv("RAILWAY_PROJECT_ID") is not None or
            os.getenv("USE_RAILWAY_FRONTEND", "").lower() in ("true", "1", "yes")
        )
        
        self.enabled = enabled and not is_railway
        
        if self.enabled:
            if cache_dir:
                self.cache_dir = Path(cache_dir)
            else:
                # Use environment variable or default to temp directory
                env_path = os.getenv("GRAPH_CACHE_DIR")
                if env_path:
                    self.cache_dir = Path(env_path)
                else:
                    import tempfile
                    self.cache_dir = Path(tempfile.gettempdir()) / "argscape_graph_cache"
            
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Graph cache initialized at {self.cache_dir}")
        else:
            self.cache_dir = None
            logger.info("Graph cache disabled (Railway environment detected)")
    
    def _compute_cache_key(
        self, 
        filename: str, 
        options: Dict[str, Any],
        ts_hash: Optional[str] = None
    ) -> str:
        """
        Compute cache key based on filename and options.
        
        Args:
            filename: Tree sequence filename
            options: Graph data options (max_samples, filters, etc.)
            ts_hash: Optional hash of tree sequence content for invalidation
        
        Returns:
            Cache key string
        """
        # Create a deterministic representation of options
        options_str = json.dumps(options, sort_keys=True)
        key_data = f"{filename}:{options_str}"
        if ts_hash:
            key_data += f":{ts_hash}"
        
        # Hash to create cache key
        return hashlib.sha256(key_data.encode()).hexdigest()
    
    def get(
        self, 
        filename: str, 
        options: Dict[str, Any],
        ts_hash: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached graph data if available.
        
        Args:
            filename: Tree sequence filename
            options: Graph data options
            ts_hash: Optional hash for cache invalidation
        
        Returns:
            Cached graph data or None if not found/expired
        """
        if not self.enabled:
            return None
        
        try:
            cache_key = self._compute_cache_key(filename, options, ts_hash)
            cache_file = self.cache_dir / f"{cache_key}.json"
            
            if not cache_file.exists():
                return None
            
            # Check if cache is too old (default: 24 hours)
            max_age = int(os.getenv("GRAPH_CACHE_MAX_AGE_HOURS", "24")) * 3600
            file_age = time.time() - cache_file.stat().st_mtime
            if file_age > max_age:
                logger.debug(f"Cache expired for {cache_key} (age: {file_age/3600:.1f}h)")
                cache_file.unlink()
                return None
            
            # Load cached data
            with open(cache_file, 'r') as f:
                data = json.load(f)
            
            logger.info(f"Cache hit for {filename} (key: {cache_key[:8]}...)")
            return data
            
        except Exception as e:
            logger.warning(f"Failed to load from cache: {e}")
            return None
    
    def set(
        self, 
        filename: str, 
        options: Dict[str, Any],
        data: Dict[str, Any],
        ts_hash: Optional[str] = None
    ) -> bool:
        """
        Store graph data in cache.
        
        Args:
            filename: Tree sequence filename
            options: Graph data options
            data: Graph data to cache
            ts_hash: Optional hash for cache invalidation
        
        Returns:
            True if cached successfully, False otherwise
        """
        if not self.enabled:
            return False
        
        try:
            cache_key = self._compute_cache_key(filename, options, ts_hash)
            cache_file = self.cache_dir / f"{cache_key}.json"
            
            # Write to temp file first, then rename (atomic operation)
            temp_file = cache_file.with_suffix('.tmp')
            with open(temp_file, 'w') as f:
                json.dump(data, f)
            
            temp_file.rename(cache_file)
            
            logger.info(f"Cached graph data for {filename} (key: {cache_key[:8]}...)")
            return True
            
        except Exception as e:
            logger.warning(f"Failed to cache graph data: {e}")
            return False
    
    def invalidate(self, filename: str) -> int:
        """
        Invalidate all cached entries for a given filename.
        
        Args:
            filename: Tree sequence filename
        
        Returns:
            Number of cache entries removed
        """
        if not self.enabled:
            return 0
        
        try:
            # Find all cache files that start with this filename
            # Note: This is approximate - removes all caches for this filename
            removed = 0
            for cache_file in self.cache_dir.glob("*.json"):
                # Try to determine if this cache file is for this filename
                # This is a best-effort approach
                try:
                    cache_file.unlink()
                    removed += 1
                except Exception:
                    pass
            
            logger.info(f"Invalidated {removed} cache entries for {filename}")
            return removed
            
        except Exception as e:
            logger.warning(f"Failed to invalidate cache: {e}")
            return 0
    
    def clear_all(self) -> int:
        """
        Clear all cached graph data.
        
        Returns:
            Number of cache entries removed
        """
        if not self.enabled:
            return 0
        
        try:
            removed = 0
            for cache_file in self.cache_dir.glob("*.json"):
                try:
                    cache_file.unlink()
                    removed += 1
                except Exception:
                    pass
            
            logger.info(f"Cleared {removed} cache entries")
            return removed
            
        except Exception as e:
            logger.warning(f"Failed to clear cache: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        if not self.enabled:
            return {
                "enabled": False,
                "cache_dir": None,
                "num_entries": 0,
                "total_size_bytes": 0
            }
        
        try:
            cache_files = list(self.cache_dir.glob("*.json"))
            total_size = sum(f.stat().st_size for f in cache_files)
            
            return {
                "enabled": True,
                "cache_dir": str(self.cache_dir),
                "num_entries": len(cache_files),
                "total_size_bytes": total_size,
                "total_size_mb": total_size / (1024 * 1024)
            }
            
        except Exception as e:
            logger.warning(f"Failed to get cache stats: {e}")
            return {
                "enabled": True,
                "cache_dir": str(self.cache_dir),
                "error": str(e)
            }


# Global cache instance
graph_cache = GraphCache()

