import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Set up environment variables before importing main to avoid actually connecting
import os
os.environ["OPENAI_API_KEY"] = "test_key"
os.environ["RAG_API_KEY"] = "test_rag_key"

from main import app
from core.models import DocumentInfo, QueryResult

client = TestClient(app)

def test_health_check_no_auth():
    response = client.get("/health")
    assert response.status_code == 403 or response.status_code == 401

@patch("main.vector_store")
@patch("main.indexing_agent")
def test_health_check_with_auth(mock_indexing_agent, mock_vector_store):
    mock_indexing_agent.list_documents.return_value = []
    mock_vector_store.count.return_value = 0
    
    response = client.get("/health", headers={"Authorization": "Bearer test_rag_key"})
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "total_documents": 0,
        "total_chunks": 0
    }

@patch("main.indexing_agent")
def test_ingest_url(mock_indexing_agent):
    mock_indexing_agent.ingest_url.return_value = DocumentInfo(
        id="test_id",
        name="test_url_doc",
        doc_type="url",
        chunk_count=5,
        ingested_at="2024-01-01T00:00:00Z",
        file_hash="testhash"
    )
    
    response = client.post(
        "/ingest/url",
        headers={"Authorization": "Bearer test_rag_key"},
        json={"url": "https://example.com/autism-resource", "user_id": "user123"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["doc_id"] == "test_id"
    assert data["chunk_count"] == 5
    assert "user123" in str(mock_indexing_agent.ingest_url.call_args)


@patch("main.query_agent")
def test_query_documents(mock_query_agent):
    mock_query_agent.query.return_value = QueryResult(
        answer="This is a mocked answer for parents.",
        sources=[{"doc_id": "test_id", "doc_name": "Resource", "relevance": 0.95}],
        query="What is autism?"
    )
    
    response = client.post(
        "/query",
        headers={"Authorization": "Bearer test_rag_key"},
        json={"question": "What is autism?", "user_id": "user123"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "This is a mocked answer for parents."
    assert len(data["sources"]) == 1
    assert "user123" in str(mock_query_agent.query.call_args)


@patch("main.indexing_agent")
def test_delete_document(mock_indexing_agent):
    mock_indexing_agent.delete_document.return_value = None
    
    response = client.delete(
        "/documents/doc123",
        headers={"Authorization": "Bearer test_rag_key"},
        params={"user_id": "user123"}
    )
    
    assert response.status_code == 200
    assert response.json()["message"] == "Document doc123 deleted successfully"
    mock_indexing_agent.delete_document.assert_called_once_with("doc123", "user123")
