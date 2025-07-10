# Railway 배포 가이드

## 🚀 빠른 배포 (헬스체크 통과 우선)

현재 Procfile은 헬스체크를 빠르게 통과하기 위해 서버만 즉시 시작합니다.

```bash
web: gunicorn config.wsgi:application --bind [::]:$PORT --workers 1 --threads 2 --timeout 120 --preload
```

## 📋 배포 후 필수 작업

Railway 배포가 성공하고 헬스체크가 통과한 후, Railway CLI를 통해 다음 명령을 실행하세요:

### 1. Railway CLI 설치 (없는 경우)
```bash
npm install -g @railway/cli
```

### 2. Railway 프로젝트 연결
```bash
railway link
```

### 3. 배포 후 작업 실행
```bash
# 옵션 1: 개별 명령 실행
railway run python3 manage.py migrate --noinput
railway run python3 manage.py createcachetable
railway run python3 manage.py collectstatic --noinput --clear

# 옵션 2: 스크립트 실행
railway run bash post_deploy.sh
```

## 🔧 대안: 백그라운드 작업 자동화

만약 헬스체크가 안정적으로 통과한다면, Procfile을 다음과 같이 수정할 수 있습니다:

```bash
web: bash quick_start.sh
```

이렇게 하면 서버 시작과 동시에 백그라운드에서 마이그레이션이 자동으로 실행됩니다.

## ⚠️ 주의사항

1. **첫 배포 시**: 반드시 수동으로 마이그레이션을 실행해야 합니다.
2. **DB 스키마 변경 시**: 배포 후 즉시 마이그레이션을 실행하세요.
3. **캐시 테이블**: 처음 한 번만 생성하면 됩니다.

## 🏃 헬스체크 디버깅

헬스체크가 여전히 실패한다면:

1. Railway 로그 확인
```bash
railway logs
```

2. 헬스체크 엔드포인트 직접 테스트
```bash
curl https://[your-app].up.railway.app/api/health/
```

3. 환경변수 확인
- `SECRET_KEY`가 설정되어 있는지 확인
- `DATABASE_URL`이 올바른지 확인
- `DJANGO_SETTINGS_MODULE=config.settings.railway`

## 🚨 긴급 복구

만약 배포가 계속 실패한다면:

1. 이전 버전으로 롤백
```bash
git checkout v0.3.6
git push origin main --force
```

2. 또는 헬스체크 비활성화 (railway.json 수정)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "deploy": {
    "numReplicas": 1
  }
}
```