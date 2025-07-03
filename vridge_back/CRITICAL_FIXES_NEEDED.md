# VideoPlanet Critical Fixes Needed

## 🚨 즉시 수정이 필요한 보안 취약점

### 1. HttpOnly 쿠키 설정 (보안 위험: HIGH)
**파일**: `users/views.py`, `users/views_auth.py`
```python
# 현재 (취약함)
res.set_cookie("vridge_session", vridge_session, ...)

# 수정 필요
res.set_cookie(
    "vridge_session",
    vridge_session,
    httponly=True,  # XSS 방지
    samesite="Lax",  # CSRF 방지
    secure=True,
    max_age=2419200
)
```

### 2. 비밀번호 재설정 보안 강화 (보안 위험: HIGH)
**파일**: `users/views_auth.py`
```python
# ResetPassword 클래스에 다음 추가:
- 인증번호 해시 저장
- 만료 시간 설정 (10분)
- Rate limiting (IP당 분당 3회)
- 토큰 검증 추가
```

### 3. SQL 인젝션 방지 (보안 위험: MEDIUM)
**파일**: `feedbacks/views.py`
```python
# Raw SQL을 ORM으로 변경 권장
# 또는 파라미터 바인딩 확실히 검증
```

### 4. CSRF 보호 활성화 (보안 위험: MEDIUM)
**파일**: 여러 views.py 파일
```python
# @csrf_exempt 제거하고 프론트엔드에서 CSRF 토큰 처리
```

## 🔧 기능 오류 수정

### 1. WebSocket URL 하드코딩 (Feedback.jsx)
```javascript
// 현재
const ws = new WebSocket(`ws://localhost:8000/ws/chat/${project_id}/`)

// 수정
const wsUrl = process.env.REACT_APP_WS_URL || 'wss://videoplanet.up.railway.app'
const ws = new WebSocket(`${wsUrl}/ws/chat/${project_id}/`)
```

### 2. HTTP 상태 코드 수정
```python
# 권한 없음: 500 → 403
# 리소스 없음: 500 → 404
# 잘못된 요청: 500 → 400
# 인증 필요: 500 → 401
```

### 3. 메모리 누수 방지
```javascript
// useEffect cleanup 함수 추가
useEffect(() => {
  const timer = setInterval(...);
  return () => clearInterval(timer);
}, []);
```

## 📊 성능 개선

### 1. 데이터베이스 인덱스 추가
```python
# users/models.py
class User(AbstractUser):
    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
        ]

# projects/models.py
class Project(TimeStampedModel):
    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['created']),
        ]
```

### 2. N+1 쿼리 문제 해결
```python
# select_related, prefetch_related 사용
projects = Project.objects.select_related('user').prefetch_related('members')
```

## 🏗️ 구조 개선

### 1. JWT 라이브러리 통일
- 모든 인증에서 SimpleJWT 사용
- 소셜 로그인 코드 리팩토링

### 2. 에러 처리 표준화
```python
# common/exceptions.py 생성
class APIException:
    @staticmethod
    def bad_request(message="잘못된 요청입니다."):
        return JsonResponse({"error": message}, status=400)
    
    @staticmethod
    def unauthorized(message="인증이 필요합니다."):
        return JsonResponse({"error": message}, status=401)
    
    @staticmethod
    def forbidden(message="권한이 없습니다."):
        return JsonResponse({"error": message}, status=403)
    
    @staticmethod
    def not_found(message="리소스를 찾을 수 없습니다."):
        return JsonResponse({"error": message}, status=404)
```

### 3. 로깅 시스템 구현
```python
# print() 문을 로거로 교체
import logging
logger = logging.getLogger(__name__)
```

## 우선순위
1. **긴급 (24시간 내)**: HttpOnly 쿠키, 비밀번호 재설정 보안
2. **높음 (1주일 내)**: SQL 인젝션 방지, CSRF 보호, WebSocket URL
3. **중간 (2주일 내)**: HTTP 상태 코드, 메모리 누수, JWT 통일
4. **낮음 (1개월 내)**: 인덱스 추가, 에러 처리 표준화, 로깅