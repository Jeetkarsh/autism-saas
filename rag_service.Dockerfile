FROM python:3.11-slim

WORKDIR /app

# Install system deps for psycopg2 and playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY rag_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install playwright browsers (for URL scraping)
RUN playwright install --with-deps chromium

COPY rag_service/ .

ENV PYTHONPATH=/app
ENV PORT=8100

EXPOSE 8100

# Run via uvicorn
CMD ["uvicorn", "rag_service.main:app", "--host", "0.0.0.0", "--port", "8100"]
