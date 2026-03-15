"""Base parser and parser factory."""
from abc import ABC, abstractmethod


class BaseParser(ABC):
    """Abstract base class for document parsers."""

    @abstractmethod
    def parse(self, content: bytes, filename: str) -> str:
        """Parse document content into plain text.

        Args:
            content: Raw file bytes.
            filename: Original filename.

        Returns:
            Extracted text content.
        """
        pass

    @abstractmethod
    def supported_extensions(self) -> list[str]:
        """Return list of supported file extensions (lowercase, with dot)."""
        pass


class ParserFactory:
    """Factory to select the right parser based on file extension."""

    _parsers: list[BaseParser] = []

    @classmethod
    def register(cls, parser: BaseParser):
        cls._parsers.append(parser)

    @classmethod
    def get_parser(cls, filename: str) -> BaseParser | None:
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        for parser in cls._parsers:
            if ext in parser.supported_extensions():
                return parser
        return None

    @classmethod
    def supported_types(cls) -> list[str]:
        exts = []
        for parser in cls._parsers:
            exts.extend(parser.supported_extensions())
        return list(set(exts))
