#!/bin/bash

# ARGscape Railway Deployment Build
echo "🚂 Building ARGscape for Railway deployment..."

# Ensure we're in the project root
if [ ! -f "railway.toml" ]; then
    echo "❌ Please run this from the project root directory"
    exit 1
fi

echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "🐍 Checking backend dependencies..."
cd backend
pip install -r requirements-web.txt
cd ..

echo "✅ Ready for Railway deployment!"
echo "   Run: railway up" 