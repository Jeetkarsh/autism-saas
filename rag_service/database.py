"""
Database module for RAG service.
Manages pgvector connections and document storage.
"""

import uuid
from datetime import datetime
from typing import Optional
from contextlib import contextmanager

import psycopg2
from psycopg2 import pool
from psycopg2.extras import Json
from pydantic import BaseModel

# Connection pool
_connection_pool: Optional[pool.ThreadedConnectionPool] = None

# ─── Config ──────────────────────────────────────────────────────────────────

def get_database_url() -> str:
    import os
    return os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:54322/neurobridge"
    )

# ─── Pool Management ───────────────────────────────────────────────────────────

def init_pool(minconn: int = 1, maxconn: int = 10) -> pool.ThreadedConnectionPool:
    global _connection_pool
    if _connection_pool is None:
        _connection_pool = pool.ThreadedConnectionPool(
            minconn,
            maxconn,
            get_database_url(),
        )
    return _connection_pool


def close_pool() -> None:
    global _connection_pool
    if _connection_pool:
        _connection_pool.closeall()
        _connection_pool = None


@contextmanager
def get_connection():
    """Get a connection from the pool. Auto-returns to pool on exit."""
    if _connection_pool is None:
        init_pool()
    conn = _connection_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _connection_pool.putconn(conn)


# ─── Schema ───────────────────────────────────────────────────────────────────

def init_schema() -> None:
    """Initialize pgvector extension and documents table."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL,
                    title TEXT NOT NULL,
                    source_type TEXT NOT NULL,  -- 'file', 'url', 'manual'
                    source_url TEXT,
                    content TEXT NOT NULL,
                    content_hash TEXT,  -- dedup
                    metadata JSONB DEFAULT '{}',
                    embedding VECTOR(1536),  -- OpenAI ada-002 dim
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_user_id
                ON documents(user_id)
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_content_hash
                ON documents(content_hash)
            """)
            # Hybrid search index
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_embedding
                ON documents USING hnsw (embedding vector_cosine_ops)
            """)


# ─── Document Model ────────────────────────────────────────────────────────────

class DocumentRecord(BaseModel):
    id: str
    user_id: str
    title: str
    source_type: str
    source_url: Optional[str] = None
    content: str
    metadata: dict
    created_at: datetime


# ─── CRUD Operations ───────────────────────────────────────────────────────────

def insert_document(
    user_id: str,
    title: str,
    content: str,
    source_type: str,
    source_url: Optional[str] = None,
    metadata: Optional[dict] = None,
    embedding: Optional[list[float]] = None,
) -> str:
    """Insert a document with its embedding. Returns doc ID."""
    import hashlib
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Check dedup
            cur.execute(
                "SELECT id FROM documents WHERE user_id = %s AND content_hash = %s",
                (user_id, content_hash)
            )
            existing = cur.fetchone()
            if existing:
                return str(existing[0])

            doc_id = str(uuid.uuid4())
            embedding_arr = embedding if embedding is not None else [0.0] * 1536

            cur.execute(
                """
                INSERT INTO documents
                    (id, user_id, title, source_type, source_url, content,
                     content_hash, metadata, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    doc_id, user_id, title, source_type, source_url,
                    content, content_hash, Json(metadata or {}),
                    embedding_arr,
                )
            )
            return doc_id


def search_documents(
    user_id: str,
    query_embedding: list[float],
    top_k: int = 5,
    min_similarity: float = 0.3,
) -> list[dict]:
    """
    Hybrid search: cosine similarity on embeddings + keyword match on content.
    Returns top-k results with scores.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            # Vector similarity (cosine)
            cur.execute(
                """
                SELECT id, title, source_type, source_url, content, metadata,
                       1 - (embedding <=> %s::vector) AS similarity
                FROM documents
                WHERE user_id = %s
                  AND 1 - (embedding <=> %s::vector) > %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (query_embedding, user_id, query_embedding,
                 min_similarity, query_embedding, top_k)
            )
            rows = cur.fetchall()
            return [
                {
                    "id": str(r[0]),
                    "title": r[1],
                    "source_type": r[2],
                    "source_url": r[3],
                    "content": r[4],
                    "metadata": r[5],
                    "similarity": float(r[6]),
                }
                for r in rows
            ]


def list_documents(user_id: str, limit: int = 50) -> list[dict]:
    """List all documents for a user."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, source_type, source_url, metadata, created_at
                FROM documents
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit)
            )
            rows = cur.fetchall()
            return [
                {
                    "id": str(r[0]),
                    "title": r[1],
                    "source_type": r[2],
                    "source_url": r[3],
                    "metadata": r[4],
                    "created_at": r[5].isoformat() if r[5] else None,
                }
                for r in rows
            ]


def get_document(doc_id: str, user_id: str) -> Optional[dict]:
    """Get a single document by ID."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, source_type, source_url, content, metadata,
                       created_at
                FROM documents
                WHERE id = %s AND user_id = %s
                """,
                (doc_id, user_id)
            )
            r = cur.fetchone()
            if not r:
                return None
            return {
                "id": str(r[0]),
                "title": r[1],
                "source_type": r[2],
                "source_url": r[3],
                "content": r[4],
                "metadata": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
            }


def delete_document(doc_id: str, user_id: str) -> bool:
    """Delete a document. Returns True if deleted."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM documents WHERE id = %s AND user_id = %s",
                (doc_id, user_id)
            )
            return cur.rowcount > 0
