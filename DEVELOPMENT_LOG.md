# VideoPlanet 개발 로그

## 2025년 1월 8일 개발사항

### 1. 영상 피드백 페이지 UI 개선
#### 문제점
- 영상 관리 버튼(삭제, 교체) 부재
- 영상 업로드 버튼 디자인 개선 필요

#### 해결
- **영상 삭제 버튼 추가** (빨간색)
- **영상 교체 버튼 추가** (파란색)
- 공유 버튼 왼쪽에 배치
- 그라디언트와 애니메이션이 적용된 업로드 버튼 디자인

#### 수정 파일
- `/vridge_front/src/page/Cms/Feedback.jsx`
- `/vridge_front/src/css/Cms/VideoUploadButton.scss`

---

### 2. 영상 기획 페이지 UI/UX 개선
#### 문제점
- 스토리 기획 페이지의 "자세히 보기" 버튼 가로 길이 과다
- 모든 네비게이션 버튼들이 너무 넓음
- 스토리 전개 강도와 전개 방식의 위치가 직관적이지 않음

#### 해결
- **버튼 가로 길이 조정**
  - `expand-toggle-btn`: width: 100% → width: auto
  - `button-group` 버튼들: width: 100% → width: 120px (고정폭)
  - 이후 width: auto, min-width: 140px로 재조정 (가변폭)
- **스토리 전개 강도를 전개 방식 위로 이동**
- **"간결"을 "그대로"로 변경** (원본 콘텐츠 유지 의미 명확화)
- **스토리 프레임워크 개선**
  - 기존: 클래식 기승전결, 3막 구조, 히어로의 여정, 5막 구조
  - 변경: 클래식 기승전결, Pixar Storytelling, Save the Cat, Star Moment

#### 수정 파일
- `/vridge_front/src/page/Cms/VideoPlanning.jsx`
- `/vridge_front/src/page/Cms/VideoPlanning.scss`

---

### 3. 영상 플레이어 환경 설정 문제 해결
#### 문제점
- 로컬 개발 시 프론트엔드가 프로덕션 서버의 영상을 로드하려고 시도
- 404 오류 발생

#### 해결
- `.env.local` 파일 생성하여 로컬 개발 환경 설정
- `REACT_APP_API_BASE_URL=http://localhost:8000` 설정

#### 수정 파일
- `/vridge_front/.env.local` (새로 생성)

---

### 4. 프로젝트 등록 시 한글 인코딩 오류 수정
#### 문제점
- btoa() 함수가 Latin1 범위를 벗어난 한글 문자 처리 불가
- "The string to be encoded contains characters outside of the Latin1 range" 에러

#### 해결
- UTF-8 문자열을 안전하게 Base64로 인코딩하는 함수 추가
- `b64EncodeUnicode` 함수 구현

#### 수정 파일
- `/vridge_front/src/api/project.js`

---

### 5. 프로젝트 등록 폼 간소화
#### 요구사항
- 톤앤매너, 장르, 컨셉트 입력 필드 제거

#### 해결
- ProjectInput 컴포넌트에서 해당 필드 제거
- 관련 상태 및 핸들러 함수 정리
- project_initial 함수에서 초기화 제거

#### 수정 파일
- `/vridge_front/src/tasks/Project/ProjectInput.jsx`
- `/vridge_front/src/page/Cms/ProjectCreate.jsx`
- `/vridge_front/src/util/util.js`

---

### 6. UserProfile 테이블 마이그레이션 문제 해결
#### 문제점
- "relation 'users_userprofile' does not exist" 500 에러
- 마이페이지 접근 불가

#### 해결
- 마이그레이션 재실행 가이드 작성
- 테이블 수동 생성 스크립트 제공
- views_mypage.py 버그 수정 (memo.content → memo.memo)

#### 수정/생성 파일
- `/USERPROFILE_FIX_GUIDE.md` (새로 생성)
- `/vridge_back/fix_userprofile_table.py` (새로 생성)
- `/vridge_back/ensure_userprofile.py` (새로 생성)
- `/vridge_back/fix_userprofile_migration.py` (새로 생성)
- `/vridge_back/users/views_mypage.py`

---

