# Multi-stage build: Frontend + Backend in single deployment
FROM node:20-alpine AS frontend-build

# Build the frontend
WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install --no-audit
COPY frontend/ ./
RUN npm run build && ls -la dist/

# Python backend stage
FROM python:3.11-slim AS backend

# Set working directory
WORKDIR /app

# Install system dependencies including R and comprehensive build tools
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    make \
    cmake \
    autoconf \
    automake \
    libtool \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire project for package installation
COPY pyproject.toml .
COPY argscape argscape/

# Copy requirements first for better caching
COPY argscape/backend/requirements-web.txt requirements.txt

# Install Python dependencies and the package itself
RUN pip install --no-cache-dir --timeout 300 -r requirements.txt && \
    pip install -e .

# Copy built frontend from previous stage
COPY --from=frontend-build /frontend/dist argscape/frontend_dist
RUN ls -la argscape/frontend_dist/ || echo "Frontend dist directory not found"

# Create temporary directory for file storage
RUN mkdir -p /tmp/argscape_storage && chmod 777 /tmp/argscape_storage

# Set environment variables
ENV PYTHONPATH=/app
ENV TEMP_STORAGE_PATH=/tmp/argscape_storage
ENV PYTHONUNBUFFERED=1

# Expose port (Railway will override)
EXPOSE 8000

# Start command
CMD ["python", "-m", "argscape.backend.startup"] 