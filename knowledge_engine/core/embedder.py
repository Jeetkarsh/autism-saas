"""OpenAI embedding wrapper."""
import asyncio
from openai import AsyncOpenAI
from config import OPENAI_API_KEY, EMBEDDING_MODEL

_client = None

def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    return _client

async def _embed_batch(client: AsyncOpenAI, batch: list[str]) -> list[list[float]]:
    response = await client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=batch,
    )
    return [item.embedding for item in response.data]

async def _async_embed_texts(texts: list[str]) -> list[list[float]]:
    client = _get_client()
    batch_size = 512
    tasks = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        tasks.append(_embed_batch(client, batch))
        
    results = await asyncio.gather(*tasks)
    
    all_embeddings = []
    for res in results:
        all_embeddings.extend(res)
        
    return all_embeddings

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using OpenAI embeddings API."""
    if not texts:
        return []

    return asyncio.run(_async_embed_texts(texts))

def embed_single(text: str) -> list[float]:
    """Embed a single text string."""
    result = embed_texts([text])
    return result[0] if result else []
