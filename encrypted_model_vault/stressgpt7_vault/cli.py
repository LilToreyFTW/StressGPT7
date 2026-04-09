"""
Command-line interface for the encrypted model vault.

Provides:
- CLI commands for vault operations
- Batch processing capabilities
- Scripting support
- Progress tracking
"""

import click
import sys
import os
from pathlib import Path
from typing import Optional, List
from getpass import getpass

from .core.vault_manager import VaultManager, VaultError
from .core.model_loader import ModelLoader
from .core.scanner import ModelScanner, ModelFile
from .core.encryption import EncryptionManager
from .utils.logger import VaultLogger, get_log_manager
from .utils.config import VaultConfig


# Global logger
logger = get_log_manager().get_logger("CLI")


@click.group()
@click.option('--config', '-c', type=click.Path(), help='Configuration file path')
@click.option('--log-level', default='INFO', help='Log level')
@click.pass_context
def cli(ctx, config, log_level):
    """StressGPT7 Encrypted Model Vault CLI."""
    ctx.ensure_object(dict)
    
    # Setup logging
    log_manager = get_log_manager()
    log_manager.set_global_level(getattr(VaultLogger, log_level.upper()))
    
    # Load configuration
    ctx.obj['config'] = VaultConfig(config) if config else VaultConfig()
    ctx.obj['logger'] = logger


@cli.command()
@click.option('--path', '-p', required=True, help='Vault directory path')
@click.option('--password', prompt='Password', hide_input=True, help='Vault password')
@click.option('--overwrite', is_flag=True, help='Overwrite existing vault')
@click.pass_context
def create(ctx, path, password, overwrite):
    """Create a new encrypted vault."""
    try:
        vault_path = Path(path).expanduser()
        
        click.echo(f"Creating vault at: {vault_path}")
        
        # Create vault
        vault_manager = VaultManager(vault_path, password=password)
        vault_manager.create_vault(overwrite=overwrite)
        vault_manager.close_vault()
        
        click.echo("Vault created successfully!")
        logger.log_operation("vault_create", True, {"path": str(vault_path)})
        
    except VaultError as e:
        click.echo(f"Error: {str(e)}", err=True)
        logger.log_operation("vault_create", False, {"error": str(e)})
        sys.exit(1)


@cli.command()
@click.option('--path', '-p', required=True, help='Vault directory path')
@click.option('--password', help='Vault password (will prompt if not provided)')
@click.option('--keyfile', help='Keyfile path for authentication')
@click.pass_context
def open(ctx, path, password, keyfile):
    """Open and authenticate with a vault."""
    try:
        vault_path = Path(path).expanduser()
        
        # Get password if not provided
        if not password and not keyfile:
            password = getpass("Enter vault password: ")
        
        click.echo(f"Opening vault: {vault_path}")
        
        # Open vault
        if password:
            vault_manager = VaultManager(vault_path, password=password)
        else:
            vault_manager = VaultManager(vault_path, keyfile_path=keyfile)
        
        vault_manager.open_vault()
        
        # Store in context for subcommands
        ctx.obj['vault_manager'] = vault_manager
        ctx.obj['model_loader'] = ModelLoader(vault_manager)
        
        click.echo("Vault opened successfully!")
        logger.log_operation("vault_open", True, {"path": str(vault_path)})
        
        # Show vault info
        info = vault_manager.get_vault_info()
        click.echo(f"\nVault Information:")
        click.echo(f"  Models: {info['model_count']}")
        click.echo(f"  Total Size: {info['total_size'] / (1024**3):.2f} GB")
        click.echo(f"  Encryption: {info['encryption_algorithm']}")
        
    except VaultError as e:
        click.echo(f"Error: {str(e)}", err=True)
        logger.log_operation("vault_open", False, {"error": str(e)})
        sys.exit(1)


