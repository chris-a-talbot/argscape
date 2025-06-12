# Multi-stage Dockerfile for ARGscape backend
# Optimized for minimal size and build speed

FROM python:3.11-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY argscape/backend/requirements-web.txt .
RUN pip install --no-cache-dir --user -r requirements-web.txt

# Copy the backend package and install it
COPY argscape/backend /app/argscape/backend/
COPY pyproject.toml .
RUN pip install --no-cache-dir --user -e .

# Runtime stage
FROM python:3.11-slim AS runtime

# Copy installed packages from builder
COPY --from=builder /root/.local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /app /app

# Set working directory
WORKDIR /app

# Create non-root user
RUN useradd -m -u 1001 argscape && \
    chown -R argscape:argscape /app

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PATH="/usr/local/bin:$PATH"

# Development stage
FROM runtime AS development
USER argscape
CMD ["uvicorn", "argscape.backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM runtime AS production
USER argscape
CMD ["uvicorn", "argscape.backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
