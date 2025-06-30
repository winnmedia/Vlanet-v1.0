# VideoPlanet 연결 문제 원인 분석 보고서

## 문제 요약
영상 피드백 페이지가 접속되지 않고 프로젝트 내용을 불러오지 못하는 문제

## 근본 원인 분석

### 1. **하드코딩된 프로덕션 URL**
- **문제**: React 앱이 로컬 서버 대신 프로덕션 서버(videoplanet.up.railway.app)로 API 요청
- **위치**: `vridge_front/src/api/feedback.js`
- **해결**: 상대 경로로 변경 및 proxy 설정

### 2. **JWT 인증 라이브러리 비호환성**
- **문제**: Frontend와 Backend가 서로 다른 JWT 처리 방식 사용
- **에러**: `InvalidSignatureError: Signature verification failed`
- **해결**: Django REST Framework의 SimpleJWT로 통일

### 3. **누락된 Python 모듈**
- **문제**: celery, channels, daphne 모듈 미설치
- **해결**: 해당 기능 일시적 비활성화

### 4. **데이터베이스 마이그레이션 누락**
- **문제**: video_file_web, video_file_mobile 등 컬럼 부재
- **해결**: makemigrations 및 migrate 실행

## 해결된 사항

1. ✅ API URL을 상대 경로로 변경
2. ✅ package.json에 proxy 설정 추가
3. ✅ JWT 인증 방식 통일 (SimpleJWT)
4. ✅ CORS 설정 정리
5. ✅ 데이터베이스 마이그레이션
6. ✅ 테스트 계정 생성 (test@example.com / test1234)

## 현재 상태

### 작동 중인 기능
- Django 서버 (포트 8000)
- React 서버 (포트 3000)
- 로그인 API
- JWT 토큰 생성
- 프록시를 통한 API 통신

### 비활성화된 기능
- WebSocket 채팅 (channels 모듈 필요)
- 비디오 인코딩 (celery 모듈 필요)
- 이미지 처리 (Pillow 모듈 필요)

## 배포 준비 사항

1. **프로덕션 설정 파일 생성 완료**
   - `/vridge_back/config/settings_prod.py`

2. **배포 가이드 작성 완료**
   - `/DEPLOYMENT_GUIDE.md`

3. **필요한 추가 작업**
   - PostgreSQL 데이터베이스 설정
   - 환경변수 설정
   - 정적 파일 서버 구성
   - HTTPS 인증서 설정

## 로그인 방법

1. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
2. http://localhost:3000/login 접속
3. 로그인 정보:
   - Email: test@example.com
   - Password: test1234

로그인 후 localStorage에 VGID 토큰이 저장되며, 이후 API 요청 시 자동으로 인증됩니다.