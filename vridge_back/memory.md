# VideoPlanet 프로젝트 구조 및 개발 히스토리

## 프로젝트 구조 (2025-01-27 기준)

```
VideoPlanet/
├── vridge_front/        # React 프론트엔드 (Vercel 배포)
│   └── src/
│       ├── api/         # API 호출 함수
│       ├── page/        # 페이지 컴포넌트
│       └── components/  # 재사용 컴포넌트
└── vridge_back/         # Django 백엔드 (Railway 배포)
    ├── config/          # Django 설정
    ├── users/           # 사용자 관리
    ├── projects/        # 프로젝트 관리
    ├── feedbacks/       # 피드백 시스템
    ├── video_planning/  # 영상 기획
    └── video_analysis/  # 영상 분석
```

## 기술 스택
- **프론트엔드**: React, Next.js, TypeScript
- **백엔드**: Django 4.2, Django REST Framework
- **데이터베이스**: PostgreSQL (Railway)
- **캐시**: Redis
- **배포**: Frontend - Vercel, Backend - Railway
- **파일 저장**: Railway Volume Mount

## 주요 URL 및 엔드포인트
- **프론트엔드**: https://vlanet.net, https://videoplanetready.vercel.app
- **백엔드**: https://videoplanet.up.railway.app
- **API 베이스**: /api/

## 개발 히스토리

### 2025-01-27: 영상 업로드 405 에러 분석 및 해결
**문제**: 프론트엔드에서 영상 업로드 시 405 Method Not Allowed 에러 발생

**분석 결과**:
1. 프론트엔드는 `/api/projects/${projectId}/feedback/upload/`로 POST 요청
2. 백엔드에는 두 개의 업로드 엔드포인트 존재:
   - `POST /api/feedbacks/<int:id>` (feedbacks 앱)
   - `POST /api/projects/<int:project_id>/feedback/upload/` (projects 앱)
3. 405 에러 원인: CORS preflight OPTIONS 요청 처리 누락

**해결 내용**:
1. ProjectFeedbackUpload 뷰에 OPTIONS 메서드 추가
   - CORS preflight 요청을 올바르게 처리하도록 수정
   - Access-Control-Allow-* 헤더 설정
2. 권한 정책 통일
   - projects 앱: 매니저만 업로드 → 모든 멤버 업로드 가능으로 변경
   - feedbacks 앱과 동일한 권한 정책으로 통일
3. 안전한 파일 업로드 구현
   - 파일 크기 제한: 최대 600MB
   - 지원 형식: .mp4, .webm, .ogg, .mov, .avi, .mkv
   - 한글 파일명 안전 처리: UUID 기반 파일명으로 변환

**주요 결정사항**:
- 파일 업로드는 프로젝트 컨텍스트에서 처리 (projects 앱 사용)
- 모든 프로젝트 멤버가 파일 업로드 가능
- CORS preflight 요청 적절히 처리
- 대용량 비디오 파일 및 한글 파일명 지원

### 2025-01-27: 영상기획 페이지 섹션 타이틀 스타일 통일
**요청**: 영상기획 페이지에서 각 섹션의 타이틀 스타일이 일관되지 않은 문제 해결

**분석 결과**:
1. 스토리 전개강도: `<label>` 태그 사용
2. 스토리 전개방식: `<h4>` 태그 사용  
3. 주인공 설정: `<label>` 태그 사용
4. 기획안 제목: 타이틀 없음 (input placeholder만 있음)
5. 기획안 내용: 타이틀 없음 (textarea placeholder만 있음)

**해결 내용**:
1. 모든 섹션에 통일된 `<h4 className="section-title">` 태그 적용
2. 새로운 `.section-title` 클래스 생성:
   - 폰트 크기: 20px
   - 폰트 굵기: 700
   - 색상: #1a1f36
   - 왼쪽 패딩: 16px
   - 그라데이션 왼쪽 보더 장식 추가
3. 기존 개별 섹션의 중복된 타이틀 스타일 제거
4. 기획안 제목과 내용 섹션에 명시적인 타이틀 추가

**주요 결정사항**:
- VideoPlanet 브랜드 가이드라인에 맞춰 일관된 디자인 시스템 적용
- 모든 섹션 타이틀에 동일한 시각적 계층 구조 부여
- 브랜드 컬러를 활용한 그라데이션 액센트로 시각적 통일성 강화

### 2025-01-27: 프론트엔드 및 백엔드 배포 실행
**요청**: VideoPlanet 프로젝트의 프론트엔드와 백엔드 배포

**핵심 해결책**:
1. 변경사항 커밋 및 푸시 완료 (커밋: 6f316ae, 97ee35d)
2. 프론트엔드: 17개 UI/UX 개선사항 반영
3. 백엔드: 영상 업로드 API 수정, 게스트 피드백 기능 추가

**배포 결과**:
1. **백엔드 (Railway)**: ✅ 성공
   - API Health: 정상 작동
   - CORS 설정: 정상
   - 응답 시간: 0.44초
   - 주요 엔드포인트 접근 가능

