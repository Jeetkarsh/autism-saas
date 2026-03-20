"""
NeuroBridge RAG Service — FastAPI Backend
Serves the knowledge engine for the Autism SaaS application.

Endpoints:
  GET  /health                    — Health check
  POST /ingest/file               — Upload & ingest a document file
  POST /ingest/url                — Scrape & ingest a URL
  GET  /documents                 — List all documents for a user
  GET  /documents/{doc_id}        — Get a single document
  DELETE /documents/{doc_id}      — Delete a document
  POST /query                     — Semantic search query (RAG)
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings

# Local modules
from .database import (
    init_pool,
    close_pool,
    init_schema,
    insert_document,
    search_documents,
    list_documents,
    get_document,
    delete_document,
    EMBEDDING_DIM,
)
from .embeddings import get_embedding, get_embeddings_batch
from .processor import (
    extract_text_from_file,
    scrape_url,
    chunk_text,
)

# ─── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("rag_service")

# ─── Settings ──────────────────────────────────────────────────────────────────

class Settings(BaseSettings):
    # Auth
    rag_api_key: str = "development_secret_key"
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:54322/neurobridge"
    # OpenAI
    openai_api_key: str = ""
    # Optional: override embedding model
    embedding_model: str = "text-embedding-ada-002"
    # Query defaults
    default_top_k: int = 5
    min_similarity: float = 0.3

    class Config:
        env_prefix = ""


settings = Settings()

# ─── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize pool and schema on startup; clean up on shutdown."""
    logger.info("Starting RAG service...")
    os.environ.setdefault("DATABASE_URL", settings.database_url)
    os.environ.setdefault("OPENAI_API_KEY", settings.openai_api_key)
    os.environ.setdefault("EMBEDDING_MODEL", settings.embedding_model)
    try:
        init_pool()
        init_schema()
        logger.info("Database pool and schema ready.")
    except Exception as exc:
        logger.warning("Could not initialize database pool: %s", exc)
        logger.warning("Service will start but DB operations will fail until DB is available.")
    yield
    close_pool()
    logger.info("RAG service shutdown complete.")


# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NeuroBridge RAG Service",
    description="Knowledge engine for the NeuroBridge Autism SaaS platform.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Next.js frontend
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Auth ──────────────────────────────────────────────────────────────────────

def verify_api_key(x_api_key: str = Header(..., alias="Authorization")) -> str:
    """Bearer token verification. Strips 'Bearer ' prefix."""
    if x_api_key.startswith("Bearer "):
        x_api_key = x_api_key[7:]
    if x_api_key != settings.rag_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


# ─── Request/Response Models ───────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str
    user_id: str
    top_k: Optional[int] = None
    include_content: Optional[bool] = False


class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]
    query: str


class IngestURLRequest(BaseModel):
    url: str
    user_id: str
    title: Optional[str] = None


class IngestResponse(BaseModel):
    id: str
    title: str
    chunks_ingested: int
    message: str


class DocumentResponse(BaseModel):
    id: str
    title: str
    source_type: str
    source_url: Optional[str]
    content: Optional[str]
    metadata: dict
    created_at: Optional[str]


class HealthResponse(BaseModel):
    status: str
    database: str
    openai_configured: bool


# ─── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    db_status = "unknown"
    try:
        from .database import get_connection
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {exc}"

    return HealthResponse(
        status="ok",
        database=db_status,
        openai_configured=bool(settings.openai_api_key),
    )


# ─── Ingest File ───────────────────────────────────────────────────────────────

@app.post("/ingest/file", response_model=IngestResponse)
async def ingest_file(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    _: str = Form(None),  # compatibility: allow optional title
):
    verify_api_key()

    # Read file content
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    filename = file.filename or "unknown"
    logger.info("Ingesting file '%s' for user %s", filename, user_id)

    # Extract text
    try:
        text = extract_text_from_file(content, filename)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse file: {exc}") from exc

    if not text.strip():
        raise HTTPException(status_code=422, detail="No text content extracted from file")

    # Chunk the text
    chunks = chunk_text(text, chunk_size=1000, overlap=100)
    logger.info("File '%s' split into %d chunks", filename, len(chunks))

    # Generate embeddings in batch
    try:
        embeddings = get_embeddings_batch(chunks)
    except Exception as exc:
        logger.error("Embedding generation failed: %s", exc)
        # Fall back: store without embeddings
        embeddings = [[0.0] * EMBEDDING_DIM for _ in chunks]

    # Insert chunks as separate documents
    title = Path(filename).stem.replace("_", " ").replace("-", " ").title()
    ingested = 0
    doc_id = None

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_title = f"{title} (chunk {i + 1}/{len(chunks)})"
        metadata = {
            "chunk_index": i,
            "total_chunks": len(chunks),
            "original_filename": filename,
            "chunk_hash": content_hash(chunk),
        }
        did = insert_document(
            user_id=user_id,
            title=chunk_title,
            content=chunk,
            source_type="file",
            source_url=None,
            metadata=metadata,
            embedding=embedding,
        )
        if i == 0:
            doc_id = did
        ingested += 1

    logger.info("Ingested %d chunks for file '%s'", ingested, filename)

    return IngestResponse(
        id=doc_id or "",
        title=title,
        chunks_ingested=ingested,
        message=f"Successfully ingested {ingested} chunks.",
    )


# ─── Ingest URL ────────────────────────────────────────────────────────────────

