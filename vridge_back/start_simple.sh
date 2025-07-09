#!/bin/bash
echo "=== Starting VideoPlanet Backend (Simple Mode) ==="
echo "Port: ${PORT:-8000}"

# 환경 변수 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 간단한 마이그레이션
echo "Running migrations..."
python3 manage.py migrate --noinput || true

# Gunicorn 시작 (최소 설정)
echo "Starting Gunicorn on port ${PORT:-8000}..."
gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --timeout 120 \
    --log-level info