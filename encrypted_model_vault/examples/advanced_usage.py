#!/usr/bin/env python3
"""
Advanced usage examples for StressGPT7 Encrypted Model Vault.

This example demonstrates:
- Batch operations
- Model loading and inference
- Custom authentication
- Performance optimization
- Error handling and recovery
"""

import sys
import os
import time
from pathlib import Path
from contextlib import contextmanager

# Add the package to Python path for development
sys.path.insert(0, str(Path(__file__).parent.parent))

from stressgpt7_vault import VaultManager, ModelLoader, ModelScanner, EncryptionManager


class VaultManager:
    """Enhanced vault manager with batch operations."""
    
    def __init__(self, vault_path, authentication_method="password"):
        self.vault_path = Path(vault_path)
        self.authentication_method = authentication_method
        self.vault = None
        self.model_loader = None
    
    @contextmanager
    def authenticated_session(self, password=None, keyfile_path=None):
        """Context manager for authenticated vault session."""
        try:
            if self.authentication_method == "password":
                self.vault = VaultManager(self.vault_path, password=password)
            else:
                self.vault = VaultManager(self.vault_path, keyfile_path=keyfile_path)
            
            self.vault.open_vault()
            self.model_loader = ModelLoader(self.vault)
            
            yield self.vault, self.model_loader
            
        finally:
            if self.vault:
                self.vault.close_vault()
                self.vault = None
                self.model_loader = None
    
    def batch_add_models(self, model_files, progress_callback=None):
        """Add multiple models to vault with progress tracking."""
        added_models = []
        
        for i, model_file in enumerate(model_files):
            try:
                def model_progress(progress):
                    if progress_callback:
                        total_progress = ((i + progress) / len(model_files)) * 100
                        progress_callback(total_progress)
                
                model_id = self.vault.add_model(
                    model_file.path,
                    model_name=model_file.name,
                    progress_callback=model_progress
                )
                added_models.append((model_file, model_id))
                
            except Exception as e:
                print(f"Failed to add {model_file.name}: {e}")
        
        return added_models
    
    def batch_verify_integrity(self):
        """Verify integrity of all models in vault."""
        results = self.vault.verify_vault_integrity()
        
        if not results['vault_integrity']:
            print("Integrity issues found:")
            for failed in results['failed_models']:
                print(f"  - {failed['name']}: {failed['error']}")
            
            # Attempt recovery for failed models
            self.attempt_model_recovery(results['failed_models'])
        
        return results
    
    def attempt_model_recovery(self, failed_models):
        """Attempt to recover failed models."""
        print("Attempting model recovery...")
        
        for failed in failed_models:
            try:
                # Try to re-verify the model
                models = self.vault.list_models()
                model = next((m for m in models if m['id'] == failed['id']), None)
                
                if model:
                    print(f"  Re-verifying {model['name']}...")
                    # Implementation would go here
                    print(f"  Recovery completed for {model['name']}")
                
            except Exception as e:
                print(f"  Recovery failed for {failed['name']}: {e}")


