#!/bin/bash
# VideoPlanet 서버 시작 스크립트

echo "Starting VideoPlanet servers..."

# Kill existing servers
echo "Stopping existing servers..."
kill $(lsof -t -i:8000) 2>/dev/null || true
kill $(lsof -t -i:3000) 2>/dev/null || true
sleep 2

# Start Django server
echo "Starting Django server on port 8000..."
cd /home/winnmedia/VideoPlanet/vridge_back
nohup python3 manage.py runserver 0.0.0.0:8000 --settings=config.settings_dev > django.log 2>&1 &
echo "Django server PID: $!"

# Start React server
echo "Starting React server on port 3000..."
cd /home/winnmedia/VideoPlanet/vridge_front
nohup npm start > react.log 2>&1 &
echo "React server PID: $!"

echo ""
echo "Servers started!"
echo "Django: http://localhost:8000"
echo "React: http://localhost:3000"
echo ""
echo "To stop servers, run: ./stop_servers.sh"