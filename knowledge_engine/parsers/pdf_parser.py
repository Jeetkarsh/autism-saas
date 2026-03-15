"""PDF parser using PyMuPDF."""
import io
from parsers.base import BaseParser


class PDFParser(BaseParser):
    """Parser for .pdf files using PyMuPDF (fitz)."""

    def parse(self, content: bytes, filename: str) -> str:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=content, filetype="pdf")
        text_parts = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            if text.strip():
                text_parts.append(f"[Page {page_num + 1}]\n{text.strip()}")
        doc.close()
        return "\n\n".join(text_parts)

    def supported_extensions(self) -> list[str]:
        return [".pdf"]
