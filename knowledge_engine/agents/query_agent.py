"""Query agent: retrieve relevant chunks and generate LLM answer with sources."""
from openai import OpenAI
from core.models import QueryResult
from core.embedder import embed_single
from storage import vector_store
from config import OPENAI_API_KEY, LLM_MODEL
from logger import setup_logger

logger = setup_logger("query_agent")

_client = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


SYSTEM_PROMPT = """You are a knowledgeable assistant for AutismConnect, a platform supporting parents of autistic children.

Your job is to answer questions based ONLY on the provided context. If the context doesn't contain enough information to answer the question, say so honestly. Do not make up information.

Guidelines:
- Be warm, supportive, and parent-friendly in tone
- Use clear, accessible language
- When citing information, reference which source document it comes from
- If the question is about medical advice, always recommend consulting with a healthcare professional
- Keep answers concise but thorough

Format your answer in a clear, readable way. When referencing sources, mention them naturally in your answer."""


def query(question: str, user_id: str, n_results: int = 5) -> QueryResult:
    """Answer a question using RAG.

    Args:
        question: User's question.
        user_id: User Context.
        n_results: Number of chunks to retrieve.

    Returns:
        QueryResult with answer and sources.
    """
    # Embed the question
    query_embedding = embed_single(question)

    # Retrieve relevant chunks
    results = vector_store.query(query_embedding, n_results=n_results, where={"user_id": user_id})
    
    num_retrieved = len(results.get("documents", [[]])[0]) if results else 0
    logger.info(f"Query retrieval completed", extra={"extra_info": {"user_id": user_id, "question": question, "retrieved_chunks": num_retrieved}})

    # Build context from retrieved chunks
    context_parts = []
    sources = []
    seen_docs = set()

    if results and results.get("documents") and results["documents"][0]:
        for i, (doc, meta, distance) in enumerate(zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )):
            context_parts.append(f"[Source {i + 1}: {meta.get('doc_name', 'Unknown')}]\n{doc}")

            doc_id = meta.get("doc_id", "")
            if doc_id not in seen_docs:
                seen_docs.add(doc_id)
                sources.append({
                    "doc_id": doc_id,
                    "doc_name": meta.get("doc_name", "Unknown"),
                    "relevance": round(1 - distance, 3),  # Convert distance to similarity
                })

    context = "\n\n---\n\n".join(context_parts)

    if not context:
        return QueryResult(
            answer="I don't have any information in the knowledge base to answer that question yet. Please check back after more documents have been added.",
            sources=[],
            query=question,
        )

    # Generate answer with LLM
    client = _get_client()
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Context:\n{context}\n\n---\n\nQuestion: {question}",
            },
        ],
        temperature=0.3,
        max_tokens=1000,
    )

    answer = response.choices[0].message.content or "I couldn't generate an answer."

    logger.info("LLM answer generation completed", extra={"extra_info": {"user_id": user_id, "prompt_tokens": response.usage.prompt_tokens, "completion_tokens": response.usage.completion_tokens}})

    return QueryResult(
        answer=answer,
        sources=sources,
        query=question,
    )