@app.post("/ingest/url", response_model=IngestResponse)
async def ingest_url(body: IngestURLRequest):
    verify_api_key()

    url = body.url
    user_id = body.user_id
    title_override = body.title

    logger.info("Ingesting URL '%s' for user %s", url, user_id)

    # Scrape the URL
    try:
        title, text = scrape_url(url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"URL fetch failed: {exc}") from exc

    if not text.strip():
        raise HTTPException(status_code=422, detail="No text content found at URL")

    title = title_override or title or url

    # Chunk the text
    chunks = chunk_text(text, chunk_size=1000, overlap=100)
    logger.info("URL '%s' split into %d chunks", url, len(chunks))

    # Generate embeddings
    try:
        embeddings = get_embeddings_batch(chunks)
    except Exception as exc:
        logger.error("Embedding generation failed: %s", exc)
        embeddings = [[0.0] * EMBEDDING_DIM for _ in chunks]

    # Insert chunks
    ingested = 0
    doc_id = None

    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_title = f"{title} (chunk {i + 1}/{len(chunks)})"
        metadata = {
            "chunk_index": i,
            "total_chunks": len(chunks),
            "original_url": url,
            "chunk_hash": content_hash(chunk),
        }
        did = insert_document(
            user_id=user_id,
            title=chunk_title,
            content=chunk,
            source_type="url",
            source_url=url,
            metadata=metadata,
            embedding=embedding,
        )
        if i == 0:
            doc_id = did
        ingested += 1

    logger.info("Ingested %d chunks from URL '%s'", ingested, url)

    return IngestResponse(
        id=doc_id or "",
        title=title,
        chunks_ingested=ingested,
        message=f"Successfully ingested {ingested} chunks from URL.",
    )


# ─── List Documents ────────────────────────────────────────────────────────────

@app.get("/documents")
async def get_documents(
    user_id: str,
    limit: int = 50,
    _: str = Header(None, alias="Authorization"),
):
    verify_api_key()
    docs = list_documents(user_id=user_id, limit=limit)
    return {"documents": docs, "count": len(docs)}


# ─── Get Single Document ────────────────────────────────────────────────────────

@app.get("/documents/{doc_id}")
async def get_doc(doc_id: str, _: str = Header(None, alias="Authorization")):
    verify_api_key()
    # doc_id format: user_id embedded in query string
    raise HTTPException(status_code=400, detail="Use /documents?user_id=... for listing")


@app.get("/documents/")
async def get_doc_by_id(
    user_id: str,
    doc_id: Optional[str] = None,
    _: str = Header(None, alias="Authorization"),
):
    verify_api_key()
    if not doc_id:
        raise HTTPException(status_code=400, detail="doc_id query parameter required")
    doc = get_document(doc_id=doc_id, user_id=user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


# ─── Delete Document ───────────────────────────────────────────────────────────

@app.delete("/documents/{doc_id}")
async def delete_doc(
    doc_id: str,
    user_id: str,
    _: str = Header(None, alias="Authorization"),
):
    verify_api_key()
    deleted = delete_document(doc_id=doc_id, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found or already deleted")
    return {"message": "Document deleted", "id": doc_id}


# ─── Query (RAG) ────────────────────────────────────────────────────────────────

@app.post("/query", response_model=QueryResponse)
async def query(body: QueryRequest):
    verify_api_key()

    query_text = body.query
    user_id = body.user_id
    top_k = body.top_k or settings.default_top_k
    include_content = body.include_content or False

    logger.info("Query from user %s: %s", user_id, query_text[:100])

    # Step 1: Generate query embedding
    try:
        query_embedding = get_embedding(query_text)
    except Exception as exc:
        logger.error("Query embedding failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to generate query embedding") from exc

    # Step 2: Semantic search
    try:
        results = search_documents(
            user_id=user_id,
            query_embedding=query_embedding,
            top_k=top_k,
            min_similarity=settings.min_similarity,
        )
    except Exception as exc:
        logger.error("Document search failed: %s", exc)
        raise HTTPException(status_code=502, detail="Document search failed") from exc

    if not results:
        return QueryResponse(
            answer="I couldn't find any relevant information in your knowledge base to answer that question. Try adding more documents or rephrasing your question.",
            sources=[],
            query=query_text,
        )

    # Step 3: Build context from top results
    context_parts = []
    for r in results:
        if include_content:
            context_parts.append(f"[Source: {r['title']}]\n{r['content']}")
        else:
            context_parts.append(f"[Source: {r['title']}] {r['content'][:300]}...")

    context = "\n\n".join(context_parts)

    # Step 4: Generate answer using OpenAI
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key or None)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a knowledgeable assistant for parents and caregivers "
                        "of autistic children. Use ONLY the provided context to answer "
                        "questions. If the context doesn't contain enough information, "
                        "say so honestly. Be compassionate, evidence-based, and practical. "
                        "Format your answer clearly with bullet points or numbered lists "
                        "when appropriate. Never make up information not in the context."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Context:\n{context}\n\n"
                        f"Question: {query_text}\n\n"
                        f"Answer:"
                    ),
                },
            ],
            max_tokens=800,
            temperature=0.3,
        )

        answer = response.choices[0].message.content or ""
    except Exception as exc:
        logger.error("LLM answer generation failed: %s", exc)
        answer = (
            "I found relevant sources but encountered an error generating a formatted answer. "
            f"Here are the relevant excerpts:\n\n{context[:1000]}"
        )

    # Step 5: Build source list
    sources = [
        {
            "id": r["id"],
            "title": r["title"],
            "source_type": r["source_type"],
            "source_url": r.get("source_url"),
            "similarity": round(r["similarity"], 3),
            "content": r["content"][:500] if include_content else None,
        }
        for r in results
    ]

    return QueryResponse(
        answer=answer,
        sources=sources,
        query=query_text,
    )


# ─── Path helper (used above) ──────────────────────────────────────────────────

from pathlib import Path
from .processor import content_hash
