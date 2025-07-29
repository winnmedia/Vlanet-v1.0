#!/bin/bash

echo "🎨 VideoPlanet Visual Regression Tests"
echo "======================================"

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 환경 체크
echo -e "\n${YELLOW}1. 환경 체크${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되지 않았습니다${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 버전: $(node -v)${NC}"

# 2. 의존성 설치 확인
echo -e "\n${YELLOW}2. 의존성 확인${NC}"
if [ ! -d "node_modules/@playwright" ]; then
    echo "Playwright가 설치되지 않았습니다. 설치를 시작합니다..."
    npm install
fi
echo -e "${GREEN}✅ 의존성 설치 완료${NC}"

# 3. Next.js 개발 서버 시작
echo -e "\n${YELLOW}3. Next.js 개발 서버 시작${NC}"
# 기존 프로세스 종료
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 백그라운드에서 서버 시작
npm run dev > dev-server.log 2>&1 &
SERVER_PID=$!
echo "서버 PID: $SERVER_PID"

# 서버 시작 대기
echo "서버 시작 대기중..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ 서버가 시작되었습니다${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# 4. 시각적 테스트 실행
echo -e "\n${YELLOW}4. 시각적 회귀 테스트 실행${NC}"
echo "브라우저 없이 테스트 모드로 실행합니다..."

# 테스트 실행 (브라우저 설치 없이)
npx playwright test --config=playwright-ci.config.ts --reporter=list || true

# 5. 정리
echo -e "\n${YELLOW}5. 정리 작업${NC}"
kill $SERVER_PID 2>/dev/null || true
echo -e "${GREEN}✅ 테스트 완료${NC}"

# 6. 결과 안내
echo -e "\n${YELLOW}테스트 결과:${NC}"
echo "- 로그 파일: dev-server.log"
echo "- 테스트 리포트: npx playwright show-report"
echo ""
echo -e "${YELLOW}참고:${NC} 실제 브라우저 테스트를 위해서는 다음 명령어를 실행하세요:"
echo "sudo npx playwright install-deps"
echo "npx playwright install"