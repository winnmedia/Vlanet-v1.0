# Railway 배포 가이드

## 필수 환경변수 (Railway Variables에 설정)

```
DJANGO_SETTINGS_MODULE=config.settings_railway_standalone
SECRET_KEY=django-insecure-your-unique-secret-key
```

## 선택 환경변수

```
DEBUG=False
SENDGRID_API_KEY=your-sendgrid-key
```

## 자동 제공되는 환경변수

- DATABASE_URL (PostgreSQL 서비스 추가 시)
- PORT (Railway가 자동 할당)
- RAILWAY_ENVIRONMENT

## 주의사항

- DB_NAME, DB_USER 등의 개별 DB 환경변수는 사용하지 않음
- DATABASE_URL만 사용 (Railway가 자동 제공)