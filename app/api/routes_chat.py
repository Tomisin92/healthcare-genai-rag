from fastapi import APIRouter, Depends
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from .deps import get_settings_dep

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat_endpoint(
    payload: ChatRequest,
    _settings=Depends(get_settings_dep),
):
    """
    Healthcare chat endpoint.

    This endpoint provides general medical information and clinic workflow
    guidance based on de-identified healthcare documents.

    It does NOT provide personal medical advice or emergency triage.
    """
    return await ChatService.chat(payload)
