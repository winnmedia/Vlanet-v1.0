#!/bin/bash
echo "=== Starting VideoPlanet Backend ==="
echo "Python version: $(python3 --version)"
echo "Port: $PORT"
echo "Settings: config.settings_minimal"

# 환경 변수 설정
export DJANGO_SETTINGS_MODULE=config.settings_minimal

# 마이그레이션
echo "Running migrations..."
python3 manage.py migrate --noinput || echo "Migration failed, continuing..."

# 정적 파일 수집
echo "Collecting static files..."
python3 manage.py collectstatic --noinput || echo "Collectstatic failed, continuing..."

# 서버 시작
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --timeout 120 \
    --log-level debug \
    --access-logfile - \
    --error-logfile - \
    --capture-output