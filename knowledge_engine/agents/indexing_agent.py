"""Indexing agent: parse → chunk → embed → store pipeline."""
import uuid
from datetime import datetime, timezone
from core.models import Chunk, DocumentInfo
from core.chunker import chunk_text
from core.embedder import embed_texts
from core.hasher import compute_file_hash, compute_text_hash
from storage import vector_store
from parsers.base import ParserFactory
from logger import setup_logger

logger = setup_logger("indexing_agent")

# In-memory document registry (persisted via ChromaDB metadata)
_doc_registry: dict[str, DocumentInfo] = {}


def _load_registry(user_id: str = None):
    """Load document registry from ChromaDB metadata."""
    global _doc_registry
    doc_ids = vector_store.get_all_doc_ids(user_id)
    for doc_id in doc_ids:
        chunks = vector_store.get_doc_chunks(doc_id, user_id)
        if chunks["metadatas"]:
            meta = chunks["metadatas"][0]
            _doc_registry[doc_id] = DocumentInfo(
                id=doc_id,
                name=meta.get("doc_name", "Unknown"),
                doc_type=meta.get("doc_type", "unknown"),
                chunk_count=len(chunks["ids"]),
                ingested_at=meta.get("ingested_at", ""),
                file_hash=meta.get("file_hash", ""),
            )


def get_registry(user_id: str = None) -> dict[str, DocumentInfo]:
    """Get the document registry, loading from store if needed."""
    if not _doc_registry:
        _load_registry(user_id)
    
    # Filter by user_id if registry loaded globally previously
    if user_id and user_id != "admin":
        # Force a reload or filter what we have; simplest is just loading current state
        # Because global _doc_registry caches everything, we'd rather fetch directly 
        # but to keep it simple, we rebuild the filtered list.
        _doc_registry.clear()
        _load_registry(user_id)
        
    return _doc_registry


def ingest_file(content: bytes, filename: str, user_id: str) -> DocumentInfo:
    """Ingest a file: parse, chunk, embed, and store.

    Args:
        content: Raw file bytes.
        filename: Original filename.
        user_id: User context.

    Returns:
        DocumentInfo with ingestion results.
    """
    # Check for duplicate
    file_hash = compute_file_hash(content)
    registry = get_registry(user_id)
    for doc in registry.values():
        if doc.file_hash == file_hash:
            logger.warning(f"Duplicate file upload attempt: {filename}")
            raise ValueError(f"Document already ingested: {doc.name} (ID: {doc.id})")

    # Parse
    parser = ParserFactory.get_parser(filename)
    if parser is None:
        supported = ", ".join(ParserFactory.supported_types())
        raise ValueError(f"Unsupported file type. Supported: {supported}")

    text = parser.parse(content, filename)
    if not text.strip():
        raise ValueError("No text could be extracted from the file.")

    # Generate doc ID
    doc_id = str(uuid.uuid4())[:12]
    now = datetime.now(timezone.utc).isoformat()
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else "unknown"

    # Chunk
    chunks = chunk_text(
        text=text,
        doc_id=doc_id,
        doc_name=filename,
        metadata={"doc_type": ext, "file_hash": file_hash, "ingested_at": now},
    )

    if not chunks:
        raise ValueError("Document produced no chunks after parsing.")

    # Embed
    chunk_texts = [c.content for c in chunks]
    embeddings = embed_texts(chunk_texts)

    # Store
    vector_store.add_chunks(
        ids=[c.id for c in chunks],
        embeddings=embeddings,
        documents=chunk_texts,
        metadatas=[
            {
                "doc_id": doc_id,
                "doc_name": filename,
                "doc_type": ext,
                "chunk_index": c.chunk_index,
                "file_hash": file_hash,
                "ingested_at": now,
                "user_id": user_id,
            }
            for c in chunks
        ],
    )

    # Register
    doc_info = DocumentInfo(
        id=doc_id,
        name=filename,
        doc_type=ext,
        chunk_count=len(chunks),
        ingested_at=now,
        file_hash=file_hash,
    )
    _doc_registry[doc_id] = doc_info
    
    logger.info(
        f"Successfully ingested file: {filename}",
        extra={"extra_info": {"doc_id": doc_id, "chunk_count": len(chunks), "user_id": user_id}}
    )

    return doc_info


