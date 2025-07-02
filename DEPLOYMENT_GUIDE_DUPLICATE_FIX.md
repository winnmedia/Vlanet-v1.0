# Deployment Guide: Fix Duplicate Project Creation

## 배포 단계

### 1. 코드 배포
1. 변경된 파일들을 Railway에 배포:
   - `config/settings/railway.py` - 캐시 설정 추가
   - `config/settings/cors_emergency_fix.py` - 캐시 확인 로그 추가
   - `projects/models.py` - IdempotencyRecord 모델 추가
   - `projects/views_idempotent_fixed.py` - 개선된 멱등성 뷰
   - `projects/urls.py` - URL 업데이트

### 2. 데이터베이스 마이그레이션
Railway 콘솔이나 SSH에서 실행:
```bash
python manage.py migrate projects
```

### 3. 캐시 설정
#### Option A: Redis 설정 (권장)
Railway 환경변수에 추가:
```
REDIS_URL=redis://your-redis-host:6379/0
```

#### Option B: 데이터베이스 캐시 사용
Redis가 없으면 자동으로 데이터베이스 캐시를 사용합니다.
캐시 테이블 생성:
```bash
python manage.py createcachetable django_cache_table
```

### 4. 배포 후 확인
1. Railway 로그 확인:
   ```
   Redis cache configured: redis://...
   ```
   또는
   ```
   WARNING: Redis not configured, using database cache as fallback
   ```

2. 프로젝트 생성 테스트:
   - 동일한 프로젝트를 빠르게 2번 생성 시도
   - 1개만 생성되는지 확인

### 5. 모니터링
로그에서 다음 패턴 확인:
- `[CreateProjectFixed] Duplicate request, returning existing project`
- `[CreateProjectFixed] Recent duplicate found`
- `[CreateProjectFixed] Cache hit for key`

## 환경변수 설정 (Railway)

필수:
- `DATABASE_URL`: PostgreSQL 연결 정보 (이미 설정됨)

선택 (권장):
- `REDIS_URL`: Redis 연결 정보 (예: `redis://localhost:6379/0`)

## 문제 해결

### Redis 연결 실패
- Railway에서 Redis 애드온 추가
- 또는 외부 Redis 서비스 사용 (Redis Cloud, Upstash 등)

### 캐시 테이블 생성 실패
```bash
python manage.py dbshell
```
```sql
DROP TABLE IF EXISTS django_cache_table;
```
다시 시도:
```bash
python manage.py createcachetable
```

### 여전히 중복 생성되는 경우
1. 모든 서버 인스턴스가 새 코드로 업데이트되었는지 확인
2. 프론트엔드가 vlanet.net 도메인만 사용하는지 확인
3. 로그에서 멱등성 키가 제대로 전달되는지 확인

## 롤백 계획
문제 발생 시:
1. `projects/urls.py`에서 URL을 이전 버전으로 변경:
   ```python
   path("create", views_idempotent.CreateProjectIdempotent.as_view()),
   ```
2. 재배포

## 성공 지표
- 프로젝트 중복 생성 0건
- 로그에 "Duplicate request" 메시지 확인
- 사용자 불만 없음