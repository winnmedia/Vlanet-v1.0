#!/bin/bash
set -e

echo "=== VideoPlane Django 서버 시작 (개선된 버전) ==="
echo "시간: $(date)"
echo "Python 버전: $(python3 --version)"
echo "현재 디렉토리: $(pwd)"

# 기본값 설정 (환경변수가 없을 경우 사용)
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-"config.settings_railway"}
export SECRET_KEY=${SECRET_KEY:-"django-insecure-videoplanet-temp-key-$(date +%s)"}
export DEBUG=${DEBUG:-"True"}
export PORT=${PORT:-"8000"}

echo ""
echo "🔧 환경변수 상태:"
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "SECRET_KEY: ${SECRET_KEY:0:20}..."
echo "DATABASE_URL: ${DATABASE_URL:-'SQLite 사용 (기본값)'}"
echo "DEBUG: $DEBUG"
echo "PORT: $PORT"

# 0. 긴급 수정 먼저 실행
echo "🚨 Running emergency fix..."
python3 emergency_fix.py || echo "⚠️ Emergency fix failed, continuing..."

# 1. 기본 마이그레이션 실행
echo "🔄 Running basic migrations..."
python3 manage.py migrate --noinput || echo "⚠️ Basic migration failed, continuing..."

# 2. 강제 마이그레이션 (누락된 테이블/컬럼 생성)
echo "🔧 Running force migration to create missing tables..."
python3 manage.py force_migrate || echo "⚠️ Force migration failed, continuing..."

# 3. ProjectInvitation 테이블 강제 생성 (필요한 경우)
echo "🔨 Ensuring ProjectInvitation table exists..."
python3 force_migrate_railway.py || echo "⚠️ ProjectInvitation table creation failed, continuing..."

# 4. 마이그레이션 재실행 (강제 마이그레이션 후)
echo "🔄 Re-running migrations after force migration..."
python3 manage.py migrate --noinput || echo "⚠️ Secondary migration failed, continuing..."

# 4-1. development_framework 컬럼 강제 생성
echo "🛠️ Ensuring development_framework column exists..."
python3 force_development_framework.py || echo "⚠️ Development framework column creation failed, continuing..."

# 4-2. feedback 테이블 컬럼 확인 및 생성
echo "🔧 Ensuring feedback columns exist..."
python3 ensure_feedback_columns.py || echo "⚠️ Feedback columns creation failed, continuing..."

# 5. 미디어 파일 디렉토리 생성
echo "📁 Creating media directories..."
mkdir -p media/feedback_file || true
mkdir -p media/profile_images || true
chmod -R 755 media || true

# 6. 정적 파일 수집
echo "📦 Collecting static files..."
python3 manage.py collectstatic --noinput || echo "⚠️ Static files collection failed, continuing..."

# 7. 마이그레이션 상태 최종 확인
echo "✅ Final migration check..."
python3 manage.py showmigrations || echo "⚠️ Migration status check failed, continuing..."

# 7-1. 데이터베이스 상태 확인
echo "🔍 Checking database status..."
python3 manage.py check_db_status || echo "⚠️ Database status check failed, continuing..."

# 8. Django 앱 시작 가능 여부 테스트
echo "🧪 Testing Django app startup..."
if python3 -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', '$DJANGO_SETTINGS_MODULE')
try:
    django.setup()
    print('✅ Django 설정 성공')
    
    # 기본 앱 확인
    from django.apps import apps
    print(f'   등록된 앱: {len(apps.get_app_configs())}개')
    
    # 데이터베이스 확인
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
    print('✅ 데이터베이스 연결 성공')
    
    exit(0)
except Exception as e:
    print(f'❌ Django 설정 실패: {e}')
    import traceback
    traceback.print_exc()
    exit(1)
"; then
    echo "✅ Django startup test passed"
    
    # 9. Gunicorn 시작 (더 안정적인 설정)
    echo "🚀 Starting Gunicorn server..."
    exec gunicorn config.wsgi:application \
        --bind 0.0.0.0:$PORT \
        --workers 2 \
        --threads 4 \
        --timeout 300 \
        --keep-alive 5 \
        --max-requests 1000 \
        --max-requests-jitter 100 \
        --preload \
        --access-logfile - \
        --error-logfile - \
        --log-level info \
        --capture-output
else
    echo "❌ Django startup test failed - starting emergency server"
    echo "🚨 Emergency mode activated"
    exec python3 emergency_server.py
fi