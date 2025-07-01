# VideoPlanet 회원가입 이메일 인증 구현 계획

## 현재 상황 분석

### 백엔드
- ✅ 이메일 발송 시스템 정상 작동
- ✅ `EmailVerify` 모델 존재
- ✅ `SendAuthNumber`, `EmailAuth` API 엔드포인트 구현됨
- ❌ 회원가입 시 이메일 인증 미적용

### 프론트엔드
- ✅ 이메일 인증 컴포넌트(`AuthEmail.jsx`) 존재
- ❌ 회원가입 플로우에서 이메일 인증 단계 없음
- 현재: 회원가입 → 즉시 로그인 → 대시보드

## 구현 방안

### 방안 1: 회원가입 전 이메일 인증 (권장)
```
1. 이메일 입력
2. 인증번호 발송
3. 인증번호 확인
4. 나머지 정보 입력 (닉네임, 비밀번호)
5. 회원가입 완료
```

**장점:**
- 가짜 이메일 차단
- 사용자가 이메일을 정확히 입력했는지 확인
- 스팸 계정 방지

### 방안 2: 회원가입 후 이메일 인증
```
1. 모든 정보 입력 (이메일, 닉네임, 비밀번호)
2. 회원가입 (미인증 상태)
3. 이메일 인증 요청
4. 인증 완료 시 정식 계정 활성화
```

**장점:**
- 빠른 회원가입 경험
- 나중에 인증 가능

**단점:**
- 미인증 계정 관리 필요
- 복잡한 상태 관리

## 구현 계획 (방안 1 기준)

### 1. 백엔드 수정사항

#### A. User 모델에 이메일 인증 상태 추가
```python
# users/models.py
class User(AbstractUser):
    # ... 기존 필드 ...
    email_verified = models.BooleanField(default=False, verbose_name="이메일 인증 여부")
    email_verified_at = models.DateTimeField(null=True, blank=True, verbose_name="이메일 인증 일시")
```

#### B. 회원가입 API 수정
```python
# 회원가입 프로세스를 2단계로 분리
1. /users/signup/request - 이메일 검증 및 인증번호 발송
2. /users/signup/complete - 인증번호 확인 후 회원가입 완료
```

### 2. 프론트엔드 수정사항

#### A. 회원가입 페이지 UI 변경
- Step 1: 이메일 입력 및 인증
- Step 2: 닉네임, 비밀번호 입력

#### B. 상태 관리
```javascript
const [step, setStep] = useState(1); // 1: 이메일 인증, 2: 정보 입력
const [verifiedEmail, setVerifiedEmail] = useState('');
const [authToken, setAuthToken] = useState(''); // 임시 토큰
```

### 3. API 엔드포인트 설계

#### POST /users/signup/request
**요청:**
```json
{
  "email": "user@example.com"
}
```

**응답:**
```json
{
  "message": "인증번호가 이메일로 발송되었습니다.",
  "email": "user@example.com"
}
```

#### POST /users/signup/verify
**요청:**
```json
{
  "email": "user@example.com",
  "auth_number": "123456"
}
```

**응답:**
```json
{
  "message": "이메일 인증이 완료되었습니다.",
  "auth_token": "temporary-token-for-signup"
}
```

#### POST /users/signup/complete
**요청:**
```json
{
  "email": "user@example.com",
  "auth_token": "temporary-token-for-signup",
  "nickname": "사용자닉네임",
  "password": "password123"
}
```

**응답:**
```json
{
  "message": "회원가입이 완료되었습니다.",
  "vridge_session": "jwt-token",
  "user": "user@example.com"
}
```

## 보안 고려사항

1. **인증번호 유효시간**: 3분
2. **인증 시도 제한**: 5회
3. **임시 토큰**: 10분 유효
4. **Rate Limiting**: IP당 시간당 10회

## 사용자 경험 개선

1. **인증번호 재발송**: 30초 후 가능
2. **진행 상태 표시**: Progress bar
3. **오류 메시지**: 명확한 안내
4. **로딩 상태**: 각 단계별 표시

## 구현 우선순위

1. 백엔드 API 수정
2. 프론트엔드 이메일 인증 단계 추가
3. 테스트 및 검증
4. 배포