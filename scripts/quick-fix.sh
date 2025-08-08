#!/bin/bash
# VideoPlanet Quick Fix Script - 5분 내 버그 수정 자동화

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 VideoPlanet Quick Fix - 5분 내 자동 수정${NC}"
echo "=================================="

# 1. 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}현재 브랜치:${NC} $CURRENT_BRANCH"

# 2. 변경사항 확인
if [ -z "$1" ]; then
    echo -e "${RED}❌ 사용법: ./quick-fix.sh '수정 내용 설명'${NC}"
    exit 1
fi

FIX_MESSAGE=$1
echo -e "${GREEN}✅ 수정 내용:${NC} $FIX_MESSAGE"

# 3. 테스트 실행 (프론트엔드)
echo -e "\n${YELLOW}📝 프론트엔드 빌드 테스트 중...${NC}"
cd vridge_front_hybrid
npm run build --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 프론트엔드 빌드 성공${NC}"
else
    echo -e "${RED}❌ 프론트엔드 빌드 실패 - 수정 필요${NC}"
    exit 1
fi
cd ..

# 4. Git 커밋
echo -e "\n${YELLOW}📦 변경사항 커밋 중...${NC}"
git add -A
git commit -m "fix: $FIX_MESSAGE

🚀 Quick Fix 자동 수정
- 실행 시간: $(date +'%Y-%m-%d %H:%M:%S')
- 브랜치: $CURRENT_BRANCH"

# 5. 푸시 (옵션)
echo -e "\n${GREEN}✅ 수정 완료!${NC}"
echo -e "${YELLOW}배포하려면 다음 명령어를 실행하세요:${NC}"
echo "git push origin $CURRENT_BRANCH"

# 실행 시간 표시
END_TIME=$(date +%s)
START_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
echo -e "\n${GREEN}⏱️  총 실행 시간: ${ELAPSED}초${NC}"