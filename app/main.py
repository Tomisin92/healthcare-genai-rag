from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.logging_config import setup_logging
from app.api import routes_chat, routes_docs

setup_logging()
settings = get_settings()

app = FastAPI(
    title="Healthcare GenAI RAG Assistant",
    version="0.1.0",
    description=(
        "A healthcare information assistant that uses Retrieval-Augmented "
        "Generation over curated medical documents. "
        "Not a substitute for professional medical advice."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_chat.router, prefix="/api")
app.include_router(routes_docs.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.env}
