from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatRequest(BaseModel):
    query: str = Field(..., description="User question about health or clinic workflow")
    use_agent: bool = Field(
        default=False,  # FIXED: Changed from True to False to use RAG by default
        description="Use agentic reasoning on top of healthcare RAG",
    )


class ChatResponse(BaseModel):
    answer: str
    source_documents: Optional[List[Dict[str, Any]]] = None
    retrieval_scores: Optional[List[float]] = None
    trace_id: Optional[str] = None
    