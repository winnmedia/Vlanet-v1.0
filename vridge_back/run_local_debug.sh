#!/bin/bash
# VideoPlanet 백엔드 로컬 디버그 실행 스크립트

echo "🚀 VideoPlanet Django 백엔드 로컬 실행"
echo "=================================="

# 환경변수 설정
export DJANGO_SETTINGS_MODULE=config.settings_railway
export SECRET_KEY="django-insecure-local-debug-key"
export DEBUG=True
export DATABASE_URL=""  # SQLite 사용
export ALLOWED_HOSTS="*"
export CORS_ALLOW_ALL_ORIGINS=True

# Python 경로 확인
echo "Python 버전: $(python3 --version)"
echo "현재 디렉토리: $(pwd)"

# 의존성 확인
echo ""
echo "📦 필수 패키지 확인..."
python3 -c "
import django
import rest_framework
import corsheaders
print('✅ Django:', django.__version__)
print('✅ DRF:', rest_framework.__version__)
print('✅ CORS Headers 설치됨')
" || {
    echo "❌ 필수 패키지가 없습니다. requirements.txt 설치 필요"
    exit 1
}

# 마이그레이션 실행
echo ""
echo "🔄 데이터베이스 마이그레이션..."
python3 manage.py migrate --noinput

# 테스트 사용자 생성
echo ""
echo "👤 테스트 사용자 생성..."
python3 -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_railway')
django.setup()

from users.models import User
if not User.objects.filter(email='test@example.com').exists():
    User.objects.create_user(
        email='test@example.com',
        password='Test123!',
        name='테스트 사용자'
    )
    print('✅ 테스트 사용자 생성 완료')
else:
    print('✅ 테스트 사용자 이미 존재')
"

# 정적 파일 수집
echo ""
echo "📁 정적 파일 수집..."
python3 manage.py collectstatic --noinput

# 개발 서버 실행
echo ""
echo "🌐 개발 서버 시작 (포트 8000)..."
echo "=================================="
echo "API URL: http://localhost:8000"
echo "Health Check: http://localhost:8000/api/health/"
echo "Admin: http://localhost:8000/admin/"
echo "=================================="

# runserver 사용 (개발용)
python3 manage.py runserver 0.0.0.0:8000