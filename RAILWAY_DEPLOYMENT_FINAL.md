# VideoPlanet Railway 최종 배포 가이드

## 통합 배포 전략
프론트엔드와 백엔드를 하나의 서비스로 배포하여 간단하게 운영합니다.

## Railway 환경변수 설정

Railway 대시보드 → Variables에 다음 환경변수들을 추가:

```bash
# Django 기본 설정
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=your-secure-secret-key-here
DEBUG=False

# 데이터베이스 (Railway가 자동으로 제공)
# DATABASE_URL 또는 RAILWAY_DATABASE_URL

# 이메일 설정
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# 소셜 로그인
NAVER_CLIENT_ID=your-naver-client-id
NAVER_SECRET_KEY=your-naver-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
KAKAO_API_KEY=your-kakao-api-key

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=vridge-front
AWS_S3_REGION_NAME=ap-northeast-2

# Twelve Labs API
TWELVE_LABS_API_KEY=your-twelve-labs-api-key
TWELVE_LABS_INDEX_ID=your-index-id
```

## 배포 후 설정

### 1. 데이터베이스 마이그레이션
```bash
railway run bash
cd vridge_back
python manage.py migrate
python manage.py createsuperuser
```

### 2. 도메인 설정
Railway 대시보드에서:
- Settings → Domains → Generate Domain
- 또는 Custom Domain 추가

### 3. 접속 확인
- API: `https://your-domain.railway.app/api/`
- Admin: `https://your-domain.railway.app/admin/`
- Frontend: `https://your-domain.railway.app/`

## 문제 해결

### PostgreSQL 연결 실패
1. Railway 대시보드에서 PostgreSQL 서비스 추가
2. VideoPlanet 서비스와 연결
3. DATABASE_URL이 자동으로 추가되는지 확인

### 정적 파일 문제
- WhiteNoise가 자동으로 처리
- `/static/` 경로로 접근 가능

### WebSocket 연결
- Daphne가 포함되어 있으나 Railway는 HTTP만 지원
- 실시간 기능은 polling으로 대체 필요

## 로컬 테스트
```bash
# 백엔드
cd vridge_back
python manage.py runserver --settings=config.settings.production

# 프론트엔드
cd vridge_front
npm start
```

## 배포 명령
```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

Railway가 자동으로 빌드하고 배포합니다.