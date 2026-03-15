"""Plain text and Markdown parser."""
from parsers.base import BaseParser


class TextParser(BaseParser):
    """Parser for .txt and .md files."""

    def parse(self, content: bytes, filename: str) -> str:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1")

    def supported_extensions(self) -> list[str]:
        return [".txt", ".md", ".markdown"]
