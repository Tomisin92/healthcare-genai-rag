import os
from typing import List
from loguru import logger
from app.rag.ingest import ingest_documents_from_dir
from app.core.config import get_settings

settings = get_settings()


class DocService:
    @staticmethod
    async def reindex() -> dict:
        logger.info("Reindexing healthcare documents...")
        ingest_documents_from_dir(settings.raw_docs_dir)
        return {"status": "ok"}

    @staticmethod
    async def list_docs() -> List[str]:
        if not os.path.exists(settings.raw_docs_dir):
            return []
        all_files = []
        for root, _, files in os.walk(settings.raw_docs_dir):
            for f in files:
                if f.lower().endswith((".txt", ".md", ".pdf")):
                    all_files.append(os.path.join(root, f))
        return all_files
