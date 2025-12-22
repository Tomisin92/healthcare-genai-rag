# Healthcare GenAI RAG System

A production-ready Retrieval-Augmented Generation (RAG) system for healthcare education and clinical decision support, deployed on Azure Kubernetes Service (AKS) with full observability, latency monitoring, and alerting.

**Disclaimer:** For educational use only. Not a substitute for professional medical advice.

## Overview

This project combines:

- A **FastAPI backend** that exposes chat and health endpoints
- A **vector-search RAG pipeline** over curated healthcare PDFs (e.g., hypertension and vaccination toolkits)
- A **React + TypeScript + Vite frontend** that provides a Healthcare AI Assistant UI
- **Azure Application Insights** dashboards and log-based alerts for p90 latency
- **Containerized deployment** to Azure Kubernetes Service (AKS) backed by Azure Container Registry (ACR)

The goal is to demonstrate a realistic, end-to-end GenAI system that you can run locally, in Docker, and on AKS.

## Architecture

### High-Level Components

#### Backend (API)
- FastAPI application
- `/api/chat` RAG endpoint
- `/health` health-check endpoint
- Integrates with OpenAI GPT-4o-mini and embeddings
- Uses FAISS as an in-process vector store

#### RAG / Data Layer
- PDF ingestion and chunking into embeddings
- FAISS index persisted under `data/vectorstore/`
- Document metadata retained for source citations (filename + page)

#### Frontend (UI)
- React + TypeScript + Vite SPA
- "RAG-Powered Healthcare Assistant" chat UI
- Conversation list / "New Consultation" flow
- Source provenance panel and downloadable chat transcripts
- Logic to hide sources for chitchat and "I'm not sure / no context" answers

#### Observability
- Azure Application Insights for logs, traces, and custom dimensions
- Percentile latency dashboards (p50, p90, p99) and request-rate charts
- Log-based alert rule on `p90_latency_ms` for `rag_chat_request` traces
- Email notifications via Azure Monitor Action Group / quick actions

#### Infrastructure / Deployment
- Dockerized backend
- Azure Container Registry (ACR) as image registry
- Azure Kubernetes Service (AKS) for orchestrating the API
- Kubernetes Deployment, Service, and Secret manifests
- Optional static hosting or AKS-served frontend

## Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- Docker Desktop
- Azure CLI
- kubectl
- Azure subscription with permissions to create ACR + AKS
- OpenAI API key

## Folder Structure

```
healthcare-genai-rag/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes_chat.py        # /api/chat, /health, etc.
│   │   ├── core/
│   │   │   ├── config.py             # settings, env handling
│   │   │   └── logging.py            # structured logging / App Insights
│   │   ├── models/
│   │   │   ├── schemas.py            # Pydantic models
│   │   │   └── rag_request.py
│   │   ├── services/
│   │   │   ├── rag_pipeline.py       # retrieval + LLM orchestration
│   │   │   ├── embeddings.py         # OpenAI embedding calls
│   │   │   └── vector_store.py       # FAISS index load/save
│   │   ├── instrumentation/
│   │   │   └── app_insights.py       # traces, customDimensions.latency_ms
│   │   └── __init__.py
│   ├── data/
│   │   ├── raw_docs/                 # input PDFs (not committed)
│   │   └── vectorstore/              # FAISS index artifacts
│   ├── tests/
│   │   └── test_chat.py
│   ├── main.py                       # FastAPI app entrypoint
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # chat UI + business logic
│   │   ├── main.tsx
│   │   ├── types/
│   │   │   └── chat.ts               # Conversation, Message, ChatResponse
│   │   ├── services/
│   │   │   └── api.ts                # axios client for /api/chat
│   │   ├── styles/
│   │   │   └── tailwind.css
│   │   └── vite-env.d.ts
│   ├── public/
│   │   └── index.html
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── postcss.config.cjs
│   └── tailwind.config.cjs
│
├── k8s/
│   ├── deployment.yaml               # backend Deployment
│   ├── service.yaml                  # LoadBalancer Service
│   ├── secret.yaml.template          # OPENAI_API_KEY secret template
│   └── ingress.yaml                  # optional ingress config
│
├── infra/
│   ├── scripts/
│   │   ├── build_push_acr.sh
│   │   └── deploy_aks.sh
│   └── monitors/
│       ├── appinsights_queries.kql   # latency, error-rate, rpm queries
│       └── dashboards.json           # Azure dashboard export (optional)
│
├── .gitignore
├── README.md
└── LICENSE
```

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/Tomisin92/healthcare-genai-rag.git
cd healthcare-genai-rag
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv healthgenai-env

