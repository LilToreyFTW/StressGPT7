#!/usr/bin/env python3
"""
Basic usage examples for StressGPT7 Encrypted Model Vault.

This example demonstrates:
- Creating and opening vaults
- Adding and retrieving models
- Basic vault operations
"""

import sys
import os
from pathlib import Path

# Add the package to Python path for development
sys.path.insert(0, str(Path(__file__).parent.parent))

from stressgpt7_vault import VaultManager, ModelScanner, EncryptionManager


def main():
    """Demonstrate basic vault operations."""
    
    print("StressGPT7 Encrypted Model Vault - Basic Usage Example")
    print("=" * 60)
    
    # Setup paths
    vault_path = Path.home() / "example_vault"
    models_dir = Path.home() / "models"
    
    # Example 1: Create a new vault
    print("\n1. Creating new vault...")
    try:
        vault = VaultManager(vault_path, password="example_password_123")
        vault.create_vault(overwrite=True)
        vault.open_vault()
        print(f"   Vault created and opened: {vault_path}")
    except Exception as e:
        print(f"   Error: {e}")
        return
    
    # Example 2: Generate a keyfile
    print("\n2. Generating keyfile...")
    try:
        keyfile_path = Path.home() / "vault_keyfile.key"
        encryption_manager = EncryptionManager()
        encryption_manager.generate_keyfile(keyfile_path)
        print(f"   Keyfile generated: {keyfile_path}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 3: Scan for models (if models directory exists)
    print("\n3. Scanning for models...")
    try:
        if models_dir.exists():
            scanner = ModelScanner()
            
            def progress_callback(progress):
                print(f"   Scanning progress: {progress:.1f}%", end='\r')
            
            model_files = scanner.scan_directory(
                models_dir, 
                recursive=True,
                progress_callback=progress_callback
            )
            print(f"\n   Found {len(model_files)} model files:")
            
            for model_file in model_files[:3]:  # Show first 3
                size_mb = model_file.size / (1024 * 1024)
                print(f"   - {model_file.name} ({model_file.format}, {size_mb:.1f} MB)")
            
            if len(model_files) > 3:
                print(f"   ... and {len(model_files) - 3} more")
        else:
            print(f"   Models directory not found: {models_dir}")
            print("   Creating a dummy model file for demonstration...")
            
            # Create a dummy file for demonstration
            models_dir.mkdir(parents=True, exist_ok=True)
            dummy_model = models_dir / "dummy_model.pt"
            dummy_model.write_bytes(b"0" * (1024 * 1024))  # 1MB dummy file
            print(f"   Created dummy model: {dummy_model}")
            
            # Scan again
            scanner = ModelScanner()
            model_files = scanner.scan_directory(models_dir)
            print(f"   Found {len(model_files)} model file")
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 4: Add models to vault
    print("\n4. Adding models to vault...")
    try:
        if models_dir.exists():
            scanner = ModelScanner()
            model_files = scanner.scan_directory(models_dir)
            
            for model_file in model_files:
                print(f"   Adding {model_file.name}...")
                
                def progress_callback(progress):
                    print(f"   Encryption progress: {progress:.1f}%", end='\r')
                
                model_id = vault.add_model(
                    model_file.path,
                    model_name=model_file.name,
                    description=f"Example {model_file.format} model",
                    tags=["example", model_file.format],
                    progress_callback=progress_callback
                )
                print(f"\n   Added successfully! ID: {model_id}")
                
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 5: List models in vault
    print("\n5. Listing models in vault...")
    try:
        models = vault.list_models()
        print(f"   Total models: {len(models)}")
        
        for model in models:
            size_mb = model['file_size'] / (1024 * 1024)
            created = model['created_at'][:19].replace('T', ' ')
            print(f"   - {model['name']}")
            print(f"     ID: {model['id']}")
            print(f"     Type: {model['model_type']}")
            print(f"     Size: {size_mb:.1f} MB")
            print(f"     Created: {created}")
            print()
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 6: Retrieve a model
    print("\n6. Retrieving a model...")
    try:
        models = vault.list_models()
        if models:
            model_id = models[0]['id']
            output_path = Path.home() / "retrieved_model.pt"
            
            print(f"   Retrieving model {model_id}...")
            
            def progress_callback(progress):
                print(f"   Decryption progress: {progress:.1f}%", end='\r')
            
            vault.get_model(model_id, output_path, progress_callback=progress_callback)
            print(f"\n   Model retrieved to: {output_path}")
            
            # Verify the file
            if output_path.exists():
                size_mb = output_path.stat().st_size / (1024 * 1024)
                print(f"   File size: {size_mb:.1f} MB")
                
                # Clean up
                output_path.unlink()
                print(f"   Cleaned up retrieved file")
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 7: Check vault integrity
    print("\n7. Checking vault integrity...")
    try:
        results = vault.verify_vault_integrity()
        
        if results['vault_integrity']:
            print(f"   Integrity: PASSED")
            print(f"   Models verified: {results['models_verified']}")
        else:
            print(f"   Integrity: FAILED")
            print(f"   Models verified: {results['models_verified']}")
            print(f"   Models failed: {results['models_failed']}")
            
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 8: Get vault information
    print("\n8. Vault information:")
    try:
        info = vault.get_vault_info()
        print(f"   Path: {info['vault_path']}")
        print(f"   Version: {info['version']}")
        print(f"   Models: {info['model_count']}")
        print(f"   Total size: {info['total_size'] / (1024**3):.2f} GB")
        print(f"   Encryption: {info['encryption_algorithm']}")
        print(f"   Key derivation: {info['key_derivation']}")
        
    except Exception as e:
        print(f"   Error: {e}")
    
    # Example 9: Close vault
    print("\n9. Closing vault...")
    try:
        vault.close_vault()
        print("   Vault closed successfully")
        
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\nExample completed!")
    print(f"Vault location: {vault_path}")
    print(f"You can now use the CLI or GUI to interact with this vault:")
    print(f"  CLI: stressgpt7-vault open --path {vault_path} --password example_password_123")
    print(f"  GUI: stressgpt7-vault gui")


if __name__ == "__main__":
    main()
