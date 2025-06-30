# VideoPlanet 이메일 설정 가이드

## Railway 환경 변수 설정

### 1. Gmail 앱 비밀번호 생성

1. Google 계정으로 이동: https://myaccount.google.com/
2. 보안 → 2단계 인증 활성화
3. 보안 → 앱 비밀번호 생성
4. 앱 선택: "메일", 기기 선택: "기타(맞춤 이름)"
5. 이름 입력: "VideoPlanet"
6. 생성된 16자리 앱 비밀번호 복사

### 2. Railway 환경 변수 설정

Railway 대시보드에서 `vridge-back` 서비스 선택 후 Variables 탭에서 추가:

```env
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
```

또는 (이미 설정되어 있을 경우):

```env
GOOGLE_ID=your-gmail@gmail.com
GOOGLE_APP_PASSWORD=your-16-char-app-password
```

### 3. 선택적 설정

```env
DEFAULT_FROM_EMAIL=VideoPlanet <noreply@your-domain.com>
```

## 테스트 방법

### 로컬 테스트
```bash
cd vridge_back
python test_email_config.py
```

### Railway 콘솔 테스트
```bash
python manage.py shell
```

```python
from django.core.mail import send_mail
from django.conf import settings

# 설정 확인
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"Has password: {bool(settings.EMAIL_HOST_PASSWORD)}")

# 테스트 이메일 발송
send_mail(
    'Test Email',
    'This is a test email from VideoPlanet',
    settings.DEFAULT_FROM_EMAIL,
    ['your-test-email@example.com'],
    fail_silently=False,
)
```

## 문제 해결

### 이메일 발송 실패 시

1. **환경 변수 확인**
   - Railway Variables 탭에서 설정 확인
   - 앱 비밀번호가 정확한지 확인 (공백 없이)

2. **Gmail 설정 확인**
   - 2단계 인증이 활성화되어 있는지 확인
   - 앱 비밀번호가 유효한지 확인

3. **로그 확인**
   ```bash
   railway logs -s vridge-back
   ```

4. **일반적인 오류**
   - `SMTPAuthenticationError`: 이메일/비밀번호 확인
   - `SMTPServerDisconnected`: 네트워크 문제, 다시 시도
   - `Connection refused`: 포트 번호 확인 (587)

### 개발 환경 vs 프로덕션 환경

- **개발 환경**: 콘솔에 이메일 출력 (실제 발송 안 함)
- **프로덕션 환경**: Gmail SMTP를 통해 실제 이메일 발송

## 보안 주의사항

- 절대 실제 Gmail 비밀번호를 사용하지 마세요
- 반드시 앱 비밀번호를 생성해서 사용하세요
- 환경 변수는 Railway Variables에만 저장하세요
- 코드에 직접 비밀번호를 하드코딩하지 마세요