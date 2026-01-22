# Production Dockerfile for ARGscape (Railway deployment)
# For local development, use docker-compose.yml which references argscape/api/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including GDAL for geospatial libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    build-essential \
    make \
    cmake \
    autoconf \
    automake \
    libtool \
    gdal-bin \
    libgdal-dev \
    libproj-dev \
    libgeos-dev \
    libspatialindex-dev \
    && rm -rf /var/lib/apt/lists/*

# Set GDAL environment variables before installing Python packages
ENV GDAL_CONFIG=/usr/bin/gdal-config \
    CPLUS_INCLUDE_PATH=/usr/include/gdal \
    C_INCLUDE_PATH=/usr/include/gdal

# Copy Python package configuration and source
COPY pyproject.toml .
COPY argscape argscape/
COPY docs docs/
COPY argscape/api/requirements-web.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --timeout 300 -r requirements.txt && \
    pip install -e .

# Build documentation (Jupyter Book)
RUN pip install --no-cache-dir jupyter-book sphinx-book-theme myst-nb sphinx-copybutton sphinx-design && \
    cd docs/book && jupyter-book build -n --keep-going . && \
    mkdir -p /app/argscape/docs_dist && \
    cp -r _build/html /app/argscape/docs_dist/

# Set runtime environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "-m", "argscape.api.startup"]