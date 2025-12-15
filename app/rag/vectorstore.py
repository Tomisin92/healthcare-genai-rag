import os
from typing import Optional
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from app.core.config import get_settings

settings = get_settings()


def get_embeddings():
    return OpenAIEmbeddings(
        model=settings.embedding_model,
        openai_api_key=settings.openai_api_key,
    )


def get_vectorstore(persist_directory: Optional[str] = None) -> Chroma:
    persist_dir = persist_directory or settings.vectorstore_dir
    os.makedirs(persist_dir, exist_ok=True)
    embeddings = get_embeddings()
    vectordb = Chroma(
        collection_name="healthcare-docs",
        embedding_function=embeddings,
        persist_directory=persist_dir,
    )
    return vectordb