@cli.command()
@click.option('--directory', '-d', required=True, help='Directory to scan')
@click.option('--recursive/--no-recursive', default=True, help='Scan recursively')
@click.option('--max-depth', type=int, help='Maximum scan depth')
@click.pass_context
def scan(ctx, directory, recursive, max_depth):
    """Scan directory for model files."""
    try:
        scan_path = Path(directory).expanduser()
        
        if not scan_path.exists():
            click.echo(f"Error: Directory does not exist: {scan_path}")
            sys.exit(1)
        
        click.echo(f"Scanning directory: {scan_path}")
        
        # Create scanner and scan
        scanner = ModelScanner()
        
        def progress_callback(progress):
            click.echo(f"Progress: {progress:.1f}%", nl=False)
            click.echo('\r', nl=False)
        
        model_files = scanner.scan_directory(
            scan_path, 
            recursive=recursive, 
            max_depth=max_depth,
            progress_callback=progress_callback
        )
        
        click.echo()  # New line after progress
        
        if not model_files:
            click.echo("No model files found.")
            return
        
        # Show results
        click.echo(f"\nFound {len(model_files)} model files:")
        click.echo("-" * 80)
        
        for model_file in model_files:
            size_mb = model_file.size / (1024 * 1024)
            click.echo(f"{model_file.name}")
            click.echo(f"  Path: {model_file.path}")
            click.echo(f"  Format: {model_file.format}")
            click.echo(f"  Size: {size_mb:.1f} MB")
            click.echo(f"  Checksum: {model_file.checksum}")
            click.echo()
        
        # Show statistics
        stats = scanner.get_scan_statistics(model_files)
        click.echo(f"Statistics:")
        click.echo(f"  Total files: {stats['total_files']}")
        click.echo(f"  Total size: {stats['total_size_gb']:.2f} GB")
        click.echo(f"  Formats: {', '.join(stats['formats'].keys())}")
        
        # Check for duplicates
        duplicates = scanner.find_duplicates(model_files)
        if duplicates:
            click.echo(f"\nFound {len(duplicates)} sets of duplicates:")
            for checksum, files in duplicates.items():
                click.echo(f"  Checksum: {checksum[:16]}...")
                for file in files:
                    click.echo(f"    {file.path}")
        
        logger.log_operation("directory_scan", True, {
            "directory": str(scan_path),
            "files_found": len(model_files)
        })
        
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        logger.log_operation("directory_scan", False, {"error": str(e)})
        sys.exit(1)


@cli.command()
@click.option('--model', '-m', required=True, help='Model file path')
@click.option('--name', '-n', help='Model name')
@click.option('--description', '-d', help='Model description')
@click.option('--tags', help='Comma-separated tags')
@click.pass_context
def add(ctx, model, name, description, tags):
    """Add a model to the vault."""
    vault_manager = ctx.obj.get('vault_manager')
    if not vault_manager:
        click.echo("Error: No vault opened. Use 'open' command first.", err=True)
        sys.exit(1)
    
    try:
        model_path = Path(model).expanduser()
        
        if not model_path.exists():
            click.echo(f"Error: Model file not found: {model_path}")
            sys.exit(1)
        
        # Parse tags
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
        
        click.echo(f"Adding model to vault: {model_path}")
        
        def progress_callback(progress):
            click.echo(f"Progress: {progress:.1f}%", nl=False)
            click.echo('\r', nl=False)
        
        # Add model
        model_id = vault_manager.add_model(
            model_path,
            model_name=name,
            description=description,
            tags=tag_list,
            progress_callback=progress_callback
        )
        
        click.echo()  # New line after progress
        click.echo(f"Model added successfully! ID: {model_id}")
        
        logger.log_operation("model_add", True, {
            "model_path": str(model_path),
            "model_id": model_id
        })
        
    except VaultError as e:
        click.echo(f"Error: {str(e)}", err=True)
        logger.log_operation("model_add", False, {"error": str(e)})
        sys.exit(1)


