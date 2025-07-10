#!/bin/bash
# Railway 배포 후 수동으로 실행할 스크립트

echo "=== Post-deployment tasks ==="

# 환경 변수 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 마이그레이션 실행
echo "Running migrations..."
python3 manage.py migrate --noinput

# 캐시 테이블 생성
echo "Creating cache table..."
python3 manage.py createcachetable

# 정적 파일 수집 (옵션)
echo "Collecting static files..."
python3 manage.py collectstatic --noinput --clear

echo "=== Post-deployment tasks completed ==="