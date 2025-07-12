#\!/bin/bash
# 단순화된 Railway 시작 스크립트

echo "=== Starting Django Application (Simple) ==="

# 필수 환경변수만 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 마이그레이션 실행 (에러 무시)
echo "Running migrations..."
python manage.py migrate --noinput || echo "Migration warnings ignored"

# 캐시 테이블 생성 (에러 무시)
python manage.py createcachetable || echo "Cache table already exists"

# 정적 파일 수집
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Gunicorn 시작
echo "Starting Gunicorn on port $PORT..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
EOF < /dev/null
