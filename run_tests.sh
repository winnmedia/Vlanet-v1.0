#!/bin/bash

# VideoPlanet 통합 테스트 실행 스크립트
# Q, The Gatekeeper of Truth

echo "=========================================="
echo "VideoPlanet 통합 테스트 시작"
echo "Q, The Gatekeeper of Truth"
echo "=========================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 테스트 결과 저장
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 로그 파일
LOG_FILE="test_results_$(date +%Y%m%d_%H%M%S).log"

# 테스트 함수
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${BLUE}[테스트]${NC} $test_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" >> "$LOG_FILE" 2>&1; then
        echo -e "${GREEN}✓ 통과${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ 실패${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 1. 환경 확인
echo -e "${YELLOW}[환경 확인]${NC}"

# Node.js 확인
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "Node.js: ${GREEN}$NODE_VERSION${NC}"
else
    echo -e "Node.js: ${RED}설치되지 않음${NC}"
    exit 1
fi

# Python 확인
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "Python: ${GREEN}$PYTHON_VERSION${NC}"
else
    echo -e "Python: ${RED}설치되지 않음${NC}"
    exit 1
fi

echo ""

# 2. 의존성 설치 확인
echo -e "${YELLOW}[의존성 확인]${NC}"

# 프론트엔드 의존성
if [ -d "vridge_front/node_modules" ]; then
    echo -e "프론트엔드 패키지: ${GREEN}설치됨${NC}"
else
    echo -e "프론트엔드 패키지: ${YELLOW}설치 중...${NC}"
    cd vridge_front && npm install && cd ..
fi

# Puppeteer 설치 확인
if ! npm list puppeteer &> /dev/null; then
    echo -e "Puppeteer: ${YELLOW}설치 중...${NC}"
    cd vridge_front && npm install --save-dev puppeteer chai && cd ..
fi

# Python 패키지 확인
if ! python3 -c "import requests" &> /dev/null; then
    echo -e "Python requests: ${YELLOW}설치 중...${NC}"
    pip3 install requests
fi

echo ""

# 3. 정적 코드 분석
echo -e "${YELLOW}[정적 코드 분석]${NC}"

# ESLint 실행 (설치되어 있는 경우)
if command -v eslint &> /dev/null; then
    run_test "ESLint 검사" "cd vridge_front && npx eslint src --ext .js,.jsx"
else
    echo -e "${YELLOW}ESLint가 설치되지 않음 - 건너뜀${NC}"
fi

# console.log 검사
run_test "console.log 검사" "! grep -r 'console\.log' vridge_front/src --include='*.js' --include='*.jsx' | grep -v '// console.log'"

# 민감 정보 검사
run_test "민감 정보 노출 검사" "! grep -r -i 'password\|secret\|key\|token' vridge_front/src --include='*.js' --include='*.jsx' | grep -v -E '(passwordInput|secretKey|localStorage)'"

echo ""

# 4. 프론트엔드 통합 테스트
echo -e "${YELLOW}[프론트엔드 통합 테스트]${NC}"

# 빌드 테스트
run_test "Next.js 빌드" "cd vridge_front && npm run build"

# Puppeteer 테스트 실행
if [ -f "vridge_front/integration-tests.js" ]; then
    run_test "UI 통합 테스트" "cd vridge_front && node integration-tests.js"
else
    echo -e "${RED}integration-tests.js 파일이 없음${NC}"
fi

echo ""

# 5. 백엔드 API 테스트
echo -e "${YELLOW}[백엔드 API 테스트]${NC}"

# Django 마이그레이션 체크
run_test "Django 마이그레이션 확인" "cd vridge_back && python manage.py migrate --check"

# API 테스트 실행
if [ -f "vridge_back/api_tests.py" ]; then
    run_test "API 통합 테스트" "cd vridge_back && python api_tests.py"
else
    echo -e "${RED}api_tests.py 파일이 없음${NC}"
fi

echo ""

# 6. 성능 테스트
echo -e "${YELLOW}[성능 테스트]${NC}"

# 번들 크기 확인
if [ -d "vridge_front/.next" ]; then
    BUNDLE_SIZE=$(du -sh vridge_front/.next | cut -f1)
    echo -e "번들 크기: ${BLUE}$BUNDLE_SIZE${NC}"
    
    # 크기가 너무 큰지 확인 (예: 50MB 이상)
    SIZE_IN_MB=$(du -sm vridge_front/.next | cut -f1)
    if [ $SIZE_IN_MB -gt 50 ]; then
        echo -e "${YELLOW}⚠️  번들 크기가 큽니다 (${SIZE_IN_MB}MB)${NC}"
    fi
fi

echo ""

# 7. 보안 검사
echo -e "${YELLOW}[보안 검사]${NC}"

# npm audit
run_test "npm 보안 감사" "cd vridge_front && npm audit --audit-level=high"

# 하드코딩된 URL 검사
run_test "하드코딩된 URL 검사" "! grep -r 'http://localhost' vridge_front/src --include='*.js' --include='*.jsx'"

echo ""

# 8. 테스트 결과 요약
echo "=========================================="
echo -e "${YELLOW}테스트 결과 요약${NC}"
echo "=========================================="
echo -e "총 테스트: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "통과: ${GREEN}$PASSED_TESTS${NC}"
echo -e "실패: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Zero-Defect 상태 달성!${NC}"
    echo -e "${GREEN}모든 테스트가 통과했습니다.${NC}"
    EXIT_CODE=0
else
    echo ""
    echo -e "${RED}❌ 결함 발견!${NC}"
    echo -e "${RED}$FAILED_TESTS개의 테스트가 실패했습니다.${NC}"
    echo -e "${YELLOW}상세 내용은 $LOG_FILE 파일을 확인하세요.${NC}"
    EXIT_CODE=1
fi

echo "=========================================="
echo ""

# 테스트 보고서 생성
echo -e "${BLUE}[테스트 보고서 생성]${NC}"
cat > test_summary.json << EOF
{
  "test_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_tests": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "pass_rate": $(awk "BEGIN {printf \"%.1f\", $PASSED_TESTS/$TOTAL_TESTS*100}"),
  "log_file": "$LOG_FILE"
}
EOF

echo -e "테스트 요약이 ${BLUE}test_summary.json${NC}에 저장되었습니다."
echo ""

exit $EXIT_CODE