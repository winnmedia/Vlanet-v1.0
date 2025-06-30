#!/bin/bash

echo "🛑 모든 서버 중지 중..."
pkill -f "python3 manage.py runserver"
pkill -f "react-scripts start"
pkill -f "npm start"
sleep 2

echo "🚀 백엔드 서버 시작..."
cd /home/winnmedia/VideoPlanet/vridge_back
DJANGO_SETTINGS_MODULE=config.settings_dev python3 manage.py runserver &
sleep 3

echo "🚀 프론트엔드 서버 시작..."
cd /home/winnmedia/VideoPlanet/vridge_front
npm start &

echo "✅ 서버 시작 완료!"
echo "백엔드: http://localhost:8000"
echo "프론트엔드: http://localhost:3000"
echo ""
echo "20초 후에 브라우저에서 http://localhost:3000 을 열어주세요"