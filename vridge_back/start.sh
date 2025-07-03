#!/bin/bash
echo "=== Starting VideoPlanet Backend ==="
echo "Python version: $(python --version)"
echo "Django version: $(python -c 'import django; print(django.__version__)')"
echo "Port: $PORT"
echo "Settings: config.settings_minimal"

# 마이그레이션
echo "Running migrations..."
python manage.py migrate --settings=config.settings_minimal --noinput

# 정적 파일 수집
echo "Collecting static files..."
python manage.py collectstatic --settings=config.settings_minimal --noinput

# 서버 시작
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --timeout 120 \
    --log-level info \
    --access-logfile - \
    --error-logfile -