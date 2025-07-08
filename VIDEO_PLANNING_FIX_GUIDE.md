# Video Planning Table Fix Guide

## 문제 요약
"relation 'video_planning' does not exist" 오류는 video_planning 테이블이 데이터베이스에 생성되지 않았음을 의미합니다.

## 원인
- 마이그레이션이 실행되었지만 실제 테이블이 생성되지 않음
- 또는 마이그레이션이 아예 실행되지 않음

## Railway에서 해결 방법

### 방법 1: Railway 콘솔에서 직접 실행

1. Railway 대시보드에서 백엔드 서비스 선택
2. "Console" 탭으로 이동
3. 다음 명령어 순서대로 실행:

```bash
# 마이그레이션 상태 확인
python manage.py showmigrations video_planning

# 마이그레이션 실행
python manage.py migrate video_planning

# 테이블 생성 확인
python manage.py shell
```

Shell에서:
```python
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'video_planning');")
print(cursor.fetchone()[0])  # True여야 함
```

### 방법 2: 수동 테이블 생성 (긴급 수정)

Railway 콘솔의 Django shell에서:

```python
from django.db import connection

with connection.cursor() as cursor:
    # video_planning 테이블 생성
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS video_planning (
            id BIGSERIAL PRIMARY KEY,
            created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            planning_text TEXT NOT NULL,
            planning_data JSONB DEFAULT '{}',
            status VARCHAR(20) DEFAULT 'created',
            user_id BIGINT REFERENCES users_user(id) ON DELETE CASCADE,
            title VARCHAR(200) DEFAULT '',
            session_id VARCHAR(100) DEFAULT '',
            metadata JSONB DEFAULT '{}'
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_video_planning_user ON video_planning(user_id);
        CREATE INDEX IF NOT EXISTS idx_video_planning_created ON video_planning(created);
        CREATE INDEX IF NOT EXISTS idx_video_planning_session ON video_planning(session_id);
    """)
    
    # video_planning_image 테이블 생성
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS video_planning_image (
            id BIGSERIAL PRIMARY KEY,
            created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            planning_id BIGINT NOT NULL REFERENCES video_planning(id) ON DELETE CASCADE,
            image_type VARCHAR(50) NOT NULL,
            image_url TEXT NOT NULL,
            prompt TEXT DEFAULT '',
            metadata JSONB DEFAULT '{}'
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_video_planning_image_planning ON video_planning_image(planning_id);
    """)
    
    print("Tables created successfully!")
```

### 방법 3: force_migrate.py 실행

프로젝트에 이미 포함된 force_migrate.py 스크립트 활용:

```bash
# Railway 콘솔에서
python force_migrate.py
```

이 스크립트는 자동으로:
- 누락된 테이블 확인
- 필요한 마이그레이션 실행
- 문제 해결 시도

## 검증

테이블이 생성되었는지 확인:

```python
from video_planning.models import VideoPlanning

# 테스트 레코드 생성
test = VideoPlanning.objects.create(
    planning_text="Test planning",
    planning_data={"test": True}
)
print(f"Created: {test.id}")

# 조회 테스트
count = VideoPlanning.objects.count()
print(f"Total records: {count}")
```

## 추가 확인사항

1. **마이그레이션 파일 존재 확인**:
   ```bash
   ls video_planning/migrations/
   ```
   - 0001_initial.py
   - 0002_alter_videoplanning_user.py

2. **Django 마이그레이션 기록 확인**:
   ```python
   from django.db import connection
   cursor = connection.cursor()
   cursor.execute("SELECT * FROM django_migrations WHERE app = 'video_planning';")
   print(cursor.fetchall())
   ```

3. **권한 문제 확인**:
   PostgreSQL 사용자가 테이블 생성 권한이 있는지 확인

## 예방 조치

1. **Procfile 업데이트** (이미 설정됨):
   ```
   release: python manage.py migrate
   web: gunicorn config.wsgi:application
   ```

2. **배포 시 자동 마이그레이션**:
   Railway는 release 명령을 자동 실행하므로, 향후 배포 시 자동으로 마이그레이션됨

## 문제가 지속될 경우

1. Railway PostgreSQL 데이터베이스 연결 정보 확인
2. DATABASE_URL 환경변수가 올바른지 확인
3. 데이터베이스 접속 권한 확인
4. Railway 지원팀에 문의

---
*이 가이드는 video_planning 테이블 누락 문제를 해결하기 위한 것입니다.*