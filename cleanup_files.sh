#!/bin/bash
# VideoPlanet 파일 정리 스크립트
# 작성일: 2025-08-01

echo "🧹 VideoPlanet 파일 정리 시작..."
echo "================================"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 현재 날짜
TODAY=$(date +%Y%m%d_%H%M%S)

# 1. 현재 상황 표시
echo -e "\n${YELLOW}📊 현재 파일 현황:${NC}"
echo "테스트/디버그 파일 수: $(find vridge_back -name "test_*.py" -o -name "debug_*.py" -o -name "fix_*.py" -o -name "create_test_*.py" | wc -l)"
echo "중복 설정 파일 수: $(ls vridge_back/config/settings_*.py 2>/dev/null | wc -l)"
echo "로그 파일 수: $(ls vridge_back/*.log 2>/dev/null | wc -l)"

# 2. 백업 디렉토리 생성
BACKUP_DIR="archived_cleanup_${TODAY}"
echo -e "\n${YELLOW}📦 백업 디렉토리 생성: ${BACKUP_DIR}${NC}"
mkdir -p "$BACKUP_DIR"

# 3. 안전 확인
echo -e "\n${YELLOW}🔒 안전 확인:${NC}"
# Git 상태 확인
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${GREEN}✅ Git 작업 디렉토리 깨끗함${NC}"
else
    echo -e "${RED}⚠️  커밋되지 않은 변경사항이 있습니다!${NC}"
    echo "정리를 계속하시겠습니까? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "정리 취소됨"
        exit 1
    fi
fi

# 4. 정리 대상 표시
echo -e "\n${YELLOW}🗑️  정리 대상 파일들:${NC}"
echo -e "\n1. 테스트/디버그 파일들:"
find vridge_back -name "test_*.py" -o -name "debug_*.py" -o -name "fix_*.py" -o -name "create_test_*.py" | head -10
echo "... 외 $(find vridge_back -name "test_*.py" -o -name "debug_*.py" -o -name "fix_*.py" -o -name "create_test_*.py" | wc -l)개"

echo -e "\n2. 중복 설정 파일들:"
ls vridge_back/config/settings_{minimal,railway*,simple}.py 2>/dev/null || echo "없음"

echo -e "\n3. 로그 파일들:"
ls vridge_back/*.log 2>/dev/null | head -5 || echo "없음"

# 5. 사용자 확인
echo -e "\n${RED}⚠️  경고: 이 작업은 되돌릴 수 없습니다!${NC}"
echo "위 파일들을 정리하시겠습니까? (yes/no)"
read -r confirm

if [[ "$confirm" != "yes" ]]; then
    echo "정리 취소됨"
    exit 0
fi

# 6. 파일 이동 및 삭제
echo -e "\n${YELLOW}🧹 파일 정리 시작...${NC}"

# 로그 파일
LOG_FILE="cleanup_files_${TODAY}.log"
echo "파일 정리 로그 - $(date)" > "$LOG_FILE"

# 테스트/디버그 파일들 이동
echo -e "\n테스트/디버그 파일 이동 중..."
find vridge_back -name "test_*.py" -o -name "debug_*.py" -o -name "fix_*.py" -o -name "create_test_*.py" | while read -r file; do
    echo "이동: $file" | tee -a "$LOG_FILE"
    mv "$file" "$BACKUP_DIR/" 2>/dev/null
done

# 중복 설정 파일들 이동
echo -e "\n중복 설정 파일 이동 중..."
for file in vridge_back/config/settings_{minimal,railway,railway_simple,railway_standalone}.py; do
    if [[ -f "$file" ]]; then
        echo "이동: $file" | tee -a "$LOG_FILE"
        mv "$file" "$BACKUP_DIR/"
    fi
done

# settings 하위 디렉토리 이동
if [[ -d "vridge_back/config/settings" ]]; then
    echo "이동: vridge_back/config/settings/" | tee -a "$LOG_FILE"
    mv "vridge_back/config/settings" "$BACKUP_DIR/"
fi

# 임시 스크립트 이동
for file in vridge_back/{start_emergency.sh,run_local_debug.sh}; do
    if [[ -f "$file" ]]; then
        echo "이동: $file" | tee -a "$LOG_FILE"
        mv "$file" "$BACKUP_DIR/"
    fi
done

# 로그 파일 이동
echo -e "\n로그 파일 이동 중..."
for file in vridge_back/*.log; do
    if [[ -f "$file" ]]; then
        echo "이동: $file" | tee -a "$LOG_FILE"
        mv "$file" "$BACKUP_DIR/"
    fi
done

# test_results 디렉토리 이동
if [[ -d "vridge_back/test_results" ]]; then
    echo "이동: vridge_back/test_results/" | tee -a "$LOG_FILE"
    mv "vridge_back/test_results" "$BACKUP_DIR/"
fi

# scripts/tests 디렉토리 이동
if [[ -d "vridge_back/scripts/tests" ]]; then
    echo "이동: vridge_back/scripts/tests/" | tee -a "$LOG_FILE"
    mv "vridge_back/scripts/tests" "$BACKUP_DIR/"
fi

# 오래된 문서 아카이브 생성
echo -e "\n오래된 문서 아카이브 중..."
mkdir -p "$BACKUP_DIR/old_docs"
for doc in vridge_back/{CORS_SETUP_GUIDE.md,EMAIL_SETUP_GUIDE.md,DEMO_ACCOUNTS.md,TEST_PROJECTS.md,CRITICAL_FIXES_NEEDED.md,PROJECT_CREATION_ISSUES.md,URGENT_MIGRATION_NOW.md}; do
    if [[ -f "$doc" ]]; then
        echo "아카이브: $doc" | tee -a "$LOG_FILE"
        mv "$doc" "$BACKUP_DIR/old_docs/"
    fi
done

# 7. 백업 압축
echo -e "\n${YELLOW}📦 백업 압축 중...${NC}"
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR" && rm -rf "$BACKUP_DIR"

# 8. 결과 표시
echo -e "\n${GREEN}✅ 정리 완료!${NC}"
echo -e "\n${YELLOW}📊 정리 결과:${NC}"
echo "남은 설정 파일:"
ls vridge_back/config/settings_*.py 2>/dev/null || echo "없음"

echo -e "\n보존된 핵심 파일:"
echo "- settings_base.py, settings_fixed.py, settings_dev.py"
echo "- start.sh, start_improved.sh, start_emergency_fix.sh"
echo "- emergency_server.py"
echo "- RAILWAY_ENV_GUIDE.md"

echo -e "\n${YELLOW}📝 정리 로그:${NC} $LOG_FILE"
echo -e "${YELLOW}📦 백업 파일:${NC} ${BACKUP_DIR}.tar.gz"

echo -e "\n${GREEN}🎉 파일 정리가 완료되었습니다!${NC}"
echo "프로젝트가 더 깔끔해졌습니다."