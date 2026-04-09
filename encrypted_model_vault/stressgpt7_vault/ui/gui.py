"""
GUI interface for the encrypted model vault using PyQt5.

Provides:
- 1920x1080 vault management interface
- Model list and operations
- Encrypt/decrypt functionality
- Status logs and progress tracking
- Security features and authentication
"""

import sys
import os
from pathlib import Path
from typing import Optional, Dict, Any, List
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QLineEdit, QTextEdit, QListWidget, QListWidgetItem,
    QProgressBar, QTabWidget, QTableWidget, QTableWidgetItem, QHeaderView,
    QFileDialog, QMessageBox, QInputDialog, QFrame, QSplitter,
    QGroupBox, QCheckBox, QComboBox, QSpinBox, QStatusBar, QMenuBar,
    QMenu, QAction, QDialog, QDialogButtonBox, QFormLayout
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal, QTimer, QSize
from PyQt5.QtGui import QFont, QIcon, QPixmap, QPalette, QColor

from ..core.vault_manager import VaultManager, VaultError, VaultAccessError
from ..core.model_loader import ModelLoader, ModelLoadError
from ..core.scanner import ModelScanner, ModelFile
from ..core.encryption import EncryptionManager
from ..utils.logger import VaultLogger
from ..utils.config import VaultConfig


class WorkerThread(QThread):
    """Worker thread for background operations."""
    
    progress = pyqtSignal(float)
    finished = pyqtSignal(object)
    error = pyqtSignal(str)
    
    def __init__(self, operation, *args, **kwargs):
        super().__init__()
        self.operation = operation
        self.args = args
        self.kwargs = kwargs
    
    def run(self):
        try:
            result = self.operation(*self.args, **self.kwargs)
            self.finished.emit(result)
        except Exception as e:
            self.error.emit(str(e))


