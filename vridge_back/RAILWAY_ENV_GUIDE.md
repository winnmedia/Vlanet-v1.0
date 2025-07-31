# Railway 환경변수 설정 가이드

## 필수 환경변수 (반드시 설정해야 함)

Railway 대시보드에서 다음 환경변수를 설정해주세요:

### 1. Django 설정
```
DJANGO_SETTINGS_MODULE=config.settings_fixed
SECRET_KEY=your-secret-key-here
DEBUG=False
```

### 2. 데이터베이스 설정
```
DATABASE_URL=postgresql://user:password@host:port/dbname
```
- Railway PostgreSQL 서비스를 추가하면 자동으로 설정됩니다

### 3. Redis 설정 (옵션)
```
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```
- Railway Redis 서비스를 추가하면 자동으로 설정됩니다

### 4. CORS 설정 (옵션)
```
CORS_ALLOWED_ORIGINS=https://vlanet.net,https://www.vlanet.net
```

### 5. 이메일 설정 (옵션)
```
SENDGRID_API_KEY=your-sendgrid-api-key
```

## Railway에서 환경변수 설정 방법

1. Railway 대시보드에 로그인
2. VideoPlanet 프로젝트 선택
3. Settings 탭으로 이동
4. Variables 섹션에서 환경변수 추가
5. 위의 필수 환경변수를 모두 입력
6. Save 버튼 클릭

## 환경변수 확인 방법

배포 후 다음 URL로 환경변수 설정 상태 확인:
```
https://videoplanet.up.railway.app/debug/
```

## 주의사항

- SECRET_KEY는 반드시 안전한 랜덤 문자열로 설정
- DATABASE_URL은 Railway PostgreSQL 서비스 추가 시 자동 생성
- 환경변수 변경 후 자동으로 재배포됨 (약 5분 소요)

## 문제 해결

### Django가 시작되지 않을 때
1. 환경변수가 모두 설정되었는지 확인
2. DATABASE_URL이 올바른지 확인
3. Railway 로그에서 오류 메시지 확인

### CORS 오류가 발생할 때
1. CORS_ALLOWED_ORIGINS에 프론트엔드 도메인 추가
2. 쉼표로 구분하여 여러 도메인 입력 가능

작성일: 2025-08-01