import os
import sys
import json
import logging
import asyncio
import re
from typing import Optional
from pathlib import Path

# Fix path to import config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import discord
import aiohttp
from config import DISCORD_KB_BOT_TOKEN, DISCORD_KB_CHANNEL_ID, RAG_BASE_URL

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("discord_watcher")

# State tracking for deduplication
DATA_DIR = Path(os.path.dirname(os.path.abspath(__file__))) / "data"
DATA_DIR.mkdir(exist_ok=True)
PROCESSED_LOG = DATA_DIR / "processed_messages.json"

def load_processed_ids() -> set[str]:
    if PROCESSED_LOG.exists():
        try:
            with open(PROCESSED_LOG, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except json.JSONDecodeError:
            logger.warning("Corrupted processed_messages.json, returning empty set.")
    return set()

def save_processed_id(msg_id: str):
    processed = load_processed_ids()
    processed.add(msg_id)
    with open(PROCESSED_LOG, 'w', encoding='utf-8') as f:
        json.dump(list(processed), f)

# Set up Discord client
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

# URL extraction regex
URL_PATTERN = re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')

async def ingest_file(filename: str, content: bytes, user_id: str) -> dict:
    url = f"{RAG_BASE_URL}/ingest/file"
    async with aiohttp.ClientSession() as session:
        data = aiohttp.FormData()
        data.add_field('file', content, filename=filename)
        data.add_field('user_id', user_id)
        
        headers = {"Authorization": f"Bearer {os.getenv('RAG_API_KEY', 'development_secret_key')}"}
        
        async with session.post(url, data=data, headers=headers) as response:
            result = await response.json()
            if response.status != 200:
                raise Exception(f"RAG API Error: {result.get('detail', 'Unknown error')}")
            return result

async def ingest_url(target_url: str, user_id: str) -> dict:
    url = f"{RAG_BASE_URL}/ingest/url"
    async with aiohttp.ClientSession() as session:
        payload = {"url": target_url, "user_id": user_id}
        headers = {
            "Authorization": f"Bearer {os.getenv('RAG_API_KEY', 'development_secret_key')}",
            "Content-Type": "application/json"
        }
        
        async with session.post(url, json=payload, headers=headers) as response:
            result = await response.json()
            if response.status != 200:
                raise Exception(f"RAG API Error: {result.get('detail', 'Unknown error')}")
            return result

@client.event
async def on_ready():
    logger.info(f"Discord watcher started. Logged in as {client.user.name}")
    logger.info(f"Monitoring channel: {DISCORD_KB_CHANNEL_ID}")
    logger.info(f"RAG backend: {RAG_BASE_URL}")

@client.event
async def on_message(message: discord.Message):
    # Ignore our own messages
    if message.author == client.user:
        return
        
    # Ignore messages outside the configured channel
    if str(message.channel.id) != DISCORD_KB_CHANNEL_ID:
        return

    msg_id = str(message.id)
    user_id = str(message.author.id)
    
    # Check deduplication log
    if msg_id in load_processed_ids():
        logger.debug(f"Skipping already processed message {msg_id}")
        return

    logger.info(f"Processing new message {msg_id} from {message.author.name}")
    
    ingested_something = False
    feedback_msgs = []
    
    # 1. Process attachments
    for attachment in message.attachments:
        logger.info(f"Downloading attachment: {attachment.filename}")
        try:
            content = await attachment.read()
            result = await ingest_file(attachment.filename, content, user_id)
            chunks = result.get('chunk_count', 0)
            feedback_msgs.append(f"📄 **{attachment.filename}** ingested ({chunks} chunks).")
            ingested_something = True
        except Exception as e:
            logger.error(f"Failed to ingest attachment {attachment.filename}: {e}")
            feedback_msgs.append(f"❌ Failed to ingest **{attachment.filename}**: {e}")
            await message.add_reaction("❌")
            
    # 2. Process URLs in message content
    urls = URL_PATTERN.findall(message.content)
    for url in urls:
        logger.info(f"Found URL: {url}")
        try:
            result = await ingest_url(url, user_id)
            chunks = result.get('chunk_count', 0)
            feedback_msgs.append(f"🔗 **URL** ingested ({chunks} chunks).")
            ingested_something = True
        except Exception as e:
            logger.error(f"Failed to ingest URL {url}: {e}")
            feedback_msgs.append(f"❌ Failed to ingest URL: {e}")
            await message.add_reaction("❌")
            
    # 3. Process plain text notes (if message has no attachments or URLs, and isn't empty)
    clean_content = message.content.strip()
    if clean_content and not urls and not message.attachments:
        logger.info(f"Processing message as plain text note")
        try:
            # Create a virtual text file
            filename = f"discord_note_{msg_id}.txt"
            content = clean_content.encode('utf-8')
            result = await ingest_file(filename, content, user_id)
            chunks = result.get('chunk_count', 0)
            feedback_msgs.append(f"📝 **Text Note** ingested ({chunks} chunks).")
            ingested_something = True
        except Exception as e:
            logger.error(f"Failed to ingest text note: {e}")
            feedback_msgs.append(f"❌ Failed to ingest text note: {e}")
            await message.add_reaction("❌")

    # Feedback and commit
    if feedback_msgs:
        try:
            await message.reply("\n".join(feedback_msgs))
            if ingested_something:
                await message.add_reaction("✅")
        except discord.errors.Forbidden:
            logger.warning("Bot lacks permission to reply or react in this channel.")
            
    # Always save the message ID so we don't repeatedly fail on the same bad message
    save_processed_id(msg_id)

if __name__ == "__main__":
    if not DISCORD_KB_BOT_TOKEN:
        logger.error("DISCORD_KB_BOT_TOKEN is missing. Please check .env or config.py")
        sys.exit(1)
        
    try:
        client.run(DISCORD_KB_BOT_TOKEN)
    except Exception as e:
        logger.error(f"Failed to run Discord bot: {e}")
        sys.exit(1)
