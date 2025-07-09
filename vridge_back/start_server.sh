#!/bin/sh
# Railway 서버 시작 스크립트

echo "Starting VideoPlanet server..."

# 환경변수 확인
echo "PORT: ${PORT:-8000}"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"

# 데이터베이스 대기 (실패해도 계속 진행)
python wait_for_db.py || echo "Warning: Database wait failed, continuing anyway"

# 마이그레이션 (실패해도 계속 진행)
python manage.py migrate --noinput || echo "Warning: Migration failed, continuing anyway"

# 정적 파일 수집 (실패해도 계속 진행)
python manage.py collectstatic --noinput || echo "Warning: Collectstatic failed, continuing anyway"

# Gunicorn 시작
echo "Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info