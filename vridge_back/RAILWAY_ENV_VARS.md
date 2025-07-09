# Railway 환경변수 설정 가이드

## 필수 환경변수

Railway 대시보드에서 다음 환경변수들이 설정되어 있는지 확인하세요:

### 1. Django 설정
```
SECRET_KEY=your-secret-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings_railway
```

### 2. 데이터베이스
```
DATABASE_URL=postgresql://user:password@host:port/dbname
# 또는
RAILWAY_DATABASE_URL=postgresql://...
```

### 3. Railway 환경
```
RAILWAY_ENVIRONMENT=production
PORT=8000
```

### 4. 이메일 (SendGrid)
```
SENDGRID_API_KEY=your-sendgrid-api-key
```

### 5. Redis (선택사항)
```
REDIS_URL=redis://...
```

## 환경변수 확인 방법

1. Railway 대시보드 접속
2. 프로젝트 선택
3. Variables 탭 클릭
4. 위 환경변수들이 모두 설정되어 있는지 확인

## 주의사항

- SECRET_KEY는 반드시 안전한 랜덤 문자열로 설정
- DATABASE_URL은 Railway PostgreSQL 서비스에서 자동 제공
- PORT는 Railway가 자동으로 설정하므로 별도 설정 불필요