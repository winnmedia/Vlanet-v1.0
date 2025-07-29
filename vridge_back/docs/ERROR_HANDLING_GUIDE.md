# VideoPlanet 백엔드 에러 처리 가이드

## 개요
이 문서는 VideoPlanet 백엔드의 표준화된 에러 처리 시스템 사용법을 설명합니다.

## 에러 응답 형식

### 에러 응답 구조
```json
{
  "error": {
    "type": "ERROR_TYPE",
    "message": "사용자 친화적인 메시지",
    "timestamp": "2025-01-29T12:34:56.789Z",
    "error_id": "550e8400-e29b-41d4-a716-446655440000",
    "details": {
      // 추가 정보 (선택사항)
    }
  }
}
```

### 성공 응답 구조
```json
{
  "success": true,
  "data": {
    // 응답 데이터
  },
  "timestamp": "2025-01-29T12:34:56.789Z"
}
```

## 사용 방법

### 1. APIResponse 클래스 사용 (권장)

```python
from common.decorators import APIResponse

class MyView(View):
    def get(self, request):
        # 성공 응답
        return APIResponse.success(data={"users": []})
        
        # 생성 성공 (201)
        return APIResponse.created(data={"id": 123})
        
        # 에러 응답들
        return APIResponse.bad_request("잘못된 입력값입니다.")
        return APIResponse.unauthorized("로그인이 필요합니다.")
        return APIResponse.forbidden("권한이 없습니다.")
        return APIResponse.not_found("리소스를 찾을 수 없습니다.")
        return APIResponse.conflict("이미 존재하는 데이터입니다.")
        return APIResponse.internal_error("서버 오류가 발생했습니다.")
```

### 2. 데코레이터 사용

#### @handle_errors
모든 예외를 자동으로 처리합니다.

```python
from common.decorators import handle_errors

@handle_errors
def my_view(request):
    # 예외가 발생해도 자동으로 적절한 에러 응답 생성
    data = json.loads(request.body)  # JSONDecodeError 자동 처리
    return JsonResponse({"success": True})
```

#### @validate_json_request
JSON 요청을 자동으로 검증합니다.

```python
from common.decorators import validate_json_request

@validate_json_request(required_fields=['email', 'password'])
def login_view(request):
    # request.json_data가 자동으로 추가됨
    data = request.json_data
    email = data['email']  # 이미 검증됨
```

#### @standardize_response
성공 응답을 자동으로 표준화합니다.

```python
from common.decorators import standardize_response

@standardize_response
def my_view(request):
    # dict를 반환하면 자동으로 표준 응답으로 변환
    return {"users": [{"id": 1, "name": "John"}]}
    
    # 상태 코드도 함께 반환 가능
    return {"message": "Created"}, 201
```

### 3. 미들웨어 자동 처리

ErrorHandlerMiddleware가 다음 예외들을 자동으로 처리합니다:

- `ValidationError` → 400 Bad Request
- `PermissionDenied` → 403 Forbidden
- `ObjectDoesNotExist` → 404 Not Found
- `AuthenticationFailed` → 401 Unauthorized
- `IntegrityError` → 409 Conflict
- `JSONDecodeError` → 400 Bad Request
- 기타 예외 → 500 Internal Server Error

## 마이그레이션 가이드

### 기존 코드를 단계적으로 마이그레이션

#### Before:
```python
class CheckEmail(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            
            if not email:
                return JsonResponse({"error": "Email required"}, status=400)
                
            if User.objects.filter(email=email).exists():
                return JsonResponse({"error": "Email exists"}, status=409)
                
            return JsonResponse({"success": True})
            
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
```

#### After:
```python
class CheckEmail(View):
    @handle_errors
    @validate_json_request(required_fields=['email'])
    def post(self, request):
        email = request.json_data['email']
        
        if User.objects.filter(email=email).exists():
            return APIResponse.conflict("이미 사용중인 이메일입니다.")
            
        return APIResponse.success({"available": True})
```

## 에러 타입 참조

| HTTP 상태 코드 | 에러 타입 | 사용 시기 |
|--------------|----------|---------|
| 400 | BAD_REQUEST | 잘못된 요청 파라미터 |
| 400 | VALIDATION_ERROR | 유효성 검증 실패 |
| 400 | JSON_PARSE_ERROR | JSON 파싱 실패 |
| 401 | UNAUTHORIZED | 인증 필요 |
| 401 | AUTHENTICATION_FAILED | 로그인 실패 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | NOT_FOUND | 리소스 없음 |
| 409 | CONFLICT | 중복 데이터 |
| 409 | INTEGRITY_ERROR | DB 무결성 위반 |
| 429 | TOO_MANY_REQUESTS | Rate limit 초과 |
| 500 | INTERNAL_SERVER_ERROR | 서버 오류 |

## 로깅

모든 에러는 자동으로 로깅됩니다:
- 고유한 error_id 생성
- 요청 경로, 메서드, 사용자 정보 포함
- 스택 트레이스 저장

## 프론트엔드 연동

프론트엔드에서는 다음과 같이 처리:

```javascript
try {
  const response = await axios.post('/api/users/signin/', data);
  // 성공 처리
} catch (error) {
  if (error.response?.data?.error) {
    const errorData = error.response.data.error;
    console.error(`Error Type: ${errorData.type}`);
    console.error(`Error Message: ${errorData.message}`);
    console.error(`Error ID: ${errorData.error_id}`);
    
    // 사용자에게 메시지 표시
    showAlert(errorData.message);
  }
}
```

## 주의사항

1. **일관성 유지**: 모든 API 엔드포인트에서 동일한 에러 형식 사용
2. **사용자 친화적 메시지**: 기술적 용어 대신 이해하기 쉬운 한국어 메시지 사용
3. **보안**: 프로덕션에서는 상세한 에러 정보 노출 금지
4. **로깅**: error_id를 통해 문제 추적 가능

## 테스트

테스트 스크립트 실행:
```bash
python test_error_handling.py
```

이 스크립트는 다양한 에러 시나리오를 테스트하고 응답 형식을 확인합니다.