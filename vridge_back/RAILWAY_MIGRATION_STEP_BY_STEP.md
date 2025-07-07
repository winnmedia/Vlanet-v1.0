# 🚨 Railway 운영 서버 마이그레이션 Step-by-Step 가이드

## 📋 사전 확인 사항

### 현재 문제
- `column projects_project.tone_manner does not exist`
- `relation "projects_idempotencyrecord" does not exist`
- `relation "video_planning" does not exist`

### 해결 방법 3가지

---

## 방법 1: 웹 브라우저로 즉시 실행 (가장 쉬움) 🌐

### 1단계: 배포 완료 확인
- GitHub 푸시 후 5-10분 대기
- Railway 대시보드에서 배포 상태 확인

### 2단계: 브라우저에서 실행
```
https://videoplanet.up.railway.app/emergency-migrate/?secret=migrate2024
```

### 3단계: 실패 시 강제 모드
```
https://videoplanet.up.railway.app/emergency-migrate/?secret=migrate2024&force=true
```

### 4단계: 결과 확인
성공 시:
```json
{
  "status": "completed",
  "message": "All migrations applied successfully!",
  "verified_tables": ["video_planning", "projects_project", "projects_idempotencyrecord"],
  "verified_columns": ["tone_manner", "genre", "concept"]
}
```

---

## 방법 2: Railway CLI 사용 🖥️

### 1단계: Railway CLI 설치 및 연결
```bash
# CLI 설치 (이미 있으면 건너뛰기)
npm install -g @railway/cli

# 로그인 및 프로젝트 연결
railway login
railway link
```

### 2단계: 마이그레이션 파일 확인
```bash
# Railway 환경에서 실행
railway run ls projects/migrations/
railway run cat projects/migrations/0017_project_concept_project_genre_project_tone_manner.py
```

### 3단계: 마이그레이션 상태 확인
```bash
railway run python manage.py showmigrations projects
railway run python manage.py showmigrations video_planning
```

### 4단계: 마이그레이션 실행
```bash
# 기본 마이그레이션
railway run python manage.py migrate --verbosity 2

# 또는 특정 앱만
railway run python manage.py migrate projects
railway run python manage.py migrate video_planning
```

### 5단계: 강제 마이그레이션 (필요시)
```bash
# 강제 스크립트 실행
railway run python force_migrate.py

# 또는 fake 마이그레이션
railway run python manage.py migrate projects 0017 --fake
```

### 6단계: DB 검증
```bash
railway run python manage.py shell << 'EOF'
from django.db import connection
with connection.cursor() as cursor:
    # 테이블 확인
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('video_planning', 'projects_project', 'projects_idempotencyrecord')
    """)
    print("Tables:", [row[0] for row in cursor.fetchall()])
    
    # 컬럼 확인
    cursor.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'projects_project' 
        AND column_name IN ('tone_manner', 'genre', 'concept')
    """)
    print("Columns:", [row[0] for row in cursor.fetchall()])
EOF
```

---

## 방법 3: Railway 대시보드 Web Shell 🌍

### 1단계: Railway 대시보드 접속
1. https://railway.app 로그인
2. VideoPlanet 백엔드 서비스 선택

### 2단계: Web Shell 열기
1. 우측 상단 Command Palette (Cmd/Ctrl + K)
2. "Connect" 선택
3. Shell 접속

### 3단계: 마이그레이션 실행
```bash
# 현재 상태 확인
python manage.py showmigrations

# 마이그레이션 실행
python manage.py migrate

# 실패 시 강제 실행
python force_migrate.py
```

### 4단계: PostgreSQL 직접 확인
```bash
python manage.py dbshell
```

PostgreSQL 프롬프트에서:
```sql
-- 테이블 목록
\dt

-- projects_project 구조
\d projects_project

-- tone_manner 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects_project' 
AND column_name IN ('tone_manner', 'genre', 'concept');

-- IdempotencyRecord 테이블 확인
\d projects_idempotencyrecord

-- video_planning 테이블 확인
\d video_planning
```

---

## 🔍 검증 체크리스트

### DB 레벨 검증
- [ ] `video_planning` 테이블 존재
- [ ] `video_planning_image` 테이블 존재
- [ ] `projects_project.tone_manner` 컬럼 존재
- [ ] `projects_project.genre` 컬럼 존재
- [ ] `projects_project.concept` 컬럼 존재
- [ ] `projects_idempotencyrecord` 테이블 존재

### API 레벨 검증
```bash
# 프로젝트 목록
curl https://videoplanet.up.railway.app/api/projects/

# 비디오 기획 최근 목록
curl https://videoplanet.up.railway.app/api/video-planning/recent/

# 프로젝트 생성 테스트 (POST)
curl -X POST https://videoplanet.up.railway.app/api/projects/atomic-create/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Test Project", "manager": "Test Manager", "consumer": "Test Consumer"}'
```

### 프론트엔드 검증
1. https://vlanet.net 접속
2. 로그인
3. 프로젝트 생성 페이지에서 새 프로젝트 생성
4. 500 에러가 발생하지 않아야 함

---

## 🚨 문제 해결

### "migration conflict" 에러
```bash
# 특정 마이그레이션으로 롤백
railway run python manage.py migrate projects 0016

# 다시 최신으로 마이그레이션
railway run python manage.py migrate projects
```

### "relation already exists" 에러
```bash
# fake 마이그레이션 사용
railway run python manage.py migrate projects 0017 --fake
```

### 수동 SQL 실행 (최후의 수단)
```bash
railway run python manage.py dbshell
```

```sql
-- tone_manner 컬럼 수동 추가
ALTER TABLE projects_project 
ADD COLUMN IF NOT EXISTS tone_manner VARCHAR(50),
ADD COLUMN IF NOT EXISTS genre VARCHAR(50),
ADD COLUMN IF NOT EXISTS concept VARCHAR(50);

-- IdempotencyRecord 테이블 수동 생성
CREATE TABLE IF NOT EXISTS projects_idempotencyrecord (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users_user(id),
    idempotency_key VARCHAR(255) NOT NULL,
    project_id INTEGER,
    request_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'processing',
    UNIQUE(user_id, idempotency_key)
);

-- video_planning 테이블은 migrate로 생성해야 함
\q
python manage.py migrate video_planning
```

---

## 📊 최종 보고 템플릿

### 성공 시:
```
✅ Railway 운영 서버 마이그레이션 완료

1. 실행 방법: [웹 브라우저 / Railway CLI / Web Shell]
2. 마이그레이션 적용:
   - projects: 0001 ~ 0017 ✓
   - video_planning: 0001 ~ 0002 ✓
3. DB 검증 완료:
   - tone_manner 컬럼 ✓
   - IdempotencyRecord 테이블 ✓
   - video_planning 테이블 ✓
4. API 테스트: 200 OK
5. 프론트엔드 기능: 정상 작동
```

### 실패 시:
```
❌ 마이그레이션 에러 발생

1. 에러 메시지:
[전체 에러 로그 복사]

2. 시도한 방법:
- [ ] 일반 migrate
- [ ] 강제 migrate
- [ ] fake migrate

3. 현재 상태:
- showmigrations 결과: [복사]
- DB 테이블 상태: [복사]
```

---

## 📞 추가 지원

문제 지속 시:
1. Railway 로그 전체 캡처
2. `python manage.py showmigrations` 결과
3. PostgreSQL `\dt` 및 `\d projects_project` 결과
4. 에러 메시지 전문

위 정보와 함께 공유해 주시면 즉시 해결 방안을 제시하겠습니다!