"""
IP-based persistent session storage for multi-user deployment
Provides persistent file storage tied to client IP addresses with automatic cleanup
"""

import os
import time
import hashlib
import tempfile
import logging
import threading
import shutil
import pickle
import json
import base64
from typing import Dict, List, Optional, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from pathlib import Path

try:
    import tskit
except ImportError:
    tskit = None

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.executors.pool import ThreadPoolExecutor
except ImportError:
    BackgroundScheduler = None
    ThreadPoolExecutor = None

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    PBKDF2 = PBKDF2HMAC  # Alias for compatibility
except ImportError:
    Fernet = None
    hashes = None
    PBKDF2 = None
    PBKDF2HMAC = None

logger = logging.getLogger(__name__)

@dataclass
class UserSession:
    """Represents a user session with file storage."""
    session_id: str
    created_at: datetime
    last_accessed: datetime
    client_ip: str
    uploaded_files: Dict[str, bytes] = field(default_factory=dict)
    tree_sequences: Dict[str, tskit.TreeSequence] = field(default_factory=dict)
    temp_dir: Optional[str] = None
    
    def update_access_time(self):
        """Update the last accessed time."""
        self.last_accessed = datetime.now()
    
    def is_expired(self, max_age_hours: int = 168) -> bool:  # Default 7 days for persistent sessions
        """Check if session has expired."""
        expiry_time = self.created_at + timedelta(hours=max_age_hours)
        return datetime.now() > expiry_time
    
    def get_file_count(self) -> int:
        """Get total number of files in session."""
        return len(self.tree_sequences)
    
    def get_memory_usage(self) -> int:
        """Estimate memory usage of stored files in bytes."""
        total_size = 0
        for file_data in self.uploaded_files.values():
            total_size += len(file_data)
        return total_size