# Windows
healthgenai-env\Scripts\activate

# macOS / Linux
source healthgenai-env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env and set OPENAI_API_KEY and other settings
```

Run the API:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Endpoints:**
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health
- Chat: POST http://localhost:8000/api/chat

### 3. Frontend Setup

```bash
cd ../frontend

# Install Node dependencies
npm install

# Start dev server
npm run dev
```

By default, Vite serves the UI on http://localhost:5173 and proxies API calls to the backend (configure base URL in `src/services/api.ts` if needed).

## Docker Workflows

### Build & Run Backend Image Locally

From `backend/`:

```bash
docker build -t healthcare-genai-rag:local .
docker run --rm -p 8000:8000 --env-file .env healthcare-genai-rag:local
```

You can then point the frontend at http://localhost:8000.

## Azure AKS Deployment

### 1. Azure Login & Environment

```bash
# Login
az login

# Select subscription
az account set --subscription "<your-subscription-id>"

# Set variables
export RESOURCE_GROUP="genai-rg"
export AKS_NAME="genai-aks"
export ACR_NAME="genairagacr"
export LOCATION="eastus"
```

### 2. Create Azure Resources

```bash
# Resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Providers
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.ContainerService

# Container registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --location $LOCATION

# AKS cluster
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

From `backend/`:

```bash
# Login to ACR
az acr login --name $ACR_NAME

# Get login server
export ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Build and push
docker build -t $ACR_LOGIN_SERVER/healthcare-genai-rag:latest .
docker push $ACR_LOGIN_SERVER/healthcare-genai-rag:latest
```

### 4. Deploy to AKS

```bash
# Get cluster credentials
az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME

# Option A: create secret from literal
kubectl create secret generic healthcare-rag-secret \
  --from-literal=OPENAI_API_KEY='your-openai-key-here'

# Option B: use templated secret manifest
cp k8s/secret.yaml.template k8s/secret.yaml
# edit k8s/secret.yaml and add OPENAI_API_KEY
kubectl apply -f k8s/secret.yaml

# Deploy workload
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
# optional
# kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get all
kubectl get svc healthcare-rag-service
```

### 5. Test the Deployed API

```bash
# External IP
EXTERNAL_IP=$(kubectl get svc healthcare-rag-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Health
curl http://$EXTERNAL_IP/health

# Chat
curl -X POST http://$EXTERNAL_IP/api/chat/ \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the symptoms of diabetes?"}'
```

## Monitoring & Alerts (Application Insights)

### Logging & Metrics

The backend sends structured traces to Application Insights where each chat request:

- Logs a `traces` entry with `message == "rag_chat_request"`
- Adds `customDimensions.latency_ms` for end-to-end request latency
- Supports percentile latency queries and dashboards

Example KQL to compute `p90_latency_ms`:

```kusto
traces
| where message == "rag_chat_request"
| extend latency_ms = todouble(customDimensions.latency_ms)
| where isnotnull(latency_ms)
| summarize p90_latency_ms = percentiles(latency_ms, 90)
```

### Dashboards

Create an Azure Dashboard tile using the above query (and similar ones for p50, p99, and requests per minute) to visualize latency over time.

