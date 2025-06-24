#!/bin/bash

# 가비아 배포용 Django 시작 스크립트

set -e

echo "Starting Vridge Backend..."

# 데이터베이스 연결 대기
echo "Waiting for database..."
while ! nc -z postgres 5432; do
    sleep 1
done
echo "Database is ready!"

# Redis 연결 대기
echo "Waiting for Redis..."
while ! nc -z redis 6379; do
    sleep 1
done
echo "Redis is ready!"

# 데이터베이스 마이그레이션
echo "Running migrations..."
python manage.py migrate --noinput

# 정적 파일 수집
echo "Collecting static files..."
python manage.py collectstatic --noinput

# 슈퍼유저 생성 (환경 변수가 설정된 경우)
if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_EMAIL" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')
    print('Superuser created successfully')
else:
    print('Superuser already exists')
"
fi

# 샘플 데이터 로드 (개발 환경에서만)
if [ "$DJANGO_ENV" = "development" ]; then
    echo "Loading sample data..."
    if [ -f "fixtures/sample_data.json" ]; then
        python manage.py loaddata fixtures/sample_data.json
    fi
fi

# 로그 디렉토리 확인
mkdir -p /app/logs

echo "Starting Daphne server..."

# Daphne를 사용하여 ASGI 애플리케이션 실행
exec daphne -b 0.0.0.0 -p 8000 \
    --access-log /app/logs/access.log \
    --proxy-headers \
    config.asgi:application