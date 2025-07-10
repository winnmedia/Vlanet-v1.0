#!/bin/bash
echo "=== Starting VideoPlanet Backend (Quick Start) ==="

# 환경 변수 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 필수 환경변수 체크
if [ -z "$SECRET_KEY" ]; then
    echo "ERROR: SECRET_KEY environment variable is not set!"
    exit 1
fi

# Gunicorn 즉시 시작 (헬스체크 우선)
echo "Starting Gunicorn immediately for health checks..."
gunicorn config.wsgi:application \
    --bind [::]:${PORT:-8000} \
    --workers 1 \
    --threads 2 \
    --timeout 120 \
    --preload \
    --log-level info \
    --access-logfile - \
    --error-logfile - &

GUNICORN_PID=$!

# 백그라운드에서 마이그레이션 실행
(
    echo "Running migrations in background..."
    python3 manage.py migrate --noinput || echo "Migration failed"
    python3 manage.py createcachetable || true
    python3 manage.py collectstatic --noinput --clear || true
    echo "Background tasks completed"
) &

# Gunicorn 프로세스 대기
wait $GUNICORN_PID