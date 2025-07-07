# Railway 운영 환경 긴급 마이그레이션 가이드

## 🚨 긴급 조치 필요
프로덕션 DB에 마이그레이션이 적용되지 않아 500 에러가 발생하고 있습니다.

## 방법 1: Railway CLI 사용 (권장)

1. Railway CLI 설치 (이미 설치되어 있다면 건너뛰기)
```bash
npm install -g @railway/cli
```

2. Railway 프로젝트에 연결
```bash
railway login
railway link
```

3. Railway 환경에서 마이그레이션 실행
```bash
railway run python manage.py showmigrations
railway run python manage.py migrate --verbosity 2
```

## 방법 2: Railway 대시보드에서 실행

1. https://railway.app 로그인
2. VideoPlanet 백엔드 서비스 선택
3. 우측 상단 "Command Palette" (Cmd/Ctrl + K) 열기
4. "Connect" 선택하여 셸 접속
5. 다음 명령어 순서대로 실행:

```bash
# 1. 현재 상태 확인
python manage.py showmigrations

# 2. 마이그레이션 실행
python manage.py migrate

# 3. 테이블 확인
python manage.py shell
```

Shell에서:
```python
from django.db import connection
cursor = connection.cursor()

# video_planning 테이블 확인
cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'video_planning');")
print('video_planning exists:', cursor.fetchone()[0])

# projects_project.tone_manner 컬럼 확인
cursor.execute("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'projects_project' AND column_name = 'tone_manner');")
print('tone_manner exists:', cursor.fetchone()[0])

# projects_idempotencyrecord 테이블 확인
cursor.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects_idempotencyrecord');")
print('IdempotencyRecord exists:', cursor.fetchone()[0])
```

## 방법 3: 일회성 Job으로 실행

1. Railway 대시보드에서 백엔드 서비스 선택
2. "New" → "Job" 클릭
3. Command에 입력:
```
python manage.py migrate --noinput
```
4. "Run Job" 클릭

## 확인 필요 사항

마이그레이션 후 다음 테이블/컬럼이 존재해야 합니다:
- ✅ `video_planning` 테이블
- ✅ `video_planning_image` 테이블
- ✅ `projects_project.tone_manner` 컬럼
- ✅ `projects_project.genre` 컬럼
- ✅ `projects_project.concept` 컬럼
- ✅ `projects_idempotencyrecord` 테이블

## 문제 해결

만약 마이그레이션이 실패한다면:

1. **Fake 마이그레이션** (테이블은 있지만 마이그레이션 기록이 없는 경우)
```bash
python manage.py migrate --fake
```

2. **특정 앱만 마이그레이션**
```bash
python manage.py migrate projects
python manage.py migrate video_planning
```

3. **강제 마이그레이션** (주의: 데이터 손실 가능)
```bash
python manage.py migrate --run-syncdb
```

## 마이그레이션 후 확인

1. API 테스트:
```bash
curl https://videoplanet.up.railway.app/api/video-planning/recent/
curl https://videoplanet.up.railway.app/api/projects/
```

2. 로그 확인:
- Railway 대시보드 → Logs 탭에서 에러 메시지 확인

## 🎯 예상 결과

마이그레이션 성공 후:
- 500 Internal Server Error 해결
- 모든 API 정상 작동
- 프로젝트 생성, 비디오 기획 기능 정상화