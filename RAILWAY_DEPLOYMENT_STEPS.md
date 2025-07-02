# Railway 배포 단계별 가이드

## 1. 코드 푸시
```bash
git push origin main
```

## 2. Railway 자동 배포
Railway는 GitHub 연동되어 있어 자동으로 배포가 시작됩니다.

## 3. Railway 콘솔에서 마이그레이션 실행

### 방법 1: Railway CLI 사용
```bash
railway run python manage.py migrate projects
```

### 방법 2: Railway 웹 콘솔 사용
1. Railway Dashboard 접속
2. 프로젝트 선택
3. "Shell" 또는 "Console" 열기
4. 다음 명령어 실행:
```bash
cd vridge_back
python manage.py migrate projects
```

## 4. 캐시 설정 확인

### Redis 사용 시 (권장)
1. Railway 환경변수에 `REDIS_URL` 추가
2. Railway에서 Redis 애드온 추가 또는 외부 Redis 서비스 연결

### 데이터베이스 캐시 사용 시
```bash
python manage.py createcachetable django_cache_table
```

## 5. 배포 확인

### 로그 확인
```bash
railway logs
```

다음 메시지 확인:
- "Redis cache configured" 또는 "Using database cache as fallback"
- "Migrations for 'projects'" 

### 테스트
1. 프로젝트 생성 테스트
2. 빠르게 2번 클릭해도 1개만 생성되는지 확인
3. 날짜 형식 오류 시 적절한 에러 메시지 확인

## 6. 문제 발생 시

### 마이그레이션 오류
```bash
python manage.py showmigrations projects
python manage.py migrate projects --fake 0013
python manage.py migrate projects
```

### 캐시 관련 오류
```bash
python test_cache_availability.py
```

### 롤백 필요 시
1. `urls.py`에서 이전 뷰로 변경:
```python
path("create", views_idempotent.CreateProjectIdempotent.as_view()),
```
2. 재배포

## 7. 모니터링

### 중복 생성 체크
```bash
railway logs | grep -E "DUPLICATE|duplicate_prevented"
```

### 에러 확인
```bash
railway logs | grep -E "ERROR|Error|error"
```

## 완료 체크리스트
- [ ] 코드 푸시 완료
- [ ] Railway 자동 배포 성공
- [ ] 마이그레이션 실행 완료
- [ ] 캐시 설정 확인
- [ ] 프로젝트 생성 테스트 성공
- [ ] 중복 생성 방지 확인