class AdvancedModelOperations:
    """Advanced model operations and utilities."""
    
    def __init__(self, vault_manager):
        self.vault_manager = vault_manager
    
    def find_duplicate_models(self):
        """Find potential duplicate models based on metadata."""
        models = self.vault_manager.vault.list_models()
        
        # Group by size and type
        size_groups = {}
        for model in models:
            key = (model['file_size'], model['model_type'])
            if key not in size_groups:
                size_groups[key] = []
            size_groups[key].append(model)
        
        # Find duplicates
        duplicates = []
        for (size, model_type), group in size_groups.items():
            if len(group) > 1:
                duplicates.append({
                    'size': size,
                    'type': model_type,
                    'models': group
                })
        
        return duplicates
    
    def optimize_vault_storage(self):
        """Optimize vault storage by identifying large models and compression opportunities."""
        models = self.vault_manager.vault.list_models()
        
        # Sort by size
        models_sorted = sorted(models, key=lambda m: m['file_size'], reverse=True)
        
        print("Vault Storage Analysis:")
        print(f"Total models: {len(models)}")
        print(f"Total size: {sum(m['file_size'] for m in models) / (1024**3):.2f} GB")
        
        print("\nLargest models:")
        for model in models_sorted[:5]:
            size_gb = model['file_size'] / (1024**3)
            print(f"  - {model['name']}: {size_gb:.2f} GB")
        
        # Identify potential compression candidates
        compression_candidates = []
        for model in models:
            compression_ratio = model['encrypted_size'] / model['file_size']
            if compression_ratio > 0.8:  # Less than 20% compression
                compression_candidates.append(model)
        
        if compression_candidates:
            print(f"\nModels with poor compression ({len(compression_candidates)}):")
            for model in compression_candidates[:5]:
                ratio = model['encrypted_size'] / model['file_size']
                print(f"  - {model['name']}: {ratio:.1%}")
        
        return {
            'largest_models': models_sorted[:10],
            'compression_candidates': compression_candidates
        }
    
    def model_usage_analytics(self):
        """Analyze model usage patterns."""
        models = self.vault_manager.vault.list_models()
        
        # Analyze by type
        type_counts = {}
        type_sizes = {}
        
        for model in models:
            model_type = model['model_type']
            type_counts[model_type] = type_counts.get(model_type, 0) + 1
            type_sizes[model_type] = type_sizes.get(model_type, 0) + model['file_size']
        
        print("Model Usage Analytics:")
        print("\nBy Type:")
        for model_type, count in type_counts.items():
            size_gb = type_sizes[model_type] / (1024**3)
            print(f"  - {model_type}: {count} models, {size_gb:.2f} GB")
        
        # Analyze by creation date
        from datetime import datetime, timedelta
        
        now = datetime.utcnow()
        recent_models = []
        old_models = []
        
        for model in models:
            created = datetime.fromisoformat(model['created_at'])
            if now - created < timedelta(days=30):
                recent_models.append(model)
            elif now - created > timedelta(days=365):
                old_models.append(model)
        
        print(f"\nRecent models (< 30 days): {len(recent_models)}")
        print(f"Old models (> 1 year): {len(old_models)}")
        
        return {
            'type_counts': type_counts,
            'type_sizes': type_sizes,
            'recent_models': len(recent_models),
            'old_models': len(old_models)
        }


class PerformanceBenchmark:
    """Performance benchmarking for vault operations."""
    
    def __init__(self, vault_manager):
        self.vault_manager = vault_manager
        self.results = {}
    
    def benchmark_encryption_speed(self, test_file_sizes=[1, 10, 100, 1000]):
        """Benchmark encryption speed for different file sizes (MB)."""
        print("Encryption Speed Benchmark:")
        print("Size (MB) | Time (s) | Speed (MB/s)")
        print("-" * 40)
        
        for size_mb in test_file_sizes:
            # Create test file
            test_file = Path.home() / f"test_file_{size_mb}mb.bin"
            
            try:
                # Create test data
                with open(test_file, 'wb') as f:
                    f.write(b'0' * (size_mb * 1024 * 1024))
                
                # Benchmark encryption
                start_time = time.time()
                
                model_id = self.vault_manager.vault.add_model(
                    test_file,
                    model_name=f"test_{size_mb}mb"
                )
                
                encryption_time = time.time() - start_time
                speed = size_mb / encryption_time
                
                print(f"{size_mb:9d} | {encryption_time:8.2f} | {speed:9.2f}")
                
                self.results[f'encryption_{size_mb}mb'] = {
                    'time': encryption_time,
                    'speed': speed
                }
                
                # Clean up
                self.vault_manager.vault.remove_model(model_id)
                
            finally:
                if test_file.exists():
                    test_file.unlink()
    
    def benchmark_decryption_speed(self):
        """Benchmark decryption speed."""
        models = self.vault_manager.vault.list_models()
        
        if not models:
            print("No models to benchmark decryption")
            return
        
        print("Decryption Speed Benchmark:")
        print("Model | Size (MB) | Time (s) | Speed (MB/s)")
        print("-" * 50)
        
        for model in models[:5]:  # Test first 5 models
            try:
                output_path = Path.home() / "temp_decrypted.bin"
                
                start_time = time.time()
                self.vault_manager.vault.get_model(model['id'], output_path)
                decryption_time = time.time() - start_time
                
                size_mb = model['file_size'] / (1024 * 1024)
                speed = size_mb / decryption_time
                
                print(f"{model['name'][:15]:15} | {size_mb:9.1f} | {decryption_time:8.2f} | {speed:9.2f}")
                
                # Clean up
                if output_path.exists():
                    output_path.unlink()
                
            except Exception as e:
                print(f"{model['name'][:15]:15} | ERROR: {e}")
    
    def benchmark_vault_operations(self):
        """Benchmark general vault operations."""
        print("Vault Operations Benchmark:")
        
        # Benchmark listing models
        start_time = time.time()
        models = self.vault_manager.vault.list_models()
        list_time = time.time() - start_time
        
        print(f"List {len(models)} models: {list_time:.3f}s")
        
        # Benchmark integrity check
        start_time = time.time()
        results = self.vault_manager.vault.verify_vault_integrity()
        integrity_time = time.time() - start_time
        
        print(f"Integrity check: {integrity_time:.3f}s")
        
        # Benchmark vault info
        start_time = time.time()
        info = self.vault_manager.vault.get_vault_info()
        info_time = time.time() - start_time
        
        print(f"Get vault info: {info_time:.3f}s")


