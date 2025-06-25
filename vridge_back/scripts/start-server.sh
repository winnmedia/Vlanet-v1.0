#!/bin/bash
set -e

echo "Starting server initialization..."

# 환경변수 확인
echo "Environment check:"
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "RAILWAY_DATABASE_URL: ${RAILWAY_DATABASE_URL:0:20}..."

# 마이그레이션 실행 (단계별로)
echo "Running database migrations..."

# contenttypes 먼저 (Django 기본)
echo "Step 1: Migrating contenttypes..."
python manage.py migrate contenttypes 0001 --noinput || echo "Contenttypes initial migration failed"

# users 앱 마이그레이션 (Custom User 모델)
echo "Step 2: Migrating users app..."
python manage.py migrate users 0001 --noinput || echo "Users initial migration failed"

# auth 마이그레이션 (users가 먼저 생성된 후)
echo "Step 3: Migrating auth..."
python manage.py migrate auth 0001 --noinput || echo "Auth initial migration failed"

# admin 마이그레이션
echo "Step 4: Migrating admin..."
python manage.py migrate admin 0001 --noinput || echo "Admin initial migration failed"

# 나머지 모든 마이그레이션
echo "Step 5: Running all remaining migrations..."
python manage.py migrate --noinput || echo "Other migrations failed"

# 정적 파일 수집 (이미 WhiteNoise가 처리하지만 안전을 위해)
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Collectstatic failed, but continuing..."

# 데이터베이스 연결 테스트
echo "Testing database connection..."
python manage.py dbshell --command="SELECT 1;" || echo "Database connection test failed"

# Gunicorn 시작
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}