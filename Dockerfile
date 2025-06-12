FROM python:3.11-slim

WORKDIR /app

# Install system and Python dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
COPY argscape argscape/
COPY argscape/backend/requirements-web.txt requirements.txt

RUN ls -l argscape/frontend_dist
RUN ls -l argscape/frontend_dist/assets

RUN pip install --no-cache-dir --timeout 300 -r requirements.txt && \
    pip install -e .

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "-m", "argscape.backend.startup"]