class PersistentSessionStorage:
    """IP-based persistent session storage with disk persistence."""
    
    def __init__(self, 
                 max_session_age_hours: int = 168,  # 7 days default
                 max_files_per_session: int = 50,
                 max_file_size_mb: int = 100,
                 cleanup_interval_minutes: int = 60,
                 storage_base_path: Optional[str] = None):
        
        # Set up storage directory
        if storage_base_path:
            self.storage_base_path = Path(storage_base_path)
        else:
            # Use environment variable or default to system temp
            env_path = os.getenv("PERSISTENT_SESSION_PATH")
            if env_path:
                self.storage_base_path = Path(env_path)
            else:
                self.storage_base_path = Path(tempfile.gettempdir()) / "argscape_sessions"
        
        self.storage_base_path.mkdir(parents=True, exist_ok=True)
        
        # Check if encryption should be enabled (Railway deployment only)
        # Set ENABLE_ENCRYPTION=true in Railway environment variables
        self.encryption_enabled = os.getenv("ENABLE_ENCRYPTION", "false").lower() in ("true", "1", "yes")
        
        self.sessions: Dict[str, UserSession] = {}
        self.max_session_age_hours = max_session_age_hours
        self.max_files_per_session = max_files_per_session
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024
        self.cleanup_interval_minutes = cleanup_interval_minutes
        self._lock = threading.RLock()
        
        # Load existing sessions from disk
        self._load_sessions_from_disk()
        
        # Setup cleanup scheduler
        if BackgroundScheduler and ThreadPoolExecutor:
            self.scheduler = BackgroundScheduler(
                executors={'default': ThreadPoolExecutor(max_workers=1)},
                timezone='UTC'
            )
            self.scheduler.add_job(
                self._cleanup_expired_sessions,
                'interval',
                minutes=cleanup_interval_minutes,
                id='cleanup_sessions'
            )
            self.scheduler.start()
        else:
            self.scheduler = None
        
        logger.info(f"PersistentSessionStorage initialized with {max_session_age_hours}h max age")
        logger.info(f"Storage path: {self.storage_base_path}")
        logger.info(f"Encryption enabled: {self.encryption_enabled}")
    
    def _get_encryption_key(self, client_ip: str) -> bytes:
        """
        Derive an encryption key from the client IP.
        This ensures only someone with the correct IP can decrypt the files.
        """
        if not Fernet or not PBKDF2 or not hashes:
            raise RuntimeError("Cryptography library not available")
        
        # Use the same salt as session ID for consistency
        salt = b"argscape_session_salt_2024"
        
        # Derive a key from the client IP using PBKDF2
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,  # Standard security, fast enough for our use case
        )
        key = base64.urlsafe_b64encode(kdf.derive(client_ip.encode()))
        return key
    
    def _encrypt_data(self, data: bytes, client_ip: str) -> bytes:
        """Encrypt data using IP-based key."""
        # Only encrypt if explicitly enabled (Railway deployment)
        if not self.encryption_enabled:
            return data
            
        if not Fernet:
            logger.warning("Cryptography not available, storing data unencrypted")
            return data
        
        try:
            key = self._get_encryption_key(client_ip)
            f = Fernet(key)
            return f.encrypt(data)
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def _decrypt_data(self, encrypted_data: bytes, client_ip: str) -> bytes:
        """Decrypt data using IP-based key."""
        # Only decrypt if encryption was enabled
        if not self.encryption_enabled:
            return encrypted_data
            
        if not Fernet:
            logger.warning("Cryptography not available, assuming data is unencrypted")
            return encrypted_data
        
        try:
            key = self._get_encryption_key(client_ip)
            f = Fernet(key)
            return f.decrypt(encrypted_data)
        except Exception as e:
            # If decryption fails, check if data might be unencrypted (legacy files)
            # Fernet-encrypted data is base64url-encoded and typically starts with 'gAAAAAB'
            # Unencrypted tskit .trees files have a specific binary structure
            # If the data doesn't look like Fernet-encrypted, it's likely legacy unencrypted data
            is_likely_encrypted = (
                len(encrypted_data) > 10 and 
                encrypted_data[:10].startswith(b'gAAAAAB')  # Fernet header pattern
            )
            
            if is_likely_encrypted:
                # Data appears encrypted but decryption failed - likely wrong IP/key
                logger.error(f"Decryption failed (wrong IP or corrupted data): {e}")
                raise
            else:
                # Data doesn't look encrypted - likely a legacy file from before encryption was enabled
                logger.debug(f"Data appears unencrypted (legacy file), returning as-is. "
                           f"File was likely created before encryption was enabled.")
                return encrypted_data
    
    def _get_session_id_from_ip(self, client_ip: str) -> str:
        """Generate a consistent session ID from client IP."""
        # Use SHA256 hash of IP to create a consistent session ID
        # Add a salt to make it less predictable
        salt = "argscape_session_salt_2024"
        session_data = f"{client_ip}_{salt}"
        return hashlib.sha256(session_data.encode()).hexdigest()[:16]
    
    def _get_session_dir(self, session_id: str) -> Path:
        """Get the directory path for a session."""
        return self.storage_base_path / f"session_{session_id}"
    
    def _save_session_metadata(self, session: UserSession):
        """Save session metadata to disk."""
        session_dir = self._get_session_dir(session.session_id)
        session_dir.mkdir(parents=True, exist_ok=True)
        
        metadata = {
            "session_id": session.session_id,
            "created_at": session.created_at.isoformat(),
            "last_accessed": session.last_accessed.isoformat(),
            "client_ip": session.client_ip,
            "file_list": list(session.tree_sequences.keys())
        }
        
        metadata_file = session_dir / "metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def _load_session_from_disk(self, session_id: str) -> Optional[UserSession]:
        """Load a session from disk."""
        session_dir = self._get_session_dir(session_id)
        metadata_file = session_dir / "metadata.json"
        
        if not metadata_file.exists():
            return None
        
        try:
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            
            session = UserSession(
                session_id=session_id,
                created_at=datetime.fromisoformat(metadata["created_at"]),
                last_accessed=datetime.fromisoformat(metadata["last_accessed"]),
                client_ip=metadata["client_ip"],
                temp_dir=str(session_dir)
            )
            
            # Load tree sequences
            for filename in metadata["file_list"]:
                # Filename in metadata already includes .trees extension
                if filename.endswith('.trees'):
                    ts_file = session_dir / filename
                else:
                    ts_file = session_dir / f"{filename}.trees"
                file_data_file = session_dir / f"{filename}.data"
                
                if ts_file.exists():
                    try:
                        # Load encrypted tree sequence
                        with open(ts_file, 'rb') as f:
                            encrypted_ts_data = f.read()
                        
                        # Decrypt the tree sequence data
                        decrypted_ts_data = self._decrypt_data(encrypted_ts_data, session.client_ip)
                        
                        # Write to temporary file and load
                        temp_fd, temp_path = tempfile.mkstemp(suffix=".trees")
                        os.close(temp_fd)
                        
                        try:
                            with open(temp_path, 'wb') as f:
                                f.write(decrypted_ts_data)
                            
                            ts = tskit.load(temp_path)
                            session.tree_sequences[filename] = ts
                        finally:
                            try:
                                os.unlink(temp_path)
                            except Exception as cleanup_error:
                                logger.warning(f"Failed to clean up temp file {temp_path}: {cleanup_error}")
                        
                        # Load original encrypted file data if available
                        if file_data_file.exists():
                            try:
                                with open(file_data_file, 'rb') as f:
                                    encrypted_file_data = f.read()
                                # Decrypt and cache in memory
                                file_data = self._decrypt_data(encrypted_file_data, session.client_ip)
                                session.uploaded_files[filename] = file_data
                            except Exception as e:
                                logger.warning(f"Failed to load file data for {filename}, will load on demand: {e}")
                        else:
                            logger.warning(f"File data not found for {filename}, will attempt to load on demand")
                            
                    except Exception as e:
                        logger.warning(f"Failed to load tree sequence {filename} for session {session_id}: {e}")
            
            return session
            
        except Exception as e:
            logger.error(f"Failed to load session {session_id} from disk: {e}")
            return None
    
    def _load_sessions_from_disk(self):
        """Load all existing sessions from disk on startup."""
        if not self.storage_base_path.exists():
            return
        
        loaded_count = 0
        for session_dir in self.storage_base_path.iterdir():
            if session_dir.is_dir() and session_dir.name.startswith("session_"):
                session_id = session_dir.name.replace("session_", "")
                session = self._load_session_from_disk(session_id)
                
                if session and not session.is_expired(self.max_session_age_hours):
                    self.sessions[session_id] = session
                    loaded_count += 1
                elif session:
                    # Clean up expired session
                    self._cleanup_session_files(session_id)
        
        logger.info(f"Loaded {loaded_count} persistent sessions from disk")
    
    def get_or_create_session(self, client_ip: str) -> str:
        """Get existing session for IP or create a new one."""
        session_id = self._get_session_id_from_ip(client_ip)
        
        with self._lock:
            # Check if session exists in memory
            if session_id in self.sessions:
                session = self.sessions[session_id]
                if not session.is_expired(self.max_session_age_hours):
                    session.update_access_time()
                    self._save_session_metadata(session)
                    return session_id
                else:
                    # Clean up expired session
                    self._cleanup_session(session_id)
            
            # Try to load from disk
            session = self._load_session_from_disk(session_id)
            if session and not session.is_expired(self.max_session_age_hours):
                session.update_access_time()
                self.sessions[session_id] = session
                self._save_session_metadata(session)
                logger.info(f"Restored session {session_id} for IP {client_ip}")
                return session_id
            elif session:
                # Clean up expired session
                self._cleanup_session_files(session_id)
            
            # Create new session
            session_dir = self._get_session_dir(session_id)
            session_dir.mkdir(parents=True, exist_ok=True)
            
            session = UserSession(
                session_id=session_id,
                created_at=datetime.now(),
                last_accessed=datetime.now(),
                client_ip=client_ip,
                temp_dir=str(session_dir)
            )
            
            self.sessions[session_id] = session
            self._save_session_metadata(session)
            
            logger.info(f"Created new persistent session {session_id} for IP {client_ip}")
            return session_id
    

    
    def get_session(self, session_id: str) -> Optional[UserSession]:
        """Get a session by ID, updating access time."""
        with self._lock:
            session = self.sessions.get(session_id)
            if session and not session.is_expired(self.max_session_age_hours):
                session.update_access_time()
                self._save_session_metadata(session)
                return session
            elif session:
                self._cleanup_session(session_id)
                return None
            return None
    
    def store_file(self, session_id: str, filename: str, contents: bytes) -> bool:
        """Store a file in the session."""
        if len(contents) > self.max_file_size_bytes:
            raise ValueError(f"File too large: {len(contents)} bytes (max: {self.max_file_size_bytes})")
        
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Invalid or expired session")
        
        if session.get_file_count() >= self.max_files_per_session:
            raise ValueError(f"Too many files in session (max: {self.max_files_per_session})")
        
        with self._lock:
            session.uploaded_files[filename] = contents
            
            # Encrypt and save file data to disk
            session_dir = self._get_session_dir(session_id)
            file_data_path = session_dir / f"{filename}.data"
            encrypted_data = self._encrypt_data(contents, session.client_ip)
            with open(file_data_path, 'wb') as f:
                f.write(encrypted_data)
            
            self._save_session_metadata(session)
            enc_status = "encrypted" if self.encryption_enabled else "unencrypted"
            logger.info(f"Stored {enc_status} file {filename} in persistent session {session_id}")
        
        return True
    
    def store_tree_sequence(self, session_id: str, filename: str, ts: tskit.TreeSequence) -> bool:
        """Store a tree sequence in the session."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Invalid or expired session")
        
        with self._lock:
            # Log mutation count before storing
            logger.info(f"Storing tree sequence {filename} with {ts.num_mutations} mutations")
            
            session.tree_sequences[filename] = ts
            
            # Save tree sequence to disk with encryption
            session_dir = self._get_session_dir(session_id)
            # Ensure filename has .trees extension (handle cases where it already does)
            if filename.endswith('.trees'):
                base_filename = filename
            else:
                base_filename = f"{filename}.trees"
            ts_file_path = session_dir / base_filename
            
            # Dump to a temporary file first, then encrypt
            temp_fd, temp_path = tempfile.mkstemp(suffix=".trees")
            os.close(temp_fd)
            
            try:
                ts.dump(temp_path)
                
                # Read the unencrypted data
                with open(temp_path, 'rb') as f:
                    ts_data = f.read()
                
                # Encrypt and write to final location
                encrypted_data = self._encrypt_data(ts_data, session.client_ip)
                with open(ts_file_path, 'wb') as f:
                    f.write(encrypted_data)
                
                enc_status = "encrypted" if self.encryption_enabled else "unencrypted"
                logger.info(f"Stored {enc_status} tree sequence {filename} in persistent session {session_id}")
            finally:
                # Clean up temp file
                try:
                    os.unlink(temp_path)
                except Exception as cleanup_error:
                    logger.warning(f"Failed to clean up temp file {temp_path}: {cleanup_error}")
            
            self._save_session_metadata(session)
        
        return True
    
    def get_tree_sequence(self, session_id: str, filename: str) -> Optional[tskit.TreeSequence]:
        """Get a tree sequence from the session."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        # Try to get from memory first
        ts = session.tree_sequences.get(filename)
        if ts is not None:
            logger.info(f"Retrieved tree sequence {filename} from memory: {ts.num_mutations} mutations")
            return ts
        
        # If not in memory, try to load from disk (encrypted)
        session_dir = self._get_session_dir(session_id)
        # Ensure filename has .trees extension (handle cases where it already does)
        if filename.endswith('.trees'):
            ts_file_path = session_dir / filename
        else:
            ts_file_path = session_dir / f"{filename}.trees"
        
        if ts_file_path.exists():
            try:
                # Read encrypted data
                with open(ts_file_path, 'rb') as f:
                    encrypted_data = f.read()
                
                # Decrypt the data
                decrypted_data = self._decrypt_data(encrypted_data, session.client_ip)
                
                # Write to temporary file and load
                temp_fd, temp_path = tempfile.mkstemp(suffix=".trees")
                os.close(temp_fd)
                
                try:
                    with open(temp_path, 'wb') as f:
                        f.write(decrypted_data)
                    
                    ts = tskit.load(temp_path)
                    logger.info(f"Loaded encrypted tree sequence {filename} from disk: {ts.num_mutations} mutations")
                    
                    # Cache in memory for future access
                    session.tree_sequences[filename] = ts
                    return ts
                finally:
                    # Clean up temp file
                    try:
                        os.unlink(temp_path)
                    except Exception as cleanup_error:
                        logger.warning(f"Failed to clean up temp file {temp_path}: {cleanup_error}")
                        
            except Exception as e:
                logger.error(f"Failed to load tree sequence {filename} from disk: {e}")
        
        return None
    
    def get_file_list(self, session_id: str) -> List[str]:
        """Get list of files in the session."""
        session = self.get_session(session_id)
        if not session:
            return []
        
        return list(session.tree_sequences.keys())
    
    def delete_file(self, session_id: str, filename: str) -> bool:
        """Delete a file from the session."""
        session = self.get_session(session_id)
        if not session:
            return False
        
        with self._lock:
            session.uploaded_files.pop(filename, None)
            session.tree_sequences.pop(filename, None)
            
            # Delete files from disk
            session_dir = self._get_session_dir(session_id)
            try:
                if filename.endswith('.trees'):
                    (session_dir / filename).unlink(missing_ok=True)
                else:
                    (session_dir / f"{filename}.trees").unlink(missing_ok=True)
                (session_dir / f"{filename}.data").unlink(missing_ok=True)
            except Exception as e:
                logger.warning(f"Failed to delete disk files for {filename}: {e}")
            
            self._save_session_metadata(session)
            logger.info(f"Deleted file {filename} from persistent session {session_id}")
        
        return True
    
    def get_file_size_bytes(self, session_id: str, filename: str) -> Optional[int]:
        """Get file size in bytes from the session."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        # Check if file data is in memory
        file_data = session.uploaded_files.get(filename)
        if file_data is not None:
            return len(file_data)
        
        # Check disk for tree sequence file
        session_dir = self._get_session_dir(session_id)
        if filename.endswith('.trees'):
            ts_file_path = session_dir / filename
        else:
            ts_file_path = session_dir / f"{filename}.trees"
        
        if ts_file_path.exists():
            try:
                return ts_file_path.stat().st_size
            except Exception as e:
                logger.warning(f"Failed to get file size for {filename}: {e}")
        
        # Check for .data file
        file_data_file = session_dir / f"{filename}.data"
        if file_data_file.exists():
            try:
                return file_data_file.stat().st_size
            except Exception as e:
                logger.warning(f"Failed to get file data size for {filename}: {e}")
        
        return None
    
    def get_file_data(self, session_id: str, filename: str) -> Optional[bytes]:
        """Get raw file data from the session."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        # First try to get from memory
        file_data = session.uploaded_files.get(filename)
        if file_data is not None:
            return file_data
        
        # If not in memory, try to load from disk (encrypted)
        session_dir = self._get_session_dir(session_id)
        file_data_file = session_dir / f"{filename}.data"
        
        if file_data_file.exists():
            try:
                with open(file_data_file, 'rb') as f:
                    encrypted_data = f.read()
                    # Decrypt the data
                    file_data = self._decrypt_data(encrypted_data, session.client_ip)
                    # Cache in memory for future access
                    session.uploaded_files[filename] = file_data
                    return file_data
            except Exception as e:
                logger.error(f"Failed to load file data from disk for {filename}: {e}")
        
        # If no .data file exists, check if we have a tree sequence that we can generate file data from
        # This handles simulated files that don't have original file data
        ts = session.tree_sequences.get(filename)
        if ts is not None:
            try:
                import tempfile
                import os
                
                # Create a temporary file but close it immediately so we can write to it
                tmp_fd, tmp_path = tempfile.mkstemp(suffix=".trees")
                os.close(tmp_fd)  # Close the file descriptor immediately
                
                try:
                    # Now we can safely write to it
                    ts.dump(tmp_path)
                    
                    # Read the generated file data
                    with open(tmp_path, 'rb') as f:
                        file_data = f.read()
                    
                    # Cache the generated file data
                    session.uploaded_files[filename] = file_data
                    
                    # Also save to disk for future use (encrypted)
                    try:
                        encrypted_data = self._encrypt_data(file_data, session.client_ip)
                        with open(file_data_file, 'wb') as f:
                            f.write(encrypted_data)
                    except Exception as e:
                        logger.warning(f"Failed to cache generated file data to disk for {filename}: {e}")
                    
                    logger.info(f"Generated file data for simulated/inferred file {filename}")
                    return file_data
                    
                finally:
                    # Clean up temp file
                    try:
                        os.unlink(tmp_path)
                    except Exception as cleanup_error:
                        logger.warning(f"Failed to clean up temp file {tmp_path}: {cleanup_error}")
                        
            except Exception as e:
                logger.error(f"Failed to generate file data from tree sequence for {filename}: {e}")
        
        return None
    
    def get_session_stats(self, session_id: str) -> Optional[Dict]:
        """Get session statistics."""
        session = self.get_session(session_id)
        if not session:
            return None
        
        return {
            "session_id": session_id,
            "created_at": session.created_at.isoformat(),
            "last_accessed": session.last_accessed.isoformat(),
            "file_count": session.get_file_count(),
            "memory_usage_bytes": session.get_memory_usage(),
            "expires_at": (session.created_at + timedelta(hours=self.max_session_age_hours)).isoformat(),
            "client_ip": session.client_ip,
            "persistent": True
        }
    
    def _cleanup_session_files(self, session_id: str):
        """Clean up session files on disk."""
        session_dir = self._get_session_dir(session_id)
        if session_dir.exists():
            try:
                shutil.rmtree(session_dir)
                logger.info(f"Cleaned up session files for {session_id}")
            except Exception as e:
                logger.error(f"Error cleaning up session files for {session_id}: {e}")
    
    def _cleanup_session(self, session_id: str):
        """Clean up a single session."""
        with self._lock:
            session = self.sessions.pop(session_id, None)
            if session:
                self._cleanup_session_files(session_id)
    
    def _cleanup_expired_sessions(self):
        """Clean up expired sessions (called by scheduler)."""
        logger.info("Running persistent session cleanup...")
        
        expired_sessions = []
        with self._lock:
            for session_id, session in self.sessions.items():
                if session.is_expired(self.max_session_age_hours):
                    expired_sessions.append(session_id)
        
        # Also check disk for sessions not in memory
        if self.storage_base_path.exists():
            for session_dir in self.storage_base_path.iterdir():
                if session_dir.is_dir() and session_dir.name.startswith("session_"):
                    session_id = session_dir.name.replace("session_", "")
                    if session_id not in self.sessions:
                        # Try to load and check if expired
                        session = self._load_session_from_disk(session_id)
                        if session and session.is_expired(self.max_session_age_hours):
                            expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            self._cleanup_session(session_id)
            logger.info(f"Cleaned up expired persistent session: {session_id}")
        
        if expired_sessions:
            logger.info(f"Cleaned up {len(expired_sessions)} expired persistent sessions")
        
        with self._lock:
            active_sessions = len(self.sessions)
            total_files = sum(session.get_file_count() for session in self.sessions.values())
            total_memory = sum(session.get_memory_usage() for session in self.sessions.values())
            
        logger.info(f"Active persistent sessions: {active_sessions}, Total files: {total_files}, "
                   f"Total memory: {total_memory / (1024*1024):.2f} MB")
    
    def get_global_stats(self) -> Dict:
        """Get global storage statistics."""
        with self._lock:
            active_sessions = len(self.sessions)
            total_files = sum(session.get_file_count() for session in self.sessions.values())
            total_memory = sum(session.get_memory_usage() for session in self.sessions.values())
            
            oldest_session = None
            if self.sessions:
                oldest_time = min(session.created_at for session in self.sessions.values())
                oldest_session = oldest_time.isoformat()
        
        return {
            "active_sessions": active_sessions,
            "total_files": total_files,
            "total_memory_bytes": total_memory,
            "total_memory_mb": total_memory / (1024*1024),
            "oldest_session": oldest_session,
            "max_session_age_hours": self.max_session_age_hours,
            "max_files_per_session": self.max_files_per_session,
            "max_file_size_mb": self.max_file_size_bytes / (1024*1024),
            "storage_path": str(self.storage_base_path),
            "persistent": True
        }
    
    def shutdown(self):
        """Shutdown the storage system."""
        logger.info("Shutting down PersistentSessionStorage...")
        
        if self.scheduler and hasattr(self.scheduler, 'running') and self.scheduler.running:
            self.scheduler.shutdown()
        
        # Save all session metadata before shutdown
        with self._lock:
            for session in self.sessions.values():
                self._save_session_metadata(session)
        
        logger.info("PersistentSessionStorage shutdown complete")


# Global storage instance with environment-based configuration
session_storage = PersistentSessionStorage(
    max_session_age_hours=int(os.getenv("MAX_SESSION_AGE_HOURS", 24)),
    max_files_per_session=int(os.getenv("MAX_FILES_PER_SESSION", 50)),
    max_file_size_mb=int(os.getenv("MAX_FILE_SIZE_MB", 100)),
    cleanup_interval_minutes=int(os.getenv("CLEANUP_INTERVAL_MINUTES", 60))
) 