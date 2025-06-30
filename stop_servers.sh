#!/bin/bash
# VideoPlanet 서버 중지 스크립트

echo "Stopping VideoPlanet servers..."

# Kill Django server
echo "Stopping Django server (port 8000)..."
kill $(lsof -t -i:8000) 2>/dev/null || echo "Django server not running"

# Kill React server
echo "Stopping React server (port 3000)..."
kill $(lsof -t -i:3000) 2>/dev/null || echo "React server not running"

# Kill any remaining node processes
pkill -f "react-scripts start" 2>/dev/null || true

echo ""
echo "All servers stopped!"