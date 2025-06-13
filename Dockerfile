FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including GDAL for geospatial libraries
RUN apt-get update && apt-get install -y \
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
ENV GDAL_CONFIG=/usr/bin/gdal-config
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

COPY pyproject.toml .
COPY argscape argscape/
COPY argscape/backend/requirements-web.txt requirements.txt

RUN ls -l argscape/frontend_dist
RUN ls -l argscape/frontend_dist/assets

# Install Python dependencies
RUN pip install --no-cache-dir --timeout 300 -r requirements.txt && \
    pip install -e .

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["python", "-m", "argscape.backend.startup"]