### Log Alert: p90 Latency High

A log-based alert rule `rag-p90-latency-high` monitors `p90_latency_ms` and sends email when latency breaches the SLO:

- **Scope:** genai-healthcare-appinsights
- **Signal type:** Custom log search (Log search)
- **Measure:** p90_latency_ms
- **Aggregation:** Average over 5 minutes
- **Condition:** p90_latency_ms > 6000 ms
- **Evaluation period:** 15 minutes
- **Frequency:** 5 minutes
- **Severity:** 3 – Informational
- **Actions:** Email to configured address via Azure Monitor quick actions or Action Group

To adjust the SLO, edit the alert rule in Azure Portal and change the threshold value.

## Frontend Behavior Notes

- **Conversations:** Each "New Consultation" creates a new conversation with its own message history and timestamps
- **Sources Panel:** For answers grounded in documents, the assistant shows a "Sources" section listing unique (filename, page) pairs
- **Chitchat & "I don't know" Responses:**
  - Greetings/goodbyes are treated as chitchat and never show sources
  - Answers that start with "I'm not sure…" or mention that the context does not include the answer are rendered without sources to avoid misleading citations
- **Download Transcript:** The "Download" button exports the current conversation as a `.txt` file with timestamps and source references

## Operations

### Start / Stop AKS Cluster

```bash
# Stop (save cost)
az aks stop --resource-group $RESOURCE_GROUP --name $AKS_NAME

# Start
az aks start --resource-group $RESOURCE_GROUP --name $AKS_NAME
```

### Logs & Troubleshooting

```bash
# Backend logs
kubectl logs -f deployment/healthcare-rag-deployment

# Describe pods / services
kubectl describe pod <pod-name>
kubectl describe svc healthcare-rag-service
```

### Rolling Updates

```bash
# Build and push new image
docker build -t $ACR_LOGIN_SERVER/healthcare-genai-rag:v2 .
docker push $ACR_LOGIN_SERVER/healthcare-genai-rag:v2

# Update deployment
kubectl set image deployment/healthcare-rag-deployment \
  healthcare-rag=$ACR_LOGIN_SERVER/healthcare-genai-rag:v2
```

### Scaling

```bash
kubectl scale deployment healthcare-rag-deployment --replicas=3
```

## Security Notes

- Never commit `.env`, `k8s/secret.yaml`, or any file with secrets
- Prefer Azure Key Vault for production secret management
- Use private ACR endpoints and restricted NSGs in production
- Enable network policies and RBAC on AKS
- Rotate OpenAI API keys regularly and store them securely

## Cleanup

```bash
# Delete all Azure resources for this project
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

## Development Notes (Frontend)

The frontend is based on the official React + TypeScript + Vite template with:

- @vitejs/plugin-react
- Tailwind CSS for styling
- ESLint configured for TypeScript and React

If you need stricter type-aware linting, you can extend `eslint.config` to use the `typescript-eslint` type-checked configs and optional React lint plugins.

## GitHub Actions CI/CD to ACR + AKS

This section adds a simple CI/CD pipeline that:

- Builds and pushes the backend Docker image to Azure Container Registry (ACR) on each push to `main`
- Deploys the new image to AKS using kubectl

Use this as a starting point and harden it for production (OIDC, Key Vault, etc.) as needed.

### Prerequisites for CI/CD

1. GitHub repository containing this project
2. Azure resources already created (as in sections above):
   - Resource Group
   - ACR (`$ACR_NAME`)
   - AKS (`$AKS_NAME`)
3. Service principal or Federated Credentials (recommended) to allow GitHub Actions to log in to Azure and ACR

For a simple starting point, create a service principal:

```bash
az ad sp create-for-rbac \
  --name "github-actions-aks-sp" \
  --role contributor \
  --scopes /subscriptions/<SUB_ID>/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth
