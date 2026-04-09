"""
Model loader for decrypting and loading AI models from the vault.

Provides:
- Secure model decryption and loading
- Support for multiple model formats (PyTorch, ONNX, TensorFlow)
- Memory-efficient loading for large models
- Model validation and integrity checks
- Framework-specific loading utilities
"""

import os
import tempfile
from typing import Optional, Union, Dict, Any, Callable
from pathlib import Path
from contextlib import contextmanager
from .vault_manager import VaultManager, VaultAccessError
from .encryption import DecryptionError
from ..utils.logger import VaultLogger


class ModelLoadError(Exception):
    """Base exception for model loading failures."""
    pass


class UnsupportedModelFormatError(ModelLoadError):
    """Exception for unsupported model formats."""
    pass


class ModelValidationError(ModelLoadError):
    """Exception for model validation failures."""
    pass


class ModelLoader:
    """
    Loads and manages AI models from the encrypted vault.
    
    Features:
    - Secure model decryption and loading
    - Support for PyTorch, ONNX, TensorFlow models
    - Memory-efficient loading
    - Model validation
    - Temporary file management
    """
    
    # Supported model formats
    SUPPORTED_FORMATS = {
        'pytorch': ['.pt', '.pth', '.pkl'],
        'onnx': ['.onnx'],
        'tensorflow': ['.pb', '.h5', '.tflite'],
        'transformers': ['.bin', '.safetensors']
    }
    
    def __init__(self, vault_manager: VaultManager):
        """
        Initialize model loader.
        
        Args:
            vault_manager: Authenticated vault manager
        """
        self.vault_manager = vault_manager
        self.logger = VaultLogger("ModelLoader")
        self._loaded_models: Dict[str, Any] = {}
        self._temp_files: Dict[str, Path] = {}
    
    @contextmanager
    def load_model(
        self, 
        model_id: str, 
        device: Optional[str] = None,
        progress_callback: Optional[Callable[[float], None]] = None
    ):
        """
        Context manager for loading and automatically cleaning up models.
        
        Args:
            model_id: Model ID to load
            device: Optional device (e.g., 'cpu', 'cuda:0')
            progress_callback: Optional progress callback
            
        Yields:
            Loaded model object
            
        Raises:
            ModelLoadError: If model loading fails
        """
        temp_path = None
        model = None
        
        try:
            # Decrypt model to temporary file
            temp_path = self.vault_manager.get_model(model_id, progress_callback=progress_callback)
            
            # Load model
            model = self._load_model_from_file(temp_path, device)
            
            yield model
            
        except Exception as e:
            raise ModelLoadError(f"Failed to load model {model_id}: {str(e)}")
        
        finally:
            # Cleanup
            if model and hasattr(model, 'cpu'):
                try:
                    model.cpu()
                except:
                    pass
            
            if temp_path and temp_path.exists():
                try:
                    temp_path.unlink()
                except:
                    pass
    
    def load_model_permanently(
        self, 
        model_id: str, 
        device: Optional[str] = None,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> Any:
        """
        Load a model and keep it in memory.
        
        Args:
            model_id: Model ID to load
            device: Optional device
            progress_callback: Optional progress callback
            
        Returns:
            Loaded model object
            
        Raises:
            ModelLoadError: If model loading fails
        """
        if model_id in self._loaded_models:
            self.logger.warning(f"Model {model_id} already loaded")
            return self._loaded_models[model_id]
        
        try:
            # Decrypt model to temporary file
            temp_path = self.vault_manager.get_model(model_id, progress_callback=progress_callback)
            self._temp_files[model_id] = temp_path
            
            # Load model
            model = self._load_model_from_file(temp_path, device)
            self._loaded_models[model_id] = model
            
            self.logger.info(f"Loaded model: {model_id}")
            return model
            
        except Exception as e:
            raise ModelLoadError(f"Failed to load model {model_id}: {str(e)}")
    
    def unload_model(self, model_id: str) -> None:
        """
        Unload a model from memory and clean up temporary files.
        
        Args:
            model_id: Model ID to unload
        """
        if model_id in self._loaded_models:
            model = self._loaded_models[model_id]
            
            # Move to CPU if possible
            if hasattr(model, 'cpu'):
                try:
                    model.cpu()
                except:
                    pass
            
            # Remove from memory
            del self._loaded_models[model_id]
            
            # Clean up temp file
            if model_id in self._temp_files:
                temp_path = self._temp_files[model_id]
                if temp_path.exists():
                    temp_path.unlink()
                del self._temp_files[model_id]
            
            self.logger.info(f"Unloaded model: {model_id}")
    
    def unload_all_models(self) -> None:
        """Unload all models from memory."""
        model_ids = list(self._loaded_models.keys())
        for model_id in model_ids:
            self.unload_model(model_id)
    
    def get_loaded_models(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about loaded models.
        
        Returns:
            Dictionary of loaded model information
        """
        loaded_info = {}
        
        for model_id, model in self._loaded_models.items():
            info = {
                "id": model_id,
                "type": type(model).__name__,
                "temp_file": str(self._temp_files.get(model_id, "Unknown"))
            }
            
            # Add model-specific information
            if hasattr(model, 'parameters'):
                try:
                    total_params = sum(p.numel() for p in model.parameters())
                    info["parameters"] = total_params
                except:
                    pass
            
            if hasattr(model, 'state_dict'):
                try:
                    state_size = sum(p.numel() * p.element_size() for p in model.state_dict().values())
                    info["state_size_mb"] = state_size / (1024 * 1024)
                except:
                    pass
            
            loaded_info[model_id] = info
        
        return loaded_info
    
    def validate_model(self, model_id: str) -> Dict[str, Any]:
        """
        Validate a model without fully loading it.
        
        Args:
            model_id: Model ID to validate
            
        Returns:
            Validation results
            
        Raises:
            ModelValidationError: If validation fails
        """
        try:
            # Get model metadata
            models = self.vault_manager.list_models()
            model_info = next((m for m in models if m["id"] == model_id), None)
            
            if not model_info:
                raise ModelValidationError(f"Model not found: {model_id}")
            
            validation_results = {
                "model_id": model_id,
                "valid": True,
                "checks": {}
            }
            
            # Check file integrity
            try:
                temp_path = self.vault_manager.get_model(model_id)
                if temp_path.exists():
                    validation_results["checks"]["file_integrity"] = "PASS"
                    validation_results["checks"]["file_size"] = temp_path.stat().st_size
                    temp_path.unlink()
                else:
                    validation_results["checks"]["file_integrity"] = "FAIL"
                    validation_results["valid"] = False
            except Exception as e:
                validation_results["checks"]["file_integrity"] = f"FAIL: {str(e)}"
                validation_results["valid"] = False
            
            # Check model format support
            model_type = model_info["model_type"]
            if model_type in self.SUPPORTED_FORMATS:
                validation_results["checks"]["format_support"] = "PASS"
            else:
                validation_results["checks"]["format_support"] = f"FAIL: Unsupported format {model_type}"
                validation_results["valid"] = False
            
            return validation_results
            
        except Exception as e:
            raise ModelValidationError(f"Validation failed for model {model_id}: {str(e)}")
    
    def _load_model_from_file(self, model_path: Path, device: Optional[str] = None) -> Any:
        """
        Load model from file based on format.
        
        Args:
            model_path: Path to model file
            device: Optional device
            
        Returns:
            Loaded model object
            
        Raises:
            ModelLoadError: If loading fails
        """
        file_extension = model_path.suffix.lower()
        
        # Try PyTorch first
        if file_extension in ['.pt', '.pth', '.pkl']:
            return self._load_pytorch_model(model_path, device)
        
        # Try ONNX
        elif file_extension == '.onnx':
            return self._load_onnx_model(model_path, device)
        
        # Try TensorFlow
        elif file_extension in ['.pb', '.h5', '.tflite']:
            return self._load_tensorflow_model(model_path, device)
        
        # Try Transformers
        elif file_extension in ['.bin', '.safetensors']:
            return self._load_transformers_model(model_path, device)
        
        else:
            raise UnsupportedModelFormatError(f"Unsupported model format: {file_extension}")
    
    def _load_pytorch_model(self, model_path: Path, device: Optional[str] = None) -> Any:
        """Load PyTorch model."""
        try:
            import torch
            
            # Load checkpoint
            checkpoint = torch.load(model_path, map_location=device or 'cpu')
            
            # Handle different PyTorch formats
            if isinstance(checkpoint, dict):
                # Check if it's a full model state dict or just parameters
                if 'state_dict' in checkpoint:
                    # It's a checkpoint with state dict
                    state_dict = checkpoint['state_dict']
                    
                    # Try to create model if we have enough info
                    if 'model' in checkpoint:
                        model = checkpoint['model']
                        model.load_state_dict(state_dict)
                    else:
                        # Just return the state dict
                        model = state_dict
                elif all(isinstance(k, str) for k in checkpoint.keys()):
                    # Likely just a state dict
                    model = checkpoint
                else:
                    # Return the checkpoint as-is
                    model = checkpoint
            else:
                # Direct model object
                model = checkpoint
            
            # Move to device if specified
            if device and hasattr(model, 'to'):
                model = model.to(device)
            
            return model
            
        except ImportError:
            raise ModelLoadError("PyTorch not installed")
        except Exception as e:
            raise ModelLoadError(f"Failed to load PyTorch model: {str(e)}")
    
    def _load_onnx_model(self, model_path: Path, device: Optional[str] = None) -> Any:
        """Load ONNX model."""
        try:
            import onnx
            import onnxruntime as ort
            
            # Validate ONNX model
            onnx_model = onnx.load(str(model_path))
            onnx.checker.check_model(onnx_model)
            
            # Create inference session
            providers = ['CPUExecutionProvider']
            if device and 'cuda' in device.lower():
                try:
                    providers.insert(0, 'CUDAExecutionProvider')
                except:
                    pass
            
            session = ort.InferenceSession(str(model_path), providers=providers)
            
            return {
                'type': 'onnx',
                'session': session,
                'model': onnx_model,
                'inputs': [input.name for input in session.get_inputs()],
                'outputs': [output.name for output in session.get_outputs()]
            }
            
        except ImportError:
            raise ModelLoadError("ONNX or ONNX Runtime not installed")
        except Exception as e:
            raise ModelLoadError(f"Failed to load ONNX model: {str(e)}")
    
    def _load_tensorflow_model(self, model_path: Path, device: Optional[str] = None) -> Any:
        """Load TensorFlow model."""
        try:
            import tensorflow as tf
            
            # Handle different TensorFlow formats
            if model_path.suffix == '.pb':
                # Frozen graph
                model = tf.saved_model.load(str(model_path.parent))
            elif model_path.suffix == '.h5':
                # Keras model
                model = tf.keras.models.load_model(str(model_path))
            elif model_path.suffix == '.tflite':
                # TensorFlow Lite
                interpreter = tf.lite.Interpreter(model_path=str(model_path))
                interpreter.allocate_tensors()
                model = {
                    'type': 'tflite',
                    'interpreter': interpreter,
                    'input_details': interpreter.get_input_details(),
                    'output_details': interpreter.get_output_details()
                }
            else:
                raise ModelLoadError(f"Unknown TensorFlow format: {model_path.suffix}")
            
            return model
            
        except ImportError:
            raise ModelLoadError("TensorFlow not installed")
        except Exception as e:
            raise ModelLoadError(f"Failed to load TensorFlow model: {str(e)}")
    
    def _load_transformers_model(self, model_path: Path, device: Optional[str] = None) -> Any:
        """Load Transformers model."""
        try:
            from transformers import AutoConfig, AutoModel
            
            # Try to detect model type from config or file structure
            config = AutoConfig.from_pretrained(model_path.parent, local_files_only=True)
            
            model = AutoModel.from_pretrained(
                model_path.parent,
                config=config,
                local_files_only=True
            )
            
            # Move to device if specified
            if device and hasattr(model, 'to'):
                model = model.to(device)
            
            return model
            
        except ImportError:
            raise ModelLoadError("Transformers library not installed")
        except Exception as e:
            raise ModelLoadError(f"Failed to load Transformers model: {str(e)}")
    
    def __del__(self):
        """Cleanup when loader is destroyed."""
        try:
            self.unload_all_models()
        except:
            pass
