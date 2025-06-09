#!/bin/bash

# ARGscape Local Development Setup
echo "🚀 Starting ARGscape Local Development..."

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this from the project root directory"
    exit 1
fi

# Start with Docker Compose
echo "📦 Starting services with Docker Compose..."
docker-compose up --build

echo "✅ ARGscape is running at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs" 