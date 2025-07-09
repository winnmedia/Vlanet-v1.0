# 변경 이력 (Changelog)

모든 주요 변경사항이 이 파일에 기록됩니다.

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