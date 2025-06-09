#!/usr/bin/env python3
"""
Bundle the FastAPI backend into a standalone executable for Tauri distribution
"""

import subprocess
import sys
import os
import shutil
import argparse
from pathlib import Path
import platform

def get_target_binary_path(project_root, backend_dir):
    """Get the expected target binary path with platform-specific naming"""
    machine = platform.machine().lower()
    system = platform.system().lower()
    
    # Map to Rust target triple naming
    if system == "windows":
        if machine in ["amd64", "x86_64"]:
            target_triple = "x86_64-pc-windows-msvc"
        else:
            target_triple = "i686-pc-windows-msvc"
        exe_extension = ".exe"
    elif system == "darwin":  # macOS
        if machine == "arm64":
            target_triple = "aarch64-apple-darwin"
        else:
            target_triple = "x86_64-apple-darwin"
        exe_extension = ""
    else:  # Linux
        if machine in ["amd64", "x86_64"]:
            target_triple = "x86_64-unknown-linux-gnu"
        else:
            target_triple = "i686-unknown-linux-gnu"
        exe_extension = ""
    
    target_name = f"argscape-backend-{target_triple}{exe_extension}"
    sidecar_dir = project_root / "src-tauri" / "binaries"
    return sidecar_dir / target_name

def should_rebuild(backend_dir, target_binary):
    """Check if we should rebuild based on file timestamps"""
    if not target_binary.exists():
        return True
    
    # Check if any Python files are newer than the binary
    binary_time = target_binary.stat().st_mtime
    
    for python_file in backend_dir.glob("**/*.py"):
        if python_file.stat().st_mtime > binary_time:
            return True
    
    # Check requirements file
    requirements_file = backend_dir / "requirements-web.txt"
    if requirements_file.exists() and requirements_file.stat().st_mtime > binary_time:
        return True
    
    return False

def main():
    parser = argparse.ArgumentParser(description="Bundle ARGscape backend")
    parser.add_argument("--force", "-f", action="store_true", 
                       help="Force rebuild even if binary exists")
    args = parser.parse_args()
    
    # Get project root and backend directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    backend_dir = project_root / "backend"
    
    print("📦 Bundling Python backend with PyInstaller...")
    print(f"Backend directory: {backend_dir}")
    
    # Get target binary path
    target_binary = get_target_binary_path(project_root, backend_dir)
    
    # Check if we should rebuild
    if not args.force and not should_rebuild(backend_dir, target_binary):
        print(f"✅ Backend binary is up to date: {target_binary}")
        print("💡 Use --force to rebuild anyway")
        return True
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    print("📦 Bundling Python backend with PyInstaller...")
    print(f"Backend directory: {backend_dir}")
    
    # Install PyInstaller if not present
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
    
    # Clean previous builds
    dist_dir = backend_dir / "dist"
    build_dir = backend_dir / "build"
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    if build_dir.exists():
        shutil.rmtree(build_dir)
    
    # Create standalone executable using spec file
    spec_file = backend_dir / "argscape-backend.spec"
    
    if spec_file.exists():
        print("Using spec file for more precise control...")
        cmd = [
            sys.executable, "-m", "PyInstaller",
            "--clean",  # Clean cache
            str(spec_file)
        ]
    else:
        print("Using command-line approach...")
        # Create standalone executable
        cmd = [
            sys.executable, "-m", "PyInstaller",
            "--onefile",  # Single executable
            "--name", "argscape-backend",
            "--console",  # Keep console for debugging
            "--hidden-import", "uvicorn.loops.auto",
            "--hidden-import", "uvicorn.protocols.http.auto",
            "--hidden-import", "uvicorn.protocols.websockets.auto", 
            "--hidden-import", "uvicorn.lifespan.on",
            "--hidden-import", "fastapi",
            "--hidden-import", "tskit",
            "--hidden-import", "msprime",
            # Exclude GUI packages that cause conflicts
            "--exclude-module", "PyQt5",
            "--exclude-module", "PyQt6", 
            "--exclude-module", "PySide2",
            "--exclude-module", "PySide6",
            "--exclude-module", "tkinter",
            "--exclude-module", "matplotlib.backends._tkagg",
            "--exclude-module", "matplotlib.backends.qt_compat",
            "--exclude-module", "IPython",
            "--exclude-module", "jupyter",
            "--exclude-module", "notebook",
            "--add-data", f"data{os.pathsep}data",  # Include data files
            "main.py"  # Use main.py as entry point
        ]
    
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print("❌ PyInstaller failed:")
        print(result.stderr)
        return False
    
    # Create sidecar directory structure
    sidecar_dir = project_root / "src-tauri" / "binaries"
    sidecar_dir.mkdir(exist_ok=True)
    
    # Determine platform-specific naming
    machine = platform.machine().lower()
    system = platform.system().lower()
    
    # Map to Rust target triple naming
    if system == "windows":
        if machine in ["amd64", "x86_64"]:
            target_triple = "x86_64-pc-windows-msvc"
        else:
            target_triple = "i686-pc-windows-msvc"
        exe_extension = ".exe"
    elif system == "darwin":  # macOS
        if machine == "arm64":
            target_triple = "aarch64-apple-darwin"
        else:
            target_triple = "x86_64-apple-darwin"
        exe_extension = ""
    else:  # Linux
        if machine in ["amd64", "x86_64"]:
            target_triple = "x86_64-unknown-linux-gnu"
        else:
            target_triple = "i686-unknown-linux-gnu"
        exe_extension = ""
    
    # Source and target file names
    source_name = "argscape-backend" + (".exe" if os.name == "nt" else "")
    target_name = f"argscape-backend-{target_triple}{exe_extension}"
    
    source_exe = dist_dir / source_name
    target_exe = sidecar_dir / target_name
    
    if source_exe.exists():
        shutil.copy2(source_exe, target_exe)
        print(f"✅ Backend bundled successfully!")
        print(f"📁 Executable copied to: {target_exe}")
        return True
    else:
        print(f"❌ Executable not found at: {source_exe}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 