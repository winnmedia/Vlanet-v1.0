#!/bin/bash
set -e

echo "=== Starting Django Application ==="
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"

# 환경변수 확인
echo "SECRET_KEY: ${SECRET_KEY:0:10}..."
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"

# Django 설정 모듈 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 1. 기본 마이그레이션 실행
echo "🔄 Running basic migrations..."
python manage.py migrate --noinput || echo "⚠️ Basic migration failed, continuing..."

# 2. 강제 마이그레이션 (누락된 테이블/컬럼 생성)
echo "🔧 Running force migration to create missing tables..."
python manage.py force_migrate || echo "⚠️ Force migration failed, continuing..."

# 3. 마이그레이션 재실행 (강제 마이그레이션 후)
echo "🔄 Re-running migrations after force migration..."
python manage.py migrate --noinput || echo "⚠️ Secondary migration failed, continuing..."

# 4. 미디어 파일 디렉토리 생성
echo "📁 Creating media directories..."
mkdir -p /app/media/feedback_file || true
mkdir -p /app/media/profile_images || true
chmod -R 755 /app/media || true

# 5. 정적 파일 수집
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput || echo "⚠️ Static files collection failed, continuing..."

# 6. 마이그레이션 상태 최종 확인
echo "✅ Final migration check..."
python manage.py showmigrations || echo "⚠️ Migration status check failed, continuing..."

# 7. Django 앱 시작 가능 여부 테스트
echo "🧪 Testing Django app startup..."
if python3 -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
try:
    django.setup()
    print('Django setup successful')
    exit(0)
except Exception as e:
    print(f'Django setup failed: {e}')
    exit(1)
"; then
    echo "✅ Django startup test passed"
    
    # 8. Gunicorn 시작
    echo "🚀 Starting Gunicorn server..."
    exec gunicorn config.wsgi:application \
        --bind 0.0.0.0:$PORT \
        --workers 1 \
        --threads 2 \
        --timeout 120 \
        --keep-alive 2 \
        --max-requests 1000 \
        --max-requests-jitter 100 \
        --access-logfile - \
        --error-logfile -
else
    echo "❌ Django startup test failed - starting emergency server"
    echo "🚨 Emergency mode activated"
    exec python3 emergency_server.py
fi