#!/bin/bash
# scripts/deploy-frontend-duckdns.sh
# Deploy Healthcare RAG Frontend to Azure Kubernetes Service with DuckDNS

set -e

echo "🦆 Healthcare RAG Frontend Deployment with DuckDNS"
echo "===================================================="
echo ""

# Variables - CUSTOMIZE THESE
RESOURCE_GROUP="genai-rg"
AKS_NAME="genai-aks"
NAMESPACE="default"
DUCKDNS_DOMAIN="healthai.duckdns.org"
DUCKDNS_TOKEN="809ffc73-c011-462d-87a6-731cc3ea2dcb"

echo "📝 Configuration:"
echo "   Domain: $DUCKDNS_DOMAIN"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   AKS Cluster: $AKS_NAME"
echo "   Namespace: $NAMESPACE"
echo ""

# Check if we're in the right directory
if [ ! -d "k8s" ]; then
    echo "❌ Error: k8s directory not found!"
    echo "   Please run this script from the project root: healthcare-genai-rag/"
    exit 1
fi

# Get AKS credentials
echo "🔐 Getting AKS credentials..."
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME --overwrite-existing

# Check if frontend/index.html exists
if [ ! -f "frontend/index.html" ]; then
    echo "❌ Error: frontend/index.html not found!"
    echo "   Please create frontend/index.html first"
    echo "   Location: $(pwd)/frontend/index.html"
    exit 1
fi

echo "✅ Found frontend/index.html"

# Create ConfigMap from HTML
echo ""
echo "📦 Creating ConfigMap from frontend files..."
kubectl create configmap frontend-html \
    --from-file=index.html=frontend/index.html \
    --namespace=$NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ ConfigMap created/updated"

# Apply Kubernetes configurations
echo ""
echo "🔧 Applying Kubernetes configurations..."

echo "   → Applying nginx config..."
kubectl apply -f k8s/frontend-nginx-config.yaml

echo "   → Applying frontend deployment..."
kubectl apply -f k8s/frontend-deployment.yaml

echo "✅ Kubernetes configurations applied"

# Install NGINX Ingress Controller if not exists
echo ""
echo "🔌 Checking NGINX Ingress Controller..."
if ! kubectl get namespace ingress-nginx &> /dev/null; then
    echo "📥 Installing NGINX Ingress Controller..."
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
    
    echo "⏳ Waiting for ingress controller to be ready..."
    kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=300s || true
    
    echo "✅ NGINX Ingress Controller installed"
else
    echo "✅ NGINX Ingress Controller already installed"
fi

# Wait for ingress controller to get external IP
echo ""
echo "⏳ Waiting for Ingress Controller LoadBalancer IP..."
sleep 15

INGRESS_IP=""
for i in {1..30}; do
    INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    if [ ! -z "$INGRESS_IP" ]; then
        break
    fi
    echo "   Waiting for IP... (attempt $i/30)"
    sleep 5
done

if [ -z "$INGRESS_IP" ]; then
    echo "❌ Error: Could not get Ingress Controller IP after 150 seconds"
    echo "   Check the ingress controller status:"
    echo "   kubectl get svc -n ingress-nginx ingress-nginx-controller"
    exit 1
fi

echo "✅ Ingress Controller IP: $INGRESS_IP"

# Update DuckDNS
echo ""
echo "🦆 Updating DuckDNS with IP: $INGRESS_IP..."
DUCKDNS_RESPONSE=$(curl -s "https://www.duckdns.org/update?domains=healthai&token=$DUCKDNS_TOKEN&ip=$INGRESS_IP")

if [ "$DUCKDNS_RESPONSE" == "OK" ]; then
    echo "✅ DuckDNS updated successfully!"
else
    echo "⚠️  DuckDNS update response: $DUCKDNS_RESPONSE"
    echo "   Manual update URL:"
    echo "   https://www.duckdns.org/update?domains=healthai&token=$DUCKDNS_TOKEN&ip=$INGRESS_IP"
fi

# Apply Ingress
echo ""
echo "🌐 Creating Ingress with domain: $DUCKDNS_DOMAIN..."
kubectl apply -f k8s/healthcare-ingress.yaml

echo "✅ Ingress created/updated"

# Wait a moment for resources to be ready
echo ""
echo "⏳ Waiting for deployments to be ready..."
sleep 5

# Check deployment status
kubectl rollout status deployment/healthcare-frontend-deployment --timeout=120s || true
kubectl rollout status deployment/healthcare-rag-deployment --timeout=120s || true

echo ""
echo "=============================================="
echo "✅ Deployment Complete!"
echo "=============================================="
echo ""

# Show deployment status
echo "📊 Deployment Status:"
echo ""
echo "Frontend Pods:"
kubectl get pods -l app=healthcare-frontend --no-headers | head -5
echo ""
echo "Backend Pods:"
kubectl get pods -l app=healthcare-rag --no-headers | head -5
echo ""
echo "Services:"
kubectl get svc healthcare-frontend-service healthcare-rag-service --no-headers
echo ""
echo "Ingress:"
kubectl get ingress healthcare-rag-ingress --no-headers
echo ""

echo "=============================================="
echo "🌐 Access Information"
echo "=============================================="
echo ""
echo "   🔗 Website: http://$DUCKDNS_DOMAIN"
echo "   🔗 API Docs: http://$DUCKDNS_DOMAIN/docs"
echo "   🔗 Health: http://$DUCKDNS_DOMAIN/health"
echo ""
echo "   📍 Ingress IP: $INGRESS_IP"
echo "   🦆 DuckDNS: Updated ✅"
echo ""
echo "=============================================="
echo "⏳ DNS Propagation"
echo "=============================================="
echo ""
echo "DNS may take 30-60 seconds to propagate."
echo "Wait a moment, then try:"
echo ""
echo "   curl http://$DUCKDNS_DOMAIN/health"
echo ""

echo "=============================================="
echo "📝 Useful Commands"
echo "=============================================="
echo ""
echo "View frontend logs:"
echo "   kubectl logs -f deployment/healthcare-frontend-deployment"
echo ""
echo "View backend logs:"
echo "   kubectl logs -f deployment/healthcare-rag-deployment"
echo ""
echo "View all resources:"
echo "   kubectl get all"
echo ""
echo "Update frontend after changes:"
echo "   kubectl create configmap frontend-html \\"
echo "     --from-file=index.html=frontend/index.html \\"
echo "     --dry-run=client -o yaml | kubectl apply -f -"
echo "   kubectl rollout restart deployment/healthcare-frontend-deployment"
echo ""
echo "Get Ingress IP:"
echo "   kubectl get ingress healthcare-rag-ingress"
echo ""
echo "Manual DuckDNS update:"
echo "   curl \"https://www.duckdns.org/update?domains=healthai&token=$DUCKDNS_TOKEN&ip=\$NEW_IP\""
echo ""
echo "=============================================="
echo "🎉 Deployment completed successfully!"
echo "=============================================="
echo ""