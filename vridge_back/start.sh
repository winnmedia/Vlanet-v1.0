#!/bin/bash
# 에러가 발생해도 계속 진행 (헬스체크를 위해)

echo "=== Starting VideoPlanet Backend ==="
echo "Python version: $(python3 --version)"
echo "Port: $PORT"
echo "Settings: config.settings.railway"

# 환경 변수 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 필수 환경변수 체크
if [ -z "$SECRET_KEY" ]; then
    echo "ERROR: SECRET_KEY environment variable is not set!"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL not set, using SQLite"
fi

# 데이터베이스 연결 대기 (PostgreSQL의 경우)
if [ ! -z "$DATABASE_URL" ]; then
    echo "Waiting for database connection..."
    python3 manage.py shell -c "
import time
from django.db import connection
for i in range(15):
    try:
        connection.ensure_connection()
        print('Database connected!')
        break
    except Exception as e:
        print(f'Waiting for database... ({i+1}/15)')
        time.sleep(2)
else:
    print('Database connection timeout! Continuing anyway...')
" || echo "Database check failed, continuing..."
fi

# 마이그레이션
echo "Running migrations..."
python3 manage.py showmigrations || echo "Show migrations failed"
echo "---"
python3 manage.py migrate --noinput --verbosity 2 || echo "Migration failed, continuing..."

# 캐시 테이블 생성 (필요한 경우)
echo "Creating cache table if needed..."
python3 manage.py createcachetable || true

# 정적 파일 수집
echo "Collecting static files..."
python3 manage.py collectstatic --noinput --clear

# React 빌드 파일 확인
if [ -d "frontend_build" ]; then
    echo "Frontend build directory found"
    ls -la frontend_build/ | head -10
else
    echo "WARNING: frontend_build directory not found!"
fi

# 서버 시작
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind [::]:${PORT:-8000} \
    --workers ${WEB_CONCURRENCY:-2} \
    --threads ${WEB_THREADS:-4} \
    --worker-class ${WORKER_CLASS:-sync} \
    --timeout 120 \
    --log-level ${LOG_LEVEL:-info} \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --enable-stdio-inheritance