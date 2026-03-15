"""FastAPI Knowledge Engine RAG Service."""
import sys
import os

# Ensure the knowledge_engine directory is in the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Security, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import time
from config import RAG_PORT, ALLOWED_ORIGINS, RAG_API_KEY
from logger import setup_logger

logger = setup_logger("main")

# Register parsers
from parsers.base import ParserFactory
from parsers.text_parser import TextParser
from parsers.pdf_parser import PDFParser
from parsers.docx_parser import DocxParser
from parsers.xlsx_parser import XlsxParser

ParserFactory.register(TextParser())
ParserFactory.register(PDFParser())
ParserFactory.register(DocxParser())
ParserFactory.register(XlsxParser())

# Import agents
from agents import indexing_agent, query_agent
from storage import vector_store

# --- App setup ---
app = FastAPI(
    title="AutismConnect Knowledge Engine",
    description="RAG-based knowledge system for AutismConnect",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Middleware ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(
        "Request processed",
        extra={"extra_info": {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": int(process_time * 1000)
        }}
    )
    return response

# --- Security ---
security = HTTPBearer()

def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != RAG_API_KEY:
        logger.warning(
            "Unauthorized API Key attempt",
            extra={"extra_info": {"attempted_key": credentials.credentials[:6] + "..." if credentials.credentials else None}}
        )
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return credentials.credentials

# --- Request models ---
class URLIngestRequest(BaseModel):
    url: str
    user_id: str


class QueryRequest(BaseModel):
    question: str
    user_id: str


# --- Endpoints ---


@app.get("/health")
async def health(api_key: str = Depends(verify_api_key)):
    """Health check with stats."""
    docs = await run_in_threadpool(indexing_agent.list_documents, "admin")
    total_chunks = await run_in_threadpool(vector_store.count)
    return {
        "status": "ok",
        "total_documents": len(docs),
        "total_chunks": total_chunks,
    }


@app.post("/ingest/file")
async def ingest_file(
    file: UploadFile = File(...), 
    user_id: str = Form(...),
    api_key: str = Depends(verify_api_key)
):
    """Ingest an uploaded file."""
    # Input validation
    SUPPORTED_MIMES = {
        "text/plain", 
        "application/pdf", 
        "text/markdown",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
    if file.content_type not in SUPPORTED_MIMES:
        logger.warning("Unsupported file type upload attempt", extra={"extra_info": {"content_type": file.content_type, "user_id": user_id}})
        raise HTTPException(status_code=400, detail="Unsupported file type.")
    
    # Check size (10MB limit)
    MAX_SIZE = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (Max 10MB).")

    try:
        filename = file.filename or "unknown.txt"
        doc_info = await run_in_threadpool(indexing_agent.ingest_file, content, filename, user_id)
        return {
            "doc_id": doc_info.id,
            "name": doc_info.name,
            "chunk_count": doc_info.chunk_count,
            "message": f"Successfully ingested '{filename}' ({doc_info.chunk_count} chunks)",
        }
    except ValueError as e:
        logger.error(f"Validation error during file ingest: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during file ingest: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@app.post("/ingest/url")
async def ingest_url(
    request: URLIngestRequest,
    api_key: str = Depends(verify_api_key)
):
    """Ingest content from a URL."""
    try:
        doc_info = await run_in_threadpool(indexing_agent.ingest_url, request.url, request.user_id)
        return {
            "doc_id": doc_info.id,
            "name": doc_info.name,
            "chunk_count": doc_info.chunk_count,
            "message": f"Successfully ingested URL ({doc_info.chunk_count} chunks)",
        }
    except ValueError as e:
        logger.error(f"Validation error during URL ingest: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during URL ingest: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"URL ingestion failed: {str(e)}")


@app.post("/query")
async def query(
    request: QueryRequest,
    api_key: str = Depends(verify_api_key)
):
    """Query the knowledge base."""
    try:
        result = await run_in_threadpool(query_agent.query, request.question, request.user_id)
        return {
            "answer": result.answer,
            "sources": result.sources,
            "query": result.query,
        }
    except Exception as e:
        logger.error(f"Unexpected error during query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.get("/documents")
async def list_documents(
    user_id: str,
    api_key: str = Depends(verify_api_key)
):
    """List all ingested documents."""
    docs = await run_in_threadpool(indexing_agent.list_documents, user_id)
    return {
        "documents": [doc.model_dump() for doc in docs],
        "total": len(docs),
    }


@app.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    user_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Delete a document and its chunks."""
    try:
        await run_in_threadpool(indexing_agent.delete_document, doc_id, user_id)
        return {"message": f"Document {doc_id} deleted successfully"}
    except ValueError as e:
        logger.error(f"Validation error during document deletion: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during document deletion: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting AutismConnect Knowledge Engine on port {RAG_PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=RAG_PORT)
