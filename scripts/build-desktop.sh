#!/bin/bash

# ARGscape Desktop Build with Tauri
echo "🖥️  Building ARGscape Desktop Application..."

# Ensure we're in the project root
if [ ! -d "frontend/src-tauri" ]; then
    echo "❌ Tauri not initialized. Please run from project root directory."
    exit 1
fi

# Install Rust if not present
if ! command -v cargo &> /dev/null; then
    echo "🦀 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source ~/.cargo/env
fi

echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🔨 Building desktop application..."
npm run tauri:build

echo "✅ Desktop build complete!"
echo "   Check frontend/src-tauri/target/release/ for the executable" 