```

This prints a JSON block; copy it.

In your GitHub repo:
- Go to **Settings → Secrets and variables → Actions → New repository secret**
- Add:
  - `AZURE_CREDENTIALS` – the entire JSON from `az ad sp create-for-rbac`
  - `AZURE_SUBSCRIPTION_ID` – your subscription ID
  - `AZURE_RESOURCE_GROUP` – genai-rg (or your name)
  - `AZURE_AKS_NAME` – genai-aks
  - `AZURE_ACR_NAME` – genairagacr

These will be used by the workflow.

### Create the GitHub Actions workflow

Create the folder and file:

```bash
mkdir -p .github/workflows
```

`.github/workflows/ci-cd-aks.yml`:

```yaml
name: CI/CD - Build & Deploy to AKS

on:
  push:
    branches: [ "main" ]
  workflow_dispatch: {}

env:
  ACR_NAME: ${{ secrets.AZURE_ACR_NAME }}
  RESOURCE_GROUP: ${{ secrets.AZURE_RESOURCE_GROUP }}
  AKS_NAME: ${{ secrets.AZURE_AKS_NAME }}
  IMAGE_NAME: healthcare-genai-rag
  BACKEND_PATH: backend

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Azure login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Azure ACR login
        uses: azure/docker-login@v2
        with:
          login-server: ${{ env.ACR_NAME }}.azurecr.io
          username: ${{ secrets.AZURE_ACR_NAME }}
          password: ${{ secrets.AZURE_ACR_PASSWORD || '' }}
        if: false
      # For most setups with azure/login, Docker can login via 'az acr login'
      - name: ACR login via az
        run: az acr login --name $ACR_NAME

      - name: Build backend image
        working-directory: ${{ env.BACKEND_PATH }}
        run: |
          IMAGE_TAG=${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}
          echo "IMAGE_TAG=$IMAGE_TAG" >> $GITHUB_ENV
          docker build -t $IMAGE_TAG .

      - name: Push image
        run: |
          docker push $IMAGE_TAG

  deploy:
    runs-on: ubuntu-latest
    needs: build-and-push

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Azure login
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Get AKS credentials
        uses: azure/aks-set-context@v4
        with:
          resource-group: ${{ env.RESOURCE_GROUP }}
          cluster-name: ${{ env.AKS_NAME }}

      - name: Set image in Kubernetes deployment
        run: |
          IMAGE_TAG=${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}
          kubectl set image deployment/healthcare-rag-deployment \
            healthcare-rag=$IMAGE_TAG

      - name: Verify rollout
        run: |
          kubectl rollout status deployment/healthcare-rag-deployment
```

**Notes:**

- The backend Dockerfile is under `backend/`, so the workflow builds from there
- The image name is set to `<ACR_NAME>.azurecr.io/healthcare-genai-rag:<commit-sha>`
- The deployment name (`healthcare-rag-deployment`) and container name (`healthcare-rag`) must match your `k8s/deployment.yaml`
- If you prefer, you can also apply manifests directly from the workflow (for first deployment):

```yaml
      - name: Apply Kubernetes manifests
        run: |
          kubectl apply -f k8s/secret.yaml
          kubectl apply -f k8s/deployment.yaml
          kubectl apply -f k8s/service.yaml
```

Use that once, then rely on `kubectl set image` for rolling updates.

### How the pipeline works

On every push to `main`:

1. **Build & Push job**
   - Logs in to Azure and ACR
   - Builds the backend image from `backend/` and tags it with the commit SHA
   - Pushes the image to ACR

2. **Deploy job**
   - Logs in to Azure
   - Gets AKS context
   - Updates the `healthcare-rag-deployment` to use the new image tag
   - Waits for the rollout to complete

If something fails, the GitHub Actions UI will show which step broke (build, push, AKS login, or rollout).

## License

MIT License.

## Author

**Tomisin** – [GitHub](https://github.com/Tomisin92)