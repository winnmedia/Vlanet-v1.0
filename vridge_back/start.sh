#!/bin/bash
echo "=== Starting VideoPlanet Backend ==="
echo "Python version: $(python3 --version)"
echo "Port: $PORT"
echo "Settings: config.settings_minimal"

# 환경 변수 설정
export DJANGO_SETTINGS_MODULE=config.settings_minimal

# 마이그레이션
echo "Running migrations..."
python3 manage.py showmigrations
echo "---"
python3 manage.py migrate --noinput --verbosity 2 || echo "Migration failed, continuing..."

# 마이그레이션 실패 시 강제 실행
if [ $? -ne 0 ]; then
    echo "Standard migration failed. Trying force migration..."
    python3 force_migrate.py || echo "Force migration also failed"
fi

# 누락된 컬럼 수정
echo "Fixing missing columns..."
python3 manage.py fix_missing_columns || echo "Column fix failed"

echo "---"
echo "Checking database tables..."
python3 manage.py shell -c "from django.db import connection; cursor = connection.cursor(); cursor.execute(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public'\"); print('Tables:', [t[0] for t in cursor.fetchall()])"

# 캐시 테이블 생성 (필요한 경우)
echo "Creating cache table if needed..."
python3 manage.py createcachetable || echo "Cache table creation skipped"

# 정적 파일 수집
echo "Collecting static files..."
python3 manage.py collectstatic --noinput || echo "Collectstatic failed, continuing..."

# 서버 시작
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --timeout 120 \
    --log-level debug \
    --access-logfile - \
    --error-logfile - \
    --capture-output