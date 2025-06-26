# Railway 볼륨 설정 가이드

## 1. Railway 볼륨 설정

### 볼륨 생성 정보
- **볼륨 이름**: `media-storage`
- **마운트 경로**: `/app/media`
- **용도**: 영상 파일 및 미디어 저장

### Railway 대시보드에서 설정할 사항:

1. **볼륨 연결**
   - Service Settings → Volumes 탭
   - 생성한 볼륨을 서비스에 연결
   - Mount Path: `/app/media` 확인

2. **볼륨 크기**
   - 기본: 1GB (무료 플랜)
   - 권장: 10GB 이상 (Pro 플랜)
   - 영상 파일이 많을 경우 50GB+ 고려

## 2. 환경 변수 설정 (Railway Dashboard)

반드시 설정해야 할 환경 변수:

```bash
# Django 설정
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=your-secret-key-here
DEBUG=False

# 데이터베이스 (Railway가 자동 제공)
DATABASE_URL=자동 설정됨

# 미디어 파일 경로
MEDIA_ROOT=/app/media
MEDIA_URL=/media/

# CORS 및 호스트
ALLOWED_HOSTS=videoplanet.up.railway.app,vlanet.net
CORS_ALLOWED_ORIGINS=https://videoplanet.up.railway.app,https://vlanet.net

# 파일 업로드 크기 (바이트)
FILE_UPLOAD_MAX_MEMORY_SIZE=629145600
DATA_UPLOAD_MAX_MEMORY_SIZE=629145600

# 이메일 설정 (선택사항)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# JWT 설정
JWT_ALGORITHM=HS256
```

## 3. 추가 설정 사항

### Nginx 설정 (이미 구성됨)
- `client_max_body_size`: 600M
- `proxy_read_timeout`: 300s

### Gunicorn 설정 (이미 구성됨)
- `--timeout`: 300초
- 대용량 파일 업로드 지원

## 4. 볼륨 백업 권장사항

1. **정기 백업**
   - Railway Pro 플랜에서 자동 백업 설정
   - 또는 S3 등 외부 스토리지 연동 고려

2. **볼륨 모니터링**
   - Railway 대시보드에서 용량 확인
   - 80% 이상 사용 시 확장 고려

## 5. 문제 해결

### 파일이 저장되지 않을 때:
1. 볼륨이 제대로 마운트되었는지 확인
2. `/app/media` 디렉토리 권한 확인
3. Django MEDIA_ROOT 설정 확인

### 업로드 실패 시:
1. 파일 크기 제한 확인 (600MB)
2. 타임아웃 설정 확인 (5분)
3. 볼륨 용량 확인

## 6. 성능 최적화

1. **CDN 사용 고려**
   - Cloudflare 등으로 정적 파일 캐싱
   - 대역폭 절약 및 속도 향상

2. **영상 압축**
   - 업로드 전 클라이언트에서 압축
   - 서버에서 자동 압축 (FFmpeg)

3. **썸네일 생성**
   - 영상 업로드 시 자동 썸네일 생성
   - 목록 표시 시 성능 향상

## 7. 보안 설정

1. **파일 타입 검증**
   - 영상 파일만 허용
   - MIME 타입 확인

2. **접근 권한**
   - 인증된 사용자만 업로드
   - 프로젝트 멤버만 다운로드

3. **바이러스 스캔**
   - ClamAV 등 연동 고려