def ingest_url(url: str, user_id: str) -> DocumentInfo:
    """Ingest content from a URL.

    Args:
        url: Web URL to scrape and ingest.
        user_id: User context ID.

    Returns:
        DocumentInfo with ingestion results.
    """
    from parsers.url_parser import URLParser

    url_parser = URLParser()
    parse_result = url_parser.parse(url)
    
    # The new parser returns a dict with 'text' and 'file_links'
    if isinstance(parse_result, dict):
        text = parse_result.get("text", "")
        file_links = parse_result.get("file_links", [])
    else:
        text = parse_result
        file_links = []

    doc_info_list = []
    
    # 1. Ingest main page text (if any)
    if text.strip():
        text_hash = compute_text_hash(text)
        registry = get_registry(user_id)
        
        # Check for duplicate text
        is_duplicate = False
        for doc in registry.values():
            if doc.file_hash == text_hash:
                logger.warning(f"Duplicate URL text ingestion attempt: {url}")
                is_duplicate = True
                break
                
        if not is_duplicate:
            doc_id = str(uuid.uuid4())[:12]
            now = datetime.now(timezone.utc).isoformat()

            # Use domain as doc_name
            from urllib.parse import urlparse
            domain = urlparse(url).netloc or url[:50]
            doc_name = f"{domain} (URL)"

            chunks = chunk_text(
                text=text,
                doc_id=doc_id,
                doc_name=doc_name,
                metadata={"doc_type": "url", "file_hash": text_hash, "ingested_at": now, "source_url": url},
            )

            if chunks:
                chunk_texts = [c.content for c in chunks]
                embeddings = embed_texts(chunk_texts)

                vector_store.add_chunks(
                    ids=[c.id for c in chunks],
                    embeddings=embeddings,
                    documents=chunk_texts,
                    metadatas=[
                        {
                            "doc_id": doc_id,
                            "doc_name": doc_name,
                            "doc_type": "url",
                            "chunk_index": c.chunk_index,
                            "file_hash": text_hash,
                            "ingested_at": now,
                            "source_url": url,
                            "user_id": user_id,
                        }
                        for c in chunks
                    ],
                )

                doc_info = DocumentInfo(
                    id=doc_id,
                    name=doc_name,
                    doc_type="url",
                    chunk_count=len(chunks),
                    ingested_at=now,
                    file_hash=text_hash,
                )
                _doc_registry[doc_id] = doc_info
                doc_info_list.append(doc_info)
                
                logger.info(
                    f"Successfully ingested URL text: {url}",
                    extra={"extra_info": {"doc_id": doc_id, "chunk_count": len(chunks), "user_id": user_id}}
                )

    # 2. Ingest discovered files
    import requests
    for file_url in file_links:
        try:
            logger.info(f"Deep scraping: Downloading linked file {file_url}")
            # Simple stream download
            response = requests.get(file_url, stream=True, timeout=10)
            if response.status_code == 200:
                content = response.content
                filename = file_url.split("/")[-1].split("?")[0]
                if not filename:
                    filename = f"downloaded_file_{uuid.uuid4().hex[:6]}"
                    
                # Feed it into our standard file ingester
                try:
                    file_doc_info = ingest_file(content, filename, user_id)
                    doc_info_list.append(file_doc_info)
                except Exception as ve:
                    # Ignore duplicates or unsupported types from deep links silently
                    logger.warning(f"Skipping linked file {filename} during deep scrape: {str(ve)}")
        except Exception as e:
            logger.error(f"Failed to ingest linked file {file_url}: {str(e)}")

    if not doc_info_list:
        raise ValueError("URL produced no chunks (both text and deep links failed or were duplicates).")
        
    # Return the primary text doc if available, else the first file doc
    return doc_info_list[0]




def delete_document(doc_id: str, user_id: str):
    """Delete a document and all its chunks."""
    registry = get_registry(user_id)
    if doc_id not in registry:
        logger.warning(f"Document not found for deletion: {doc_id}", extra={"extra_info": {"user_id": user_id}})
        raise ValueError(f"Document not found: {doc_id}")

    vector_store.delete_by_doc_id(doc_id, user_id)
    if doc_id in _doc_registry:
        del _doc_registry[doc_id]
        
    logger.info(f"Deleted document: {doc_id}", extra={"extra_info": {"user_id": user_id}})


def list_documents(user_id: str) -> list[DocumentInfo]:
    """List all ingested documents."""
    registry = get_registry(user_id)
    return list(registry.values())