@cli.command()
@click.option('--output', '-o', required=True, help='Output path for decrypted model')
@click.option('--model-id', '-i', help='Model ID (if not provided, will list models)')
@click.pass_context
def get(ctx, output, model_id):
    """Get and decrypt a model from the vault."""
    vault_manager = ctx.obj.get('vault_manager')
    if not vault_manager:
        click.echo("Error: No vault opened. Use 'open' command first.", err=True)
        sys.exit(1)
    
    try:
        # If no model ID provided, list models and exit
        if not model_id:
            list_models(vault_manager)
            return
        
        output_path = Path(output).expanduser()
        
        click.echo(f"Decrypting model {model_id} to: {output_path}")
        
        def progress_callback(progress):
            click.echo(f"Progress: {progress:.1f}%", nl=False)
            click.echo('\r', nl=False)
        
        # Get model
        vault_manager.get_model(model_id, output_path, progress_callback)
        
        click.echo()  # New line after progress
        click.echo(f"Model decrypted successfully to: {output_path}")
        
        logger.log_operation("model_get", True, {
            "model_id": model_id,
            "output_path": str(output_path)
        })
        
    except VaultError as e:
        click.echo(f"Error: {str(e)}", err=True)
        logger.log_operation("model_get", False, {"error": str(e)})
        sys.exit(1)


@cli.command()
@click.pass_context
def list(ctx):
    """List all models in the vault."""
    vault_manager = ctx.obj.get('vault_manager')
    if not vault_manager:
        click.echo("Error: No vault opened. Use 'open' command first.", err=True)
        sys.exit(1)
    
    try:
        list_models(vault_manager)
        
    except VaultError as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)


def list_models(vault_manager):
    """Helper function to list models."""
    models = vault_manager.list_models()
    
    if not models:
        click.echo("No models in vault.")
        return
    
    click.echo(f"Models in vault ({len(models)}):")
    click.echo("-" * 100)
    
    for model in models:
        size_mb = model['file_size'] / (1024 * 1024)
        created = model['created_at'][:19].replace('T', ' ')
        
        click.echo(f"ID: {model['id']}")
        click.echo(f"Name: {model['name']}")
        click.echo(f"Type: {model['model_type']}")
        click.echo(f"Size: {size_mb:.1f} MB")
        click.echo(f"Created: {created}")
        if model['description']:
            click.echo(f"Description: {model['description']}")
        if model['tags']:
            click.echo(f"Tags: {', '.join(model['tags'])}")
        click.echo()


@cli.command()
@click.option('--model-id', '-i', required=True, help='Model ID to remove')
@click.option('--confirm', is_flag=True, help='Skip confirmation prompt')
@click.pass_context
def remove(ctx, model_id, confirm):
    """Remove a model from the vault."""
    vault_manager = ctx.obj.get('vault_manager')
    if not vault_manager:
        click.echo("Error: No vault opened. Use 'open' command first.", err=True)
        sys.exit(1)
    
    try:
        # Get model info for confirmation
        models = vault_manager.list_models()
        model = next((m for m in models if m['id'] == model_id), None)
        
        if not model:
            click.echo(f"Error: Model not found: {model_id}")
            sys.exit(1)
        
        # Confirm removal
        if not confirm:
            if not click.confirm(f"Remove model '{model['name']}' from vault?"):
                click.echo("Operation cancelled.")
                return
        
        click.echo(f"Removing model: {model['name']}")
        
        # Remove model
        vault_manager.remove_model(model_id)
        
        click.echo("Model removed successfully!")
        
        logger.log_operation("model_remove", True, {
            "model_id": model_id,
            "model_name": model['name']
        })
        
    except VaultError as e:
        click.echo(f"Error: {str(e)}", err=True)
        logger.log_operation("model_remove", False, {"error": str(e)})
        sys.exit(1)


