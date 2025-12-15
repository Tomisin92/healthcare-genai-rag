import os
from typing import List
from loguru import logger
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import get_settings
from .vectorstore import get_vectorstore

settings = get_settings()


def load_documents(doc_paths: List[str]):
    docs = []
    for path in doc_paths:
        ext = os.path.splitext(path)[1].lower()
        if ext == ".pdf":
            loader = PyPDFLoader(path)
        else:
            loader = TextLoader(path, encoding="utf-8")
        docs.extend(loader.load())
    return docs


def split_documents(docs):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    return splitter.split_documents(docs)


def ingest_documents_from_dir(directory: str | None = None):
    directory = directory or settings.raw_docs_dir
    logger.info(f"Ingesting healthcare documents from {directory}")

    doc_paths = []
    for root, _, files in os.walk(directory):
        for f in files:
            if f.lower().endswith((".txt", ".md", ".pdf")):
                doc_paths.append(os.path.join(root, f))

    if not doc_paths:
        logger.warning("No healthcare documents found for ingestion.")
        return

    docs = load_documents(doc_paths)
    chunks = split_documents(docs)

    vectordb = get_vectorstore()
    vectordb.add_documents(chunks)
    vectordb.persist()
    logger.info(f"Ingested {len(chunks)} healthcare chunks into vector store.")


if __name__ == "__main__":
    ingest_documents_from_dir()
