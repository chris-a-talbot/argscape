#!/bin/bash

# ARGscape Desktop Build with Backend Bundling
echo "🖥️  Building ARGscape Desktop Application..."

# Check if we should skip backend bundling
if [ "$1" == "--skip-backend" ]; then
    echo "⏩ Skipping backend bundling (using existing binary)"
elif [ "$1" == "--force-backend" ]; then
    echo "🔄 Force rebuilding backend..."
    python scripts/bundle-backend.py --force
else
    echo "📦 Bundling backend (smart rebuild)..."
    python scripts/bundle-backend.py
fi

echo "🔨 Building Tauri desktop application..."
cd frontend && npm run build && cd .. && tauri build

echo "✅ Desktop build complete!"
echo "   Check src-tauri/target/release/bundle/ for the installer" 