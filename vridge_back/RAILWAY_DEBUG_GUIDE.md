# Railway 배포 디버깅 가이드

## 분석 결과

### 1. 로컬 환경 테스트 결과
- Django 4.2.7 정상 설치됨
- Gunicorn 21.2.0 정상 설치됨
- WSGI 애플리케이션 정상 로드됨
- config.settings.railway 설정 파일 정상 작동

### 2. 가능한 Railway 배포 실패 원인

#### a) Python 버전 불일치
- 로컬: Python 3.12.3
- Railway: Python 3.11.9 (runtime.txt)
- 해결: runtime.txt를 `python-3.11`로 수정 완료

#### b) 환경변수 누락
Railway에서 다음 환경변수가 설정되어 있는지 확인:
```
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://...
DJANGO_SETTINGS_MODULE=config.settings.railway
```

#### c) 시작 명령어 문제
- Procfile 단순화 완료
- start.sh 스크립트 개선 완료

### 3. 수정 사항

#### Procfile (단순화)
```
web: python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120
```

#### railway.json (헬스체크 타임아웃 증가)
```json
{
  "healthcheckTimeout": 300
}
```

#### runtime.txt (Python 버전 명시)
```
python-3.11
```

### 4. Railway 환경변수 체크리스트

필수 환경변수:
- [ ] SECRET_KEY
- [ ] DATABASE_URL 또는 RAILWAY_DATABASE_URL
- [ ] DJANGO_SETTINGS_MODULE=config.settings.railway

선택 환경변수:
- [ ] DEBUG=False
- [ ] REDIS_URL (캐시용)
- [ ] EMAIL_HOST_USER
- [ ] EMAIL_HOST_PASSWORD

### 5. 디버깅 단계

1. **Railway 로그 확인**
   ```bash
   railway logs
   ```

2. **환경변수 확인**
   ```bash
   railway variables
   ```

3. **배포 상태 확인**
   ```bash
   railway status
   ```

### 6. 간단한 테스트 방법

문제가 지속되면 test_server.py를 사용하여 기본 연결 테스트:
```bash
# Procfile 임시 변경
web: python3 test_server.py
```

이렇게 하면 Django 없이 기본 서버가 작동하는지 확인 가능.

### 7. 일반적인 오류와 해결책

#### "Application failed to respond"
- 헬스체크 타임아웃 증가 (300초)
- 시작 시간이 오래 걸리는 마이그레이션 확인

#### "Module not found"
- requirements.txt 확인
- Python 버전 호환성 확인

#### "Database connection failed"
- DATABASE_URL 환경변수 확인
- PostgreSQL 서비스 연결 상태 확인

### 8. 권장 배포 프로세스

1. 로컬에서 Railway 환경 시뮬레이션
   ```bash
   export DJANGO_SETTINGS_MODULE=config.settings.railway
   python manage.py check
   ```

2. 변경사항 커밋 및 푸시
   ```bash
   git add .
   git commit -m "Fix Railway deployment"
   git push origin main
   ```

3. Railway 로그 모니터링
   ```bash
   railway logs -f
   ```