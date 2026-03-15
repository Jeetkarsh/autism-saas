"""Pydantic models for the Knowledge Engine."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ParsedSection(BaseModel):
    """A section extracted from a parsed document."""
    content: str
    metadata: dict = Field(default_factory=dict)


class Chunk(BaseModel):
    """A chunk of text ready for embedding."""
    id: str
    content: str
    doc_id: str
    doc_name: str
    chunk_index: int
    token_count: int
    metadata: dict = Field(default_factory=dict)


class DocumentInfo(BaseModel):
    """Metadata about an ingested document."""
    id: str
    name: str
    doc_type: str
    chunk_count: int
    ingested_at: str
    file_hash: str


class QueryResult(BaseModel):
    """Result from a RAG query."""
    answer: str
    sources: list[dict] = Field(default_factory=list)
    query: str


class IngestResponse(BaseModel):
    """Response from document ingestion."""
    doc_id: str
    name: str
    chunk_count: int
    message: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    total_documents: int
    total_chunks: int
