"""
Configuration management for the encrypted model vault.

Provides:
- Configuration file management
- Default settings
- Environment variable support
- Validation and security checks
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, Union
from dataclasses import dataclass, asdict, field
from ..utils.logger import VaultLogger


@dataclass
class EncryptionConfig:
    """Encryption configuration settings."""
    algorithm: str = "AES-256-GCM"
    key_derivation: str = "scrypt"  # 'scrypt' or 'pbkdf2'
    scrypt_n: int = 2 ** 20
    scrypt_r: int = 8
    scrypt_p: int = 1
    pbkdf2_iterations: int = 100000
    chunk_size: int = 64 * 1024  # 64KB


@dataclass
class SecurityConfig:
    """Security configuration settings."""
    min_password_length: int = 12
    require_special_chars: bool = True
    require_numbers: bool = True
    session_timeout_minutes: int = 30
    max_failed_attempts: int = 3
    lockout_duration_minutes: int = 15
    enable_audit_log: bool = True


@dataclass
class VaultConfig:
    """Main vault configuration."""
    default_vault_path: Optional[str] = None
    auto_create_vault: bool = False
    backup_enabled: bool = True
    backup_interval_hours: int = 24
    max_backup_count: int = 7
    compression_enabled: bool = True
    integrity_check_interval_hours: int = 24


@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: str = "INFO"
    enable_file_logging: bool = True
    enable_console_logging: bool = True
    log_dir: Optional[str] = None
    max_file_size_mb: int = 10
    backup_count: int = 5
    enable_colors: bool = True


@dataclass
class GUIConfig:
    """GUI configuration settings."""
    window_width: int = 1920
    window_height: int = 1080
    theme: str = "dark"  # 'light', 'dark', 'auto'
    font_size: int = 12
    enable_animations: bool = True
    auto_refresh_interval_seconds: int = 5


@dataclass
class StressGPT7VaultConfig:
    """Complete configuration for StressGPT7 Encrypted Model Vault."""
    encryption: EncryptionConfig = field(default_factory=EncryptionConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)
    vault: VaultConfig = field(default_factory=VaultConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    gui: GUIConfig = field(default_factory=GUIConfig)


class ConfigError(Exception):
    """Base exception for configuration errors."""
    pass


class ConfigValidationError(ConfigError):
    """Exception for configuration validation failures."""
    pass


class VaultConfig:
    """
    Configuration manager for the encrypted model vault.
    
    Features:
    - YAML configuration file support
    - Environment variable overrides
    - Configuration validation
    - Security checks
    - Default settings
    """
    
    DEFAULT_CONFIG_FILE = "stressgpt7_vault_config.yaml"
    ENV_PREFIX = "STRESSGPT7_VAULT_"
    
    def __init__(self, config_file: Optional[Union[str, Path]] = None):
        """
        Initialize configuration manager.
        
        Args:
            config_file: Optional path to configuration file
        """
        self.logger = VaultLogger("VaultConfig")
        
        # Determine config file path
        if config_file:
            self.config_file = Path(config_file)
        else:
            self.config_file = self._find_config_file()
        
        # Load configuration
        self.config = self._load_config()
        
        # Validate configuration
        self._validate_config()
    
    def get(self, section: str, key: str, default: Any = None) -> Any:
        """
        Get a configuration value.
        
        Args:
            section: Configuration section
            key: Configuration key
            default: Default value if not found
            
        Returns:
            Configuration value
        """
        try:
            config_section = getattr(self.config, section)
            return getattr(config_section, key, default)
        except AttributeError:
            return default
    
    def set(self, section: str, key: str, value: Any) -> None:
        """
        Set a configuration value.
        
        Args:
            section: Configuration section
            key: Configuration key
            value: Value to set
        """
        try:
            config_section = getattr(self.config, section)
            setattr(config_section, key, value)
        except AttributeError as e:
            raise ConfigError(f"Invalid configuration section: {section}") from e
    
    def save(self, config_file: Optional[Union[str, Path]] = None) -> None:
        """
        Save configuration to file.
        
        Args:
            config_file: Optional file path (uses default if not provided)
        """
        if config_file:
            file_path = Path(config_file)
        else:
            file_path = self.config_file
        
        try:
            # Ensure parent directory exists
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Convert to dictionary and save
            config_dict = asdict(self.config)
            
            with open(file_path, 'w') as f:
                yaml.dump(config_dict, f, default_flow_style=False, indent=2)
            
            # Set secure permissions
            file_path.chmod(0o600)
            
            self.logger.info(f"Configuration saved to: {file_path}")
            
        except Exception as e:
            raise ConfigError(f"Failed to save configuration: {str(e)}")
    
    def reload(self) -> None:
        """Reload configuration from file."""
        self.config = self._load_config()
        self._validate_config()
        self.logger.info("Configuration reloaded")
    
    def get_vault_path(self) -> Path:
        """Get the default vault path."""
        path_str = self.get('vault', 'default_vault_path')
        
        if path_str:
            vault_path = Path(path_str).expanduser()
        else:
            # Default to ~/.stressgpt7_vault
            vault_path = Path.home() / ".stressgpt7_vault"
        
        return vault_path
    
    def get_log_dir(self) -> Path:
        """Get the log directory path."""
        log_dir_str = self.get('logging', 'log_dir')
        
        if log_dir_str:
            log_dir = Path(log_dir_str).expanduser()
        else:
            # Default to vault_path/logs
            log_dir = self.get_vault_path() / "logs"
        
        return log_dir
    
    def _find_config_file(self) -> Path:
        """Find configuration file in standard locations."""
        # Check current directory
        current_dir_config = Path.cwd() / self.DEFAULT_CONFIG_FILE
        if current_dir_config.exists():
            return current_dir_config
        
        # Check home directory
        home_dir_config = Path.home() / self.DEFAULT_CONFIG_FILE
        if home_dir_config.exists():
            return home_dir_config
        
        # Check config directory
        config_dir_config = Path.home() / ".config" / "stressgpt7_vault" / self.DEFAULT_CONFIG_FILE
        if config_dir_config.exists():
            return config_dir_config
        
        # Default to current directory
        return current_dir_config
    
    def _load_config(self) -> StressGPT7VaultConfig:
        """Load configuration from file and environment variables."""
        # Start with defaults
        config = StressGPT7VaultConfig()
        
        # Load from file if it exists
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    file_config = yaml.safe_load(f) or {}
                
                # Update configuration with file values
                self._update_config_from_dict(config, file_config)
                self.logger.info(f"Configuration loaded from: {self.config_file}")
                
            except Exception as e:
                self.logger.warning(f"Failed to load config file: {str(e)}")
        
        # Override with environment variables
        self._update_config_from_env(config)
        
        return config
    
    def _update_config_from_dict(self, config: StressGPT7VaultConfig, config_dict: Dict[str, Any]) -> None:
        """Update configuration from dictionary."""
        for section_name, section_data in config_dict.items():
            if hasattr(config, section_name) and isinstance(section_data, dict):
                section = getattr(config, section_name)
                for key, value in section_data.items():
                    if hasattr(section, key):
                        setattr(section, key, value)
    
    def _update_config_from_env(self, config: StressGPT7VaultConfig) -> None:
        """Update configuration from environment variables."""
        # Map environment variables to config paths
        env_mappings = {
            f"{self.ENV_PREFIX}ENCRYPTION_ALGORITHM": ("encryption", "algorithm"),
            f"{self.ENV_PREFIX}ENCRYPTION_KEY_DERIVATION": ("encryption", "key_derivation"),
            f"{self.ENV_PREFIX}SECURITY_MIN_PASSWORD_LENGTH": ("security", "min_password_length"),
            f"{self.ENV_PREFIX}SECURITY_SESSION_TIMEOUT": ("security", "session_timeout_minutes"),
            f"{self.ENV_PREFIX}VAULT_DEFAULT_PATH": ("vault", "default_vault_path"),
            f"{self.ENV_PREFIX}LOG_LEVEL": ("logging", "level"),
            f"{self.ENV_PREFIX}LOG_DIR": ("logging", "log_dir"),
            f"{self.ENV_PREFIX}GUI_THEME": ("gui", "theme"),
            f"{self.ENV_PREFIX}GUI_WIDTH": ("gui", "window_width"),
            f"{self.ENV_PREFIX}GUI_HEIGHT": ("gui", "window_height"),
        }
        
        for env_var, (section, key) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                # Convert string to appropriate type
                converted_value = self._convert_env_value(value)
                
                try:
                    self.set(section, key, converted_value)
                except ConfigError:
                    pass  # Ignore invalid environment variables
    
    def _convert_env_value(self, value: str) -> Any:
        """Convert environment variable string to appropriate type."""
        # Boolean conversion
        if value.lower() in ('true', 'false'):
            return value.lower() == 'true'
        
        # Integer conversion
        try:
            return int(value)
        except ValueError:
            pass
        
        # Float conversion
        try:
            return float(value)
        except ValueError:
            pass
        
        # Return as string
        return value
    
    def _validate_config(self) -> None:
        """Validate configuration settings."""
        errors = []
        
        # Validate encryption settings
        if self.config.encryption.algorithm not in ["AES-256-GCM"]:
            errors.append("Invalid encryption algorithm")
        
        if self.config.encryption.key_derivation not in ["scrypt", "pbkdf2"]:
            errors.append("Invalid key derivation method")
        
        # Validate security settings
        if self.config.security.min_password_length < 8:
            errors.append("Minimum password length must be at least 8")
        
        if self.config.security.session_timeout_minutes < 1:
            errors.append("Session timeout must be at least 1 minute")
        
        # Validate vault settings
        if self.config.vault.backup_interval_hours < 1:
            errors.append("Backup interval must be at least 1 hour")
        
        # Validate logging settings
        valid_log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.config.logging.level not in valid_log_levels:
            errors.append(f"Invalid log level: {self.config.logging.level}")
        
        # Validate GUI settings
        if self.config.gui.window_width < 800 or self.config.gui.window_height < 600:
            errors.append("GUI window size must be at least 800x600")
        
        if self.config.gui.theme not in ["light", "dark", "auto"]:
            errors.append(f"Invalid GUI theme: {self.config.gui.theme}")
        
        if errors:
            raise ConfigValidationError(f"Configuration validation failed: {', '.join(errors)}")
        
        self.logger.info("Configuration validation passed")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return asdict(self.config)
    
    def print_config(self) -> None:
        """Print current configuration (for debugging)."""
        config_dict = self.to_dict()
        print(yaml.dump(config_dict, default_flow_style=False, indent=2))
