#!/bin/bash
# 에러가 나도 계속 진행
set +e

echo "Starting server WITHOUT migrations..."

# 환경변수 강제 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 환경변수 확인
echo "Environment check:"
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "PORT: ${PORT:-8000}"

# Python 경로 설정
export PYTHONPATH=/app/vridge_back:$PYTHONPATH

# Gunicorn 즉시 시작 (마이그레이션 없이)
echo "Starting Gunicorn with no-db settings..."
cd /app/vridge_back && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}