class VaultGUI(QMainWindow):
    """
    Main GUI window for StressGPT7 Encrypted Model Vault.
    
    Features:
    - 1920x1080 resolution
    - Model management interface
    - Vault operations
    - Security authentication
    - Progress tracking
    - Status logging
    """
    
    def __init__(self):
        super().__init__()
        
        # Initialize components
        self.logger = VaultLogger("VaultGUI")
        self.config = VaultConfig()
        self.vault_manager: Optional[VaultManager] = None
        self.model_loader: Optional[ModelLoader] = None
        self.current_vault_path: Optional[Path] = None
        self.is_authenticated = False
        
        # Setup UI
        self.setup_ui()
        self.setup_style()
        self.connect_signals()
        
        # Setup status timer
        self.status_timer = QTimer()
        self.status_timer.timeout.connect(self.update_status)
        self.status_timer.start(5000)  # Update every 5 seconds
        
        self.logger.info("Vault GUI initialized")
    
    def setup_ui(self):
        """Setup the main user interface."""
        self.setWindowTitle("StressGPT7 Encrypted Model Vault")
        self.setGeometry(100, 100, 1920, 1080)
        
        # Create central widget
        central_widget = QWidget()
        self.setCentral_widget(central_widget)
        
        # Create main layout
        main_layout = QHBoxLayout(central_widget)
        
        # Create splitter for resizable panels
        splitter = QSplitter(Qt.Horizontal)
        main_layout.addWidget(splitter)
        
        # Left panel - Vault operations
        self.left_panel = self.create_left_panel()
        splitter.addWidget(self.left_panel)
        
        # Right panel - Model list and details
        self.right_panel = self.create_right_panel()
        splitter.addWidget(self.right_panel)
        
        # Set splitter proportions
        splitter.setSizes([600, 1320])
        
        # Create menu bar
        self.create_menu_bar()
        
        # Create status bar
        self.create_status_bar()
    
    def create_left_panel(self) -> QWidget:
        """Create the left panel with vault operations."""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        
        # Vault Authentication Group
        auth_group = QGroupBox("Vault Authentication")
        auth_layout = QVBoxLayout(auth_group)
        
        # Vault path
        path_layout = QHBoxLayout()
        self.vault_path_edit = QLineEdit()
        self.vault_path_edit.setPlaceholderText("Select or create vault...")
        self.browse_vault_btn = QPushButton("Browse")
        self.browse_vault_btn.clicked.connect(self.browse_vault)
        path_layout.addWidget(self.vault_path_edit)
        path_layout.addWidget(self.browse_vault_btn)
        auth_layout.addLayout(path_layout)
        
        # Authentication
        auth_method_layout = QHBoxLayout()
        self.auth_method_combo = QComboBox()
        self.auth_method_combo.addItems(["Password", "Keyfile"])
        auth_method_layout.addWidget(QLabel("Method:"))
        auth_method_layout.addWidget(self.auth_method_combo)
        auth_layout.addLayout(auth_method_layout)
        
        # Password/Keyfile input
        self.auth_input = QLineEdit()
        self.auth_input.setEchoMode(QLineEdit.Password)
        self.auth_input.setPlaceholderText("Enter password...")
        auth_layout.addWidget(self.auth_input)
        
        # Keyfile browse button
        self.browse_keyfile_btn = QPushButton("Browse Keyfile")
        self.browse_keyfile_btn.clicked.connect(self.browse_keyfile)
        self.browse_keyfile_btn.hide()
        auth_layout.addWidget(self.browse_keyfile_btn)
        
        # Authentication buttons
        auth_btn_layout = QHBoxLayout()
        self.connect_btn = QPushButton("Connect")
        self.connect_btn.clicked.connect(self.connect_vault)
        self.disconnect_btn = QPushButton("Disconnect")
        self.disconnect_btn.clicked.connect(self.disconnect_vault)
        self.disconnect_btn.setEnabled(False)
        auth_btn_layout.addWidget(self.connect_btn)
        auth_btn_layout.addWidget(self.disconnect_btn)
        auth_layout.addLayout(auth_btn_layout)
        
        layout.addWidget(auth_group)
        
        # Model Operations Group
        ops_group = QGroupBox("Model Operations")
        ops_layout = QVBoxLayout(ops_group)
        
        # Scan directory
        scan_layout = QHBoxLayout()
        self.scan_path_edit = QLineEdit()
        self.scan_path_edit.setPlaceholderText("Directory to scan...")
        self.browse_scan_btn = QPushButton("Browse")
        self.browse_scan_btn.clicked.connect(self.browse_scan_directory)
        scan_layout.addWidget(self.scan_path_edit)
        scan_layout.addWidget(self.browse_scan_btn)
        ops_layout.addLayout(scan_layout)
        
        # Operation buttons
        self.scan_btn = QPushButton("Scan for Models")
        self.scan_btn.clicked.connect(self.scan_models)
        self.scan_btn.setEnabled(False)
        ops_layout.addWidget(self.scan_btn)
        
        self.encrypt_selected_btn = QPushButton("Encrypt Selected")
        self.encrypt_selected_btn.clicked.connect(self.encrypt_selected_models)
        self.encrypt_selected_btn.setEnabled(False)
        ops_layout.addWidget(self.encrypt_selected_btn)
        
        self.decrypt_btn = QPushButton("Decrypt Model")
        self.decrypt_btn.clicked.connect(self.decrypt_model)
        self.decrypt_btn.setEnabled(False)
        ops_layout.addWidget(self.decrypt_btn)
        
        self.remove_btn = QPushButton("Remove from Vault")
        self.remove_btn.clicked.connect(self.remove_model)
        self.remove_btn.setEnabled(False)
        ops_layout.addWidget(self.remove_btn)
        
        layout.addWidget(ops_group)
        
        # Progress bar
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)
        
        # Add stretch to push everything to top
        layout.addStretch()
        
        return panel
    
    def create_right_panel(self) -> QWidget:
        """Create the right panel with model list and details."""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        
        # Create tab widget
        self.tab_widget = QTabWidget()
        layout.addWidget(self.tab_widget)
        
        # Models tab
        models_tab = QWidget()
        models_layout = QVBoxLayout(models_tab)
        
        # Model table
        self.model_table = QTableWidget()
        self.model_table.setColumnCount(6)
        self.model_table.setHorizontalHeaderLabels([
            "Name", "Type", "Size", "Format", "Created", "Status"
        ])
        self.model_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.model_table.setSelectionBehavior(QTableWidget.SelectRows)
        self.model_table.itemSelectionChanged.connect(self.on_model_selection_changed)
        models_layout.addWidget(self.model_table)
        
        # Model details
        details_group = QGroupBox("Model Details")
        details_layout = QVBoxLayout(details_group)
        self.model_details_text = QTextEdit()
        self.model_details_text.setReadOnly(True)
        self.model_details_text.setMaximumHeight(200)
        details_layout.addWidget(self.model_details_text)
        models_layout.addWidget(details_group)
        
        self.tab_widget.addTab(models_tab, "Models")
        
        # Logs tab
        logs_tab = QWidget()
        logs_layout = QVBoxLayout(logs_tab)
        
        # Log controls
        log_controls = QHBoxLayout()
        self.clear_logs_btn = QPushButton("Clear Logs")
        self.clear_logs_btn.clicked.connect(self.clear_logs)
        self.save_logs_btn = QPushButton("Save Logs")
        self.save_logs_btn.clicked.connect(self.save_logs)
        log_controls.addWidget(self.clear_logs_btn)
        log_controls.addWidget(self.save_logs_btn)
        log_controls.addStretch()
        logs_layout.addLayout(log_controls)
        
        # Log display
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setFont(QFont("Consolas", 10))
        logs_layout.addWidget(self.log_text)
        
        self.tab_widget.addTab(logs_tab, "Logs")
        
        # Vault Info tab
        info_tab = QWidget()
        info_layout = QVBoxLayout(info_tab)
        
        self.vault_info_text = QTextEdit()
        self.vault_info_text.setReadOnly(True)
        info_layout.addWidget(self.vault_info_text)
        
        # Integrity check button
        self.integrity_btn = QPushButton("Check Vault Integrity")
        self.integrity_btn.clicked.connect(self.check_integrity)
        self.integrity_btn.setEnabled(False)
        info_layout.addWidget(self.integrity_btn)
        
        self.tab_widget.addTab(info_tab, "Vault Info")
        
        return panel
    
    def create_menu_bar(self):
        """Create the menu bar."""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("File")
        
        new_vault_action = QAction("New Vault", self)
        new_vault_action.triggered.connect(self.create_new_vault)
        file_menu.addAction(new_vault_action)
        
        open_vault_action = QAction("Open Vault", self)
        open_vault_action.triggered.connect(self.browse_vault)
        file_menu.addAction(open_vault_action)
        
        file_menu.addSeparator()
        
        exit_action = QAction("Exit", self)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)
        
        # Tools menu
        tools_menu = menubar.addMenu("Tools")
        
        generate_keyfile_action = QAction("Generate Keyfile", self)
        generate_keyfile_action.triggered.connect(self.generate_keyfile)
        tools_menu.addAction(generate_keyfile_action)
        
        # Help menu
        help_menu = menubar.addMenu("Help")
        
        about_action = QAction("About", self)
        about_action.triggered.connect(self.show_about)
        help_menu.addAction(about_action)
    
    def create_status_bar(self):
        """Create the status bar."""
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        
        self.status_label = QLabel("Ready")
        self.status_bar.addWidget(self.status_label)
        
        self.vault_status_label = QLabel("No vault connected")
        self.status_bar.addPermanentWidget(self.vault_status_label)
    
    def setup_style(self):
        """Setup the application style."""
        # Set dark theme
        self.setStyleSheet("""
            QMainWindow {
                background-color: #2b2b2b;
                color: #ffffff;
            }
            QGroupBox {
                font-weight: bold;
                border: 2px solid #555;
                border-radius: 5px;
                margin-top: 1ex;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px 0 5px;
            }
            QPushButton {
                background-color: #404040;
                border: 1px solid #555;
                border-radius: 3px;
                padding: 5px;
                min-height: 20px;
            }
            QPushButton:hover {
                background-color: #505050;
            }
            QPushButton:pressed {
                background-color: #353535;
            }
            QPushButton:disabled {
                background-color: #2b2b2b;
                color: #808080;
            }
            QLineEdit {
                background-color: #404040;
                border: 1px solid #555;
                border-radius: 3px;
                padding: 5px;
            }
            QTextEdit {
                background-color: #404040;
                border: 1px solid #555;
                border-radius: 3px;
            }
            QTableWidget {
                background-color: #404040;
                border: 1px solid #555;
                gridline-color: #555;
            }
            QTableWidget::item {
                padding: 5px;
            }
            QTableWidget::item:selected {
                background-color: #0078d4;
            }
            QProgressBar {
                border: 1px solid #555;
                border-radius: 3px;
                text-align: center;
            }
            QProgressBar::chunk {
                background-color: #0078d4;
            }
        """)
    
    def connect_signals(self):
        """Connect signals and slots."""
        # Authentication method change
        self.auth_method_combo.currentTextChanged.connect(self.on_auth_method_changed)
    
    def on_auth_method_changed(self, method):
        """Handle authentication method change."""
        if method == "Password":
            self.auth_input.setEchoMode(QLineEdit.Password)
            self.auth_input.setPlaceholderText("Enter password...")
            self.browse_keyfile_btn.hide()
        else:  # Keyfile
            self.auth_input.setEchoMode(QLineEdit.Normal)
            self.auth_input.setPlaceholderText("Keyfile path...")
            self.browse_keyfile_btn.show()
    
    def browse_vault(self):
        """Browse for vault directory."""
        directory = QFileDialog.getExistingDirectory(self, "Select Vault Directory")
        if directory:
            self.vault_path_edit.setText(directory)
    
    def browse_keyfile(self):
        """Browse for keyfile."""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Select Keyfile", "", "All Files (*.*)"
        )
        if file_path:
            self.auth_input.setText(file_path)
    
    def browse_scan_directory(self):
        """Browse for directory to scan."""
        directory = QFileDialog.getExistingDirectory(self, "Select Directory to Scan")
        if directory:
            self.scan_path_edit.setText(directory)
    
    def connect_vault(self):
        """Connect to vault."""
        vault_path = self.vault_path_edit.text().strip()
        if not vault_path:
            QMessageBox.warning(self, "Error", "Please select a vault path")
            return
        
        auth_input = self.auth_input.text().strip()
        if not auth_input:
            QMessageBox.warning(self, "Error", "Please provide authentication")
            return
        
        try:
            # Create vault manager
            if self.auth_method_combo.currentText() == "Password":
                self.vault_manager = VaultManager(vault_path, password=auth_input)
            else:
                self.vault_manager = VaultManager(vault_path, keyfile_path=auth_input)
            
            # Open vault
            self.vault_manager.open_vault()
            
            # Create model loader
            self.model_loader = ModelLoader(self.vault_manager)
            
            # Update UI state
            self.current_vault_path = Path(vault_path)
            self.is_authenticated = True
            self.update_ui_state()
            
            # Load models
            self.load_models()
            
            # Update vault info
            self.update_vault_info()
            
            self.log_message("Connected to vault successfully")
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to connect to vault: {str(e)}")
            self.log_message(f"Vault connection failed: {str(e)}", "ERROR")
    
    def disconnect_vault(self):
        """Disconnect from vault."""
        if self.vault_manager:
            try:
                self.vault_manager.close_vault()
                self.vault_manager = None
                self.model_loader = None
                self.is_authenticated = False
                self.current_vault_path = None
                self.update_ui_state()
                self.model_table.setRowCount(0)
                self.log_message("Disconnected from vault")
            except Exception as e:
                self.log_message(f"Error disconnecting: {str(e)}", "ERROR")
    
    def create_new_vault(self):
        """Create a new vault."""
        directory = QFileDialog.getExistingDirectory(self, "Select Directory for New Vault")
        if not directory:
            return
        
        # Get authentication
        auth_input, ok = QInputDialog.getText(
            self, "Create Vault", "Enter password for new vault:", QLineEdit.Password
        )
        if not ok or not auth_input:
            return
        
        try:
            # Create vault
            vault_manager = VaultManager(directory, password=auth_input)
            vault_manager.create_vault()
            vault_manager.close_vault()
            
            # Update UI
            self.vault_path_edit.setText(directory)
            self.auth_input.setText(auth_input)
            
            QMessageBox.information(self, "Success", "Vault created successfully")
            self.log_message(f"Created new vault: {directory}")
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to create vault: {str(e)}")
            self.log_message(f"Vault creation failed: {str(e)}", "ERROR")
    
    def scan_models(self):
        """Scan directory for models."""
        scan_path = self.scan_path_edit.text().strip()
        if not scan_path:
            QMessageBox.warning(self, "Error", "Please select a directory to scan")
            return
        
        if not Path(scan_path).exists():
            QMessageBox.warning(self, "Error", "Directory does not exist")
            return
        
        # Start scanning in background
        self.scan_worker = WorkerThread(self._scan_directory, scan_path)
        self.scan_worker.progress.connect(self.update_progress)
        self.scan_worker.finished.connect(self.on_scan_complete)
        self.scan_worker.error.connect(self.on_scan_error)
        self.scan_worker.start()
        
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)
        self.log_message(f"Scanning directory: {scan_path}")
    
    def _scan_directory(self, directory):
        """Background directory scanning."""
        scanner = ModelScanner()
        return scanner.scan_directory(directory)
    
    def on_scan_complete(self, model_files):
        """Handle scan completion."""
        self.progress_bar.setVisible(False)
        
        if not model_files:
            QMessageBox.information(self, "Scan Complete", "No model files found")
            self.log_message("Scan complete: No models found")
            return
        
        # Show results in dialog
        dialog = ModelSelectionDialog(model_files, self)
        if dialog.exec_() == QDialog.Accepted:
            selected_files = dialog.get_selected_files()
            self.encrypt_models(selected_files)
        
        self.log_message(f"Scan complete: Found {len(model_files)} model files")
    
    def on_scan_error(self, error_msg):
        """Handle scan error."""
        self.progress_bar.setVisible(False)
        QMessageBox.critical(self, "Scan Error", f"Scanning failed: {error_msg}")
        self.log_message(f"Scan error: {error_msg}", "ERROR")
    
    def encrypt_models(self, model_files):
        """Encrypt selected models."""
        if not model_files:
            return
        
        # Start encryption in background
        self.encrypt_worker = WorkerThread(self._encrypt_models, model_files)
        self.encrypt_worker.progress.connect(self.update_progress)
        self.encrypt_worker.finished.connect(self.on_encrypt_complete)
        self.encrypt_worker.error.connect(self.on_encrypt_error)
        self.encrypt_worker.start()
        
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)
        self.log_message(f"Encrypting {len(model_files)} models...")
    
    def _encrypt_models(self, model_files):
        """Background model encryption."""
        encrypted_models = []
        for i, model_file in enumerate(model_files):
            try:
                # Add model to vault
                model_id = self.vault_manager.add_model(
                    model_file.path,
                    model_name=model_file.name,
                    progress_callback=lambda p: self.encrypt_worker.progress.emit(
                        (i / len(model_files) + p / len(model_files)) * 100
                    )
                )
                encrypted_models.append((model_file, model_id))
            except Exception as e:
                self.log_message(f"Failed to encrypt {model_file.name}: {str(e)}", "ERROR")
        
        return encrypted_models
    
    def on_encrypt_complete(self, encrypted_models):
        """Handle encryption completion."""
        self.progress_bar.setVisible(False)
        self.load_models()
        self.update_vault_info()
        
        QMessageBox.information(
            self, "Encryption Complete",
            f"Successfully encrypted {len(encrypted_models)} models"
        )
        self.log_message(f"Encryption complete: {len(encrypted_models)} models encrypted")
    
    def on_encrypt_error(self, error_msg):
        """Handle encryption error."""
        self.progress_bar.setVisible(False)
        QMessageBox.critical(self, "Encryption Error", f"Encryption failed: {error_msg}")
        self.log_message(f"Encryption error: {error_msg}", "ERROR")
    
    def encrypt_selected_models(self):
        """Encrypt models from scan results."""
        # This would be implemented with a selection dialog
        QMessageBox.information(self, "Info", "Use Scan for Models first")
    
    def decrypt_model(self):
        """Decrypt selected model."""
        current_row = self.model_table.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "Error", "Please select a model to decrypt")
            return
        
        model_id = self.model_table.item(current_row, 0).data(Qt.UserRole)
        if not model_id:
            return
        
        # Get output path
        output_path, _ = QFileDialog.getSaveFileName(
            self, "Save Decrypted Model", "", "All Files (*.*)"
        )
        if not output_path:
            return
        
        try:
            # Decrypt model
            self.vault_manager.get_model(model_id, output_path)
            
            QMessageBox.information(self, "Success", f"Model decrypted to: {output_path}")
            self.log_message(f"Decrypted model to: {output_path}")
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Decryption failed: {str(e)}")
            self.log_message(f"Decryption error: {str(e)}", "ERROR")
    
    def remove_model(self):
        """Remove selected model from vault."""
        current_row = self.model_table.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "Error", "Please select a model to remove")
            return
        
        model_id = self.model_table.item(current_row, 0).data(Qt.UserRole)
        model_name = self.model_table.item(current_row, 0).text()
        
        reply = QMessageBox.question(
            self, "Confirm Removal",
            f"Are you sure you want to remove '{model_name}' from the vault?",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            try:
                self.vault_manager.remove_model(model_id)
                self.load_models()
                self.update_vault_info()
                
                QMessageBox.information(self, "Success", "Model removed from vault")
                self.log_message(f"Removed model: {model_name}")
                
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Removal failed: {str(e)}")
                self.log_message(f"Removal error: {str(e)}", "ERROR")
    
    def load_models(self):
        """Load models from vault into table."""
        if not self.vault_manager:
            return
        
        try:
            models = self.vault_manager.list_models()
            self.model_table.setRowCount(len(models))
            
            for row, model in enumerate(models):
                # Name
                name_item = QTableWidgetItem(model["name"])
                name_item.setData(Qt.UserRole, model["id"])
                self.model_table.setItem(row, 0, name_item)
                
                # Type
                self.model_table.setItem(row, 1, QTableWidgetItem(model["model_type"]))
                
                # Size
                size_mb = model["file_size"] / (1024 * 1024)
                self.model_table.setItem(row, 2, QTableWidgetItem(f"{size_mb:.1f} MB"))
                
                # Format
                self.model_table.setItem(row, 3, QTableWidgetItem(model["model_type"]))
                
                # Created
                created = model["created_at"][:19].replace('T', ' ')
                self.model_table.setItem(row, 4, QTableWidgetItem(created))
                
                # Status
                self.model_table.setItem(row, 5, QTableWidgetItem("Stored"))
            
        except Exception as e:
            self.log_message(f"Failed to load models: {str(e)}", "ERROR")
    
    def update_vault_info(self):
        """Update vault information display."""
        if not self.vault_manager:
            return
        
        try:
            info = self.vault_manager.get_vault_info()
            
            info_text = f"""
Vault Information:
================
Path: {info['vault_path']}
Version: {info['version']}
Created: {info['created_at']}
Last Modified: {info['last_modified']}

Statistics:
-----------
Models: {info['model_count']}
Total Size: {info['total_size'] / (1024**3):.2f} GB
Encrypted Size: {info['total_encrypted_size'] / (1024**3):.2f} GB
Compression Ratio: {(1 - info['total_encrypted_size'] / info['total_size']) * 100:.1f}%

Security:
---------
Encryption: {info['encryption_algorithm']}
Key Derivation: {info['key_derivation']}
            """.strip()
            
            self.vault_info_text.setPlainText(info_text)
            
        except Exception as e:
            self.log_message(f"Failed to update vault info: {str(e)}", "ERROR")
    
    def check_integrity(self):
        """Check vault integrity."""
        if not self.vault_manager:
            return
        
        try:
            results = self.vault_manager.verify_vault_integrity()
            
            if results["vault_integrity"]:
                QMessageBox.information(
                    self, "Integrity Check",
                    f"Vault integrity verified!\n\n"
                    f"Models verified: {results['models_verified']}\n"
                    f"Models failed: {results['models_failed']}"
                )
            else:
                failed_models = "\n".join([
                    f"- {m['name']}: {m['error']}" for m in results['failed_models']
                ])
                QMessageBox.warning(
                    self, "Integrity Issues",
                    f"Vault integrity issues detected!\n\n"
                    f"Models verified: {results['models_verified']}\n"
                    f"Models failed: {results['models_failed']}\n\n"
                    f"Failed models:\n{failed_models}"
                )
            
            self.log_message(f"Integrity check: {results['models_verified']} verified, {results['models_failed']} failed")
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Integrity check failed: {str(e)}")
            self.log_message(f"Integrity check error: {str(e)}", "ERROR")
    
    def generate_keyfile(self):
        """Generate a new keyfile."""
        file_path, _ = QFileDialog.getSaveFileName(
            self, "Generate Keyfile", "", "Keyfile (*.key)"
        )
        if not file_path:
            return
        
        try:
            encryption_manager = EncryptionManager()
            encryption_manager.generate_keyfile(file_path)
            
            QMessageBox.information(self, "Success", f"Keyfile generated: {file_path}")
            self.log_message(f"Generated keyfile: {file_path}")
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Keyfile generation failed: {str(e)}")
            self.log_message(f"Keyfile generation error: {str(e)}", "ERROR")
    
    def on_model_selection_changed(self):
        """Handle model selection change."""
        has_selection = self.model_table.currentRow() >= 0
        self.decrypt_btn.setEnabled(has_selection and self.is_authenticated)
        self.remove_btn.setEnabled(has_selection and self.is_authenticated)
        
        # Update model details
        if has_selection:
            current_row = self.model_table.currentRow()
            model_id = self.model_table.item(current_row, 0).data(Qt.UserRole)
            self.update_model_details(model_id)
        else:
            self.model_details_text.clear()
    
    def update_model_details(self, model_id):
        """Update model details display."""
        if not self.vault_manager or not model_id:
            return
        
        try:
            models = self.vault_manager.list_models()
            model = next((m for m in models if m["id"] == model_id), None)
            
            if model:
                details = f"""
Model Details:
=============
Name: {model['name']}
ID: {model['id']}
Type: {model['model_type']}
Size: {model['file_size'] / (1024**2):.1f} MB
Encrypted Size: {model['encrypted_size'] / (1024**2):.1f} MB
Checksum: {model['checksum']}
Created: {model['created_at']}
Last Accessed: {model['last_accessed']}

Description: {model.get('description', 'N/A')}
Tags: {', '.join(model.get('tags', []))}
                """.strip()
                
                self.model_details_text.setPlainText(details)
        
        except Exception as e:
            self.model_details_text.setPlainText(f"Error loading details: {str(e)}")
    
    def update_progress(self, value):
        """Update progress bar."""
        self.progress_bar.setValue(int(value))
    
    def update_ui_state(self):
        """Update UI state based on authentication."""
        self.connect_btn.setEnabled(not self.is_authenticated)
        self.disconnect_btn.setEnabled(self.is_authenticated)
        self.scan_btn.setEnabled(self.is_authenticated)
        self.encrypt_selected_btn.setEnabled(self.is_authenticated)
        self.integrity_btn.setEnabled(self.is_authenticated)
        
        if self.is_authenticated:
            self.vault_status_label.setText(f"Connected: {self.current_vault_path.name}")
            self.status_label.setText("Vault connected")
        else:
            self.vault_status_label.setText("No vault connected")
            self.status_label.setText("Ready")
    
    def update_status(self):
        """Update status display."""
        # This could periodically update various status information
        pass
    
    def log_message(self, message, level="INFO"):
        """Add message to log display."""
        timestamp = QDateTime.currentDateTime().toString("yyyy-MM-dd hh:mm:ss")
        log_entry = f"[{timestamp}] {level}: {message}"
        
        self.log_text.append(log_entry)
        
        # Auto-scroll to bottom
        scrollbar = self.log_text.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
        
        # Also log to file logger
        if level == "ERROR":
            self.logger.error(message)
        elif level == "WARNING":
            self.logger.warning(message)
        else:
            self.logger.info(message)
    
    def clear_logs(self):
        """Clear log display."""
        self.log_text.clear()
        self.log_message("Logs cleared")
    
    def save_logs(self):
        """Save logs to file."""
        file_path, _ = QFileDialog.getSaveFileName(
            self, "Save Logs", "vault_logs.txt", "Text Files (*.txt)"
        )
        if file_path:
            try:
                with open(file_path, 'w') as f:
                    f.write(self.log_text.toPlainText())
                QMessageBox.information(self, "Success", f"Logs saved to: {file_path}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to save logs: {str(e)}")
    
    def show_about(self):
        """Show about dialog."""
        QMessageBox.about(
            self, "About",
            "StressGPT7 Encrypted Model Vault\n\n"
            "Version 1.0.0\n\n"
            "A secure system for storing, encrypting, and managing AI models.\n\n"
            "Features:\n"
            "· AES-256-GCM encryption\n"
            "· Secure key derivation\n"
            "· Model integrity verification\n"
            "· Multiple model format support\n"
            "· GUI and CLI interfaces"
        )
    
    def closeEvent(self, event):
        """Handle application close."""
        if self.vault_manager:
            try:
                self.vault_manager.close_vault()
            except:
                pass
        
        event.accept()


class ModelSelectionDialog(QDialog):
    """Dialog for selecting models from scan results."""
    
    def __init__(self, model_files, parent=None):
        super().__init__(parent)
        self.model_files = model_files
        self.selected_files = []
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dialog UI."""
        self.setWindowTitle("Select Models to Encrypt")
        self.setFixedSize(800, 600)
        
        layout = QVBoxLayout(self)
        
        # Model list
        self.model_list = QListWidget()
        for model_file in self.model_files:
            item = QListWidgetItem(f"{model_file.name} ({model_file.format}, {model_file.size / (1024**2):.1f} MB)")
            item.setData(Qt.UserRole, model_file)
            item.setFlags(item.flags() | Qt.ItemIsUserCheckable)
            item.setCheckState(Qt.Checked)
            self.model_list.addItem(item)
        
        layout.addWidget(self.model_list)
        
        # Buttons
        button_layout = QHBoxLayout()
        select_all_btn = QPushButton("Select All")
        select_all_btn.clicked.connect(self.select_all)
        deselect_all_btn = QPushButton("Deselect All")
        deselect_all_btn.clicked.connect(self.deselect_all)
        button_layout.addWidget(select_all_btn)
        button_layout.addWidget(deselect_all_btn)
        button_layout.addStretch()
        
        dialog_buttons = QDialogButtonBox(
            QDialogButtonBox.Ok | QDialogButtonBox.Cancel
        )
        dialog_buttons.accepted.connect(self.accept)
        dialog_buttons.rejected.connect(self.reject)
        button_layout.addWidget(dialog_buttons)
        
        layout.addLayout(button_layout)
    
    def select_all(self):
        """Select all models."""
        for i in range(self.model_list.count()):
            item = self.model_list.item(i)
            item.setCheckState(Qt.Checked)
    
    def deselect_all(self):
        """Deselect all models."""
        for i in range(self.model_list.count()):
            item = self.model_list.item(i)
            item.setCheckState(Qt.Unchecked)
    
    def get_selected_files(self):
        """Get selected model files."""
        selected = []
        for i in range(self.model_list.count()):
            item = self.model_list.item(i)
            if item.checkState() == Qt.Checked:
                model_file = item.data(Qt.UserRole)
                selected.append(model_file)
        return selected


def main():
    """Main entry point for GUI application."""
    app = QApplication(sys.argv)
    app.setApplicationName("StressGPT7 Encrypted Model Vault")
    app.setApplicationVersion("1.0.0")
    
    # Create and show main window
    window = VaultGUI()
    window.show()
    
    # Run application
    sys.exit(app.exec_())
