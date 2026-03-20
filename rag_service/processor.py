"""
Document processing module for RAG service.
Handles file parsing (PDF, TXT, MD) and URL scraping.
"""

import re
import hashlib
from typing import Optional
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from bs4.element import NavigableString


# ─── Text Extraction ────────────────────────────────────────────────────────────

def extract_text_from_file(content: bytes, filename: str) -> str:
    """
    Extract text content from a file based on its extension.
    Supports: .txt, .md, .pdf, .html
    """
    ext = Path(filename).suffix.lower()

    if ext == ".txt":
        return content.decode("utf-8", errors="replace")

    elif ext == ".md":
        # Strip markdown syntax lightly; keep readable text
        text = content.decode("utf-8", errors="replace")
        # Remove code blocks
        text = re.sub(r"```[\s\S]*?```", "", text)
        # Remove inline code
        text = re.sub(r"`[^`]+`", "", text)
        # Remove links but keep text
        text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
        # Remove images
        text = re.sub(r"!\[([^\]]*)\]\([^\)]+\)", "", text)
        # Remove headers markers but keep text
        text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
        # Remove bold/italic
        text = re.sub(r"[*_]{1,3}([^*_]+)[*_]{1,3}", r"\1", text)
        return text.strip()

    elif ext == ".html" or ext == ".htm":
        soup = BeautifulSoup(content.decode("utf-8", errors="replace"), "html.parser")
        return strip_html(soup.get_text())

    elif ext == ".pdf":
        # Use pdfminer or fall back to raw text extraction
        try:
            from pdfminer.high_level import extract_text as pdf_extract
            import io
            return pdf_extract(io.BytesIO(content))
        except ImportError:
            # Fallback: try to extract readable text patterns
            text = content.decode("latin-1", errors="replace")
            # Filter to mostly printable ASCII
            lines = []
            for line in text.splitlines():
                clean = re.sub(r"[^\x20-\x7E\n]", " ", line)
                if len(clean.strip()) > 20:
                    lines.append(clean)
            return "\n".join(lines)

    else:
        # Try UTF-8 decode as fallback
        return content.decode("utf-8", errors="replace")


def strip_html(html_text: str) -> str:
    """Remove HTML tags and decode entities."""
    soup = BeautifulSoup(html_text, "html.parser")
    text = soup.get_text(separator="\n")
    # Collapse blank lines
    lines = [l.strip() for l in text.splitlines()]
    return "\n".join(l for l in lines if l)


# ─── URL Scraping ──────────────────────────────────────────────────────────────

def scrape_url(url: str, timeout: int = 30) -> tuple[str, str]:
    """
    Fetch a URL and extract its title + readable text content.
    Returns (title, content).

    Raises ValueError on failure.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; NeuroBridgeBot/1.0; "
            "+https://neurobridge.app/bot)"
        ),
        "Accept": "text/html,application/xhtml+xml",
    }

    try:
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise ValueError(f"Failed to fetch URL: {exc}") from exc

    content_type = response.headers.get("Content-Type", "")
    if "text/html" not in content_type and "application/xhtml" not in content_type:
        raise ValueError(f"URL does not return HTML: {content_type}")

    html = response.text
    soup = BeautifulSoup(html, "html.parser")

    # Extract title
    title = ""
    if soup.title:
        title = soup.title.string or ""
    if not title:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)

    # Remove unwanted elements
    for tag in soup.find_all(["script", "style", "nav", "header", "footer",
                               "aside", "form", "button"]):
        tag.decompose()

    # Get main content
    # Prefer <main>, <article>, or the largest <div>
    main = soup.find("main") or soup.find("article") or soup.find("div", class_=re.compile(r"content|main|article", re.I))
    if main:
        text = strip_html(str(main))
    else:
        text = strip_html(str(soup.body) if soup.body else str(soup))

    # Remove duplicate lines
    lines = text.splitlines()
    deduped = []
    seen = set()
    for line in lines:
        norm = line.strip().lower()
        if norm and norm not in seen and len(line.strip()) > 10:
            seen.add(norm)
            deduped.append(line)

    return title.strip(), "\n".join(deduped).strip()


# ─── Chunking ─────────────────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
    """
    Split long text into overlapping chunks.
    Chunks by paragraph when possible, falls back to sentences.
    """
    # Try paragraph splitting first
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    chunks = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 1 <= chunk_size:
            current += ("\n" if current else "") + para
        else:
            if current:
                chunks.append(current)
            # If paragraph itself is too long, split by sentence
            if len(para) > chunk_size:
                sentences = re.split(r"(?<=[.!?])\s+", para)
                current = ""
                for sent in sentences:
                    if len(current) + len(sent) + 1 <= chunk_size:
                        current += (" " if current else "") + sent
                    else:
                        if current:
                            chunks.append(current)
                        # If single sentence too long, hard split
                        if len(sent) > chunk_size:
                            for i in range(0, len(sent), chunk_size - overlap):
                                chunks.append(sent[i:i + chunk_size])
                        current = ""
            else:
                current = para

    if current:
        chunks.append(current)

    return chunks


# ─── Content Hash ──────────────────────────────────────────────────────────────

def content_hash(text: str) -> str:
    """Stable SHA-256 hash of text content for deduplication."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
