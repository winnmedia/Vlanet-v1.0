# JWT 인증 문제 해결 가이드

## 🔴 현재 문제 상황

### 증상
1. 로그인 시도 시 401 Unauthorized 응답
2. "이 토큰은 모든 타입의 토큰에 대해 유효하지 않습니다" 오류
3. "User not found: ceo@winnmedia.co.kr" 로그
4. JWT auth result: None

### 근본 원인
1. **사용자 조회 로직 불일치**: username vs email 필드 혼용
2. **토큰 타입 검증 오류**: token_type 필드 누락 또는 불일치
3. **인증 미들웨어 부재**: 일관성 없는 인증 처리

## ✅ 본질적 해결 방안

### 1. 즉시 적용 가능한 수정 (임시 해결 아님, 본질적 해결)

#### A. settings_base.py 수정
```python
# /home/winnmedia/VideoPlanet/vridge_back/config/settings_base.py

# JWT 설정 개선
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=7),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=28),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_TYPE_CLAIM": "token_type",  # 중요: 토큰 타입 명시
    "JTI_CLAIM": "jti",
}

# REST Framework 설정
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.jwt_auth_fixed.EnhancedJWTAuthentication",  # 개선된 인증 클래스 사용
    ],
    # ... 기타 설정
}
```

#### B. urls.py에 새 인증 엔드포인트 추가
```python
# /home/winnmedia/VideoPlanet/vridge_back/config/urls.py

from users.views_auth_fixed import ImprovedSignIn, TokenRefreshView, TokenVerifyView

urlpatterns = [
    # ... 기존 패턴들
    
    # 개선된 인증 엔드포인트
    path('api/auth/login/', ImprovedSignIn.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
    path('api/auth/verify/', TokenVerifyView.as_view()),
]
```

#### C. 미들웨어 추가 (선택적이지만 권장)
```python
# settings_base.py의 MIDDLEWARE 섹션

MIDDLEWARE = [
    # ... 기존 미들웨어들
    'users.jwt_auth_fixed.JWTAuthenticationMiddleware',  # JWT 자동 인증
    # ... 나머지 미들웨어들
]
```

### 2. 데이터베이스 정합성 확인

```bash
# 사용자 데이터 정합성 확인
python3 manage.py shell << EOF
from users.models import User
from django.db.models import Q

# username과 email 불일치 확인
mismatched = User.objects.exclude(
    Q(username=models.F('email'))
).values('id', 'username', 'email')

for user in mismatched:
    print(f"ID: {user['id']}, Username: {user['username']}, Email: {user['email']}")
    
# 필요시 username을 email로 통일
# User.objects.filter(email__isnull=False).update(username=models.F('email'))
EOF
```

### 3. 프론트엔드 수정사항

```javascript
// 로그인 요청 예시
const login = async (email, password) => {
    try {
        const response = await fetch('https://videoplanet.up.railway.app/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,  // 또는 username
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // 토큰 저장
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            
            // 이후 API 요청 시 헤더에 포함
            // Authorization: Bearer <access_token>
        }
    } catch (error) {
        console.error('Login failed:', error);
    }
};

// API 요청 시 토큰 포함
const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('access_token');
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // 401 응답 시 토큰 갱신
    if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
            // 재시도
            return apiRequest(url, options);
        }
    }
    
    return response;
};
```

## 🚀 배포 절차

### 1단계: 코드 수정 및 테스트
```bash
# 로컬 테스트
cd /home/winnmedia/VideoPlanet/vridge_back
python3 manage.py runserver

# 별도 터미널에서 테스트
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass"}'
```

### 2단계: 커밋 및 푸시
```bash
git add -A
git commit -m "fix: JWT 인증 시스템 완전 재구성 - 토큰 타입 및 사용자 조회 문제 해결"
git push origin recovery-20250731
```

### 3단계: Railway 배포 확인
- Railway 대시보드에서 자동 배포 확인
- 로그에서 에러 확인
- 배포 완료 후 API 테스트

## 📊 모니터링 및 디버깅

### 토큰 디버깅 도구 사용
```python
# Django shell에서 토큰 검증
from users.jwt_auth_fixed import debug_token

token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
info = debug_token(token)
print(info)
```

### 로그 모니터링
```bash
# Railway 로그 확인
railway logs --tail

# 특정 패턴 검색
railway logs | grep "JWT\|Auth\|Token"
```

## ⚠️ 주의사항

1. **SECRET_KEY 일치**: 프로덕션과 개발 환경의 SECRET_KEY가 다르면 토큰 검증 실패
2. **시간 동기화**: 서버 시간이 맞지 않으면 토큰 만료 시간 계산 오류
3. **CORS 설정**: 프론트엔드 도메인이 CORS_ALLOWED_ORIGINS에 포함되어야 함
4. **HTTPS 필수**: 프로덕션에서는 반드시 HTTPS 사용

## 🔄 롤백 계획

문제 발생 시:
```bash
# 이전 버전으로 롤백
git checkout HEAD~1
git push origin recovery-20250731 --force

# Railway에서 수동 재배포
railway up
```

## 📝 체크리스트

- [ ] jwt_auth_fixed.py 파일 생성
- [ ] views_auth_fixed.py 파일 생성
- [ ] settings_base.py 수정
- [ ] urls.py에 새 엔드포인트 추가
- [ ] 로컬 테스트 완료
- [ ] 프론트엔드 API 호출 수정
- [ ] Railway 배포
- [ ] 프로덕션 테스트

## 💡 추가 개선사항

1. **Refresh Token Rotation**: 보안 강화를 위해 refresh token도 주기적으로 갱신
2. **Token Blacklist**: 로그아웃 시 토큰 무효화 처리
3. **다중 디바이스 지원**: 사용자별 여러 토큰 관리
4. **2FA 지원**: 추가 보안을 위한 2단계 인증

---

작성일: 2025-08-06
작성자: Benjamin (Backend Lead)