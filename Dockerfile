# Use Python 3.9 slim image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Django 설정을 스크립트에서 강제로 설정함
# ENV DJANGO_SETTINGS_MODULE=config.settings.railway_no_db

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Build frontend
RUN cd vridge_front && npm install && npm run build

# Create staticfiles directory
RUN mkdir -p /app/vridge_back/staticfiles

# Expose port
EXPOSE 8000

# Copy start scripts
COPY vridge_back/scripts/start-server-no-migrate.sh /app/start-server-no-migrate.sh
RUN chmod +x /app/start-server-no-migrate.sh

# Run the application WITHOUT migrations
WORKDIR /app/vridge_back
CMD ["/app/start-server-no-migrate.sh"]