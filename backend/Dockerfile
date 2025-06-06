# Multi-stage Dockerfile for ARGscape backend
# Supports both development and production deployments

FROM mambaorg/micromamba:alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    g++ \
    make \
    bash \
    curl \
    git \
    && rm -rf /var/cache/apk/*

# Copy environment files
COPY environment.yml /tmp/environment.yml
COPY environment-local.yml /tmp/environment-local.yml

# Create conda environment
RUN micromamba create -n argscape -f /tmp/environment.yml && \
    micromamba clean --all --yes

# Set shell to use conda
SHELL ["micromamba", "run", "-n", "argscape", "/bin/bash", "-c"]

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements-web.txt .
RUN pip install --no-cache-dir -r requirements-web.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Development stage
FROM base AS development

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Start development server with hot reload
CMD ["micromamba", "run", "--no-capture-output", "-n", "argscape", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S argscape && \
    adduser -S argscape -u 1001 -G argscape

# Set proper permissions
RUN chown -R argscape:argscape /app

# Switch to non-root user
USER argscape

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Start production server
CMD ["micromamba", "run", "--no-capture-output", "-n", "argscape", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
