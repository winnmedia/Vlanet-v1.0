#!/bin/bash
# 최소한의 시작 스크립트
set -e

echo "Starting Django with minimal configuration..."

# 환경변수 기본값 설정
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings.railway}
export SECRET_KEY=${SECRET_KEY:-temporary-secret-key}

# Django 서버 시작 (마이그레이션 없이)
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 1 \
    --timeout 300 \
    --access-logfile - \
    --error-logfile - \
    --log-level debug