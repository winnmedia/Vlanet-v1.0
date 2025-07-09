#!/bin/bash
# VideoPlanet 로컬 백엔드 테스트 스크립트

echo "VideoPlanet 로컬 백엔드 시작..."

# 환경변수 설정 (로컬 테스트용)
export DJANGO_SETTINGS_MODULE="config.settings"
export SENDGRID_API_KEY="your_sendgrid_api_key_here"
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
export DEBUG="True"

# 가상환경 활성화 (있다면)
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "env" ]; then
    source env/bin/activate
fi

# 데이터베이스 마이그레이션
echo "데이터베이스 마이그레이션 실행..."
python manage.py migrate

# 정적 파일 수집
echo "정적 파일 수집..."
python manage.py collectstatic --noinput

# 개발 서버 시작
echo "개발 서버 시작 (http://localhost:8000)..."
python manage.py runserver