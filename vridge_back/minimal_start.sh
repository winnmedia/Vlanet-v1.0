#!/bin/bash
# 최소한의 시작 스크립트 - 마이그레이션만 실행하고 바로 서버 시작

cd /app/vridge_back 2>/dev/null || cd vridge_back 2>/dev/null || true

# 환경변수 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

# 마이그레이션 (에러 무시)
python3 manage.py migrate --noinput 2>/dev/null || true

# Gunicorn 시작
exec gunicorn config.wsgi:application \
    --bind [::]:${PORT:-8000} \
    --workers 2 \
    --timeout 120