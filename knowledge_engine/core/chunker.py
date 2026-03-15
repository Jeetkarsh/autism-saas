"""Token-based text chunker with overlap."""
import tiktoken
from core.models import Chunk
from config import CHUNK_MIN_TOKENS, CHUNK_MAX_TOKENS, CHUNK_OVERLAP_TOKENS


def _get_encoder():
    """Get tiktoken encoder for cl100k_base (used by text-embedding-3-small)."""
    return tiktoken.get_encoding("cl100k_base")


def chunk_text(
    text: str,
    doc_id: str,
    doc_name: str,
    metadata: dict | None = None,
) -> list[Chunk]:
    """Split text into overlapping chunks based on token count.

    Strategy:
    1. Split text into sentences (by newlines and periods).
    2. Accumulate sentences into chunks of CHUNK_MAX_TOKENS.
    3. Maintain CHUNK_OVERLAP_TOKENS overlap between consecutive chunks.
    """
    if not text.strip():
        return []

    enc = _get_encoder()
    metadata = metadata or {}

    # Split into sentences/paragraphs
    lines = text.replace("\r\n", "\n").split("\n")
    sentences = []
    for line in lines:
        line = line.strip()
        if line:
            sentences.append(line)

    if not sentences:
        return []

    chunks = []
    current_tokens = []
    current_text_parts = []
    chunk_index = 0

    for sentence in sentences:
        sentence_tokens = enc.encode(sentence)

        # If adding this sentence would exceed max, finalize the current chunk
        if current_tokens and len(current_tokens) + len(sentence_tokens) > CHUNK_MAX_TOKENS:
            chunk_text_str = "\n".join(current_text_parts)
            chunks.append(Chunk(
                id=f"{doc_id}_chunk_{chunk_index}",
                content=chunk_text_str,
                doc_id=doc_id,
                doc_name=doc_name,
                chunk_index=chunk_index,
                token_count=len(current_tokens),
                metadata=metadata,
            ))
            chunk_index += 1

            # Keep overlap tokens from the end of the current chunk
            overlap_text = []
            overlap_tokens = []
            for part in reversed(current_text_parts):
                part_tokens = enc.encode(part)
                if len(overlap_tokens) + len(part_tokens) > CHUNK_OVERLAP_TOKENS:
                    break
                overlap_text.insert(0, part)
                overlap_tokens = part_tokens + overlap_tokens

            current_text_parts = overlap_text
            current_tokens = overlap_tokens

        current_text_parts.append(sentence)
        current_tokens.extend(sentence_tokens)

    # Finalize last chunk
    if current_text_parts:
        chunk_text_str = "\n".join(current_text_parts)
        token_count = len(current_tokens)
        if token_count >= CHUNK_MIN_TOKENS or chunk_index == 0:
            chunks.append(Chunk(
                id=f"{doc_id}_chunk_{chunk_index}",
                content=chunk_text_str,
                doc_id=doc_id,
                doc_name=doc_name,
                chunk_index=chunk_index,
                token_count=token_count,
                metadata=metadata,
            ))
        elif chunks:
            # Merge small trailing chunk with the previous one
            prev = chunks[-1]
            merged_content = prev.content + "\n" + chunk_text_str
            merged_tokens = len(enc.encode(merged_content))
            chunks[-1] = Chunk(
                id=prev.id,
                content=merged_content,
                doc_id=prev.doc_id,
                doc_name=prev.doc_name,
                chunk_index=prev.chunk_index,
                token_count=merged_tokens,
                metadata=prev.metadata,
            )

    return chunks
