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
COPY argscape/api/requirements-web.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --timeout 300 -r requirements.txt && \
    pip install -e .

# Set runtime environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "-m", "argscape.api.startup"]