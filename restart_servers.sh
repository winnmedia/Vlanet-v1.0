#!/bin/bash

echo "🚀 VideoPlanet 서버 재시작 중..."

# 기존 서버 종료
echo "기존 서버 종료 중..."
pkill -f "python manage.py runserver"
pkill -f "npm start"
pkill -f "react-scripts"

# 잠시 대기
sleep 2

# 백엔드 서버 시작
echo "백엔드 서버 시작 중..."
cd ~/VideoPlanet/vridge_back
python manage.py runserver &
BACKEND_PID=$!

# 프론트엔드 서버 시작
echo "프론트엔드 서버 시작 중..."
cd ~/VideoPlanet/vridge_front
npm start &
FRONTEND_PID=$!

echo "✅ 서버가 시작되었습니다!"
echo "백엔드: http://localhost:8000"
echo "프론트엔드: http://localhost:3000"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."

# 프로세스 대기
wait $BACKEND_PID $FRONTEND_PID