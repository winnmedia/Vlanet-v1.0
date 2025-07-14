#!/bin/bash
set -e

echo "=== Starting Django Application ==="
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"

# 환경변수 확인
echo "SECRET_KEY: ${SECRET_KEY:0:10}..."
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"

# Django 설정 모듈 설정 (원래 설정 사용)
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 1. 기본 마이그레이션 실행
echo "🔄 Running basic migrations..."
python manage.py migrate --noinput || echo "⚠️ Basic migration failed, continuing..."

# 2. 강제 마이그레이션 (누락된 테이블/컬럼 생성)
echo "🔧 Running force migration to create missing tables..."
python manage.py force_migrate || echo "⚠️ Force migration failed, continuing..."

# 3. ProjectInvitation 테이블 강제 생성 (필요한 경우)
echo "🔨 Ensuring ProjectInvitation table exists..."
python force_migrate_railway.py || echo "⚠️ ProjectInvitation table creation failed, continuing..."

# 4. 마이그레이션 재실행 (강제 마이그레이션 후)
echo "🔄 Re-running migrations after force migration..."
python manage.py migrate --noinput || echo "⚠️ Secondary migration failed, continuing..."

# 4-1. development_framework 컬럼 강제 생성
echo "🛠️ Ensuring development_framework column exists..."
python force_development_framework.py || echo "⚠️ Development framework column creation failed, continuing..."

# 5. 미디어 파일 디렉토리 생성
echo "📁 Creating media directories..."
mkdir -p /app/media/feedback_file || true
mkdir -p /app/media/profile_images || true
chmod -R 755 /app/media || true

# 6. 정적 파일 수집
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput || echo "⚠️ Static files collection failed, continuing..."

# 7. 마이그레이션 상태 최종 확인
echo "✅ Final migration check..."
python manage.py showmigrations || echo "⚠️ Migration status check failed, continuing..."

# 7-1. 데이터베이스 상태 확인
echo "🔍 Checking database status..."
python manage.py check_db_status || echo "⚠️ Database status check failed, continuing..."

# 8. Django 앱 시작 가능 여부 테스트
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
    
    # 9. Gunicorn 시작
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