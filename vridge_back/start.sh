#!/bin/bash
set -e

echo "=== VideoPlanet Django 서버 시작 (간소화 버전) ==="
echo "시간: $(date)"
echo "Python 버전: $(python3 --version)"

# 환경변수 설정
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-"config.settings.railway"}
export SECRET_KEY=${SECRET_KEY:-"django-insecure-videoplanet-temp-key-$(date +%s)"}
export DEBUG=${DEBUG:-"False"}
export PORT=${PORT:-"8000"}

echo ""
echo "🔧 환경변수:"
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "DEBUG: $DEBUG"
echo "PORT: $PORT"

# Django 설정 검증
echo ""
echo "🧪 Django 설정 검증..."
python3 -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', '$DJANGO_SETTINGS_MODULE')
django.setup()
print('✅ Django 설정 성공')
from django.apps import apps
print(f'   등록된 앱: {len(apps.get_app_configs())}개')
"

# 마이그레이션 실행
echo ""
echo "🔄 마이그레이션 실행..."
python3 manage.py migrate --noinput

# 정적 파일 수집
echo ""
echo "📦 정적 파일 수집..."
python3 manage.py collectstatic --noinput

# 미디어 디렉토리 생성
echo ""
echo "📁 미디어 디렉토리 생성..."
mkdir -p media/feedback_file
mkdir -p media/profile_images
chmod -R 755 media

# 서버 시작
echo ""
echo "🚀 Gunicorn 서버 시작..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --threads 4 \
    --timeout 120 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload \
    --access-logfile - \
    --error-logfile - \
    --log-level info