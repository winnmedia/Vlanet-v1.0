#!/bin/bash
echo "Starting VideoPlanet Backend..."
cd /app/vridge_back

# Use environment variable if set, otherwise use railway_simple
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings.railway_simple}
echo "Using Django settings: $DJANGO_SETTINGS_MODULE"

# Database URL 확인
echo "Database URL available: ${DATABASE_URL:+Yes}"
echo "Railway Database URL available: ${RAILWAY_DATABASE_URL:+Yes}"

# Gunicorn 시작
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -