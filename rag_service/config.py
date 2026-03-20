import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/neurobridge"
    )

    # Supabase (for auth validation)
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # OpenAI for embeddings
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")

    # Embedding settings
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    embedding_dimension: int = int(os.getenv("EMBEDDING_DIMENSION", "1536"))

    # Vector store
    vector_store: str = os.getenv("VECTOR_STORE", "pgvector")  # pgvector | pinecone

    # Pinecone (optional)
    pinecone_api_key: str = os.getenv("PINECONE_API_KEY", "")
    pinecone_index: str = os.getenv("PINECONE_INDEX", "neurobridge-kb")

    # Server
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8100"))
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Chunk settings
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1000"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))

    # LLM for query synthesis
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    class Config:
        env_file = ".env"


settings = Settings()
