# VideoPlanet 배포 트러블슈팅 가이드

## 🚨 일반적인 배포 문제 및 해결 방법

### 1. CORS 오류

#### 증상
```
Access to XMLHttpRequest at 'https://videoplanet.up.railway.app/api/...' 
from origin 'https://vlanet.net' has been blocked by CORS policy
```

#### 해결 방법
1. **백엔드 CORS 설정 확인**
   ```python
   # settings/railway.py
   CORS_ALLOWED_ORIGINS = [
       "https://vlanet.net",
       "https://www.vlanet.net",
   ]
   ```

2. **환경변수로 동적 설정**
   ```bash
   # Railway 환경변수
   CORS_ALLOWED_ORIGINS=https://vlanet.net,https://www.vlanet.net
   ```

3. **긴급 조치 (임시)**
   ```python
   CORS_ALLOW_ALL_ORIGINS = True  # 개발용만!
   ```

### 2. 정적 파일 404 오류

#### 증상
- CSS/JS 파일이 로드되지 않음
- Django admin 스타일 깨짐

#### 해결 방법
1. **collectstatic 실행 확인**
   ```bash
   python manage.py collectstatic --noinput
   ```

2. **WhiteNoise 설정 확인**
   ```python
   MIDDLEWARE = [
       'django.middleware.security.SecurityMiddleware',
       'whitenoise.middleware.WhiteNoiseMiddleware',  # 이 위치 중요!
       ...
   ]
   ```

3. **STATIC_ROOT 설정**
   ```python
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   ```

### 3. 데이터베이스 연결 실패

#### 증상
```
django.db.utils.OperationalError: could not connect to server
```

#### 해결 방법
1. **DATABASE_URL 확인**
   ```bash
   # Railway에서 자동 제공되는지 확인
   echo $DATABASE_URL
   ```

2. **연결 테스트**
   ```bash
   python manage.py dbshell
   ```

3. **마이그레이션 상태 확인**
   ```bash
   python manage.py showmigrations
   ```

### 4. 미디어 파일 업로드 실패

#### 증상
- 파일 업로드 시 500 에러
- 업로드된 파일이 보이지 않음

#### 해결 방법
1. **미디어 디렉토리 권한**
   ```bash
   mkdir -p media
   chmod 755 media
   ```

2. **파일 크기 제한 확인**
   ```python
   # settings.py
   FILE_UPLOAD_MAX_MEMORY_SIZE = 500 * 1024 * 1024  # 500MB
   DATA_UPLOAD_MAX_MEMORY_SIZE = 500 * 1024 * 1024
   ```

3. **S3 설정 (프로덕션)**
   ```bash
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_STORAGE_BUCKET_NAME=your-bucket
   USE_S3=True
   ```

### 5. 웹소켓 연결 실패

#### 증상
```
WebSocket connection to 'wss://...' failed
```

#### 해결 방법
1. **ASGI 서버 확인**
   ```bash
   # Procfile 또는 start.sh
   daphne -b 0.0.0.0 -p $PORT config.asgi:application
   ```

2. **Redis 연결 확인**
   ```bash
   redis-cli ping
   ```

3. **채널 레이어 설정**
   ```python
   CHANNEL_LAYERS = {
       'default': {
           'BACKEND': 'channels_redis.core.RedisChannelLayer',
           'CONFIG': {
               "hosts": [os.environ.get('REDIS_URL')],
           },
       },
   }
   ```

### 6. 환경변수 누락

#### 증상
- KeyError: 'SECRET_KEY'
- 특정 기능이 작동하지 않음

#### 해결 방법
1. **필수 환경변수 체크리스트**
   ```bash
   # 백엔드
   SECRET_KEY
   DATABASE_URL
   REDIS_URL (선택)
   
   # 프론트엔드
   REACT_APP_API_URL
   ```

2. **환경변수 디버깅**
   ```python
   # settings.py에 추가
   import os
   print("Environment variables:")
   for key in sorted(os.environ.keys()):
       if not any(secret in key.upper() for secret in ['KEY', 'SECRET', 'PASSWORD']):
           print(f"{key}: {os.environ[key]}")
   ```

