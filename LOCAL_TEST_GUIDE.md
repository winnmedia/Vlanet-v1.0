# VideoPlanet 로컬 테스트 가이드

## 백엔드 실행

1. **터미널 1 - 백엔드 서버**
```bash
cd vridge_back
python manage.py runserver 0.0.0.0:8003
```

백엔드 접속 주소: http://localhost:8003/

### 주요 엔드포인트
- API 상태 확인: http://localhost:8003/api/
- 데이터베이스 테스트: http://localhost:8003/api/db_test/
- 관리자 페이지: http://localhost:8003/admin/

## 프론트엔드 실행

2. **터미널 2 - 프론트엔드 서버**
```bash
cd vridge_front
npm start
```

프론트엔드 접속 주소: http://localhost:3001/

## 환경변수 설정

백엔드 실행 전 필요한 환경변수:
```bash
export SECRET_KEY="your-secret-key"
export DATABASE_URL="postgresql://user:pass@localhost/dbname"  # PostgreSQL 사용 시
```

## 문제 해결

### 포트 충돌 시
- 백엔드 포트 변경: `python manage.py runserver 0.0.0.0:8004`
- 프론트엔드 포트 변경: `PORT=3002 npm start`

### 데이터베이스 에러 시
1. SQLite 사용 (개발용):
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

2. PostgreSQL 사용:
   ```bash
   export DATABASE_URL="postgresql://..."
   python manage.py migrate
   ```

### CORS 에러 시
백엔드 settings에서 프론트엔드 URL 확인:
- `http://localhost:3001` 이 CORS_ALLOWED_ORIGINS에 포함되어 있는지 확인

## Railway 배포 상태 확인

Railway 대시보드에서 다음을 확인:
1. 빌드 로그 확인
2. 배포 상태 확인
3. 환경변수 설정 확인
4. 도메인 접속 테스트

배포된 URL: https://[your-app-name].railway.app/api/