2. **프론트엔드 (Vercel)**: ⚠️ 확인 필요
   - vlanet.net: 307 리다이렉트
   - videoplanetready.vercel.app: 404 에러
   - Vercel 대시보드에서 프로젝트 설정 확인 필요

**주요 결정사항 및 근거**:
- vercel.json을 vridge_front 디렉토리에 배치 (루트가 아닌)
- 모든 변경사항을 한 번에 배포하여 일관성 유지
- 헬스체크 스크립트 작성으로 배포 상태 자동 검증

**후속 조치 필요**:
- Vercel 대시보드에서 프로젝트 설정 확인
- 도메인 연결 상태 점검
- 프론트엔드 빌드 로그 확인

### 2025-01-27: 영상기획 PDF 내보내기 기능 수정
**문제**: 영상기획 페이지의 PDF 내보내기 기능이 작동하지 않음

**분석 결과**:
1. 프론트엔드는 GET 요청으로 `/api/video-planning/export/pdf/${planningId}/` 호출
2. 백엔드는 POST 요청으로 planning_data를 받도록 구현되어 있었음
3. URL 패턴과 요청 방식의 불일치로 인한 문제

**해결 내용**:
1. 새로운 GET 엔드포인트 추가: `export_planning_to_pdf`
   - planning_id를 URL 파라미터로 받아 처리
   - 사용자의 기획만 접근 가능하도록 권한 검증
   - VideoPlanningSerializer를 사용하여 데이터 직렬화
2. URL 패턴 추가: `export/pdf/<int:planning_id>/`
3. 기존 POST 방식 엔드포인트는 유지 (하위 호환성)

**주요 결정사항**:
- RESTful API 원칙에 따라 GET 방식으로 리소스 조회 및 다운로드
- 권한 검증을 통한 보안 강화
- 기존 코드와의 호환성 유지

### 2025-01-27: 프로젝트 진행 현황 섹션 리디자인
**요청**: 전체일정/프로젝트관리 페이지의 프로젝트 진행 현황 섹션을 미니멀하고 세련되게 리디자인

**해결 내용**:
1. 헤더 섹션 개선
   - 깔끔한 타이틀과 필터 탭 UI 추가
   - 전체/진행중/지연 필터로 프로젝트 분류
   - 각 필터에 프로젝트 개수 표시
   - 미니멀한 접기/펼치기 버튼 디자인

2. 프로젝트 카드 디자인 개선
   - 불필요한 장식 요소 제거
   - 원형 프로그레스 인디케이터로 진행률 표시
   - 지연 프로젝트에 시각적 경고 표시
   - 프로젝트 기간 정보 추가

3. 단계별 타임라인 UI
   - 기존 그리드 방식에서 세로 타임라인으로 변경
   - 각 단계를 점과 선으로 연결하여 진행 흐름 시각화
   - 완료/진행중/지연 상태를 색상으로 구분
   - 미니멀한 체크박스 스타일의 완료 버튼

4. 전체적인 스타일 개선
   - VideoPlanet 브랜드 컬러 일관성 유지
   - 그림자와 테두리를 최소화한 플랫 디자인
   - 부드러운 애니메이션과 호버 효과
   - 반응형 디자인 유지

**주요 결정사항**:
- 기능성을 유지하면서 시각적 복잡도 감소
- 정보 위계를 명확히 하여 가독성 향상
- 브랜드 아이덴티티와 일관성 있는 디자인 언어 적용

### 2025-01-27: 영상 피드백 페이지 멤버 초대 기능 복구
**문제**: 영상 피드백 페이지에서 멤버 초대 버튼이 표시되지 않음

**분석 결과**:
1. 피드백 페이지(Feedback.jsx)에 멤버 초대 관련 코드는 모두 구현되어 있음
   - InviteInput 컴포넌트 import
   - 멤버 초대 관련 상태 변수들
   - handleOpenInviteModal, handleCloseInviteModal 함수
   - 멤버 초대 모달 UI
2. 문제는 `.member_header` CSS 클래스가 정의되지 않아 UI가 제대로 표시되지 않음
3. 프로젝트 관리 페이지(ProjectView.jsx)와 UI 일관성 부족

**해결 내용**:
1. Cms.scss에 `.member_header` 스타일 추가
   - 멤버 초대 버튼을 위한 헤더 영역 스타일링
   - flex 레이아웃으로 우측 정렬
   - 하단 보더로 시각적 구분
2. 프로젝트 관리 페이지와 동일한 UI 구조 유지
   - 관리자만 멤버 초대 버튼 표시
   - 동일한 모달 디자인
   - 일관된 버튼 스타일 (브랜드 그라데이션)

**주요 결정사항**:
- 프로젝트 관리와 피드백 페이지의 멤버 초대 UI 통일
- VideoPlanet 디자인 시스템 준수
- 권한 기반 UI 표시 (관리자만 초대 가능)