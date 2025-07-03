# Railway 단계적 배포 가이드

## 배포 단계

### 🟢 Stage 1: Minimal (settings_minimal.py)
- **목적**: 최소한의 설정으로 서버 시작 확인
- **특징**:
  - 기본 Django 앱만 로드
  - 로컬 메모리 캐시
  - CORS 모두 허용
  - 인증 없음
  - Worker 1개

```bash
DJANGO_SETTINGS_MODULE=config.settings_minimal
```

### 🟡 Stage 2: Progressive (settings_progressive.py)
- **목적**: 핵심 기능 점진적 추가
- **추가 기능**:
  - JWT 인증
  - 데이터베이스 캐시
  - CORS 도메인 제한
  - 이메일 설정
  - 파일 업로드 (100MB)
  - Worker 2개 가능

```bash
DJANGO_SETTINGS_MODULE=config.settings_progressive
```

### 🔴 Stage 3: Full (settings_full.py)
- **목적**: 모든 기능 활성화
- **추가 기능**:
  - Redis 캐시 (가능한 경우)
  - 성능 미들웨어
  - 미디어 헤더 미들웨어
  - 소셜 로그인
  - Celery 지원
  - 파일 업로드 (600MB)
  - 보안 헤더
  - Worker 3개 가능

```bash
DJANGO_SETTINGS_MODULE=config.settings_full
```

## Railway 배포 절차

### 1. Minimal로 시작
```json
{
  "deploy": {
    "startCommand": "DJANGO_SETTINGS_MODULE=config.settings_minimal python manage.py migrate && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 1"
  }
}
```

### 2. 헬스체크 통과 확인 후 Progressive로 업그레이드
```json
{
  "deploy": {
    "startCommand": "DJANGO_SETTINGS_MODULE=config.settings_progressive python manage.py migrate && python manage.py collectstatic --noinput && python manage.py createcachetable && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2"
  }
}
```

### 3. 안정화 후 Full로 최종 업그레이드
```json
{
  "deploy": {
    "startCommand": "DJANGO_SETTINGS_MODULE=config.settings_full python manage.py migrate && python manage.py collectstatic --noinput && python manage.py createcachetable && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3"
  }
}
```

## 체크리스트

### Minimal → Progressive
- [ ] 헬스체크 통과
- [ ] 기본 API 응답
- [ ] 정적 파일 서빙
- [ ] 데이터베이스 연결

### Progressive → Full
- [ ] JWT 인증 작동
- [ ] 파일 업로드 테스트
- [ ] CORS 정상 작동
- [ ] 이메일 발송 (옵션)

### Full 배포 후
- [ ] Redis 연결 확인
- [ ] 모든 API 엔드포인트 테스트
- [ ] 성능 모니터링
- [ ] 에러 로그 확인

## 문제 해결

### 헬스체크 실패 시
1. Minimal 설정으로 롤백
2. Railway 로그 확인
3. 환경 변수 검증

### 메모리 부족 시
1. Worker 수 감소
2. Progressive 설정 사용
3. 불필요한 미들웨어 제거

### 성능 이슈 시
1. Redis 캐시 활성화
2. 데이터베이스 쿼리 최적화
3. 정적 파일 CDN 사용 고려