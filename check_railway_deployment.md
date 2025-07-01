# Railway 배포 문제 해결 체크리스트

## 1. Railway 대시보드에서 확인할 사항:

### 백엔드 서비스 URL 확인
- Railway 대시보드 → 백엔드 서비스 클릭
- Settings 탭에서 "Domains" 섹션 확인
- 실제 URL이 `vridge-back-production.up.railway.app`인지 확인

### 배포 상태 확인
- Deployments 탭에서 최신 배포 상태 확인
- "Success" 상태인지 확인
- 실패한 경우 로그 확인

### 환경 변수 확인
- Variables 탭에서 다음 확인:
  - `DJANGO_SETTINGS_MODULE=config.settings.railway`
  - `DATABASE_URL` 또는 `RAILWAY_DATABASE_URL` 존재
  - 기타 필요한 환경 변수들

## 2. Vercel 대시보드에서 확인할 사항:

### 환경 변수 확인
- Settings → Environment Variables
- `REACT_APP_API_BASE_URL`이 Railway 백엔드 URL과 일치하는지 확인
- 예: `https://vridge-back-production.up.railway.app`

## 3. 임시 해결 방법:

### 옵션 1: Railway 환경 변수 수정
```
DJANGO_SETTINGS_MODULE=config.settings.railway_cors_fix
```

### 옵션 2: Railway 재배포
1. 코드 변경사항이 있으면 push
2. Railway 대시보드에서 "Redeploy" 클릭

### 옵션 3: 수동 재시작
Railway 대시보드 → Settings → Restart

## 4. 디버깅 명령어:

Railway CLI가 설치되어 있다면:
```bash
# Railway 로그 확인
railway logs

# Railway 환경에서 직접 명령 실행
railway run python manage.py shell
```

## 5. 확인해야 할 URL들:

- 백엔드 헬스체크: `https://[your-railway-url]/admin/`
- API 엔드포인트: `https://[your-railway-url]/projects/project_list`

백엔드 URL이 변경되었다면 Vercel 환경 변수도 업데이트해야 합니다.