#!/bin/bash
set -e

echo "Starting Django application..."
echo "PORT: ${PORT:-8000}"
echo "DJANGO_SETTINGS_MODULE: ${DJANGO_SETTINGS_MODULE:-config.settings.railway}"

# Set default environment variables
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings.railway}

# Check if SECRET_KEY is set
if [ -z "$SECRET_KEY" ]; then
    echo "ERROR: SECRET_KEY environment variable is not set!"
    echo "Please set SECRET_KEY in Railway environment variables"
    exit 1
fi

# Wait for database to be ready (if DATABASE_URL is set)
if [ ! -z "$DATABASE_URL" ]; then
    echo "Waiting for database..."
    python << END
import os
import sys
import time
import psycopg2
from urllib.parse import urlparse

url = urlparse(os.environ.get('DATABASE_URL'))
for i in range(30):
    try:
        conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            user=url.username,
            password=url.password,
            database=url.path[1:]
        )
        conn.close()
        print("Database is ready!")
        break
    except Exception as e:
        print(f"Waiting for database... {i+1}/30")
        time.sleep(2)
else:
    print("Database connection timeout!")
    sys.exit(1)
END
fi

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput || echo "Migration failed, continuing anyway..."

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Collectstatic failed, continuing anyway..."

# Create cache table if using database cache
python manage.py createcachetable || echo "Cache table creation skipped"

# Start gunicorn
echo "Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info