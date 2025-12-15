from fastapi import APIRouter, Depends
from app.services.doc_service import DocService
from .deps import get_settings_dep

router = APIRouter(prefix="/docs", tags=["docs"])


@router.post("/reindex")
async def reindex_docs(_settings=Depends(get_settings_dep)):
    """
    Reindex healthcare documents from data/raw_docs into the vector store.
    """
    return await DocService.reindex()


@router.get("/")
async def list_docs(_settings=Depends(get_settings_dep)):
    """
    List healthcare documents currently available for RAG.
    """
    return await DocService.list_docs()
