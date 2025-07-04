# VideoPlanet 배포 체크리스트

## 🚀 Railway 배포 상태

### 필수 환경 변수
- [ ] `SECRET_KEY` - Django 시크릿 키
- [ ] `DEBUG` - False (프로덕션)
- [ ] `ALLOWED_HOSTS` - videoplanet.up.railway.app,vlanet.net,www.vlanet.net
- [ ] `DATABASE_URL` - PostgreSQL 연결 정보 (Railway 자동 설정)
- [ ] `GOOGLE_API_KEY` - Gemini API 키
- [ ] `HUGGINGFACE_API_KEY` - 이미지 생성 API 키

### 서비스 상태
- [ ] 백엔드: https://videoplanet.up.railway.app
- [ ] 프론트엔드: https://vlanet.net
- [ ] 헬스체크: https://videoplanet.up.railway.app/health/

## ✅ 기능 테스트 (100% 목표)

### 1. 인프라 (3/3) ✅
- [x] 서버 헬스체크
- [x] CORS 설정
- [x] API 루트 접근

### 2. 인증 시스템 (0/4) ⏳
- [ ] 이메일 중복 확인 `/api/users/check-email/`
- [ ] 닉네임 중복 확인 `/api/users/check-nickname/`
- [ ] 회원가입 `/api/users/signup/`
- [ ] 로그인 `/api/users/login/`

### 3. 영상 기획 (5/5) ✅
- [x] 기획 라이브러리 조회
- [x] 스토리 생성
- [x] 씬 생성
- [x] 숏 생성
- [x] 스토리보드 생성

### 4. 프로젝트 관리 (0/2) ⏳
- [ ] 프로젝트 목록 조회
- [ ] 프로젝트 생성

### 5. 프론트엔드 (2/2) ✅
- [x] 메인 페이지 접근
- [x] 정적 파일 서빙

### 6. 보안 (3/3) ✅
- [x] XSS 방지
- [x] SQL 인젝션 방지
- [x] 인증 시스템

## 🔍 트러블슈팅

### 502 Bad Gateway 에러
1. Railway 로그 확인
2. 환경 변수 설정 확인
3. 빌드 성공 여부 확인
4. 포트 바인딩 확인 ($PORT)

### 404 Not Found 에러
1. URL 패턴 확인 (trailing slash)
2. urls.py 파일 확인
3. INSTALLED_APPS 확인

### CORS 에러
1. CORS_ALLOWED_ORIGINS 확인
2. 미들웨어 순서 확인
3. 프론트엔드 도메인 추가

## 📞 지원
- Railway 상태: https://railway.app/project/[your-project-id]
- Vercel 상태: https://vercel.com/[your-team]/videoplanet
- GitHub: https://github.com/winnmedia/Vlanet-v1.0