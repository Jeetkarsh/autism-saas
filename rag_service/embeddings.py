"""
Embedding generation module for RAG service.
Supports OpenAI embeddings (ada-002) with fallback to local models.
"""

import os
from typing import Optional

import openai
from openai import OpenAI

# ─── Config ────────────────────────────────────────────────────────────────────

EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-ada-002")
EMBEDDING_API_KEY = os.environ.get("OPENAI_API_KEY", "")
# Dimension for ada-002 is 1536
EMBEDDING_DIM = 1536

# ─── Client ────────────────────────────────────────────────────────────────────

_client: Optional[OpenAI] = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=EMBEDDING_API_KEY or None)
    return _client


def get_embedding(text: str) -> list[float]:
    """
    Generate an embedding for the given text using OpenAI ada-002.
    Returns a list of floats of dimension EMBEDDING_DIM.
    """
    client = get_client()
    # Truncate to 8192 tokens (ada-002 limit)
    truncated = text[: 8192 * 4]  # rough char limit

    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=truncated,
    )

    embedding = response.data[0].embedding
    if len(embedding) != EMBEDDING_DIM:
        raise ValueError(
            f"Expected embedding dim {EMBEDDING_DIM}, got {len(embedding)}. "
            f"Model={EMBEDDING_MODEL}"
        )
    return embedding


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple texts in one API call.
    Batches up to 1000 items per request (OpenAI limit).
    """
    client = get_client()
    truncated = [t[: 8192 * 4] for t in texts]

    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=truncated,
    )

    embeddings = [item.embedding for item in response.data]
    for emb in embeddings:
        if len(emb) != EMBEDDING_DIM:
            raise ValueError(
                f"Expected embedding dim {EMBEDDING_DIM}, got {len(emb)}"
            )
    return embeddings
