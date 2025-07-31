#!/bin/bash
set -e

echo "=== VideoPlanet Django 서버 시작 (개선된 버전) ==="
echo "시간: $(date)"
echo "Python 버전: $(python --version || python3 --version)"
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

# 디렉토리 생성
echo ""
echo "📁 필수 디렉토리 생성..."
mkdir -p media/feedback_file media/profile_images logs
chmod -R 755 media

# 마이그레이션 실행
echo ""
echo "🔄 데이터베이스 마이그레이션..."
# 먼저 안전한 마이그레이션 스크립트 실행
python3 ensure_migrations_safe.py || {
    echo "⚠️ 안전한 마이그레이션 실패 - 기본 방법 시도"
    python3 manage.py migrate --noinput || {
        echo "⚠️ 마이그레이션 실패 - 기본 SQLite로 진행"
    }
}

# 정적 파일 수집
echo ""
echo "📦 정적 파일 수집..."
python3 manage.py collectstatic --noinput || true

# Django 시작 테스트
echo ""
echo "🧪 Django 앱 시작 테스트..."
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
    exit(1)
"; then
    echo ""
    echo "🚀 Gunicorn 서버 시작..."
    
    # Gunicorn 실행 (더 안정적인 설정)
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
    echo ""
    echo "❌ Django 설정 실패 - 응급 서버 시작"
    echo "🚨 응급 모드로 전환합니다..."
    
    # 응급 서버 실행
    exec python3 emergency_server.py
fi