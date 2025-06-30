#!/bin/bash
# 서버 상태 확인 스크립트

echo "========================================"
echo "VideoPlanet Server Status Check"
echo "========================================"
echo ""

# Check Django server
if lsof -i:8000 > /dev/null 2>&1; then
    echo "✓ Django server: RUNNING (port 8000)"
else
    echo "✗ Django server: NOT RUNNING"
fi

# Check React server  
if lsof -i:3000 > /dev/null 2>&1; then
    echo "✓ React server: RUNNING (port 3000)"
else
    echo "✗ React server: NOT RUNNING"
fi

echo ""
echo "========================================"
echo "Process Details:"
echo "========================================"
echo ""

echo "Python processes:"
ps aux | grep -E "python.*manage.py" | grep -v grep || echo "No Django process found"

echo ""
echo "Node processes:"
ps aux | grep -E "node.*react-scripts" | grep -v grep || echo "No React process found"

echo ""
echo "========================================"
echo "Memory Usage:"
echo "========================================"
free -h

echo ""
echo "========================================"
echo "Disk Usage:"
echo "========================================"
df -h | grep -E "^/dev/"