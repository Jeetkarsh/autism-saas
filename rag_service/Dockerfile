FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for psycopg2 and pdfminer
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Non-root user for security
RUN useradd --create-home --shell /bin/bash raguser
USER raguser

EXPOSE 8100

ENV PYTHONUNBUFFERED=1 \
    RAG_SERVICE_URL=http://localhost:8100

# Run via uvicorn
CMD ["uvicorn", "rag_service.main:app", "--host", "0.0.0.0", "--port", "8100"]
