# VideoPlanet 보안 가이드

이 문서는 VideoPlanet 프로젝트의 보안 모범 사례와 설정 가이드를 제공합니다.

## 📋 목차
1. [환경 설정](#환경-설정)
2. [보안 미들웨어](#보안-미들웨어)
3. [인증 및 인가](#인증-및-인가)
4. [입력 검증](#입력-검증)
5. [파일 업로드 보안](#파일-업로드-보안)
6. [배포 체크리스트](#배포-체크리스트)
7. [모니터링 및 로깅](#모니터링-및-로깅)

## 환경 설정

### 필수 환경변수 설정

#### 1. SECRET_KEY 생성 및 설정
```bash
# 안전한 SECRET_KEY 생성
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Railway 환경변수에 설정
# SECRET_KEY=생성된_키_값
```

⚠️ **주의사항**:
- 최소 50자 이상의 랜덤 문자열 사용
- 'django-insecure'로 시작하는 키는 사용 금지
- 절대 코드에 하드코딩하지 않음
- 정기적으로 키 로테이션 수행

#### 2. DEBUG 설정
```bash
# 프로덕션 환경
DEBUG=False

# 개발 환경에서만
DEBUG=True
```

#### 3. ALLOWED_HOSTS 설정
```bash
# 특정 도메인만 허용
ALLOWED_HOSTS=vlanet.net,www.vlanet.net,api.vlanet.net,videoplanet.up.railway.app
```

## 보안 미들웨어

### 1. Rate Limiting
- 로그인 시도: 5분당 5회 제한
- 회원가입: 10분당 3회 제한
- 비밀번호 재설정: 1시간당 3회 제한

### 2. Security Headers
자동으로 다음 헤더가 추가됩니다:
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HTTPS 환경)
- `Content-Security-Policy`

### 3. HTTPS 강제 (프로덕션)
```python
# 자동 설정됨
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
```

## 인증 및 인가

### JWT 토큰 설정
- Access Token: 7일
- Refresh Token: 28일
- 토큰 블랙리스트 기능 활성화

### 비밀번호 정책
- 최소 8자 이상
- 대문자, 소문자, 숫자, 특수문자 중 3가지 이상 포함
- 동일 문자 3회 이상 연속 사용 금지
- 순차적 패턴 금지 (예: 1234, abcd)

## 입력 검증

### 이메일 검증
- RFC 5322 표준 준수
- 최대 254자 제한
- XSS 패턴 차단

### 텍스트 입력 검증
다음 패턴 자동 차단:
- `<script>`, `</script>`
- `javascript:`
- `onload=`, `onerror=`
- SQL 인젝션 패턴

### 사용 예제
```python
from users.validators import InputValidator

# 이메일 검증
is_valid, error = InputValidator.validate_email(email)
if not is_valid:
    return JsonResponse({'error': error}, status=400)

# 텍스트 검증
is_valid, error = InputValidator.validate_text_input(
    text, "프로젝트명", max_length=100
)
```

## 파일 업로드 보안

### 허용된 파일 형식
- 이미지: jpg, jpeg, png, gif, webp (최대 10MB)
- 비디오: mp4, avi, mov, wmv, flv, webm (최대 500MB)
- 문서: pdf, doc, docx, xls, xlsx, ppt, pptx (최대 50MB)
- 오디오: mp3, wav, ogg, m4a, aac (최대 50MB)

### 파일 검증 프로세스
1. 확장자 검증
2. 파일 크기 제한
3. MIME 타입 검증
4. 실행 파일 시그니처 검사
5. 악성 코드 패턴 검사

### 사용 예제
```python
from users.validators import FileValidator

# 파일 검증
is_valid, error = FileValidator.validate_file(file, file_type='image')
if not is_valid:
    return JsonResponse({'error': error}, status=400)

# 안전한 파일명 생성
safe_filename = FileValidator.sanitize_filename(file.name)
```

## 배포 체크리스트

### 배포 전 필수 확인사항

#### 1. 환경변수 확인
- [ ] SECRET_KEY 설정 (50자 이상)
- [ ] DEBUG=False 설정
- [ ] ALLOWED_HOSTS 제한
- [ ] 데이터베이스 비밀번호 강도 확인
- [ ] API 키 최소 권한 설정

#### 2. 보안 설정 확인
- [ ] HTTPS 리다이렉트 활성화
- [ ] 보안 쿠키 설정 (Secure=True)
- [ ] HSTS 헤더 설정
- [ ] CSP 헤더 설정

#### 3. 의존성 보안
```bash
# 프론트엔드 취약점 확인
npm audit

# 자동 수정
npm audit fix
```

#### 4. 로그 설정
- [ ] 보안 이벤트 로깅 활성화
- [ ] 로그 파일 권한 설정
- [ ] 로그 로테이션 설정

## 모니터링 및 로깅

### 보안 이벤트 로깅
다음 이벤트가 자동으로 기록됩니다:
- 실패한 로그인 시도
- 의심스러운 입력 패턴
- Rate limit 초과
- 파일 업로드 실패

### 로그 파일 위치
- 일반 로그: `logs/django.log`
- 보안 로그: `logs/security.log`

### 로그 모니터링
```bash
# 실시간 보안 이벤트 모니터링
tail -f logs/security.log | grep "SECURITY_EVENT"

# 실패한 로그인 시도 확인
grep "FAILED_LOGIN" logs/security.log | tail -20
```

## 보안 업데이트

### 정기적인 보안 점검
1. **주간**: 의존성 취약점 스캔
2. **월간**: 보안 로그 분석
3. **분기별**: 전체 보안 감사
4. **연간**: SECRET_KEY 로테이션

### 취약점 보고
보안 취약점을 발견하신 경우:
1. 공개적으로 게시하지 마세요
2. security@vlanet.net으로 비공개 보고
3. 24시간 내 초기 대응
4. 패치 후 공개

## 추가 보안 권장사항

### 1. 개발 환경
- 프로덕션 데이터를 개발 환경에서 사용 금지
- 개발용 SECRET_KEY와 프로덕션 KEY 분리
- Git에 민감한 정보 커밋 금지

### 2. 팀 보안 교육
- 정기적인 보안 인식 교육
- OWASP Top 10 숙지
- 안전한 코딩 가이드라인 준수

### 3. 백업 및 복구
- 정기적인 데이터베이스 백업
- 백업 파일 암호화
- 복구 절차 정기 테스트

---

**마지막 업데이트**: 2024년 1월
**담당자**: VideoPlanet 보안팀