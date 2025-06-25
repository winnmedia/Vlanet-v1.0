#!/bin/bash
set -e

echo "Starting server WITHOUT migrations..."

# 환경변수 확인
echo "Environment check:"
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "PORT: ${PORT:-8000}"

# Gunicorn 즉시 시작 (마이그레이션 없이)
echo "Starting Gunicorn directly..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}