#!/bin/bash
set -e

echo "Starting server initialization..."

# 환경변수 확인
echo "Environment check:"
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "RAILWAY_DATABASE_URL: ${RAILWAY_DATABASE_URL:0:20}..."

# 마이그레이션 실행
echo "Running database migrations..."
python manage.py migrate --noinput || echo "Migration failed, but continuing..."

# 정적 파일 수집 (이미 WhiteNoise가 처리하지만 안전을 위해)
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Collectstatic failed, but continuing..."

# 데이터베이스 연결 테스트
echo "Testing database connection..."
python manage.py dbshell --command="SELECT 1;" || echo "Database connection test failed"

# Gunicorn 시작
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}