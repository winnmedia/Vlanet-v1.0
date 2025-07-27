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