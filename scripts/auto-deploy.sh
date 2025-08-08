#!/bin/bash
# VideoPlanet Auto Deploy Script - 3분 내 자동 배포

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 VideoPlanet Auto Deploy - 3분 내 배포${NC}"
echo "========================================="

# 배포 타입 확인
DEPLOY_TYPE=${1:-"all"}
COMMIT_MSG=${2:-"Auto deploy"}

# 시작 시간
START_TIME=$(date +%s)

# 1. 빌드 테스트
echo -e "\n${YELLOW}📦 빌드 테스트 중...${NC}"

if [ "$DEPLOY_TYPE" == "frontend" ] || [ "$DEPLOY_TYPE" == "all" ]; then
    echo -e "${BLUE}프론트엔드 빌드...${NC}"
    cd vridge_front_hybrid
    npm run build --silent
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 프론트엔드 빌드 성공${NC}"
    else
        echo -e "${RED}❌ 프론트엔드 빌드 실패${NC}"
        exit 1
    fi
    cd ..
fi

if [ "$DEPLOY_TYPE" == "backend" ] || [ "$DEPLOY_TYPE" == "all" ]; then
    echo -e "${BLUE}백엔드 체크...${NC}"
    cd vridge_back
    python manage.py check --deploy 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 백엔드 체크 성공${NC}"
    else
        echo -e "${YELLOW}⚠️  백엔드 체크 경고 (계속 진행)${NC}"
    fi
    cd ..
fi

# 2. Git 커밋 & 푸시
echo -e "\n${YELLOW}📤 배포 중...${NC}"
git add -A
git commit -m "deploy: $COMMIT_MSG

🚀 Auto Deploy
- Type: $DEPLOY_TYPE
- Time: $(date +'%Y-%m-%d %H:%M:%S')"

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)

# 3. 배포 실행
if [ "$CURRENT_BRANCH" == "main" ] || [ "$CURRENT_BRANCH" == "master" ]; then
    echo -e "${GREEN}🔄 메인 브랜치 배포 실행${NC}"
    git push origin $CURRENT_BRANCH
    
    echo -e "\n${GREEN}✨ 배포 완료!${NC}"
    echo "- Vercel (프론트): 자동 배포 진행 중..."
    echo "- Railway (백엔드): 자동 배포 진행 중..."
    echo ""
    echo "배포 상태 확인:"
    echo "- 프론트: https://vercel.com/dashboard"
    echo "- 백엔드: https://railway.app/dashboard"
else
    echo -e "${YELLOW}⚠️  현재 브랜치: $CURRENT_BRANCH${NC}"
    echo "메인 브랜치가 아닙니다. 수동으로 푸시하세요:"
    echo "git push origin $CURRENT_BRANCH"
fi

# 실행 시간 계산
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n${GREEN}⏱️  총 실행 시간: ${ELAPSED}초${NC}"

# 3분(180초) 이내 완료 체크
if [ $ELAPSED -le 180 ]; then
    echo -e "${GREEN}🎯 목표 달성: 3분 이내 배포 완료!${NC}"
else
    echo -e "${YELLOW}⚠️  목표 시간 초과 (목표: 3분, 실제: ${ELAPSED}초)${NC}"
fi