#!/bin/bash
set -e

echo "=== Starting Simple Health Check Server ==="
echo "PORT: $PORT"
echo "Current directory: $(pwd)"

# 간단한 HTTP 서버 시작
exec python3 simple_health_server.py