# from fastapi import APIRouter, Depends
# from app.models.chat import ChatRequest, ChatResponse
# from app.services.chat_service import ChatService
# from .deps import get_settings_dep

# router = APIRouter(prefix="/chat", tags=["chat"])


# @router.post("/", response_model=ChatResponse)
# async def chat_endpoint(
#     payload: ChatRequest,
#     _settings=Depends(get_settings_dep),
# ):
#     """
#     Healthcare chat endpoint.

#     This endpoint provides general medical information and clinic workflow
#     guidance based on de-identified healthcare documents.

#     It does NOT provide personal medical advice or emergency triage.
#     """
#     return await ChatService.chat(payload)

import logging
import time
from fastapi import APIRouter, Depends, HTTPException
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from .deps import get_settings_dep

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


def looks_like_no_answer(answer: str) -> bool:
    lower = answer.lower()
    return (
        "provided context does not include" in lower
        or "i'm not sure" in lower
        or "i do not have enough information" in lower
    )


@router.post("/", response_model=ChatResponse)
async def chat_endpoint(
    payload: ChatRequest,
    _settings=Depends(get_settings_dep),
):
    start = time.perf_counter()
    retrieved_docs = 0

    try:
        response: ChatResponse = await ChatService.chat(payload)

        # If your ChatResponse exposes sources / docs, adapt these lines
        docs = getattr(response, "source_documents", []) or []
        retrieved_docs = len(docs)

        is_no_answer = looks_like_no_answer(response.answer)
        used_sources = bool(docs) and not is_no_answer
        status = "no_answer" if is_no_answer else "ok"
        elapsed_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "rag_chat_request",
            extra={
                "custom_dimensions": {
                    "latency_ms": elapsed_ms,
                    "retrieved_docs": retrieved_docs,
                    "used_sources": used_sources,
                    "no_answer": is_no_answer,
                    "status": status,
                }
            },
        )  # custom_dimensions will appear in App Insights logs. [web:122][web:125]

        # Optionally drop sources when no_answer to keep UX consistent
        if is_no_answer:
            if hasattr(response, "source_documents"):
                response.source_documents = []

        return response

    except Exception:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.exception(
            "rag_chat_error",
            extra={
                "custom_dimensions": {
                    "latency_ms": elapsed_ms,
                    "retrieved_docs": retrieved_docs,
                    "status": "error",
                }
            },
        )  # Exceptions with custom_dimensions will also be logged to Application Insights. [web:135][web:168]
        raise HTTPException(status_code=500, detail="Internal server error")
