# VideoPlanet 배포 체크리스트

## 배포 전 필수 확인 사항

### 1. 환경 변수 설정
#### Frontend (.env.production)
```bash
REACT_APP_BACKEND_URI=https://your-domain.com
REACT_APP_BACKEND_API_URL=https://your-domain.com
REACT_APP_SOCKET_URI=wss://your-domain.com
```

#### Backend (환경변수)
```bash
DJANGO_SETTINGS_MODULE=config.settings.production
DATABASE_URL=postgresql://...
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
```

### 2. 필수 패키지 설치
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### 3. 데이터베이스 마이그레이션
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 4. 코드 수정 사항
- [ ] `vridge_back/config/__init__.py` - Celery import 주석 해제
- [ ] `vridge_back/config/settings_base.py` - daphne, channels 주석 해제
- [ ] `vridge_back/feedbacks/models.py` - ImageField로 복원 (Pillow 설치 후)

### 5. CORS 설정 확인
- [ ] 프로덕션 도메인이 CORS_ALLOWED_ORIGINS에 포함되어 있는지 확인

### 6. WebSocket 설정
- [ ] ASGI 설정에서 WebSocket origin 확인
- [ ] Redis 서버 실행 확인

### 7. 파일 업로드 설정
- [ ] Media 파일 경로 설정
- [ ] 파일 권한 설정
- [ ] nginx 설정에서 client_max_body_size 확인

### 8. 보안 설정
- [ ] SECRET_KEY 변경
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS 설정
- [ ] HTTPS 설정

## 배포 명령어

### Railway 배포
```bash
git add .
git commit -m "Deploy: 배포 준비 완료"
git push origin main
```

### Docker 배포
```bash
docker-compose -f docker-compose.production.yml up -d
```

## 배포 후 확인 사항
1. [ ] 홈페이지 접속 확인
2. [ ] 로그인 기능 테스트
3. [ ] 영상 업로드 테스트
4. [ ] 영상 재생 테스트
5. [ ] WebSocket 연결 테스트
6. [ ] 에러 로그 확인

## 트러블슈팅

### 연결 거부 에러
- CORS 설정 확인
- 환경변수 확인
- 서버 실행 상태 확인

### 404 에러
- URL 라우팅 확인
- nginx 설정 확인
- API 엔드포인트 확인

### WebSocket 연결 실패
- Redis 서버 확인
- Daphne 실행 확인
- WebSocket origin 설정 확인