### 7. 프로필 이미지 업로드 후 수정 실패 문제 해결
#### 문제점
- HTTP 메서드 불일치 (프론트: POST, 백엔드: PATCH 기대)
- 이미지 업로드 후 즉시 프로필 정보 가져올 때 동기화 문제

#### 해결
- 백엔드 ProfileUpdate 뷰에 PATCH 메서드 지원 추가
- 프론트엔드 API 호출을 PATCH로 변경
- 이미지 업로드 후 500ms 지연 추가

#### 수정 파일
- `/vridge_back/users/views_profile_upload.py`
- `/vridge_front/src/api/user.js`
- `/vridge_front/src/page/User/MyPage.jsx`

---

### 8. 최근 생성한 기획 기능 오류 수정
#### 문제점
- 권한 설정 불일치 (AllowAny로 설정되어 있지만 코드는 인증 필요)
- 로그인 직후 토큰 설정 전 API 호출로 인한 실패

#### 해결
- 백엔드 권한을 IsAuthenticated로 변경
- 프론트엔드에 재시도 로직 추가 (최대 2회, 1초 간격)
- 로그인 후 100ms 지연 추가

#### 수정 파일
- `/vridge_back/video_planning/views.py`
- `/vridge_front/src/page/Cms/VideoPlanning.jsx`

---

### 9. 영상 기획 내보내기 기능 추가 (PDF & Google Slides)
#### 새로운 기능
- **PDF 내보내기** (2가지 형식)
  - 전체 기획서: 모든 내용 포함
  - 스토리보드만: 이미지 중심
- **Google Slides 내보내기**
  - 자동 프레젠테이션 생성
  - 스토리보드 이미지 자동 삽입

#### 구현 내용
- ReportLab을 사용한 PDF 생성
- Google Slides API 연동
- 한글 폰트 지원
- ExportModal 컴포넌트 추가

#### 생성/수정 파일
- `/vridge_back/video_planning/pdf_export_service.py` (새로 생성)
- `/vridge_back/video_planning/google_slides_service.py` (새로 생성)
- `/vridge_front/src/components/ExportModal.jsx` (새로 생성)
- `/vridge_front/src/components/ExportModal.scss` (새로 생성)
- `/vridge_back/video_planning/views.py`
- `/vridge_back/video_planning/urls.py`
- `/vridge_back/requirements.txt`

---

### 10. 스토리 생성 프롬프트 개선
#### 문제점
- 톤앤매너, 장르, 타겟 등의 메타데이터가 스토리에 직접 언급됨
- "10대를 위한 로맨스 이야기입니다" 같은 부자연스러운 표현

#### 해결
- 메타데이터를 간접적 가이드로만 활용하도록 프롬프트 수정
- 자연스러운 스토리 전개를 위한 지침 추가

#### 수정 파일
- `/vridge_back/video_planning/gemini_service.py`

---

### 11. video_planning 테이블 마이그레이션 문제 해결
#### 문제점
- "relation 'video_planning' does not exist" 500 에러
- 최근 생성한 기획 조회 불가

#### 해결
- 테이블 생성 자동화 스크립트 작성
- Railway 환경 수정 가이드 제공

#### 생성 파일
- `/VIDEO_PLANNING_FIX_GUIDE.md` (새로 생성)
- `/vridge_back/fix_video_planning_table.py` (새로 생성)

---

## 배포 이력

1. **첫 번째 배포** (commit: 34fb093)
   - UserProfile 및 프로필 이미지 업로드 수정
   - 프로젝트 등록 개선

2. **두 번째 배포** (commit: b0d1e47)
   - 영상 기획 내보내기 기능 추가

3. **세 번째 배포** (commit: 12b6fa3)
   - 최근 생성 기획 오류 수정
   - 스토리 프롬프트 개선
   - 버튼 UI 개선

---

## 주요 기술 스택
- **프론트엔드**: React.js, SCSS, Axios
- **백엔드**: Django, Django REST Framework
- **데이터베이스**: PostgreSQL
- **배포**: Railway
- **외부 API**: Google Slides API, Gemini API (스토리 생성)

---

## 환경 설정 요구사항
- Google Cloud 프로젝트 설정 (Slides API용)
- GOOGLE_APPLICATION_CREDENTIALS 환경변수
- PostgreSQL 마이그레이션 실행

---

*이 로그는 2025년 1월 8일 하루 동안의 개발 내용을 정리한 것입니다.*