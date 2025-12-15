import os
from functools import lru_cache
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    env: str = os.getenv("ENV", "local")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    data_dir: str = os.getenv("DATA_DIR", "data")
    raw_docs_dir: str = os.getenv("RAW_DOCS_DIR", "data/raw_docs")
    vectorstore_dir: str = os.getenv("VECTORSTORE_DIR", "data/vectorstore")

    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./healthcare.db")


@lru_cache
def get_settings() -> Settings:
    return Settings()