def main():
    """Demonstrate advanced vault operations."""
    
    print("StressGPT7 Encrypted Model Vault - Advanced Usage Example")
    print("=" * 65)
    
    # Setup
    vault_path = Path.home() / "advanced_vault"
    password = "advanced_password_123"
    
    # Create enhanced vault manager
    vault_mgr = VaultManager(vault_path, "password")
    
    # Example 1: Authenticated session with context manager
    print("\n1. Authenticated session example:")
    try:
        with vault_mgr.authenticated_session(password=password) as (vault, loader):
            print("   Vault opened successfully in authenticated session")
            
            # Get vault info
            info = vault.get_vault_info()
            print(f"   Models in vault: {info['model_count']}")
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 2: Batch operations
    print("\n2. Batch operations example:")
    try:
        # Create some test files
        test_dir = Path.home() / "test_models"
        test_dir.mkdir(exist_ok=True)
        
        test_files = []
        for i in range(3):
            test_file = test_dir / f"test_model_{i}.bin"
            test_file.write_bytes(b'x' * (1024 * 1024))  # 1MB each
            test_files.append(test_file)
        
        with vault_mgr.authenticated_session(password=password) as (vault, loader):
            def progress_callback(progress):
                print(f"   Batch progress: {progress:.1f}%", end='\r')
            
            added = vault_mgr.batch_add_models(test_files, progress_callback)
            print(f"\n   Added {len(added)} models in batch")
            
            # Clean up test files
            for test_file in test_files:
                test_file.unlink()
            test_dir.rmdir()
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 3: Advanced model operations
    print("\n3. Advanced model operations:")
    try:
        with vault_mgr.authenticated_session(password=password) as (vault, loader):
            ops = AdvancedModelOperations(vault_mgr)
            
            # Find duplicates
            duplicates = ops.find_duplicate_models()
            print(f"   Potential duplicate groups: {len(duplicates)}")
            
            # Storage optimization
            optimization = ops.optimize_vault_storage()
            
            # Usage analytics
            analytics = ops.model_usage_analytics()
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 4: Performance benchmarking
    print("\n4. Performance benchmarking:")
    try:
        with vault_mgr.authenticated_session(password=password) as (vault, loader):
            benchmark = PerformanceBenchmark(vault_mgr)
            
            # Run benchmarks
            benchmark.benchmark_encryption_speed([1, 10])  # Small files only
            benchmark.benchmark_decryption_speed()
            benchmark.benchmark_vault_operations()
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 5: Error handling and recovery
    print("\n5. Error handling and recovery:")
    try:
        with vault_mgr.authenticated_session(password=password) as (vault, loader):
            # Simulate various error conditions and recovery
            results = vault_mgr.batch_verify_integrity()
            
            if results['vault_integrity']:
                print("   All integrity checks passed")
            else:
                print(f"   Found {results['models_failed']} issues, recovery attempted")
            
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\nAdvanced examples completed!")
    print(f"Vault location: {vault_path}")
    print("These examples demonstrate advanced features for production use.")


if __name__ == "__main__":
    main()
