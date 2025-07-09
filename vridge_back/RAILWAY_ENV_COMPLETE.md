# Railway 환경변수 완전 가이드

## 🚨 필수 환경변수 (반드시 설정)

### Django 핵심 설정
```bash
# Django 설정 모듈 경로
DJANGO_SETTINGS_MODULE=config.settings_railway_simple

# 보안 키 (반드시 변경!)
SECRET_KEY=django-insecure-your-unique-secret-key-here-change-this

# 디버그 모드 (운영환경에서는 반드시 False)
DEBUG=False

# 허용 호스트 (Railway 도메인 포함)
ALLOWED_HOSTS=.railway.app,vlanet.net,www.vlanet.net,localhost
```

### 데이터베이스
```bash
# Railway가 자동으로 제공 (설정 불필요)
# DATABASE_URL=postgresql://user:password@host:port/dbname
```

### CORS 설정
```bash
# 프론트엔드 도메인 허용
CORS_ALLOWED_ORIGINS=https://vlanet.net,https://www.vlanet.net,http://localhost:3000
```

## 📧 이메일 설정 (SendGrid)

```bash
# SendGrid API 키
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx

# 이메일 기본 설정
DEFAULT_FROM_EMAIL=noreply@vlanet.net
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=${SENDGRID_API_KEY}
```

## 🤖 AI 서비스 API 키 (선택사항)

```bash
# OpenAI (GPT, DALL-E)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# Google Cloud
GOOGLE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json

# Hugging Face
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxx

# Twelve Labs (비디오 분석)
TWELVE_LABS_API_KEY=tl_xxxxxxxxxxxxxxxxxxxxxxxx
TWELVE_LABS_INDEX_ID=your_index_id
```

## 🚀 Railway 전용 변수

```bash
# Railway 환경 (자동 설정됨)
RAILWAY_ENVIRONMENT=production

# 포트 (자동 설정됨, 수동 설정 불필요)
# PORT=자동할당
```

## 📝 환경변수 설정 방법

1. Railway 대시보드 접속
2. 프로젝트 선택
3. "Variables" 탭 클릭
4. "RAW Editor" 모드로 전환
5. 아래 템플릿 복사하여 붙여넣기:

```
DJANGO_SETTINGS_MODULE=config.settings_railway_simple
SECRET_KEY=django-insecure-generate-your-own-secret-key-here
DEBUG=False
ALLOWED_HOSTS=.railway.app,vlanet.net,www.vlanet.net
CORS_ALLOWED_ORIGINS=https://vlanet.net,https://www.vlanet.net
SENDGRID_API_KEY=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@vlanet.net
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
```

## ⚠️ 주의사항

1. **SECRET_KEY는 반드시 변경**: 온라인 생성기 사용 권장
   - https://djecrety.ir/
   - Python: `from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())`

2. **DATABASE_URL**: Railway PostgreSQL 서비스 추가 시 자동 생성

3. **디버그 모드**: 운영환경에서는 반드시 `DEBUG=False`

4. **API 키 보안**: 절대 코드에 하드코딩하지 말 것

## 🔍 환경변수 확인 명령

배포 후 Django shell에서 확인:
```python
import os
print("SECRET_KEY exists:", bool(os.environ.get('SECRET_KEY')))
print("DATABASE_URL exists:", bool(os.environ.get('DATABASE_URL')))
print("SENDGRID_API_KEY exists:", bool(os.environ.get('SENDGRID_API_KEY')))
```