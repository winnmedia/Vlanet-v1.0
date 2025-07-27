#!/bin/bash

# VideoPlanet 배포 헬스체크 스크립트
# 2025-01-27

echo "=== VideoPlanet 배포 헬스체크 시작 ==="
echo "시작 시간: $(date)"
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프론트엔드 URL
FRONTEND_URLS=(
    "https://vlanet.net"
    "https://videoplanetready.vercel.app"
)

# 백엔드 URL
BACKEND_URL="https://videoplanet.up.railway.app"

# 1. 프론트엔드 헬스체크
echo "1. 프론트엔드 헬스체크"
echo "------------------------"
for url in "${FRONTEND_URLS[@]}"; do
    echo -n "검사 중: $url ... "
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 304 ]; then
        echo -e "${GREEN}✓ 정상 (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${RED}✗ 오류 (HTTP $HTTP_STATUS)${NC}"
    fi
done
echo ""

# 2. 백엔드 API 헬스체크
echo "2. 백엔드 API 헬스체크"
echo "------------------------"
echo -n "기본 헬스체크 (/api/health/): "
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health/")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✓ 정상${NC}"
else
    echo -e "${RED}✗ 오류${NC}"
fi

echo -n "데이터베이스 연결: "
DB_STATUS=$(curl -s "$BACKEND_URL/api/health/db/" -w "\n%{http_code}" | tail -n1)
if [ "$DB_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ 정상${NC}"
else
    echo -e "${YELLOW}⚠ 확인 필요 (HTTP $DB_STATUS)${NC}"
fi
echo ""

# 3. 주요 API 엔드포인트 테스트
echo "3. 주요 API 엔드포인트 테스트"
echo "------------------------------"
API_ENDPOINTS=(
    "/api/projects/"
    "/api/users/login/"
    "/api/feedbacks/"
    "/api/video-planning/"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    echo -n "테스트: $endpoint ... "
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL$endpoint")
    
    if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 401 ] || [ "$HTTP_STATUS" -eq 405 ]; then
        echo -e "${GREEN}✓ 접근 가능 (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${RED}✗ 오류 (HTTP $HTTP_STATUS)${NC}"
    fi
done
echo ""

# 4. CORS 설정 확인
echo "4. CORS 설정 확인"
echo "-----------------"
echo -n "프론트엔드 → 백엔드 CORS: "
CORS_HEADER=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/projects/" \
    -H "Origin: https://vlanet.net" \
    -H "Access-Control-Request-Method: GET" | grep -i "access-control-allow-origin")

if echo "$CORS_HEADER" | grep -q "vlanet.net"; then
    echo -e "${GREEN}✓ 정상${NC}"
else
    echo -e "${RED}✗ CORS 설정 확인 필요${NC}"
fi
echo ""

# 5. 성능 측정
echo "5. 응답 시간 측정"
echo "-----------------"
FRONTEND_TIME=$(curl -o /dev/null -s -w "%{time_total}\n" "https://vlanet.net")
BACKEND_TIME=$(curl -o /dev/null -s -w "%{time_total}\n" "$BACKEND_URL/api/health/")

echo "프론트엔드 응답 시간: ${FRONTEND_TIME}초"
echo "백엔드 API 응답 시간: ${BACKEND_TIME}초"
echo ""

# 6. 결과 요약
echo "=== 헬스체크 결과 요약 ==="
echo "완료 시간: $(date)"
echo ""
echo "배포가 완료되었습니다. 위의 결과를 확인하여 모든 서비스가 정상 작동하는지 검증하세요."
echo ""
echo "추가 확인 사항:"
echo "- Vercel 대시보드: https://vercel.com/dashboard"
echo "- Railway 대시보드: https://railway.app/dashboard"
echo "- 실제 사용자 테스트 수행 권장"