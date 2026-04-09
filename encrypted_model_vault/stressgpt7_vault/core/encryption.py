"""
Core encryption module using AES-256-GCM for secure model storage.

Provides:
- Strong AES-256-GCM encryption
- PBKDF2 key derivation
- Secure random IV generation
- File chunk encryption for large models
- Password and keyfile-based authentication
"""

import os
import hashlib
import struct
from typing import Optional, Tuple, Union, BinaryIO
from pathlib import Path
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidTag
import scrypt


class EncryptionError(Exception):
    """Base exception for encryption operations."""
    pass


class KeyDerivationError(EncryptionError):
    """Exception for key derivation failures."""
    pass


class DecryptionError(EncryptionError):
    """Exception for decryption failures."""
    pass


class EncryptionManager:
    """
    Manages AES-256-GCM encryption and key derivation for model vault.
    
    Features:
    - AES-256-GCM encryption with authentication
    - PBKDF2 and scrypt key derivation
    - Secure random IV generation
    - Chunk-based encryption for large files
    - Password and keyfile support
    """
    
    # Constants for encryption
    ALGORITHM = algorithms.AES
    MODE = modes.GCM
    KEY_SIZE = 32  # 256 bits
    IV_SIZE = 12   # 96 bits for GCM
    TAG_SIZE = 16  # 128 bits authentication tag
    CHUNK_SIZE = 64 * 1024  # 64KB chunks for large files
    
    # Constants for key derivation
    PBKDF2_ITERATIONS = 100000
    SALT_SIZE = 32
    SCRYPT_N = 2 ** 20  # CPU/memory cost
    SCRYPT_R = 8        # Block size
    SCRYPT_P = 1        # Parallelization
    
    def __init__(self):
        self.backend = default_backend()
    
    def derive_key_from_password(
        self, 
        password: str, 
        salt: bytes, 
        use_scrypt: bool = True
    ) -> bytes:
        """
        Derive encryption key from password using PBKDF2 or scrypt.
        
        Args:
            password: User password
            salt: Random salt
            use_scrypt: Use scrypt (more secure) or PBKDF2
            
        Returns:
            32-byte encryption key
            
        Raises:
            KeyDerivationError: If key derivation fails
        """
        try:
            password_bytes = password.encode('utf-8')
            
            if use_scrypt:
                # Use scrypt for stronger key derivation
                key = scrypt.hash(
                    password_bytes,
                    salt,
                    self.KEY_SIZE,
                    self.SCRYPT_N,
                    self.SCRYPT_R,
                    self.SCRYPT_P
                )
            else:
                # Fallback to PBKDF2
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=self.KEY_SIZE,
                    salt=salt,
                    iterations=self.PBKDF2_ITERATIONS,
                    backend=self.backend
                )
                key = kdf.derive(password_bytes)
            
            return key
            
        except Exception as e:
            raise KeyDerivationError(f"Key derivation failed: {str(e)}")
    
    def derive_key_from_keyfile(self, keyfile_path: Union[str, Path]) -> bytes:
        """
        Derive encryption key from keyfile.
        
        Args:
            keyfile_path: Path to keyfile
            
        Returns:
            32-byte encryption key
            
        Raises:
            KeyDerivationError: If keyfile cannot be processed
        """
        try:
            keyfile_path = Path(keyfile_path)
            
            if not keyfile_path.exists():
                raise KeyDerivationError(f"Keyfile not found: {keyfile_path}")
            
            with open(keyfile_path, 'rb') as f:
                keyfile_data = f.read()
            
            # Use SHA-256 to derive 32-byte key from keyfile
            key = hashlib.sha256(keyfile_data).digest()
            
            return key
            
        except Exception as e:
            raise KeyDerivationError(f"Keyfile derivation failed: {str(e)}")
    
    def generate_salt(self) -> bytes:
        """Generate cryptographically secure random salt."""
        return os.urandom(self.SALT_SIZE)
    
    def generate_iv(self) -> bytes:
        """Generate cryptographically secure random IV."""
        return os.urandom(self.IV_SIZE)
    
    def encrypt_data(
        self, 
        data: bytes, 
        key: bytes, 
        iv: Optional[bytes] = None
    ) -> Tuple[bytes, bytes, bytes]:
        """
        Encrypt data using AES-256-GCM.
        
        Args:
            data: Data to encrypt
            key: 32-byte encryption key
            iv: Optional IV (generated if not provided)
            
        Returns:
            Tuple of (encrypted_data, iv, authentication_tag)
            
        Raises:
            EncryptionError: If encryption fails
        """
        try:
            if len(key) != self.KEY_SIZE:
                raise EncryptionError(f"Invalid key size: {len(key)} bytes")
            
            if iv is None:
                iv = self.generate_iv()
            
            cipher = Cipher(
                self.ALGORITHM(key),
                self.MODE(iv),
                backend=self.backend
            )
            encryptor = cipher.encryptor()
            
            encrypted_data = encryptor.update(data) + encryptor.finalize()
            tag = encryptor.tag
            
            return encrypted_data, iv, tag
            
        except Exception as e:
            raise EncryptionError(f"Data encryption failed: {str(e)}")
    
    def decrypt_data(
        self, 
        encrypted_data: bytes, 
        key: bytes, 
        iv: bytes, 
        tag: bytes
    ) -> bytes:
        """
        Decrypt data using AES-256-GCM.
        
        Args:
            encrypted_data: Encrypted data
            key: 32-byte encryption key
            iv: Initialization vector
            tag: Authentication tag
            
        Returns:
            Decrypted data
            
        Raises:
            DecryptionError: If decryption fails or authentication fails
        """
        try:
            if len(key) != self.KEY_SIZE:
                raise DecryptionError(f"Invalid key size: {len(key)} bytes")
            
            if len(iv) != self.IV_SIZE:
                raise DecryptionError(f"Invalid IV size: {len(iv)} bytes")
            
            if len(tag) != self.TAG_SIZE:
                raise DecryptionError(f"Invalid tag size: {len(tag)} bytes")
            
            cipher = Cipher(
                self.ALGORITHM(key),
                self.MODE(iv, tag),
                backend=self.backend
            )
            decryptor = cipher.decryptor()
            
            decrypted_data = decryptor.update(encrypted_data) + decryptor.finalize()
            
            return decrypted_data
            
        except InvalidTag:
            raise DecryptionError("Authentication failed - data may be tampered")
        except Exception as e:
            raise DecryptionError(f"Data decryption failed: {str(e)}")
    
    def encrypt_file(
        self, 
        input_path: Union[str, Path], 
        output_path: Union[str, Path],
        key: bytes,
        progress_callback: Optional[callable] = None
    ) -> Tuple[bytes, bytes, bytes]:
        """
        Encrypt a file using chunk-based encryption for large files.
        
        Args:
            input_path: Path to input file
            output_path: Path to output encrypted file
            key: 32-byte encryption key
            progress_callback: Optional progress callback function
            
        Returns:
            Tuple of (salt, iv, tag) for the encrypted file
            
        Raises:
            EncryptionError: If encryption fails
        """
        try:
            input_path = Path(input_path)
            output_path = Path(output_path)
            
            if not input_path.exists():
                raise EncryptionError(f"Input file not found: {input_path}")
            
            # Generate salt and IV
            salt = self.generate_salt()
            iv = self.generate_iv()
            
            # Get file size for progress tracking
            file_size = input_path.stat().st_size
            bytes_processed = 0
            
            with open(input_path, 'rb') as infile, open(output_path, 'wb') as outfile:
                # Write header with metadata
                header = struct.pack('<QQQ', file_size, len(salt), len(iv))
                outfile.write(header)
                outfile.write(salt)
                outfile.write(iv)
                
                # Initialize cipher for streaming encryption
                cipher = Cipher(
                    self.ALGORITHM(key),
                    self.MODE(iv),
                    backend=self.backend
                )
                encryptor = cipher.encryptor()
                
                # Encrypt file in chunks
                while True:
                    chunk = infile.read(self.CHUNK_SIZE)
                    if not chunk:
                        break
                    
                    encrypted_chunk = encryptor.update(chunk)
                    outfile.write(encrypted_chunk)
                    
                    bytes_processed += len(chunk)
                    
                    if progress_callback:
                        progress = (bytes_processed / file_size) * 100
                        progress_callback(progress)
                
                # Finalize encryption and write tag
                final_chunk = encryptor.finalize()
                outfile.write(final_chunk)
                outfile.write(encryptor.tag)
            
            return salt, iv, encryptor.tag
            
        except Exception as e:
            # Clean up output file on error
            output_path = Path(output_path)
            if output_path.exists():
                output_path.unlink()
            raise EncryptionError(f"File encryption failed: {str(e)}")
    
    def decrypt_file(
        self, 
        input_path: Union[str, Path], 
        output_path: Union[str, Path],
        key: bytes,
        progress_callback: Optional[callable] = None
    ) -> None:
        """
        Decrypt a file that was encrypted with chunk-based encryption.
        
        Args:
            input_path: Path to encrypted file
            output_path: Path to output decrypted file
            key: 32-byte encryption key
            progress_callback: Optional progress callback function
            
        Raises:
            DecryptionError: If decryption fails
        """
        try:
            input_path = Path(input_path)
            output_path = Path(output_path)
            
            if not input_path.exists():
                raise DecryptionError(f"Encrypted file not found: {input_path}")
            
            with open(input_path, 'rb') as infile, open(output_path, 'wb') as outfile:
                # Read header
                header = infile.read(struct.calcsize('<QQQ'))
                file_size, salt_size, iv_size = struct.unpack('<QQQ', header)
                
                # Read salt and IV
                salt = infile.read(salt_size)
                iv = infile.read(iv_size)
                
                # Read remaining data (encrypted data + final chunk + tag)
                encrypted_data = infile.read()
                
                # Split encrypted data, final chunk, and tag
                tag = encrypted_data[-self.TAG_SIZE:]
                final_chunk = encrypted_data[-(self.TAG_SIZE + 32):-self.TAG_SIZE]  # Max 32 bytes final
                main_encrypted = encrypted_data[:-(self.TAG_SIZE + 32)]
                
                # Initialize cipher for streaming decryption
                cipher = Cipher(
                    self.ALGORITHM(key),
                    self.MODE(iv, tag),
                    backend=self.backend
                )
                decryptor = cipher.decryptor()
                
                # Decrypt main encrypted data
                decrypted_main = decryptor.update(main_encrypted)
                outfile.write(decrypted_main)
                
                # Decrypt final chunk
                decrypted_final = decryptor.update(final_chunk) + decryptor.finalize()
                outfile.write(decrypted_final)
            
            # Verify file size
            actual_size = output_path.stat().st_size
            if actual_size != file_size:
                output_path.unlink()
                raise DecryptionError(f"Size mismatch: expected {file_size}, got {actual_size}")
            
        except Exception as e:
            # Clean up output file on error
            output_path = Path(output_path)
            if output_path.exists():
                output_path.unlink()
            raise DecryptionError(f"File decryption failed: {str(e)}")
    
    def verify_encryption(
        self, 
        encrypted_path: Union[str, Path], 
        key: bytes
    ) -> bool:
        """
        Verify that an encrypted file can be decrypted with the given key.
        
        Args:
            encrypted_path: Path to encrypted file
            key: 32-byte encryption key
            
        Returns:
            True if verification succeeds, False otherwise
        """
        try:
            import tempfile
            
            with tempfile.NamedTemporaryFile(delete=True) as temp_file:
                self.decrypt_file(encrypted_path, temp_file.name, key)
                return True
                
        except DecryptionError:
            return False
        except Exception:
            return False
    
    def generate_keyfile(self, output_path: Union[str, Path]) -> bytes:
        """
        Generate a new random keyfile.
        
        Args:
            output_path: Path where to save the keyfile
            
        Returns:
            Generated key data
            
        Raises:
            EncryptionError: If keyfile generation fails
        """
        try:
            output_path = Path(output_path)
            
            # Generate random key data
            key_data = os.urandom(64)  # 512 bits of randomness
            
            # Write keyfile
            with open(output_path, 'wb') as f:
                f.write(key_data)
            
            # Set restrictive permissions
            output_path.chmod(0o600)
            
            return key_data
            
        except Exception as e:
            raise EncryptionError(f"Keyfile generation failed: {str(e)}")
