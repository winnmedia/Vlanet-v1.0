# 프로젝트가 생겼다가 사라지는 문제 분석

## 증상
- 프로젝트가 생성된 후 목록에서 사라짐
- 생겼다가 없어졌다가를 반복

## 가능한 원인들

### 1. **트랜잭션 롤백**
현재 `views_idempotent_fixed.py`에서 트랜잭션 내에서 프로젝트를 생성하는데, 에러 발생 시 전체가 롤백될 수 있습니다.

```python
with transaction.atomic():
    project = models.Project.objects.create(user=user)
    # ... 여러 작업들
    # 만약 여기서 에러 발생하면 project 생성도 롤백됨
```

**특히 FeedBack 생성 실패가 원인일 수 있음:**
```python
# FeedBack 생성 시도 (트랜잭션 밖)
try:
    from feedbacks import models as feedback_model
    feedback = feedback_model.FeedBack.objects.create()
    project.feedback = feedback
    project.save()
except Exception as e:
    logger.warning(f"Could not create FeedBack: {str(e)}")
```

### 2. **멱등성 처리 오류**
- 동일한 요청이 여러 번 들어올 때, 하나는 성공하고 나머지는 실패
- 그러나 프론트엔드가 실패 응답을 받고 다시 시도할 수 있음

### 3. **프론트엔드 상태 관리 문제**
- 프로젝트 목록 캐싱 문제
- 생성 직후 목록을 다시 불러오는 타이밍 문제
- 여러 탭/창에서 동시에 작업할 때 상태 동기화 문제

### 4. **권한 문제**
```python
# ProjectDetail.delete()에서
if member.rating == "owner" or member.rating == "manager":
    project.delete()
```
- 잘못된 권한으로 인한 자동 삭제는 없어 보임

### 5. **CASCADE 삭제**
모든 관련 모델이 `on_delete=models.CASCADE`로 설정되어 있어, 다음 중 하나가 삭제되면 프로젝트도 삭제됨:
- User (사용자 계정)
- FeedBack (피드백 객체)

### 6. **데이터베이스 제약 조건**
IdempotencyRecord의 unique_together 제약으로 인한 충돌 가능성

## 즉시 확인해야 할 사항

### 1. 로그 확인
```bash
# Railway 로그에서 확인
grep -E "PROJECT CREATION|Error creating project|Traceback" logs.txt
```

### 2. 데이터베이스 직접 확인
```sql
-- 최근 생성된 프로젝트 확인
SELECT id, name, created, updated FROM projects_project 
ORDER BY created DESC LIMIT 10;

-- 삭제된 프로젝트가 있는지 확인 (soft delete 사용 시)
SELECT * FROM projects_project WHERE deleted_at IS NOT NULL;
```

### 3. FeedBack 테이블 문제 확인
```sql
-- FeedBack 테이블 구조 확인
\d feedbacks_feedback;

-- 프로젝트와 피드백 관계 확인
SELECT p.id, p.name, p.feedback_id, f.id 
FROM projects_project p 
LEFT JOIN feedbacks_feedback f ON p.feedback_id = f.id 
WHERE p.created > NOW() - INTERVAL '1 hour';
```

## 임시 해결 방안

### 1. FeedBack 생성 비활성화
`views_idempotent_fixed.py`에서 FeedBack 생성 부분을 주석 처리:
```python
# FeedBack 생성을 트랜잭션 밖에서 시도
# try:
#     from feedbacks import models as feedback_model
#     feedback = feedback_model.FeedBack.objects.create()
#     project.feedback = feedback
#     project.save()
#     logger.info("FeedBack created successfully after transaction")
# except Exception as e:
#     logger.warning(f"Could not create FeedBack (non-critical): {str(e)}")
```

### 2. 더 자세한 로깅 추가
```python
logger.info(f"Project {project.id} created successfully")
logger.info(f"Project exists check: {models.Project.objects.filter(id=project.id).exists()}")
```

### 3. 프론트엔드에서 프로젝트 목록 강제 새로고침
프로젝트 생성 후:
```javascript
// 약간의 지연 후 목록 새로고침
setTimeout(() => {
    dispatch(fetchProjectList());
}, 1000);
```

## 권장 사항

1. **트랜잭션 범위 축소**
   - 핵심 생성 로직만 트랜잭션 내에 포함
   - FeedBack 같은 선택적 요소는 트랜잭션 밖에서 처리

2. **Soft Delete 구현**
   - 실제 삭제 대신 `deleted_at` 필드 사용
   - 삭제된 프로젝트 복구 가능

3. **감사 로그 추가**
   - 프로젝트 생성/삭제 시 별도 로그 테이블에 기록
   - 누가, 언제, 왜 삭제했는지 추적 가능

4. **프론트엔드 상태 관리 개선**
   - Redux 또는 Context API로 중앙 집중식 상태 관리
   - 실시간 동기화 또는 폴링으로 최신 상태 유지