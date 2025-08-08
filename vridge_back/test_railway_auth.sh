#!/bin/bash

echo "Railway 인증 엔드포인트 테스트"
echo "================================"

BASE_URL="https://videoplanet.up.railway.app"

echo ""
echo "1. 디버그 엔드포인트 확인"
echo "------------------------"
curl -s "$BASE_URL/api/debug/auth-status/" | python3 -m json.tool

echo ""
echo "2. Login 엔드포인트 테스트"
echo "------------------------"
curl -X POST "$BASE_URL/api/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "3. Signup 엔드포인트 테스트"
echo "------------------------"
curl -X POST "$BASE_URL/api/auth/signup/" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","nickname":"newuser","password":"Test123!@#"}' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "4. URL 매핑 확인"
echo "------------------------"
curl -s "$BASE_URL/api/debug/urls/" | python3 -m json.tool | head -30