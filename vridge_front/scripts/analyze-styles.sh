#!/bin/bash

echo "🔍 VideoPlanet 스타일 분석 도구"
echo "================================"

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. SCSS 파일 통계
echo -e "\n${YELLOW}1. SCSS 파일 통계${NC}"
TOTAL_SCSS=$(find src -name "*.scss" | wc -l)
TOTAL_CSS_MODULES=$(find src -name "*.module.scss" | wc -l)
TOTAL_GLOBAL=$(find src -name "*.scss" ! -name "*.module.scss" | wc -l)

echo -e "총 SCSS 파일: ${BLUE}$TOTAL_SCSS${NC}개"
echo -e "CSS Modules: ${GREEN}$TOTAL_CSS_MODULES${NC}개"
echo -e "전역 스타일: ${RED}$TOTAL_GLOBAL${NC}개"

# 2. 중복 가능성이 높은 파일들
echo -e "\n${YELLOW}2. 중복 가능성 높은 파일들${NC}"
echo -e "\n${BLUE}버튼 관련:${NC}"
find src -name "*.scss" | grep -i button | sort

echo -e "\n${BLUE}레이아웃 관련:${NC}"
find src -name "*.scss" | grep -i layout | sort

echo -e "\n${BLUE}피드백 관련:${NC}"
find src -name "*.scss" | grep -i feedback | sort

# 3. 파일 크기 분석
echo -e "\n${YELLOW}3. 큰 SCSS 파일 (상위 10개)${NC}"
find src -name "*.scss" -exec ls -lh {} \; | sort -k5 -hr | head -10 | awk '{print $5 "\t" $9}'

# 4. import 분석
echo -e "\n${YELLOW}4. 가장 많이 import되는 파일${NC}"
grep -h "@import\|@use" src/**/*.scss 2>/dev/null | sort | uniq -c | sort -nr | head -10

# 5. 하드코딩된 값 찾기
echo -e "\n${YELLOW}5. 하드코딩된 값 분석${NC}"

echo -e "\n${BLUE}하드코딩된 색상:${NC}"
grep -E "#[0-9a-fA-F]{3,6}" src/**/*.scss | grep -v "design-tokens\|variables" | wc -l
echo "개 발견"

echo -e "\n${BLUE}하드코딩된 픽셀 값:${NC}"
grep -E "[0-9]+px" src/**/*.scss | grep -v "design-tokens\|variables" | wc -l
echo "개 발견"

# 6. !important 사용
echo -e "\n${YELLOW}6. !important 사용 현황${NC}"
IMPORTANT_COUNT=$(grep -r "!important" src/**/*.scss | wc -l)
echo -e "${RED}$IMPORTANT_COUNT${NC}개 발견"

if [ $IMPORTANT_COUNT -gt 0 ]; then
  echo -e "\n상위 5개 파일:"
  grep -r "!important" src/**/*.scss | cut -d: -f1 | sort | uniq -c | sort -nr | head -5
fi

# 7. 미사용 가능성 높은 파일
echo -e "\n${YELLOW}7. 미사용 가능성 높은 파일${NC}"
echo "다음 패턴의 파일들은 임시/백업 파일일 가능성이 있습니다:"
find src -name "*.scss" | grep -E "old|backup|temp|test|copy" | sort

# 8. 컴포넌트별 스타일 의존성
echo -e "\n${YELLOW}8. 컴포넌트별 스타일 import 샘플${NC}"
echo "Login 컴포넌트:"
grep -h "import.*\.scss\|import.*\.css" src/page/User/Login* 2>/dev/null | head -5

echo -e "\nFeedback 컴포넌트:"
grep -h "import.*\.scss\|import.*\.css" src/page/Cms/Feedback* 2>/dev/null | head -5

# 9. 권장사항
echo -e "\n${YELLOW}9. 권장사항${NC}"
echo "1. 중복 파일 통합: 버튼 관련 ${RED}12개${NC} → ${GREEN}1개${NC}"
echo "2. 레이아웃 파일 통합: ${RED}15개${NC} → ${GREEN}3개${NC}"
echo "3. 피드백 페이지 스타일: ${RED}20개${NC} → ${GREEN}5개${NC}"
echo "4. !important 제거: ${RED}$IMPORTANT_COUNT개${NC} → ${GREEN}0개${NC}"
echo "5. 디자인 토큰 활용: 하드코딩된 값 변수화"

# 10. 다음 단계
echo -e "\n${YELLOW}10. 다음 단계${NC}"
echo "1. 이 분석 결과를 바탕으로 중복 파일 목록 작성"
echo "2. 각 컴포넌트의 실제 스타일 의존성 확인"
echo "3. 단계별 통합 계획 수립"
echo "4. 시각적 회귀 테스트로 변경사항 검증"