### 7. 인증/로그인 문제

#### 증상
- 로그인 후 바로 로그아웃됨
- 401 Unauthorized 에러

#### 해결 방법
1. **쿠키 도메인 설정**
   ```python
   SESSION_COOKIE_DOMAIN = '.vlanet.net'
   CSRF_COOKIE_DOMAIN = '.vlanet.net'
   ```

2. **HTTPS 쿠키 설정**
   ```python
   SESSION_COOKIE_SECURE = True
   CSRF_COOKIE_SECURE = True
   ```

3. **토큰 저장 위치 확인**
   ```javascript
   // 프론트엔드
   localStorage.getItem('VGID')  // 올바른 키 사용
   ```

### 8. 성능 문제

#### 증상
- 페이지 로딩이 느림
- API 응답 시간이 김

#### 해결 방법
1. **데이터베이스 쿼리 최적화**
   ```python
   # select_related, prefetch_related 사용
   projects = Project.objects.select_related('user').prefetch_related('members')
   ```

2. **캐싱 활성화**
   ```python
   from django.views.decorators.cache import cache_page
   
   @cache_page(60 * 15)  # 15분
   def my_view(request):
       ...
   ```

3. **인덱스 추가**
   ```sql
   CREATE INDEX idx_project_user ON projects_project(user_id);
   CREATE INDEX idx_project_created ON projects_project(created);
   ```

### 9. Railway 특정 문제

#### 증상
- 빌드 실패
- 헬스체크 타임아웃

#### 해결 방법
1. **빌드 명령 확인**
   ```json
   // railway.json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "pip install -r requirements.txt"
     }
   }
   ```

2. **헬스체크 타임아웃 증가**
   ```json
   {
     "deploy": {
       "healthcheckPath": "/api/health/",
       "healthcheckTimeout": 300
     }
   }
   ```

### 10. Vercel 특정 문제

#### 증상
- 빌드 에러
- 환경변수가 적용되지 않음

#### 해결 방법
1. **빌드 설정**
   ```json
   // vercel.json
   {
     "buildCommand": "CI=false npm run build",
     "outputDirectory": "build"
   }
   ```

2. **환경변수 prefix 확인**
   ```bash
   # React 앱은 REACT_APP_ prefix 필요
   REACT_APP_API_URL=https://api.example.com
   ```

## 🔍 디버깅 도구

### 로그 확인
```bash
# Railway 로그
railway logs

# Vercel 로그
vercel logs

# Django 로그
tail -f logs/django.log
```

### 네트워크 테스트
```bash
# API 엔드포인트 테스트
curl -I https://videoplanet.up.railway.app/api/health/

# CORS 테스트
curl -H "Origin: https://vlanet.net" \
     -I https://videoplanet.up.railway.app/api/health/
```

### 데이터베이스 상태
```bash
# Django shell에서
python manage.py shell
>>> from django.db import connection
>>> connection.ensure_connection()
```

## 📞 긴급 연락처

### 서비스 상태 페이지
- Railway: https://status.railway.app
- Vercel: https://www.vercel-status.com
- Cloudflare: https://www.cloudflarestatus.com

### 모니터링 대시보드
- Sentry: https://sentry.io
- Google Analytics: https://analytics.google.com
- Uptime Robot: https://uptimerobot.com

## 🚀 긴급 복구 절차

1. **서비스 확인**
   ```bash
   ./deploy_advanced.sh status production
   ```

2. **최근 변경사항 확인**
   ```bash
   git log --oneline -10
   ```

3. **롤백 (필요시)**
   ```bash
   # Git 롤백
   git revert HEAD
   git push
   
   # 또는 플랫폼에서 이전 배포로 롤백
   ```

4. **캐시 클리어**
   ```bash
   python manage.py clear_cache
   # 또는 Redis 플러시
   redis-cli FLUSHALL
   ```

5. **긴급 패치 배포**
   ```bash
   ./deploy_advanced.sh deploy production
   ```

---

⚡ **골든 룰**: 
- 항상 스테이징에서 먼저 테스트
- 배포 전 백업 필수
- 피크 시간 배포 피하기
- 롤백 계획 준비