# VideoPlanet Railway 마이그레이션 가이드

## 현재 상태
- 서버는 정상 실행 중 (DB 없이)
- PostgreSQL은 Railway에 준비되어 있음
- 마이그레이션은 수동으로 실행 필요

## 단계별 마이그레이션 방법

### 1단계: Railway CLI 설치
```bash
npm install -g @railway/cli
railway login
```

### 2단계: 프로젝트 연결
```bash
railway link
# VideoPlanet 프로젝트 선택
```

### 3단계: 환경변수를 정상 설정으로 변경
Railway 대시보드에서:
- Variables 탭으로 이동
- `DJANGO_SETTINGS_MODULE` 값을 `config.settings.railway`로 변경
- Save 클릭

### 4단계: 마이그레이션 실행
```bash
# 마이그레이션 파일 생성 (필요시)
railway run python vridge_back/manage.py makemigrations

# 마이그레이션 실행
railway run python vridge_back/manage.py migrate

# 수퍼유저 생성
railway run python vridge_back/manage.py createsuperuser
```

### 5단계: 서비스 재시작
Railway 대시보드에서:
- Settings → Deploy → Restart 클릭

## 문제 해결

### "relation users_user does not exist" 에러가 계속되면:
1. 기존 데이터베이스 초기화:
   ```bash
   railway run python vridge_back/manage.py flush --noinput
   ```

2. 순차적 마이그레이션:
   ```bash
   railway run python vridge_back/manage.py migrate contenttypes
   railway run python vridge_back/manage.py migrate auth
   railway run python vridge_back/manage.py migrate users
   railway run python vridge_back/manage.py migrate
   ```

### 환경변수 확인
```bash
railway run env | grep DJANGO_SETTINGS_MODULE
railway run env | grep DATABASE_URL
```