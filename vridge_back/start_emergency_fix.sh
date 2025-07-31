#!/bin/bash
# Django 503 오류 근본 해결을 위한 응급 시작 스크립트

echo "🚨 Django 503 오류 근본 해결 시작..."

# 환경변수 설정
# Railway에서 설정한 DJANGO_SETTINGS_MODULE을 사용하거나 기본값 사용
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings_railway}
export PYTHONPATH=/app:$PYTHONPATH  # Railway는 /app 디렉토리 사용

echo "📌 환경변수 설정 완료"
echo "   DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "   DATABASE_URL: ${DATABASE_URL:0:50}..."

# 1단계: Django 시작 가능 여부 테스트
echo -e "\n1️⃣ Django 시작 테스트..."
python3 -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', '$DJANGO_SETTINGS_MODULE')
try:
    import django
    django.setup()
    print('✅ Django 시작 성공!')
except Exception as e:
    print(f'❌ Django 시작 실패: {e}')
    import traceback
    traceback.print_exc()
"

# 2단계: 마이그레이션 실행 (실패해도 계속)
echo -e "\n2️⃣ 마이그레이션 실행..."
python3 manage.py migrate --settings=$DJANGO_SETTINGS_MODULE --run-syncdb || echo "⚠️ 마이그레이션 실패 (계속 진행)"

# 3단계: 캐시 테이블 생성 (실패해도 계속)
echo -e "\n3️⃣ 캐시 테이블 생성..."
python3 manage.py createcachetable --settings=$DJANGO_SETTINGS_MODULE || echo "⚠️ 캐시 테이블 생성 실패 (계속 진행)"

# 4단계: 정적 파일 수집 (실패해도 계속)
echo -e "\n4️⃣ 정적 파일 수집..."
python3 manage.py collectstatic --noinput --settings=$DJANGO_SETTINGS_MODULE || echo "⚠️ 정적 파일 수집 실패 (계속 진행)"

# 5단계: Gunicorn으로 서버 시작
PORT=${PORT:-8000}
echo -e "\n5️⃣ Gunicorn 서버 시작 (포트: $PORT)..."

# Gunicorn 시작 시도
gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 1 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level debug \
    --capture-output \
    --enable-stdio-inheritance \
    --preload || {
    echo "❌ Gunicorn 시작 실패! 응급 서버로 전환..."
    python3 emergency_server.py
}