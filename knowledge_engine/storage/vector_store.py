"""ChromaDB vector store wrapper."""
import chromadb
from chromadb.config import Settings
from config import CHROMA_PERSIST_DIR


_client = None
_collection = None

COLLECTION_NAME = "knowledge_base"


def _get_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def _get_collection() -> chromadb.Collection:
    global _collection
    if _collection is None:
        client = _get_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(
    ids: list[str],
    embeddings: list[list[float]],
    documents: list[str],
    metadatas: list[dict],
):
    """Add chunks with their embeddings to the vector store."""
    collection = _get_collection()
    # ChromaDB has a batch limit; process in batches of 500
    batch_size = 500
    for i in range(0, len(ids), batch_size):
        collection.add(
            ids=ids[i : i + batch_size],
            embeddings=embeddings[i : i + batch_size],
            documents=documents[i : i + batch_size],
            metadatas=metadatas[i : i + batch_size],
        )


def query(
    query_embedding: list[float],
    n_results: int = 5,
    where: dict = None,
) -> dict:
    """Query the vector store with an embedding."""
    collection = _get_collection()
    kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": n_results,
        "include": ["documents", "metadatas", "distances"],
    }
    if where:
        kwargs["where"] = where
        
    results = collection.query(**kwargs)
    return results


def delete_by_doc_id(doc_id: str, user_id: str = None):
    """Delete all chunks belonging to a document."""
    collection = _get_collection()
    if user_id and user_id != "admin":
        where = {"$and": [{"doc_id": doc_id}, {"user_id": user_id}]}
    else:
        where = {"doc_id": doc_id}
        
    # Get all chunk IDs for this doc
    results = collection.get(
        where=where,
        include=[],
    )
    if results["ids"]:
        collection.delete(ids=results["ids"])


def get_all_doc_ids(user_id: str = None) -> list[str]:
    """Get all unique document IDs in the store."""
    collection = _get_collection()
    kwargs = {"include": ["metadatas"]}
    if user_id and user_id != "admin":
        kwargs["where"] = {"user_id": user_id}
        
    results = collection.get(**kwargs)
    doc_ids = set()
    if results["metadatas"]:
        for meta in results["metadatas"]:
            if "doc_id" in meta:
                doc_ids.add(meta["doc_id"])
    return list(doc_ids)


def get_doc_chunks(doc_id: str, user_id: str = None) -> dict:
    """Get all chunks for a specific document."""
    collection = _get_collection()
    if user_id and user_id != "admin":
        where = {"$and": [{"doc_id": doc_id}, {"user_id": user_id}]}
    else:
        where = {"doc_id": doc_id}
        
    return collection.get(
        where=where,
        include=["documents", "metadatas"],
    )


def count() -> int:
    """Get total number of chunks in the store."""
    collection = _get_collection()
    return collection.count()
