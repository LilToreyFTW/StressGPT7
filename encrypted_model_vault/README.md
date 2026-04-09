# StressGPT7 Encrypted Model Vault

A secure system for storing, encrypting, and managing AI models with AES-256-GCM encryption.

## Features

### Security
- **AES-256-GCM Encryption**: Industry-standard authenticated encryption
- **Strong Key Derivation**: PBKDF2 and scrypt support
- **Multiple Authentication**: Password and keyfile-based access
- **Integrity Verification**: SHA-256 checksums and authentication tags
- **Secure Memory Management**: Automatic cleanup of sensitive data

### Functionality
- **Multi-Format Support**: PyTorch (.pt, .pth), ONNX (.onnx), TensorFlow (.pb, .h5), Transformers (.bin, .safetensors)
- **Directory Scanning**: Automatic model discovery with progress tracking
- **Chunk Encryption**: Efficient handling of large model files
- **Dynamic Management**: Add/remove models without vault recreation
- **Integrity Checks**: Verify vault and model integrity

### Interfaces
- **GUI Application**: 1920x1080 PyQt5 interface with dark theme
- **Command Line**: Full CLI for scripting and automation
- **Python API**: Programmatic access for integration

## Installation

### Prerequisites
- Python 3.8+
- PyQt5 (for GUI)
- Cryptography library
- Optional: PyTorch, ONNX, TensorFlow for model loading

### Install from Source

```bash
git clone https://github.com/stressgpt7/encrypted-model-vault.git
cd encrypted-model-vault
pip install -r requirements.txt
pip install -e .
```

### Install Dependencies

```bash
# Core dependencies
pip install cryptography PyQt5 tqdm colorama click pyyaml

# Model framework support (optional)
pip install torch onnx tensorflow transformers

# Development dependencies
pip install pytest pytest-cov black flake8
```

## Quick Start

### Using the GUI

```bash
# Launch the GUI application
stressgpt7-vault gui
```

1. **Create New Vault**: File > New Vault
2. **Set Authentication**: Choose password or keyfile authentication
3. **Add Models**: Use "Scan for Models" or browse to model files
4. **Encrypt & Store**: Select models and click "Encrypt Selected"

### Using the CLI

```bash
# Create a new vault
stressgpt7-vault create --path ~/my_vault --password

# Open the vault
stressgpt7-vault open --path ~/my_vault --password

# Scan directory for models
stressgpt7-vault scan --directory ~/models

# Add a model
stressgpt7-vault add --model ~/models/model.pt --name "My Model"

# List models
stressgpt7-vault list

# Get/decrypt a model
stressgpt7-vault get --model-id abc123 --output ~/decrypted_model.pt

# Close vault
stressgpt7-vault close
```

### Using Python API

```python
from stressgpt7_vault import VaultManager, ModelScanner

# Create vault
vault = VaultManager("~/my_vault", password="my_password")
vault.create_vault()
vault.open_vault()

# Scan for models
scanner = ModelScanner()
models = scanner.scan_directory("~/models")

# Add models to vault
for model in models:
    vault.add_model(model.path, model_name=model.name)

# Get model
vault.get_model("model_id", "~/output.pt")
vault.close_vault()
```

## Configuration

### Configuration File

Create `stressgpt7_vault_config.yaml`:

```yaml
encryption:
  algorithm: "AES-256-GCM"
  key_derivation: "scrypt"
  scrypt_n: 1048576
  scrypt_r: 8
  scrypt_p: 1
  chunk_size: 65536

security:
  min_password_length: 12
  require_special_chars: true
  require_numbers: true
  session_timeout_minutes: 30
  max_failed_attempts: 3

vault:
  default_vault_path: "~/.stressgpt7_vault"
  auto_create_vault: false
  backup_enabled: true
  backup_interval_hours: 24

logging:
  level: "INFO"
  enable_file_logging: true
  enable_console_logging: true
  log_dir: "~/.stressgpt7_vault/logs"

gui:
  window_width: 1920
  window_height: 1080
  theme: "dark"
  font_size: 12
```

### Environment Variables

```bash
export STRESSGPT7_VAULT_ENCRYPTION_ALGORITHM="AES-256-GCM"
export STRESSGPT7_VAULT_LOG_LEVEL="INFO"
export STRESSGPT7_VAULT_DEFAULT_PATH="~/.stressgpt7_vault"
export STRESSGPT7_VAULT_GUI_THEME="dark"
```

## Security Features

### Encryption Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits
- **IV Size**: 96 bits (random per file)
- **Authentication Tag**: 128 bits
- **Chunk Size**: 64KB (for large files)

### Key Derivation

- **scrypt**: N=2^20, r=8, p=1 (memory-hard)
- **PBKDF2**: 100,000 iterations with SHA-256
- **Salt**: 32 bytes random per vault

### Security Best Practices

1. **Strong Passwords**: Minimum 12 characters with special chars and numbers
2. **Keyfile Security**: Store keyfiles securely with restricted permissions (600)
3. **Regular Backups**: Enable automatic vault backups
4. **Integrity Checks**: Run regular vault integrity verification
5. **Memory Safety**: Automatic cleanup of sensitive data from memory

