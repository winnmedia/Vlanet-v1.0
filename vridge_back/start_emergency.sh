#!/bin/bash
echo "=== Starting Emergency Mode ==="
echo "Port: ${PORT:-8000}"

# 가장 간단한 Gunicorn 실행
gunicorn config.wsgi_emergency:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 1 \
    --timeout 120