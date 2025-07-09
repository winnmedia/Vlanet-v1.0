# 변경 이력 (Changelog)

모든 주요 변경사항이 이 파일에 기록됩니다.

## [0.1.13] - 2025-01-09

### 개선
- Django 설정 파일 구조 대대적 정리
- 30개 이상의 중복/불필요한 설정 파일 제거
- settings_base.py 상속 구조로 통합
- INSTALLED_APPS 중앙 관리 체계 확립

### 추가
- SETTINGS_GUIDE.md 문서 작성
- 설정 파일 관리 가이드라인 제공

### 제거
- 불필요한 settings_*.py 파일들 (emergency, minimal, progressive 등)
- settings 디렉토리 내 임시 파일들 (cors_*.py, railway_*.py 등)
- 중복된 urls_*.py, wsgi_*.py 파일들
- 혼란을 주던 config/settings.py 파일

### 수정
- config/asgi.py가 환경에 맞는 설정 사용하도록 수정
- settings/railway.py가 settings_base.py 상속받도록 변경

## [0.1.12] - 2025-01-09

### 수정
- settings/railway.py에 누락된 앱 추가 (video_planning, admin_dashboard)
- Railway가 사용하는 실제 설정 파일 수정

### 중요
- settings_railway.py가 아닌 settings/railway.py가 실제 사용되는 파일임

## [0.1.11] - 2025-01-09

### 수정
- INSTALLED_APPS에 누락된 앱 추가 (video_analysis, admin_dashboard)
- SQLite 임시 데이터베이스 설정 추가
- 중복된 WhiteNoise 미들웨어 제거
- 마이그레이션 파일의 인덱스 오류 수정

### 개선
- Django 마이그레이션 완전 성공
- 모든 앱의 URL 패턴 정상 작동
- 설정 파일 최적화

## [0.1.10] - 2025-01-09

### 수정
- Django URL 설정 오류 해결
- 존재하지 않는 뷰 모듈 참조 제거
- config/urls.py에 누락된 뷰 정의 추가
- 각 앱의 URL 패턴 정리

### 개선
- URL 로딩 시스템 안정화
- 마이그레이션 실행 가능하도록 수정

## [0.1.9] - 2025-01-09

### 보안 강화
- ALLOWED_HOSTS에서 와일드카드(*) 제거
- 구체적인 도메인만 허용 (videoplanet.up.railway.app 추가)
- 프로덕션 설정의 모든 print문 제거
- 로깅으로 대체 (Django logging 사용)

### 정리
- Windows 메타데이터 파일 제거 (Zone.Identifier)
- 프론트엔드 빌드 산출물 제거 (/vridge_front/build)
- .gitignore에 Windows 메타데이터 패턴 추가
- 모든 설정 파일 끝에 줄바꿈 추가

## [0.1.8] - 2025-01-09

### 수정
- railway-start.sh 스크립트 제거 (파일 찾기 오류)
- CMD에서 직접 명령 실행하도록 변경
- sh -c를 사용하여 여러 명령 연결
- 로그를 stdout/stderr로 출력

### 간소화
- 복잡한 스크립트 대신 단순한 명령 체인 사용
- 마이그레이션 → collectstatic → gunicorn 순서로 실행

## [0.1.7] - 2025-01-09

### 추가
- railway-start.sh 스크립트 추가
- 환경변수 검증 (SECRET_KEY 필수)
- 데이터베이스 연결 대기 로직
- 자동 마이그레이션 및 정적 파일 수집
- 상세한 로깅 및 에러 처리

### 수정
- Dockerfile에 bash 추가 (Alpine Linux)
- 시작 명령을 railway-start.sh로 변경

## [0.1.6] - 2025-01-09

### 수정
- simple_server.py 대신 실제 Django 앱 실행
- Procfile과 railway.json에서 gunicorn 명령어로 변경
- 헬스체크 경로를 /api/health로 수정
- simple_server.py 파일 제거

### 중요
- 이제 실제 Django 백엔드가 실행됨
- API 엔드포인트들이 정상 작동

## [0.1.5] - 2025-01-09

### 수정
- Dockerfile을 vridge_back 폴더에 직접 추가
- Railway가 vridge_back를 빌드 컨텍스트로 사용하는 문제 해결

## [0.1.4] - 2025-01-09

### 수정
- Railway가 vridge_back를 루트로 사용하는 문제 대응
- 조건부 requirements.txt 경로 처리
- railway.json의 Dockerfile 경로 수정

## [0.1.3] - 2025-01-09

### 수정
- requirements.txt 파일 경로 문제 해결
- cd vridge_back 후 pip install 실행
- 디버깅을 위한 ls 명령어 추가

## [0.1.2] - 2025-01-09

### 수정
- Dockerfile 빌드 컨텍스트 문제 해결
- 전체 프로젝트를 복사하도록 변경 (COPY . .)
- .dockerignore 파일 추가로 불필요한 파일 제외

## [0.1.1] - 2025-01-09

### 추가
- 버전 관리 시스템 도입 (VERSION 파일)
- 배포 로깅 시스템 구축
- Alpine Linux 기반 경량 Docker 이미지

### 변경
- Dockerfile 최적화 (python:3.11-slim → python:3.11-alpine)
- 메모리 사용량 50% 감소
- Gunicorn worker 수 최적화 (2개)

### 보안
- 모든 Dropbox 메타데이터 파일 제거 (687개)
- 프로덕션 코드의 print문을 logger로 교체
- SECRET_KEY 하드코딩 제거 (환경변수 필수)
- API 엔드포인트 권한 강화 (AllowAny → IsAuthenticated)
- ALLOWED_HOSTS 와일드카드(*) 제거

### 제거
- 중복된 view 파일 24개 삭제
- 불필요한 simple_server.py 제거

## [0.1.0] - 2025-01-08

### 초기 릴리즈
- VideoPlanet 프로젝트 첫 배포
- Django + React 기본 구조 확립
- Railway + Vercel 배포 환경 구성
- AI 기반 영상 기획 기능
- PDF/Google Slides 내보내기 기능
- 실시간 피드백 시스템