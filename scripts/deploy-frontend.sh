#!/bin/bash

# Healthcare RAG Frontend Deployment Script
# Builds and deploys the frontend to ACR and AKS

set -e

echo "🏥 Healthcare RAG Frontend Deployment"
echo "====================================="

# Configuration
ACR_NAME="genairagacr"
IMAGE_NAME="healthcare-frontend"
TAG="${1:-latest}"
BACKEND_API_URL="${2:-http://135.237.1.189/api}"

echo "📋 Configuration:"
echo "  ACR: $ACR_NAME"
echo "  Image: $IMAGE_NAME:$TAG"
echo "  Backend API: $BACKEND_API_URL"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Check if Azure CLI is available
if command -v az &> /dev/null; then
    echo "🔑 Logging in to ACR..."
    az acr login --name $ACR_NAME
else
    echo "⚠️  Azure CLI not found. Skipping ACR login."
    echo "   Make sure you're authenticated with: az acr login --name $ACR_NAME"
fi

# Build Docker image
echo ""
echo "🐳 Building Docker image..."
cd frontend
docker build \
  --build-arg VITE_API_URL=$BACKEND_API_URL \
  -t $ACR_NAME.azurecr.io/$IMAGE_NAME:$TAG \
  -t $ACR_NAME.azurecr.io/$IMAGE_NAME:latest \
  .

# Push to ACR
echo ""
echo "📤 Pushing to ACR..."
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:$TAG
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:latest

# Deploy to AKS
echo ""
echo "🚀 Deploying to AKS..."
cd ..
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for rollout
echo ""
echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/healthcare-frontend-deployment

# Get service info
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Information:"
kubectl get service healthcare-frontend-service

echo ""
echo "🌐 Access your frontend at the EXTERNAL-IP shown above"
echo ""
echo "💡 Tip: Run 'kubectl get service healthcare-frontend-service -w' to watch for the external IP"