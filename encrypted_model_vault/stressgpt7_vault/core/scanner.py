"""
Model scanner for discovering AI model files in directories.

Provides:
- Recursive directory scanning
- Model format detection
- File filtering and validation
- Progress tracking
- Duplicate detection
"""

import os
import hashlib
from typing import List, Dict, Set, Optional, Callable, Generator
from pathlib import Path
from dataclasses import dataclass
from ..utils.logger import VaultLogger


@dataclass
class ModelFile:
    """Information about a discovered model file."""
    path: Path
    name: str
    size: int
    format: str
    checksum: str
    modified_time: float
    detected_framework: Optional[str] = None
    confidence: float = 0.0


class ModelScanner:
    """
    Scans directories for AI model files.
    
    Features:
    - Recursive directory scanning
    - Multiple model format detection
    - File validation and filtering
    - Progress tracking
    - Duplicate detection
    - Framework detection
    """
    
    # Model file patterns by format
    MODEL_PATTERNS = {
        'pytorch': [
            '*.pt', '*.pth', '*.pkl',
            'model.pt', 'model.pth', 'checkpoint.pt',
            '*.pth.tar', '*.pt.tar'
        ],
        'onnx': [
            '*.onnx', 'model.onnx'
        ],
        'tensorflow': [
            '*.pb', '*.h5', '*.tflite',
            'saved_model.pb', 'model.pb',
            'model.h5', 'checkpoint.h5'
        ],
        'transformers': [
            '*.bin', '*.safetensors',
            'pytorch_model.bin', 'model.safetensors',
            'tf_model.h5'
        ],
        'caffe': [
            '*.caffemodel', '*.prototxt'
        ],
        'darknet': [
            '*.weights', '*.cfg'
        ],
        'coreml': [
            '*.mlmodel', '*.mlpackage'
        ]
    }
    
    # File size limits (bytes)
    MIN_MODEL_SIZE = 1024  # 1KB
    MAX_MODEL_SIZE = 100 * 1024 * 1024 * 1024  # 100GB
    
    # Common non-model files to exclude
    EXCLUDE_PATTERNS = [
        '*.txt', '*.md', '*.json', '*.yaml', '*.yml',
        '*.py', '*.js', '*.html', '*.css',
        '*.jpg', '*.png', '*.gif', '*.bmp',
        '*.log', '*.tmp', '*.bak', '*.swp',
        '__pycache__', '.git', '.vscode', 'node_modules'
    ]
    
    def __init__(self):
        self.logger = VaultLogger("ModelScanner")
    
    def scan_directory(
        self,
        directory: Union[str, Path],
        recursive: bool = True,
        max_depth: Optional[int] = None,
        progress_callback: Optional[Callable[[float], None]] = None,
        filter_callback: Optional[Callable[[ModelFile], bool]] = None
    ) -> List[ModelFile]:
        """
        Scan a directory for model files.
        
        Args:
            directory: Directory to scan
            recursive: Whether to scan recursively
            max_depth: Maximum recursion depth
            progress_callback: Optional progress callback (0-100)
            filter_callback: Optional filter function
            
        Returns:
            List of discovered model files
            
        Raises:
            ScannerError: If scanning fails
        """
        directory = Path(directory)
        
        if not directory.exists():
            raise ScannerError(f"Directory does not exist: {directory}")
        
        if not directory.is_dir():
            raise ScannerError(f"Path is not a directory: {directory}")
        
        self.logger.info(f"Scanning directory: {directory}")
        
        model_files = []
        total_files = 0
        processed_files = 0
        
        # Count total files first for progress tracking
        if progress_callback:
            total_files = self._count_files(directory, recursive, max_depth)
        
        # Scan for model files
        for model_file in self._scan_generator(directory, recursive, max_depth):
            processed_files += 1
            
            # Apply filter if provided
            if filter_callback and not filter_callback(model_file):
                continue
            
            model_files.append(model_file)
            
            # Update progress
            if progress_callback and total_files > 0:
                progress = (processed_files / total_files) * 100
                progress_callback(progress)
        
        self.logger.info(f"Found {len(model_files)} model files")
        
        return model_files
    
    def find_duplicates(self, model_files: List[ModelFile]) -> Dict[str, List[ModelFile]]:
        """
        Find duplicate model files based on checksum.
        
        Args:
            model_files: List of model files to check
            
        Returns:
            Dictionary mapping checksum to list of duplicate files
        """
        duplicates: Dict[str, List[ModelFile]] = {}
        checksum_groups: Dict[str, List[ModelFile]] = {}
        
        # Group by checksum
        for model_file in model_files:
            checksum = model_file.checksum
            if checksum not in checksum_groups:
                checksum_groups[checksum] = []
            checksum_groups[checksum].append(model_file)
        
        # Find duplicates (groups with more than 1 file)
        for checksum, files in checksum_groups.items():
            if len(files) > 1:
                duplicates[checksum] = files
        
        self.logger.info(f"Found {len(duplicates)} sets of duplicates")
        
        return duplicates
    
    def filter_by_size(
        self, 
        model_files: List[ModelFile],
        min_size: Optional[int] = None,
        max_size: Optional[int] = None
    ) -> List[ModelFile]:
        """
        Filter model files by size.
        
        Args:
            model_files: List of model files
            min_size: Minimum file size in bytes
            max_size: Maximum file size in bytes
            
        Returns:
            Filtered list of model files
        """
        min_size = min_size or self.MIN_MODEL_SIZE
        max_size = max_size or self.MAX_MODEL_SIZE
        
        filtered = []
        for model_file in model_files:
            if min_size <= model_file.size <= max_size:
                filtered.append(model_file)
        
        return filtered
    
    def filter_by_format(
        self, 
        model_files: List[ModelFile],
        formats: List[str]
    ) -> List[ModelFile]:
        """
        Filter model files by format.
        
        Args:
            model_files: List of model files
            formats: List of formats to include
            
        Returns:
            Filtered list of model files
        """
        filtered = []
        for model_file in model_files:
            if model_file.format in formats:
                filtered.append(model_file)
        
        return filtered
    
    def get_scan_statistics(self, model_files: List[ModelFile]) -> Dict[str, any]:
        """
        Get statistics about scanned model files.
        
        Args:
            model_files: List of model files
            
        Returns:
            Statistics dictionary
        """
        if not model_files:
            return {
                "total_files": 0,
                "total_size": 0,
                "formats": {},
                "average_size": 0,
                "largest_file": None,
                "smallest_file": None
            }
        
        # Calculate statistics
        total_size = sum(f.size for f in model_files)
        format_counts: Dict[str, int] = {}
        
        for model_file in model_files:
            format_counts[model_file.format] = format_counts.get(model_file.format, 0) + 1
        
        largest_file = max(model_files, key=lambda f: f.size)
        smallest_file = min(model_files, key=lambda f: f.size)
        
        return {
            "total_files": len(model_files),
            "total_size": total_size,
            "total_size_mb": total_size / (1024 * 1024),
            "total_size_gb": total_size / (1024 * 1024 * 1024),
            "formats": format_counts,
            "average_size": total_size / len(model_files),
            "average_size_mb": (total_size / len(model_files)) / (1024 * 1024),
            "largest_file": {
                "name": largest_file.name,
                "path": str(largest_file.path),
                "size": largest_file.size,
                "size_mb": largest_file.size / (1024 * 1024)
            },
            "smallest_file": {
                "name": smallest_file.name,
                "path": str(smallest_file.path),
                "size": smallest_file.size,
                "size_mb": smallest_file.size / (1024 * 1024)
            }
        }
    
    def _scan_generator(
        self, 
        directory: Path, 
        recursive: bool, 
        max_depth: Optional[int]
    ) -> Generator[ModelFile, None, None]:
        """Generator for scanning files."""
        
        def scan_recursive(current_dir: Path, current_depth: int):
            if max_depth is not None and current_depth >= max_depth:
                return
            
            try:
                for item in current_dir.iterdir():
                    if item.is_file():
                        # Check if it's a model file
                        model_file = self._check_model_file(item)
                        if model_file:
                            yield model_file
                    
                    elif item.is_dir() and recursive:
                        # Skip excluded directories
                        if self._should_exclude_directory(item):
                            continue
                        
                        # Recurse into subdirectory
                        yield from scan_recursive(item, current_depth + 1)
            
            except PermissionError:
                self.logger.warning(f"Permission denied accessing: {current_dir}")
            except OSError as e:
                self.logger.warning(f"Error accessing {current_dir}: {str(e)}")
        
        yield from scan_recursive(directory, 0)
    
    def _check_model_file(self, file_path: Path) -> Optional[ModelFile]:
        """Check if a file is a model file and create ModelFile object."""
        try:
            # Check if file should be excluded
            if self._should_exclude_file(file_path):
                return None
            
            # Check file size
            file_size = file_path.stat().st_size
            if file_size < self.MIN_MODEL_SIZE or file_size > self.MAX_MODEL_SIZE:
                return None
            
            # Detect format
            format_info = self._detect_format(file_path)
            if not format_info:
                return None
            
            # Calculate checksum
            checksum = self._calculate_checksum(file_path)
            
            # Get modification time
            modified_time = file_path.stat().st_mtime
            
            # Create ModelFile object
            model_file = ModelFile(
                path=file_path,
                name=file_path.name,
                size=file_size,
                format=format_info['format'],
                checksum=checksum,
                modified_time=modified_time,
                detected_framework=format_info.get('framework'),
                confidence=format_info.get('confidence', 0.0)
            )
            
            return model_file
            
        except (OSError, PermissionError):
            return None
    
    def _detect_format(self, file_path: Path) -> Optional[Dict[str, any]]:
        """Detect model format from file path and content."""
        file_name = file_path.name.lower()
        file_extension = file_path.suffix.lower()
        
        # Check by extension and patterns
        for format_name, patterns in self.MODEL_PATTERNS.items():
            for pattern in patterns:
                if self._matches_pattern(file_name, pattern):
                    # Additional confidence checks
                    confidence = self._calculate_confidence(file_path, format_name)
                    
                    return {
                        'format': format_name,
                        'framework': self._get_framework_for_format(format_name),
                        'confidence': confidence
                    }
        
        return None
    
    def _matches_pattern(self, file_name: str, pattern: str) -> bool:
        """Check if filename matches pattern."""
        import fnmatch
        return fnmatch.fnmatch(file_name, pattern)
    
    def _calculate_confidence(self, file_path: Path, format_name: str) -> float:
        """Calculate confidence score for format detection."""
        confidence = 0.5  # Base confidence
        
        file_name = file_path.name.lower()
        file_extension = file_path.suffix.lower()
        
        # Boost confidence for common model names
        if any(keyword in file_name for keyword in ['model', 'checkpoint', 'weights', 'network']):
            confidence += 0.2
        
        # Boost confidence for standard extensions
        if file_extension in ['.pt', '.pth', '.onnx', '.pb', '.h5', '.bin']:
            confidence += 0.2
        
        # Boost confidence for size (models are typically large)
        try:
            file_size = file_path.stat().st_size
            if file_size > 1024 * 1024:  # > 1MB
                confidence += 0.1
        except:
            pass
        
        return min(confidence, 1.0)
    
    def _get_framework_for_format(self, format_name: str) -> Optional[str]:
        """Get framework name for format."""
        framework_mapping = {
            'pytorch': 'PyTorch',
            'onnx': 'ONNX',
            'tensorflow': 'TensorFlow',
            'transformers': 'Hugging Face Transformers',
            'caffe': 'Caffe',
            'darknet': 'Darknet/YOLO',
            'coreml': 'Core ML'
        }
        return framework_mapping.get(format_name)
    
    def _should_exclude_file(self, file_path: Path) -> bool:
        """Check if file should be excluded from scanning."""
        file_name = file_path.name.lower()
        
        # Check exclude patterns
        for pattern in self.EXCLUDE_PATTERNS:
            if self._matches_pattern(file_name, pattern):
                return True
        
        return False
    
    def _should_exclude_directory(self, dir_path: Path) -> bool:
        """Check if directory should be excluded from scanning."""
        dir_name = dir_path.name.lower()
        
        # Exclude common non-model directories
        exclude_dirs = {
            '__pycache__', '.git', '.vscode', 'node_modules',
            'venv', 'env', '.env', 'build', 'dist', 'target',
            '.idea', '.pytest_cache', '.mypy_cache'
        }
        
        return dir_name in exclude_dirs
    
    def _count_files(self, directory: Path, recursive: bool, max_depth: Optional[int]) -> int:
        """Count total files for progress tracking."""
        count = 0
        
        def count_recursive(current_dir: Path, current_depth: int):
            nonlocal count
            
            if max_depth is not None and current_depth >= max_depth:
                return
            
            try:
                for item in current_dir.iterdir():
                    if item.is_file():
                        count += 1
                    elif item.is_dir() and recursive and not self._should_exclude_directory(item):
                        count_recursive(item, current_depth + 1)
            except (PermissionError, OSError):
                pass
        
        count_recursive(directory, 0)
        return count
    
    def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA-256 checksum of file."""
        hash_sha256 = hashlib.sha256()
        
        try:
            with open(file_path, 'rb') as f:
                # Read in chunks to handle large files
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            
            return hash_sha256.hexdigest()
            
        except (OSError, PermissionError):
            # Return a hash of the path if file can't be read
            return hashlib.sha256(str(file_path).encode()).hexdigest()


class ScannerError(Exception):
    """Base exception for scanner errors."""
    pass
