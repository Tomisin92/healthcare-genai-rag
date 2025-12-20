#!/bin/bash

# Healthcare RAG Frontend Setup Script
# This script sets up and runs the frontend for local development

set -e

echo "🏥 Healthcare RAG Frontend Setup"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend" || exit 1

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Backend API URL
# For local development with backend on localhost:8000
VITE_API_URL=http://localhost:8000/api

# For production with AKS
# VITE_API_URL=http://135.237.1.189/api
EOF
    echo "✅ Created .env file"
fi

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "📋 Available commands:"
echo "  npm run dev     - Start development server (http://localhost:3000)"
echo "  npm run build   - Build for production"
echo "  npm run preview - Preview production build"
echo ""
echo "🚀 To start the development server, run:"
echo "  cd frontend && npm run dev"