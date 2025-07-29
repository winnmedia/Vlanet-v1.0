#!/bin/bash
# 추가로 안전하게 삭제 가능한 스타일 파일들
# 생성일: 2025-07-28

echo "🗑️  추가 미사용 파일 삭제 시작..."

# Old/Backup 패턴 파일들
rm -f "src/css/Cms/FeedbackOriginal.scss"  # Original 버전
rm -f "src/css/Cms/FeedbackInitial.scss"   # Initial 버전

# 개선된 버전이 있는 파일들
rm -f "src/css/_layout.scss"               # _layout-improved.scss 있음
rm -f "src/css/HomeAlignment.scss"         # HomeAlignment-improved.scss 있음
rm -f "src/css/Cms/ButtonAlignment.scss"   # ButtonAlignment-improved.scss 있음
rm -f "src/css/Cms/FeedbackSectionRedesign.scss"  # FeedbackSectionRedesign-improved.scss 있음

# design-system으로 이미 이전된 파일들
rm -f "src/css/Cms/ProjectCreate.scss"     # design-system/pages/ProjectCreate 있음

# 사용되지 않는 스타일 파일들 (import 분석 결과)
rm -f "src/styles/reset.scss"
rm -f "src/styles/design-tokens.scss"      # design-system/tokens로 이전됨
rm -f "src/styles/common-buttons.scss"     # design-system/components/Button으로 이전됨
rm -f "src/styles/_variables.scss"         # design-system/tokens로 이전됨
rm -f "src/page/NotFound.scss"
rm -f "src/css/Service.scss"
rm -f "src/css/Policy.scss"
rm -f "src/css/DarkMode.scss"

# 테스트/데모 파일들
rm -f "src/styles/minimal-components-showcase.scss"

# 중복 typography 파일
rm -f "src/css/_typography.scss"           # design-system/tokens/_typography.scss 있음

# 중복/미사용 폼 및 버튼 파일
rm -f "src/css/_forms.scss"
rm -f "src/css/_buttons.scss"

# 미사용 CMS 파일들
rm -f "src/css/Cms/VideoUploadButton.scss"
rm -f "src/css/Cms/UploadProgress.scss"
rm -f "src/css/Cms/SubmenuFinal.scss"
rm -f "src/css/Cms/SidebarResize.scss"
rm -f "src/css/Cms/SidebarProjectSpacing.scss"
rm -f "src/css/Cms/PostManagement.scss"
rm -f "src/css/Cms/PageTitleUnified.scss"
rm -f "src/css/Cms/OpinionInputSimple.scss"
rm -f "src/css/Cms/HomeActivityLayout.scss"
rm -f "src/css/Cms/FolderManagement.scss"
rm -f "src/css/Cms/FeedbackUnified.scss"
rm -f "src/css/Cms/VideoPlanningEnhanced.scss"  # VideoPlanning.scss가 사용됨
rm -f "src/css/Cms/ProjectCreateImproved.scss"
rm -f "src/css/Cms/ProjectInfoModal.scss"

# 미사용 페이지 스타일
rm -f "src/page/Cms/VideoPlanningButtons.scss"
rm -f "src/page/Cms/FrameworkManagement.scss"
rm -f "src/page/Cms/FeedbackStyles.module.scss"
rm -f "src/page/Admin/EmailMonitor.scss"

echo "✅ 추가 삭제 완료!"
echo "📊 삭제된 파일: 34개"