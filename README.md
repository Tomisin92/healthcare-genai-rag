# Healthcare GenAI RAG System

A Retrieval-Augmented Generation (RAG) system for healthcare information using Azure Kubernetes Service (AKS).

## 🏗️ Architecture

- **Backend**: FastAPI
- **AI/ML**: OpenAI GPT-4o-mini, Text Embeddings
- **Vector Store**: FAISS
- **Container Registry**: Azure Container Registry (ACR)
- **Orchestration**: Azure Kubernetes Service (AKS)
- **Infrastructure**: Azure Cloud

## 📋 Prerequisites

- Python 3.9+
- Docker Desktop
- Azure CLI
- kubectl
- Azure Subscription with Owner role
- OpenAI API Key

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Tomisin92/healthcare-genai-rag.git
cd healthcare-genai-rag
```

### 2. Set Up Local Environment
```bash
# Create virtual environment
python -m venv healthgenai-env
source healthgenai-env/bin/activate  # On Windows: healthgenai-env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 3. Run Locally
```bash
# Start the application
uvicorn main:app --reload

# Access the API
# - API Docs: http://localhost:8000/docs
# - Health: http://localhost:8000/health
```

## 🐳 Docker Deployment
```bash
# Build Docker image
docker build -t healthcare-genai-rag:local .

# Run container
docker run -p 8000:8000 --env-file .env healthcare-genai-rag:local
```

## ☁️ Azure AKS Deployment

### 1. Azure Login & Setup
```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Set variables
export RESOURCE_GROUP="genai-rg"
export AKS_NAME="genai-aks"
export ACR_NAME="genairagacr"
export LOCATION="eastus"
```

### 2. Create Azure Resources
```bash
# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Register providers
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.ContainerService

# Create ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --location $LOCATION

# Create AKS
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --node-count 1 \
  --node-vm-size Standard_DC2s_v3 \
  --enable-managed-identity \
  --generate-ssh-keys \
  --attach-acr $ACR_NAME \
  --location $LOCATION
```

### 3. Build & Push Image to ACR
```bash
# Login to ACR
az acr login --name $ACR_NAME

# Get ACR login server
export ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Build and push
docker build -t $ACR_LOGIN_SERVER/healthcare-genai-rag:latest .
docker push $ACR_LOGIN_SERVER/healthcare-genai-rag:latest
```

### 4. Deploy to Kubernetes
```bash
# Get AKS credentials
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME

# Create secret (replace with your OpenAI key)
kubectl create secret generic healthcare-rag-secret \
  --from-literal=OPENAI_API_KEY='your-openai-key-here'

# Or use secret file
cp k8s/secret.yaml.template k8s/secret.yaml
# Edit k8s/secret.yaml and add your key
kubectl apply -f k8s/secret.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check status
kubectl get all

# Get external IP
kubectl get svc healthcare-rag-service
```

### 5. Test the Deployment
```bash
# Get external IP
EXTERNAL_IP=$(kubectl get svc healthcare-rag-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test health endpoint
curl http://$EXTERNAL_IP/health

# Test chat endpoint
curl -X POST http://$EXTERNAL_IP/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the symptoms of diabetes?"}'
```

## 🛠️ Management Commands

### Start/Stop AKS Cluster
```bash
# Stop cluster (save costs)
az aks stop --resource-group $RESOURCE_GROUP --name $AKS_NAME

# Start cluster
az aks start --resource-group $RESOURCE_GROUP --name $AKS_NAME
```

### View Logs
```bash
kubectl logs -f deployment/healthcare-rag-deployment
```

### Update Deployment
```bash
# Build new version
docker build -t $ACR_LOGIN_SERVER/healthcare-genai-rag:v2 .
docker push $ACR_LOGIN_SERVER/healthcare-genai-rag:v2

# Update deployment
kubectl set image deployment/healthcare-rag-deployment \
  healthcare-rag=$ACR_LOGIN_SERVER/healthcare-genai-rag:v2
```

### Scale Application
```bash
kubectl scale deployment healthcare-rag-deployment --replicas=3
```

## 📁 Project Structure
```
healthcare-genai-rag/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   └── services/
├── data/
│   ├── raw_docs/
│   └── vectorstore/
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── secret.yaml.template
├── tests/
├── .env.example
├── .gitignore
├── Dockerfile
├── requirements.txt
└── README.md
```

## 🔒 Security Notes

- Never commit `.env` or `k8s/secret.yaml` files
- Use Azure Key Vault for production secrets
- Rotate OpenAI API keys regularly
- Enable network policies in AKS (Azure Kubenetes Service)
- Use private ACR endpoints for production

## 🧹 Cleanup
```bash
# Delete all Azure resources
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

## 📝 License

MIT License

## 👤 Author

Tomisin - [GitHub](https://github.com/Tomisin92)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!