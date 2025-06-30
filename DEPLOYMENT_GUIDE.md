# VideoPlanet 배포 가이드

## 로컬 환경과 프로덕션 환경 차이점 분석

### 1. 현재 로컬 환경 설정

#### Backend (Django)
- **URL**: http://localhost:8000
- **설정 파일**: config.settings_dev
- **인증**: SimpleJWT 사용
- **CORS**: localhost:3000 허용
- **데이터베이스**: SQLite (로컬)

#### Frontend (React)
- **URL**: http://localhost:3000
- **API 프록시**: package.json에 설정됨
- **환경변수**: .env 파일 사용

### 2. 프로덕션 환경 요구사항

#### Backend 설정 변경사항

1. **설정 파일 분리**
   - `config/settings_prod.py` 생성 필요
   - 환경변수로 민감한 정보 관리

2. **데이터베이스 설정**
   ```python
   # PostgreSQL 또는 MySQL 설정 예시
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': os.environ.get('DB_NAME'),
           'USER': os.environ.get('DB_USER'),
           'PASSWORD': os.environ.get('DB_PASSWORD'),
           'HOST': os.environ.get('DB_HOST'),
           'PORT': os.environ.get('DB_PORT', '5432'),
       }
   }
   ```

3. **보안 설정**
   ```python
   DEBUG = False
   ALLOWED_HOSTS = [os.environ.get('DOMAIN_NAME')]
   SECRET_KEY = os.environ.get('SECRET_KEY')
   ```

4. **정적 파일 설정**
   ```python
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
   ```

5. **CORS 설정**
   ```python
   CORS_ALLOWED_ORIGINS = [
       f"https://{os.environ.get('FRONTEND_DOMAIN')}",
   ]
   ```

#### Frontend 설정 변경사항

1. **환경변수 파일**
   - `.env.production` 생성
   ```
   REACT_APP_BACKEND_API_URL=https://api.yourdomain.com
   ```

2. **API 호출 수정**
   - 모든 하드코딩된 URL 제거 완료
   - 환경변수 기반 URL 사용

### 3. 배포 전 체크리스트

#### Backend
- [ ] requirements.txt 최신화
  ```bash
  pip freeze > requirements.txt
  ```
- [ ] 프로덕션 설정 파일 생성
- [ ] 환경변수 설정
- [ ] 데이터베이스 마이그레이션
- [ ] 정적 파일 수집
  ```bash
  python manage.py collectstatic --settings=config.settings_prod
  ```
- [ ] Gunicorn 또는 uWSGI 설정

#### Frontend
- [ ] 프로덕션 빌드
  ```bash
  npm run build
  ```
- [ ] 환경변수 설정
- [ ] 정적 호스팅 설정 (Nginx, S3 등)

### 4. 필수 환경변수

#### Backend (.env)
```
DJANGO_SETTINGS_MODULE=config.settings_prod
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:pass@host:port/dbname
ALLOWED_HOSTS=api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

#### Frontend (.env.production)
```
REACT_APP_BACKEND_API_URL=https://api.yourdomain.com
```

### 5. 권장 배포 아키텍처

```
[사용자] → [CloudFlare/CDN] → [Nginx]
                                  ↓
                    [React 정적 파일] [Django API]
                                          ↓
                                    [PostgreSQL DB]
```

### 6. 주의사항

1. **인증 토큰**
   - JWT 시크릿 키는 반드시 환경변수로 관리
   - 프로덕션과 개발 환경의 시크릿 키 분리

2. **미디어 파일**
   - 영상 파일은 별도 스토리지 서비스 사용 권장 (S3, CloudFront)
   - 대용량 파일 업로드 설정 필요

3. **WebSocket (현재 비활성화)**
   - 채팅 기능 사용 시 channels, daphne 설치 필요
   - Redis 또는 RabbitMQ 설정 필요

4. **비디오 인코딩**
   - Celery 워커 설정 필요
   - FFmpeg 설치 필요

### 7. 배포 스크립트 예시

```bash
#!/bin/bash
# deploy.sh

# Backend 배포
cd vridge_back
pip install -r requirements.txt
python manage.py migrate --settings=config.settings_prod
python manage.py collectstatic --noinput --settings=config.settings_prod
gunicorn config.wsgi:application --bind 0.0.0.0:8000

# Frontend 배포
cd ../vridge_front
npm install
npm run build
# 빌드된 파일을 웹서버로 복사
```

### 8. 모니터링 및 로깅

- Django 로깅 설정 추가 필요
- 에러 트래킹 서비스 연동 (Sentry 등)
- 서버 모니터링 설정

이 가이드를 참고하여 배포를 진행하시면 됩니다. 추가적인 설정이 필요한 경우 각 섹션을 확장하여 사용하세요.