# 프로젝트 생성 관련 문제점 및 해결방안

## 발견된 주요 문제점

### 1. FeedBack 모델 이름 오류
**위치**: `projects/views.py` 439번 줄
**문제**: 
```python
feedback = feedback_model.FeedBack.objects.create()
```
- `FeedBack` 모델 이름이 대문자 B로 되어 있음
- import 문은 정확하지만 모델 이름 참조가 틀릴 가능성

**해결방안**:
- 정확한 대소문자 확인 필요
- `feedbacks/models.py`에서 클래스명은 `FeedBack`으로 확인됨

### 2. 날짜 파싱 문제
**위치**: `projects/views.py` CreateProject view (374-404번 줄)
**문제**:
- 프론트엔드에서 다양한 날짜 형식이 전송될 수 있음
- timezone 처리가 복잡함

**현재 처리 방식**:
1. "YYYY-MM-DD HH:mm" 형식 시도
2. "YYYY-MM-DD" 형식 시도
3. ISO 형식 시도

### 3. CORS 설정
**현재 설정**:
- `@csrf_exempt` 데코레이터 적용됨
- CORS 미들웨어는 올바른 순서로 설정됨
- 허용된 도메인: vlanet.net, vercel.app 도메인들

### 4. 에러 처리
**현재 상태**:
- 일반적인 에러 메시지만 반환
- 구체적인 디버깅 정보 부족

## 권장 해결 방안

### 1. 즉시 적용 가능한 수정사항

#### a. 더 구체적인 에러 로깅
```python
except Exception as e:
    logging.error(f"Project creation error: {str(e)}")
    logging.error(f"Error type: {type(e).__name__}")
    import traceback
    logging.error(f"Traceback: {traceback.format_exc()}")
```

#### b. 날짜 파싱 개선
- 프론트엔드와 날짜 형식 통일
- 명확한 타임존 처리

### 2. 디버깅 방법

1. **디버깅 스크립트 실행**:
   ```bash
   python debug_project_creation.py
   ```

2. **API 테스트**:
   ```bash
   python test_create_project.py
   ```

3. **로그 확인**:
   ```bash
   tail -f django.log | grep -i "project\|error"
   ```

### 3. 프론트엔드 확인사항

1. **요청 데이터 형식**:
   - `inputs`: 프로젝트 기본 정보 (name, manager, consumer, description)
   - `process`: 프로세스 단계 배열
   - `files`: 파일 목록 (선택사항)

2. **날짜 형식**:
   - 권장: "YYYY-MM-DD" 또는 ISO 8601 형식
   - 타임존 명시 권장

3. **인증 헤더**:
   - Authorization: Bearer {token}
   - 또는 쿠키: vridge_session

## 테스트 체크리스트

- [ ] 사용자 인증 확인
- [ ] 날짜 형식 검증
- [ ] FeedBack 모델 생성 확인
- [ ] 프로세스 단계별 객체 생성
- [ ] 트랜잭션 롤백 처리
- [ ] CORS 헤더 확인
- [ ] 에러 응답 형식

## 추가 권장사항

1. **API 문서화**: Swagger 또는 API 문서 작성
2. **유닛 테스트**: 프로젝트 생성 로직 테스트 추가
3. **프론트엔드 통합 테스트**: 실제 요청/응답 확인
4. **모니터링**: Sentry 등 에러 트래킹 도구 활용