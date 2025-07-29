#!/bin/bash
# 최종 미사용 파일 정리
# 생성일: 2025-07-28

echo "🗑️  최종 미사용 파일 정리 시작..."

# 미사용 Calendar 관련 파일
rm -f "src/css/Cms/CalendarLayout.scss"
rm -f "src/css/Cms/CalendarResponsive.scss"
rm -f "src/css/Cms/CalendarToolbar.scss"

# 미사용 Button 파일
rm -f "src/css/Cms/ButtonAlignment-improved.scss"

# 미사용 기능 파일
rm -f "src/css/Cms/OpinionInput.scss"
rm -f "src/css/Cms/AIAnalyzeButton.scss"
rm -f "src/css/Cms/AITeacherModal.scss"

# 미사용 모바일 접근성 파일 (design-system/accessibility로 이전됨)
rm -f "src/styles/mobile-accessibility.scss"

# 미사용 글로벌 스타일 (Next.js app에서 사용 안함)
rm -f "src/styles/global.scss"

# 미사용 디자인 시스템 쇼케이스
rm -f "src/styles/minimal-design-system-v2.scss"

# 미사용 Calendar 모달 스타일
rm -f "src/tasks/Calendar/ModalStyle.scss"

echo "✅ 최종 정리 완료!"
echo "📊 삭제된 파일: 11개"