"""
Vault manager for secure storage and retrieval of encrypted AI models.

Provides:
- Vault creation and management
- Model encryption and storage
- Secure model retrieval and decryption
- Vault integrity verification
- Model metadata management
"""

import json
import hashlib
import time
from datetime import datetime
from typing import Dict, List, Optional, Union, Any
from pathlib import Path
from dataclasses import dataclass, asdict
from .encryption import EncryptionManager, EncryptionError, DecryptionError
from ..utils.logger import VaultLogger


@dataclass
class ModelMetadata:
    """Metadata for encrypted models stored in the vault."""
    name: str
    original_path: str
    encrypted_path: str
    file_size: int
    encrypted_size: int
    checksum: str
    encryption_algorithm: str
    key_derivation_method: str
    salt: str  # Hex encoded
    iv: str    # Hex encoded
    tag: str   # Hex encoded
    created_at: str
    last_accessed: str
    model_type: str  # 'pytorch', 'onnx', 'tensorflow', etc.
    framework_version: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []


class VaultError(Exception):
    """Base exception for vault operations."""
    pass


class VaultAccessError(VaultError):
    """Exception for vault access failures."""
    pass


class VaultCorruptionError(VaultError):
    """Exception for vault corruption issues."""
    pass


class VaultManager:
    """
    Manages encrypted model vault operations.
    
    Features:
    - Secure vault creation and management
    - Model encryption and storage
    - Metadata tracking and indexing
    - Integrity verification
    - Secure model retrieval
    """
    
    VAULT_VERSION = "1.0"
    METADATA_FILE = "vault_metadata.json"
    MODELS_DIR = "models"
    TEMP_DIR = "temp"
    
    def __init__(self, vault_path: Union[str, Path], password: Optional[str] = None, 
                 keyfile_path: Optional[Union[str, Path]] = None):
        """
        Initialize vault manager.
        
        Args:
            vault_path: Path to vault directory
            password: Optional password for key derivation
            keyfile_path: Optional keyfile for key derivation
            
        Raises:
            VaultError: If initialization fails
        """
        self.vault_path = Path(vault_path)
        self.encryption_manager = EncryptionManager()
        self.logger = VaultLogger("VaultManager")
        
        # Authentication setup
        self.password = password
        self.keyfile_path = Path(keyfile_path) if keyfile_path else None
        self._encryption_key: Optional[bytes] = None
        self._is_authenticated = False
        
        # Vault structure
        self.models_dir = self.vault_path / self.MODELS_DIR
        self.metadata_file = self.vault_path / self.METADATA_FILE
        self.temp_dir = self.vault_path / self.TEMP_DIR
        
        # In-memory metadata cache
        self._metadata_cache: Dict[str, ModelMetadata] = {}
        self._vault_metadata: Dict[str, Any] = {}
    
    def create_vault(self, overwrite: bool = False) -> None:
        """
        Create a new encrypted vault.
        
        Args:
            overwrite: Whether to overwrite existing vault
            
        Raises:
            VaultError: If vault creation fails
        """
        try:
            if self.vault_path.exists():
                if overwrite:
                    self._delete_vault()
                else:
                    raise VaultError(f"Vault already exists: {self.vault_path}")
            
            # Create vault directory structure
            self.vault_path.mkdir(parents=True, exist_ok=True)
            self.models_dir.mkdir(exist_ok=True)
            self.temp_dir.mkdir(exist_ok=True)
            
            # Initialize vault metadata
            self._vault_metadata = {
                "version": self.VAULT_VERSION,
                "created_at": datetime.utcnow().isoformat(),
                "last_modified": datetime.utcnow().isoformat(),
                "model_count": 0,
                "total_size": 0,
                "encryption_algorithm": "AES-256-GCM",
                "key_derivation": "scrypt" if self.password else "keyfile"
            }
            
            self._save_vault_metadata()
            self._set_vault_permissions()
            
            self.logger.info(f"Created new vault: {self.vault_path}")
            
        except Exception as e:
            raise VaultError(f"Failed to create vault: {str(e)}")
    
    def open_vault(self) -> None:
        """
        Open an existing vault and authenticate.
        
        Raises:
            VaultAccessError: If authentication fails
            VaultError: If vault opening fails
        """
        try:
            if not self.vault_path.exists():
                raise VaultError(f"Vault does not exist: {self.vault_path}")
            
            if not self.metadata_file.exists():
                raise VaultCorruptionError(f"Vault metadata not found: {self.metadata_file}")
            
            # Load vault metadata
            self._load_vault_metadata()
            self._load_model_metadata()
            
            # Authenticate
            self._authenticate()
            
            # Verify vault integrity
            self._verify_vault_integrity()
            
            self.logger.info(f"Opened vault: {self.vault_path}")
            
        except Exception as e:
            raise VaultError(f"Failed to open vault: {str(e)}")
    
    def close_vault(self) -> None:
        """Close vault and clear sensitive data."""
        try:
            # Clear encryption key from memory
            if self._encryption_key:
                self._encryption_key = b'\x00' * len(self._encryption_key)
                self._encryption_key = None
            
            self._is_authenticated = False
            self._metadata_cache.clear()
            
            # Clear temp directory
            self._clear_temp_directory()
            
            self.logger.info("Vault closed successfully")
            
        except Exception as e:
            self.logger.error(f"Error closing vault: {str(e)}")
    
    def add_model(
        self, 
        model_path: Union[str, Path], 
        model_name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        progress_callback: Optional[callable] = None
    ) -> str:
        """
        Add and encrypt a model to the vault.
        
        Args:
            model_path: Path to model file
            model_name: Optional name for the model
            description: Optional description
            tags: Optional tags
            progress_callback: Optional progress callback
            
        Returns:
            Model ID
            
        Raises:
            VaultAccessError: If not authenticated
            VaultError: If model addition fails
        """
        if not self._is_authenticated:
            raise VaultAccessError("Vault not authenticated")
        
        try:
            model_path = Path(model_path)
            
            if not model_path.exists():
                raise VaultError(f"Model file not found: {model_path}")
            
            # Generate model name if not provided
            if not model_name:
                model_name = model_path.stem
            
            # Generate unique model ID
            model_id = hashlib.sha256(f"{model_name}_{time.time()}".encode()).hexdigest()[:16]
            
            # Determine model type
            model_type = self._detect_model_type(model_path)
            
            # Calculate checksum
            checksum = self._calculate_checksum(model_path)
            
            # Create encrypted file path
            encrypted_filename = f"{model_id}.encrypted"
            encrypted_path = self.models_dir / encrypted_filename
            
            # Encrypt the model
            self.logger.info(f"Encrypting model: {model_name}")
            salt, iv, tag = self.encryption_manager.encrypt_file(
                model_path, 
                encrypted_path, 
                self._encryption_key,
                progress_callback
            )
            
            # Create metadata
            metadata = ModelMetadata(
                name=model_name,
                original_path=str(model_path),
                encrypted_path=str(encrypted_path),
                file_size=model_path.stat().st_size,
                encrypted_size=encrypted_path.stat().st_size,
                checksum=checksum,
                encryption_algorithm="AES-256-GCM",
                key_derivation_method="scrypt" if self.password else "keyfile",
                salt=salt.hex(),
                iv=iv.hex(),
                tag=tag.hex(),
                created_at=datetime.utcnow().isoformat(),
                last_accessed=datetime.utcnow().isoformat(),
                model_type=model_type,
                description=description,
                tags=tags or []
            )
            
            # Store metadata
            self._metadata_cache[model_id] = metadata
            self._save_model_metadata()
            self._update_vault_metadata()
            
            self.logger.info(f"Added model to vault: {model_name} (ID: {model_id})")
            
            return model_id
            
        except Exception as e:
            # Clean up on failure
            encrypted_path = self.models_dir / f"{model_id}.encrypted"
            if encrypted_path.exists():
                encrypted_path.unlink()
            raise VaultError(f"Failed to add model: {str(e)}")
    
    def get_model(
        self, 
        model_id: str, 
        output_path: Optional[Union[str, Path]] = None,
        progress_callback: Optional[callable] = None
    ) -> Path:
        """
        Retrieve and decrypt a model from the vault.
        
        Args:
            model_id: Model ID
            output_path: Optional output path (auto-generated if not provided)
            progress_callback: Optional progress callback
            
        Returns:
            Path to decrypted model
            
        Raises:
            VaultAccessError: If not authenticated
            VaultError: If model retrieval fails
        """
        if not self._is_authenticated:
            raise VaultAccessError("Vault not authenticated")
        
        try:
            # Get metadata
            metadata = self._metadata_cache.get(model_id)
            if not metadata:
                raise VaultError(f"Model not found: {model_id}")
            
            # Generate output path if not provided
            if not output_path:
                output_path = self.temp_dir / f"{metadata.name}_decrypted.{self._get_file_extension(metadata.model_type)}"
            
            output_path = Path(output_path)
            
            # Decrypt the model
            self.logger.info(f"Decrypting model: {metadata.name}")
            
            # Reconstruct encryption parameters
            salt = bytes.fromhex(metadata.salt)
            iv = bytes.fromhex(metadata.iv)
            tag = bytes.fromhex(metadata.tag)
            
            # Decrypt file
            self.encryption_manager.decrypt_file(
                metadata.encrypted_path,
                output_path,
                self._encryption_key,
                progress_callback
            )
            
            # Verify checksum
            actual_checksum = self._calculate_checksum(output_path)
            if actual_checksum != metadata.checksum:
                output_path.unlink()
                raise VaultCorruptionError(f"Checksum mismatch for model: {model_id}")
            
            # Update last accessed
            metadata.last_accessed = datetime.utcnow().isoformat()
            self._save_model_metadata()
            
            self.logger.info(f"Retrieved model: {metadata.name}")
            
            return output_path
            
        except Exception as e:
            # Clean up on failure
            if output_path and Path(output_path).exists():
                Path(output_path).unlink()
            raise VaultError(f"Failed to retrieve model: {str(e)}")
    
    def list_models(self) -> List[Dict[str, Any]]:
        """
        List all models in the vault.
        
        Returns:
            List of model information
            
        Raises:
            VaultAccessError: If not authenticated
        """
        if not self._is_authenticated:
            raise VaultAccessError("Vault not authenticated")
        
        models = []
        for model_id, metadata in self._metadata_cache.items():
            model_info = {
                "id": model_id,
                "name": metadata.name,
                "model_type": metadata.model_type,
                "file_size": metadata.file_size,
                "encrypted_size": metadata.encrypted_size,
                "checksum": metadata.checksum,
                "created_at": metadata.created_at,
                "last_accessed": metadata.last_accessed,
                "description": metadata.description,
                "tags": metadata.tags
            }
            models.append(model_info)
        
        return models
    
    def remove_model(self, model_id: str) -> None:
        """
        Remove a model from the vault.
        
        Args:
            model_id: Model ID
            
        Raises:
            VaultAccessError: If not authenticated
            VaultError: If model removal fails
        """
        if not self._is_authenticated:
            raise VaultAccessError("Vault not authenticated")
        
        try:
            metadata = self._metadata_cache.get(model_id)
            if not metadata:
                raise VaultError(f"Model not found: {model_id}")
            
            # Remove encrypted file
            encrypted_path = Path(metadata.encrypted_path)
            if encrypted_path.exists():
                encrypted_path.unlink()
            
            # Remove from metadata
            del self._metadata_cache[model_id]
            self._save_model_metadata()
            self._update_vault_metadata()
            
            self.logger.info(f"Removed model from vault: {metadata.name}")
            
        except Exception as e:
            raise VaultError(f"Failed to remove model: {str(e)}")
    
    def verify_vault_integrity(self) -> Dict[str, Any]:
        """
        Verify the integrity of all models in the vault.
        
        Returns:
            Integrity verification results
            
        Raises:
            VaultAccessError: If not authenticated
        """
        if not self._is_authenticated:
            raise VaultAccessError("Vault not authenticated")
        
        results = {
            "vault_integrity": True,
            "models_verified": 0,
            "models_failed": 0,
            "failed_models": []
        }
        
        for model_id, metadata in self._metadata_cache.items():
            try:
                # Verify encrypted file exists
                encrypted_path = Path(metadata.encrypted_path)
                if not encrypted_path.exists():
                    results["models_failed"] += 1
                    results["failed_models"].append({
                        "id": model_id,
                        "name": metadata.name,
                        "error": "Encrypted file not found"
                    })
                    results["vault_integrity"] = False
                    continue
                
                # Verify encryption
                if not self.encryption_manager.verify_encryption(encrypted_path, self._encryption_key):
                    results["models_failed"] += 1
                    results["failed_models"].append({
                        "id": model_id,
                        "name": metadata.name,
                        "error": "Encryption verification failed"
                    })
                    results["vault_integrity"] = False
                    continue
                
                results["models_verified"] += 1
                
            except Exception as e:
                results["models_failed"] += 1
                results["failed_models"].append({
                    "id": model_id,
                    "name": metadata.name,
                    "error": str(e)
                })
                results["vault_integrity"] = False
        
        return results
    
    def get_vault_info(self) -> Dict[str, Any]:
        """
        Get vault information and statistics.
        
        Returns:
            Vault information
            
        Raises:
            VaultAccessError: If not authenticated
        """
        if not self._is_authenticated:
            raise VaultAccessError("Vault not authenticated")
        
        return {
            "vault_path": str(self.vault_path),
            "version": self._vault_metadata.get("version"),
            "created_at": self._vault_metadata.get("created_at"),
            "last_modified": self._vault_metadata.get("last_modified"),
            "model_count": len(self._metadata_cache),
            "total_size": sum(m.file_size for m in self._metadata_cache.values()),
            "total_encrypted_size": sum(m.encrypted_size for m in self._metadata_cache.values()),
            "encryption_algorithm": self._vault_metadata.get("encryption_algorithm"),
            "key_derivation": self._vault_metadata.get("key_derivation")
        }
    
    # Private methods
    
    def _authenticate(self) -> None:
        """Authenticate with password or keyfile."""
        try:
            if self.password:
                # For password authentication, we need a salt
                # In a real implementation, this would be stored securely
                salt = self.vault_path.name.encode() + b"vault_salt"
                self._encryption_key = self.encryption_manager.derive_key_from_password(
                    self.password, salt, use_scrypt=True
                )
            elif self.keyfile_path:
                self._encryption_key = self.encryption_manager.derive_key_from_keyfile(self.keyfile_path)
            else:
                raise VaultAccessError("No authentication method provided")
            
            self._is_authenticated = True
            self.logger.info("Vault authentication successful")
            
        except Exception as e:
            raise VaultAccessError(f"Authentication failed: {str(e)}")
    
    def _load_vault_metadata(self) -> None:
        """Load vault metadata from file."""
        with open(self.metadata_file, 'r') as f:
            self._vault_metadata = json.load(f)
    
    def _save_vault_metadata(self) -> None:
        """Save vault metadata to file."""
        with open(self.metadata_file, 'w') as f:
            json.dump(self._vault_metadata, f, indent=2)
    
    def _load_model_metadata(self) -> None:
        """Load model metadata from file."""
        metadata_file = self.vault_path / "models_metadata.json"
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                data = json.load(f)
                for model_id, metadata_dict in data.items():
                    self._metadata_cache[model_id] = ModelMetadata(**metadata_dict)
    
    def _save_model_metadata(self) -> None:
        """Save model metadata to file."""
        metadata_file = self.vault_path / "models_metadata.json"
        data = {model_id: asdict(metadata) for model_id, metadata in self._metadata_cache.items()}
        with open(metadata_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _update_vault_metadata(self) -> None:
        """Update vault metadata with current statistics."""
        self._vault_metadata["last_modified"] = datetime.utcnow().isoformat()
        self._vault_metadata["model_count"] = len(self._metadata_cache)
        self._vault_metadata["total_size"] = sum(m.file_size for m in self._metadata_cache.values())
        self._save_vault_metadata()
    
    def _verify_vault_integrity(self) -> None:
        """Verify basic vault integrity."""
        required_dirs = [self.models_dir, self.temp_dir]
        for dir_path in required_dirs:
            if not dir_path.exists():
                raise VaultCorruptionError(f"Missing vault directory: {dir_path}")
    
    def _detect_model_type(self, model_path: Path) -> str:
        """Detect model type from file extension."""
        suffix = model_path.suffix.lower()
        type_mapping = {
            '.pt': 'pytorch',
            '.pth': 'pytorch',
            '.pkl': 'pytorch',
            '.onnx': 'onnx',
            '.pb': 'tensorflow',
            '.h5': 'tensorflow',
            '.tflite': 'tensorflow',
            '.bin': 'transformers',
            '.safetensors': 'transformers'
        }
        return type_mapping.get(suffix, 'unknown')
    
    def _get_file_extension(self, model_type: str) -> str:
        """Get file extension for model type."""
        extension_mapping = {
            'pytorch': 'pt',
            'onnx': 'onnx',
            'tensorflow': 'pb',
            'transformers': 'bin'
        }
        return extension_mapping.get(model_type, 'bin')
    
    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA-256 checksum of file."""
        hash_sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def _set_vault_permissions(self) -> None:
        """Set secure permissions on vault directory."""
        try:
            self.vault_path.chmod(0o700)
            self.models_dir.chmod(0o700)
            self.temp_dir.chmod(0o700)
            self.metadata_file.chmod(0o600)
        except OSError:
            # Permission setting might fail on some systems
            pass
    
    def _delete_vault(self) -> None:
        """Delete existing vault."""
        import shutil
        if self.vault_path.exists():
            shutil.rmtree(self.vault_path)
    
    def _clear_temp_directory(self) -> None:
        """Clear temporary directory."""
        import shutil
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
            self.temp_dir.mkdir(exist_ok=True)
