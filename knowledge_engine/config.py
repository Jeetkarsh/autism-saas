"""Configuration for the Knowledge Engine RAG service."""
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma_db")
RAG_PORT = int(os.getenv("RAG_PORT", "8100"))
RAG_API_KEY = os.getenv("RAG_API_KEY", "development_secret_key")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# Discord Watcher config
DISCORD_KB_BOT_TOKEN = os.getenv("DISCORD_KB_BOT_TOKEN", "")
DISCORD_KB_CHANNEL_ID = os.getenv("DISCORD_KB_CHANNEL_ID", "1482748327400308846")

# Discord Query Bot configuration
DISCORD_QUERY_BOT_TOKEN = os.getenv("DISCORD_QUERY_BOT_TOKEN", "")
DISCORD_QUERY_CHANNEL_ID = os.getenv("DISCORD_QUERY_CHANNEL_ID", "")
RAG_BASE_URL = os.getenv("RAG_BASE_URL", f"http://localhost:{RAG_PORT}")

# Chunking settings
CHUNK_MIN_TOKENS = 200
CHUNK_MAX_TOKENS = 600
CHUNK_OVERLAP_TOKENS = 50

# CORS
ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
