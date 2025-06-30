#!/bin/bash

echo "Starting VideoPlot Local Development Environment..."

# Backend 시작
echo "Starting Django backend..."
cd vridge_back
python3 manage.py runserver &
BACKEND_PID=$!

# Frontend는 이미 실행 중
echo ""
echo "=========================================="
echo "Local Development URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "Django Admin: http://localhost:8000/admin"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"

# 종료 대기
wait $BACKEND_PID