## Supported Model Formats

| Format | Extensions | Framework | Loading Support |
|--------|------------|-----------|-----------------|
| PyTorch | .pt, .pth, .pkl | PyTorch | Full |
| ONNX | .onnx | ONNX | Full |
| TensorFlow | .pb, .h5, .tflite | TensorFlow | Full |
| Transformers | .bin, .safetensors | Hugging Face | Full |
| Caffe | .caffemodel, .prototxt | Caffe | Basic |
| Darknet | .weights, .cfg | YOLO/Darknet | Basic |
| CoreML | .mlmodel, .mlpackage | Core ML | Basic |

## CLI Commands

### Vault Management

```bash
# Create vault
stressgpt7-vault create --path <path> --password [--overwrite]

# Open vault
stressgpt7-vault open --path <path> [--password] [--keyfile <path>]

# Close vault
stressgpt7-vault close

# Vault info
stressgpt7-vault info

# Integrity check
stressgpt7-vault integrity
```

### Model Operations

```bash
# Scan directory
stressgpt7-vault scan --directory <path> [--recursive] [--max-depth <n>]

# Add model
stressgpt7-vault add --model <path> [--name <name>] [--description <desc>] [--tags <tags>]

# List models
stressgpt7-vault list

# Get/decrypt model
stressgpt7-vault get --model-id <id> --output <path>

# Remove model
stressgpt7-vault remove --model-id <id> [--confirm]
```

### Utilities

```bash
# Generate keyfile
stressgpt7-vault generate-keyfile --output <path>

# Launch GUI
stressgpt7-vault gui
```

## GUI Features

### Main Interface (1920x1080)

- **Left Panel**: Vault authentication and model operations
- **Right Panel**: Model list, details, logs, and vault info
- **Model Table**: Sortable list with name, type, size, format, created date
- **Progress Tracking**: Real-time progress for encryption/decryption
- **Status Logs**: Detailed operation logs with filtering
- **Dark Theme**: Professional dark interface theme

### Operations

1. **Vault Authentication**: Password or keyfile-based login
2. **Model Scanning**: Recursive directory scanning with progress
3. **Batch Operations**: Select and encrypt multiple models
4. **Model Management**: Add, remove, decrypt models
5. **Integrity Verification**: Check vault and model integrity
6. **Configuration**: Generate keyfiles and manage settings

## API Reference

### VaultManager

```python
class VaultManager:
    def __init__(self, vault_path, password=None, keyfile_path=None)
    def create_vault(self, overwrite=False)
    def open_vault(self)
    def close_vault(self)
    def add_model(self, model_path, model_name=None, **kwargs)
    def get_model(self, model_id, output_path, **kwargs)
    def remove_model(self, model_id)
    def list_models(self)
    def verify_vault_integrity(self)
```

### ModelScanner

```python
class ModelScanner:
    def scan_directory(self, directory, recursive=True, **kwargs)
    def find_duplicates(self, model_files)
    def filter_by_size(self, model_files, min_size=None, max_size=None)
    def get_scan_statistics(self, model_files)
```

### ModelLoader

```python
class ModelLoader:
    def __init__(self, vault_manager)
    def load_model_permanently(self, model_id, device=None)
    def load_model(self, model_id, device=None)  # Context manager
    def unload_model(self, model_id)
    def get_loaded_models(self)
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check password/keyfile correctness
   - Verify vault path
   - Ensure vault is not corrupted

2. **Memory Issues**
   - Use chunked encryption for large models
   - Close vault when not in use
   - Monitor system memory usage

3. **Permission Errors**
   - Check file/directory permissions
   - Ensure vault directory is writable
   - Verify keyfile permissions (600)

4. **GUI Not Starting**
   - Install PyQt5: `pip install PyQt5`
   - Check display environment
   - Try CLI interface instead

### Logs and Debugging

```bash
# Enable debug logging
stressgpt7-vault --log-level DEBUG <command>

# Check log files
ls ~/.stressgpt7_vault/logs/
cat ~/.stressgpt7_vault/logs/VaultManager.log
```

### Performance Optimization

1. **Large Models**: Use SSD storage for better I/O performance
2. **Memory**: Increase system RAM for large model loading
3. **CPU**: Multi-core processors improve encryption speed
4. **Storage**: Keep vault on fast storage (SSD recommended)

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run tests
pytest tests/ -v --cov=stressgpt7_vault

# Run specific test
pytest tests/test_vault_manager.py -v
```

### Code Style

```bash
# Format code
black stressgpt7_vault/

# Lint code
flake8 stressgpt7_vault/

# Type checking
mypy stressgpt7_vault/
```

### Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Security Considerations

- **Never share passwords or keyfiles**
- **Store keyfiles on encrypted storage**
- **Regular security audits recommended**
- **Keep software updated**
- **Monitor access logs**
- **Use strong, unique passwords**

## Support

- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues]
- **Community**: [Discord/Forum Link]

---

**StressGPT7 Encrypted Model Vault** - Secure AI Model Management
