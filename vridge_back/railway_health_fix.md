# Railway 헬스체크 문제 해결 가이드

## 수행한 변경사항

### 1. IPv6 지원 추가 ✅
**파일**: `/home/winnmedia/VideoPlanet/vridge_back/start.sh`
- 변경 전: `--bind 0.0.0.0:${PORT:-8000}`
- 변경 후: `--bind [::]:${PORT:-8000}`
- **이유**: Railway v2 런타임은 IPv6 리스닝이 필수

### 2. 헬스체크 타임아웃 증가 ✅
**파일**: `/home/winnmedia/VideoPlanet/vridge_back/railway.json`
- 변경 전: `"healthcheckTimeout": 30`
- 변경 후: `"healthcheckTimeout": 60`
- **이유**: 데이터베이스 연결 지연을 고려하여 타임아웃 증가

### 3. Gunicorn IPv6 설정 파일 생성 ✅
**파일**: `/home/winnmedia/VideoPlanet/vridge_back/gunicorn_health.py`
- IPv6 바인딩 설정
- 환경변수 기반 동적 설정
- 로깅 및 디버깅 기능 포함

### 4. Procfile 업데이트 ✅
**파일**: `/home/winnmedia/VideoPlanet/vridge_back/Procfile`
- Gunicorn이 IPv6 설정 파일을 사용하도록 변경
- 마이그레이션을 시작 명령에 포함

### 5. ALLOWED_HOSTS 확장 ✅
**파일**: `/home/winnmedia/VideoPlanet/vridge_back/config/settings/railway.py`
- `testserver` 추가 (Django 테스트용)
- `*` 추가 (헬스체크 디버깅용, 운영환경에서는 제거 권장)

### 6. 빠른 시작 스크립트 생성 ✅
**파일**: `/home/winnmedia/VideoPlanet/vridge_back/quick_start.sh`
- 서버를 즉시 시작하여 헬스체크 통과
- 마이그레이션은 백그라운드에서 실행

## 배포 방법

### 옵션 1: 표준 배포 (권장)
```bash
git add .
git commit -m "🚨 Railway 헬스체크 IPv6 지원 추가"
git push origin main
```

### 옵션 2: 빠른 시작 스크립트 사용
Railway 대시보드에서 start command를 다음으로 변경:
```bash
chmod +x quick_start.sh && ./quick_start.sh
```

## 헬스체크 테스트 방법

### 로컬 테스트
```bash
# IPv6 테스트
curl -6 http://[::1]:8000/api/health/

# IPv4 테스트
curl http://localhost:8000/api/health/
```

### Railway 배포 후 테스트
```bash
# 헬스체크 엔드포인트 확인
curl https://videoplanet.up.railway.app/api/health/

# 상세 헬스체크
curl https://videoplanet.up.railway.app/api/health-full/
```

## 문제 해결 체크리스트

### 배포 전 확인사항
- [ ] SECRET_KEY 환경변수 설정
- [ ] DATABASE_URL 환경변수 설정
- [ ] PORT 환경변수 자동 설정 (Railway가 제공)
- [ ] DJANGO_SETTINGS_MODULE=config.settings.railway

### 배포 후 확인사항
- [ ] Railway 로그에서 "Server is ready. Listening on: [::]" 확인
- [ ] 헬스체크 경로 `/api/health/` 접근 가능
- [ ] 60초 내 200 응답 반환

## 롤백 방법

문제 발생 시 이전 버전으로 롤백:
```bash
# start.sh를 원래 IPv4로 되돌리기
git revert HEAD
git push origin main
```

또는 Railway 대시보드에서 이전 배포로 롤백

## 추가 권장사항

1. **운영환경 보안 강화**
   - ALLOWED_HOSTS에서 `*` 제거
   - 특정 도메인만 허용

2. **헬스체크 최적화**
   - 데이터베이스 연결 없는 단순 헬스체크 사용
   - 캐시를 활용한 응답 속도 개선

3. **모니터링 추가**
   - 헬스체크 응답 시간 모니터링
   - 실패 알림 설정

## 참고 링크
- [Railway 헬스체크 문서](https://docs.railway.com/guides/healthchecks-and-restarts)
- [Railway IPv6 이슈](https://help.railway.com/questions/health-check-keeps-failing-56eac5eb)