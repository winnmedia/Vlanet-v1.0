#!/bin/bash
# VideoPlanet 백업 정리 스크립트
# 작성일: 2025-08-01

echo "🧹 VideoPlanet 백업 정리 시작..."
echo "================================"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 현재 날짜
TODAY=$(date +%Y%m%d)

# 1. 현재 백업 현황 표시
echo -e "\n${YELLOW}📊 현재 백업 현황:${NC}"
echo "대용량 백업 파일:"
ls -lh *.tar.gz 2>/dev/null | grep backup || echo "백업 파일 없음"

echo -e "\n백업 디렉토리:"
ls -d *backup* 2>/dev/null || echo "백업 디렉토리 없음"

# 2. 전체 백업 용량 계산
echo -e "\n${YELLOW}💾 전체 백업 용량:${NC}"
TOTAL_SIZE=$(du -ch *backup* 2>/dev/null | grep total | awk '{print $1}')
echo "총 용량: ${TOTAL_SIZE:-0}"

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
echo -e "\n${YELLOW}🗑️  정리 대상:${NC}"
echo "1. 중복된 UI 백업 디렉토리:"
ls -d ui_backup_* 2>/dev/null || echo "  없음"

echo -e "\n2. 오래된 백업 파일 (2주 이상):"
find . -name "*backup*.tar.gz" -mtime +14 -type f 2>/dev/null | head -10 || echo "  없음"

echo -e "\n3. 임시 백업 디렉토리:"
ls -d vridge_front_backup_0722 vridge_front_backup_20250723 2>/dev/null || echo "  없음"

# 5. 사용자 확인
echo -e "\n${RED}⚠️  경고: 이 작업은 되돌릴 수 없습니다!${NC}"
echo "정리를 시작하시겠습니까? (yes/no)"
read -r confirm

if [[ "$confirm" != "yes" ]]; then
    echo "정리 취소됨"
    exit 0
fi

# 6. 백업 아카이브 생성
echo -e "\n${YELLOW}📦 오래된 백업 아카이브 생성...${NC}"
mkdir -p archived_backups

# 오래된 백업들을 아카이브로 이동
if ls vridge_front_backup_20250716*.tar.gz 1> /dev/null 2>&1; then
    echo "오래된 백업 파일들을 아카이브로 이동 중..."
    tar -czf "archived_backups/old_backups_${TODAY}.tar.gz" \
        vridge_front_backup_20250716*.tar.gz \
        vridge_front_backup_20250722*.tar.gz 2>/dev/null && \
    echo -e "${GREEN}✅ 아카이브 생성 완료${NC}" || \
    echo -e "${RED}❌ 아카이브 생성 실패${NC}"
fi

# 7. 정리 실행
echo -e "\n${YELLOW}🧹 정리 시작...${NC}"

# 정리 로그 파일
LOG_FILE="backup_cleanup_${TODAY}.log"
echo "백업 정리 로그 - $(date)" > "$LOG_FILE"

# 중복 UI 백업 삭제
echo "중복 UI 백업 삭제 중..."
for dir in ui_backup_20250730_*; do
    if [[ -d "$dir" ]]; then
        echo "삭제: $dir" | tee -a "$LOG_FILE"
        rm -rf "$dir"
    fi
done

# 오래된 백업 파일 삭제 (아카이브된 것들)
echo -e "\n오래된 백업 파일 삭제 중..."
if [[ -f "archived_backups/old_backups_${TODAY}.tar.gz" ]]; then
    # 아카이브가 성공적으로 생성된 경우에만 원본 삭제
    rm -f vridge_front_backup_20250716*.tar.gz 2>/dev/null && \
    echo "삭제: vridge_front_backup_20250716*.tar.gz" | tee -a "$LOG_FILE"
    
    rm -f vridge_front_backup_20250722*.tar.gz 2>/dev/null && \
    echo "삭제: vridge_front_backup_20250722*.tar.gz" | tee -a "$LOG_FILE"
fi

# 임시 백업 디렉토리 삭제
echo -e "\n임시 백업 디렉토리 확인 중..."
echo "vridge_front_backup_0722와 vridge_front_backup_20250723를 삭제하시겠습니까? (y/N)"
read -r temp_confirm
if [[ "$temp_confirm" =~ ^[Yy]$ ]]; then
    rm -rf vridge_front_backup_0722 2>/dev/null && \
    echo "삭제: vridge_front_backup_0722" | tee -a "$LOG_FILE"
    
    rm -rf vridge_front_backup_20250723 2>/dev/null && \
    echo "삭제: vridge_front_backup_20250723" | tee -a "$LOG_FILE"
fi

# 8. 결과 표시
echo -e "\n${GREEN}✅ 정리 완료!${NC}"
echo -e "\n${YELLOW}📊 정리 후 현황:${NC}"
echo "남은 백업 파일:"
ls -lh *backup*.tar.gz 2>/dev/null | grep -v archived || echo "없음"

echo -e "\n남은 백업 디렉토리:"
ls -d *backup* 2>/dev/null | grep -v archived || echo "없음"

# 정리 후 용량
NEW_SIZE=$(du -ch *backup* 2>/dev/null | grep total | awk '{print $1}')
echo -e "\n${YELLOW}💾 정리 후 백업 용량:${NC} ${NEW_SIZE:-0}"
echo -e "${YELLOW}📝 정리 로그:${NC} $LOG_FILE"

echo -e "\n${GREEN}🎉 백업 정리가 완료되었습니다!${NC}"
echo "보존된 백업:"
echo "- 최신 백업: vridge_front_backup_20250728_*.tar.gz"
echo "- 현재 백업: vridge_front_current_backup/"
echo "- 아카이브: archived_backups/"