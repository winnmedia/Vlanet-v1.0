#!/bin/bash
set -e

echo "=== Starting Django Application ==="
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"
echo "Files in directory: $(ls -la | wc -l)"

# 환경변수 확인
echo "SECRET_KEY: ${SECRET_KEY:0:10}..."
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"

# Django 설정 모듈 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 마이그레이션 실행
echo "Running migrations..."
python manage.py ensure_migrations

# 정적 파일 수집
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Gunicorn 시작
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 1 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -