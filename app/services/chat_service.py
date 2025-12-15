from loguru import logger
from app.rag.pipelines import run_rag
from app.agent.agentic_rag import run_agentic
from app.models.chat import ChatRequest, ChatResponse


class ChatService:
    @staticmethod
    async def chat(payload: ChatRequest) -> ChatResponse:
        logger.info(f"[Healthcare Chat] query={payload.query} agent={payload.use_agent}")

        if payload.use_agent:
            result = run_agentic(payload.query)
            # For now, we don't expose context docs with agent, just answer.
            return ChatResponse(answer=result["answer"])
        else:
            result = run_rag(payload.query)
            return ChatResponse(
                answer=result["answer"],
                source_documents=result["context_documents"],
            )
