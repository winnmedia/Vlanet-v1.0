#!/bin/bash
set -e

echo "=== VideoPlanet Production Start ==="
echo "Environment: ${RAILWAY_ENVIRONMENT:-production}"
echo "Port: ${PORT:-8000}"

# 환경변수 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# Python 경로 설정
export PYTHONPATH=/app/vridge_back:$PYTHONPATH

# 정적 파일 수집
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Static collection skipped"

# 마이그레이션 시도 (실패해도 계속)
echo "Running migrations..."
python manage.py migrate --noinput || {
    echo "Migration failed. Trying minimal setup..."
    python manage.py migrate contenttypes --noinput || true
    python manage.py migrate auth --noinput || true
    python manage.py migrate users --noinput || true
    echo "Will retry full migration after server starts"
}

# Gunicorn 시작
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -