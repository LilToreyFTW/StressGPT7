"""
Logging system for the encrypted model vault.

Provides:
- Structured logging with multiple levels
- File and console output
- Colored terminal output
- Log rotation and management
- Security-aware logging (no sensitive data)
"""

import logging
import logging.handlers
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from colorama import Fore, Style, init
import json


# Initialize colorama
init()


class VaultLogger:
    """
    Enhanced logger for the vault system with security features.
    
    Features:
    - Multiple log levels
    - Colored console output
    - File logging with rotation
    - Structured logging
    - Security filtering (no sensitive data)
    """
    
    # Log levels
    DEBUG = logging.DEBUG
    INFO = logging.INFO
    WARNING = logging.WARNING
    ERROR = logging.ERROR
    CRITICAL = logging.CRITICAL
    
    # Color mapping for console output
    COLORS = {
        'DEBUG': Fore.CYAN,
        'INFO': Fore.GREEN,
        'WARNING': Fore.YELLOW,
        'ERROR': Fore.RED,
        'CRITICAL': Fore.MAGENTA + Style.BRIGHT
    }
    
    # Sensitive data patterns to filter out
    SENSITIVE_PATTERNS = [
        'password', 'key', 'token', 'secret', 'credential',
        'salt', 'iv', 'tag', 'hash', 'checksum',
        'api_key', 'auth', 'private'
    ]
    
    def __init__(
        self, 
        name: str,
        level: int = INFO,
        log_file: Optional[Path] = None,
        max_file_size: int = 10 * 1024 * 1024,  # 10MB
        backup_count: int = 5,
        enable_console: bool = True,
        enable_colors: bool = True
    ):
        """
        Initialize vault logger.
        
        Args:
            name: Logger name
            level: Log level
            log_file: Optional log file path
            max_file_size: Maximum log file size before rotation
            backup_count: Number of backup files to keep
            enable_console: Whether to enable console output
            enable_colors: Whether to enable colored output
        """
        self.name = name
        self.level = level
        self.enable_colors = enable_colors
        
        # Create logger
        self.logger = logging.getLogger(f"VaultLogger.{name}")
        self.logger.setLevel(level)
        
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # Setup formatters
        console_formatter = self._create_console_formatter()
        file_formatter = self._create_file_formatter()
        
        # Add console handler
        if enable_console:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(level)
            console_handler.setFormatter(console_formatter)
            self.logger.addHandler(console_handler)
        
        # Add file handler
        if log_file:
            log_file.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=max_file_size,
                backupCount=backup_count
            )
            file_handler.setLevel(level)
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
    
    def debug(self, message: str, **kwargs) -> None:
        """Log debug message."""
        self._log(self.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs) -> None:
        """Log info message."""
        self._log(self.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs) -> None:
        """Log warning message."""
        self._log(self.WARNING, message, **kwargs)
    
    def error(self, message: str, **kwargs) -> None:
        """Log error message."""
        self._log(self.ERROR, message, **kwargs)
    
    def critical(self, message: str, **kwargs) -> None:
        """Log critical message."""
        self._log(self.CRITICAL, message, **kwargs)
    
    def log_operation(self, operation: str, success: bool, details: Optional[Dict[str, Any]] = None) -> None:
        """
        Log an operation with structured data.
        
        Args:
            operation: Operation name
            success: Whether operation succeeded
            details: Optional operation details
        """
        message = f"Operation: {operation} - {'SUCCESS' if success else 'FAILED'}"
        
        log_data = {
            'operation': operation,
            'success': success,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if details:
            log_data['details'] = self._filter_sensitive_data(details)
        
        if success:
            self.info(message, **log_data)
        else:
            self.error(message, **log_data)
    
    def log_security_event(self, event: str, severity: str = 'INFO', details: Optional[Dict[str, Any]] = None) -> None:
        """
        Log a security-related event.
        
        Args:
            event: Security event description
            severity: Event severity
            details: Optional event details
        """
        message = f"SECURITY: {event}"
        
        log_data = {
            'security_event': event,
            'severity': severity,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if details:
            log_data['details'] = self._filter_sensitive_data(details)
        
        # Use appropriate log level based on severity
        level_map = {
            'INFO': self.INFO,
            'WARNING': self.WARNING,
            'ERROR': self.ERROR,
            'CRITICAL': self.CRITICAL
        }
        
        log_level = level_map.get(severity.upper(), self.INFO)
        self._log(log_level, message, **log_data)
    
    def _log(self, level: int, message: str, **kwargs) -> None:
        """Internal logging method with security filtering."""
        # Filter sensitive data from kwargs
        filtered_kwargs = self._filter_sensitive_data(kwargs)
        
        # Add structured data if provided
        if filtered_kwargs:
            structured_data = json.dumps(filtered_kwargs, default=str)
            message = f"{message} | {structured_data}"
        
        self.logger.log(level, message)
    
    def _filter_sensitive_data(self, data: Any) -> Any:
        """Filter out sensitive data from log entries."""
        if isinstance(data, dict):
            filtered = {}
            for key, value in data.items():
                if self._is_sensitive_key(key):
                    filtered[key] = '[REDACTED]'
                else:
                    filtered[key] = self._filter_sensitive_data(value)
            return filtered
        elif isinstance(data, list):
            return [self._filter_sensitive_data(item) for item in data]
        elif isinstance(data, str):
            # Check for sensitive patterns in strings
            if self._contains_sensitive_data(data):
                return '[REDACTED]'
            return data
        else:
            return data
    
    def _is_sensitive_key(self, key: str) -> bool:
        """Check if a key name indicates sensitive data."""
        key_lower = key.lower()
        return any(pattern in key_lower for pattern in self.SENSITIVE_PATTERNS)
    
    def _contains_sensitive_data(self, text: str) -> bool:
        """Check if text contains potentially sensitive data."""
        text_lower = text.lower()
        return any(pattern in text_lower for pattern in self.SENSITIVE_PATTERNS)
    
    def _create_console_formatter(self) -> logging.Formatter:
        """Create console formatter with colors."""
        if self.enable_colors:
            format_string = (
                f"{Style.DIM}%(asctime)s{Style.RESET_ALL} "
                f"%(levelname)s: "
                f"{Style.BRIGHT}%(name)s{Style.RESET_ALL} - "
                f"%(message)s"
            )
        else:
            format_string = "%(asctime)s %(levelname)s: %(name)s - %(message)s"
        
        return ColoredFormatter(format_string, self.COLORS if self.enable_colors else None)
    
    def _create_file_formatter(self) -> logging.Formatter:
        """Create file formatter (no colors)."""
        format_string = (
            "%(asctime)s "
            "%(levelname)s: "
            "%(name)s - "
            "%(message)s"
        )
        return logging.Formatter(format_string)


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colored output for different log levels."""
    
    def __init__(self, fmt: str, colors: Optional[Dict[str, str]] = None):
        super().__init__(fmt)
        self.colors = colors or {}
    
    def format(self, record: logging.LogRecord) -> str:
        # Format the message first
        formatted = super().format(record)
        
        # Add color if available
        if self.colors and record.levelname in self.colors:
            color = self.colors[record.levelname]
            reset = Style.RESET_ALL
            
            # Find the level name in the formatted string and wrap it with color
            level_start = formatted.find(record.levelname)
            if level_start != -1:
                level_end = level_start + len(record.levelname)
                formatted = (
                    formatted[:level_start] +
                    color + record.levelname + reset +
                    formatted[level_end:]
                )
        
        return formatted


class LogManager:
    """Manages multiple vault loggers."""
    
    def __init__(self, log_dir: Path):
        self.log_dir = log_dir
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self._loggers: Dict[str, VaultLogger] = {}
    
    def get_logger(
        self, 
        name: str, 
        level: int = VaultLogger.INFO,
        enable_file: bool = True,
        enable_console: bool = True
    ) -> VaultLogger:
        """Get or create a logger."""
        if name not in self._loggers:
            log_file = self.log_dir / f"{name}.log" if enable_file else None
            self._loggers[name] = VaultLogger(
                name=name,
                level=level,
                log_file=log_file,
                enable_console=enable_console
            )
        return self._loggers[name]
    
    def set_global_level(self, level: int) -> None:
        """Set log level for all loggers."""
        for logger in self._loggers.values():
            logger.logger.setLevel(level)
            for handler in logger.logger.handlers:
                handler.setLevel(level)
    
    def cleanup_old_logs(self, days: int = 30) -> None:
        """Clean up log files older than specified days."""
        import time
        
        current_time = time.time()
        cutoff_time = current_time - (days * 24 * 60 * 60)
        
        for log_file in self.log_dir.glob("*.log*"):
            try:
                if log_file.stat().st_mtime < cutoff_time:
                    log_file.unlink()
            except OSError:
                pass


# Global log manager instance
_log_manager: Optional[LogManager] = None


def get_log_manager(log_dir: Optional[Path] = None) -> LogManager:
    """Get the global log manager."""
    global _log_manager
    
    if _log_manager is None:
        if log_dir is None:
            log_dir = Path.cwd() / "logs"
        _log_manager = LogManager(log_dir)
    
    return _log_manager


def get_logger(name: str, level: int = VaultLogger.INFO) -> VaultLogger:
    """Get a logger instance."""
    return get_log_manager().get_logger(name, level)