@cli.command()
@click.pass_context
def integrity(ctx):
    """Check vault integrity."""
    vault_manager = ctx.obj.get('vault_manager')
    if not vault_manager:
        click.echo("Error: No vault opened. Use 'open' command first.", err=True)
        sys.exit(1)
    
    try:
        click.echo("Checking vault integrity...")
        
        results = vault_manager.verify_vault_integrity()
        
        if results['vault_integrity']:
            click.echo("Vault integrity: PASSED")
            click.echo(f"Models verified: {results['models_verified']}")
        else:
            click.echo("Vault integrity: FAILED")
            click.echo(f"Models verified: {results['models_verified']}")
            click.echo(f"Models failed: {results['models_failed']}")
            
            if results['failed_models']:
                click.echo("\nFailed models:")
                for failed in results['failed_models']:
                    click.echo(f"  {failed['name']}: {failed['error']}")
        
        logger.log_operation("integrity_check", True, results)
        
    except VaultError as e:
        click.echo(f"Error: {str(e)}", err=True)
        logger.log_operation("integrity_check", False, {"error": str(e)})
        sys.exit(1)


@cli.command()
@click.option('--output', '-o', required=True, help='Output keyfile path')
@click.pass_context
def generate_keyfile(ctx, output):
    """Generate a new keyfile."""
    try:
        output_path = Path(output).expanduser()
        
        click.echo(f"Generating keyfile: {output_path}")
        
        # Generate keyfile
        encryption_manager = EncryptionManager()
        encryption_manager.generate_keyfile(output_path)
        
        click.echo("Keyfile generated successfully!")
        click.echo(f"Keyfile saved to: {output_path}")
        click.echo("Keep this keyfile secure and private!")
        
        logger.log_operation("keyfile_generate", True, {"output_path": str(output_path)})
        
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        logger.log_operation("keyfile_generate", False, {"error": str(e)})
        sys.exit(1)


@cli.command()
@click.pass_context
def info(ctx):
    """Show vault information."""
    vault_manager = ctx.obj.get('vault_manager')
    if not vault_manager:
        click.echo("Error: No vault opened. Use 'open' command first.", err=True)
        sys.exit(1)
    
    try:
        info = vault_manager.get_vault_info()
        
        click.echo("Vault Information:")
        click.echo("=" * 50)
        click.echo(f"Path: {info['vault_path']}")
        click.echo(f"Version: {info['version']}")
        click.echo(f"Created: {info['created_at']}")
        click.echo(f"Last Modified: {info['last_modified']}")
        click.echo()
        click.echo("Statistics:")
        click.echo(f"  Models: {info['model_count']}")
        click.echo(f"  Total Size: {info['total_size'] / (1024**3):.2f} GB")
        click.echo(f"  Encrypted Size: {info['total_encrypted_size'] / (1024**3):.2f} GB")
        if info['total_size'] > 0:
            compression = (1 - info['total_encrypted_size'] / info['total_size']) * 100
            click.echo(f"  Compression: {compression:.1f}%")
        click.echo()
        click.echo("Security:")
        click.echo(f"  Encryption: {info['encryption_algorithm']}")
        click.echo(f"  Key Derivation: {info['key_derivation']}")
        
    except VaultError as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.pass_context
def close(ctx):
    """Close the vault."""
    vault_manager = ctx.obj.get('vault_manager')
    if not vault_manager:
        click.echo("No vault is currently open.")
        return
    
    try:
        vault_manager.close_vault()
        click.echo("Vault closed successfully!")
        
        logger.log_operation("vault_close", True)
        
        # Clear from context
        ctx.obj['vault_manager'] = None
        ctx.obj['model_loader'] = None
        
    except VaultError as e:
        click.echo(f"Error: {str(e)}", err=True)
        logger.log_operation("vault_close", False, {"error": str(e)})
        sys.exit(1)


@cli.command()
@click.pass_context
def gui(ctx):
    """Launch the GUI interface."""
    try:
        from .ui.gui import main as gui_main
        
        click.echo("Launching GUI...")
        logger.info("Launching GUI interface")
        
        # Run GUI
        gui_main()
        
    except ImportError as e:
        click.echo(f"Error: GUI dependencies not installed: {str(e)}", err=True)
        click.echo("Install with: pip install PyQt5")
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error launching GUI: {str(e)}", err=True)
        sys.exit(1)


def main():
    """Main entry point for CLI."""
    cli()
