
# Gmail 이메일 발송 설정 가이드

## 1. Gmail 앱 비밀번호 생성

### 사전 요구사항
- Google 계정에 2단계 인증이 활성화되어 있어야 합니다.

### 단계별 설정

1. **2단계 인증 활성화**
   - https://myaccount.google.com/security 접속
   - "2단계 인증" 클릭
   - 안내에 따라 2단계 인증 설정

2. **앱 비밀번호 생성**
   - https://myaccount.google.com/apppasswords 접속
   - 앱 선택: "메일"
   - 기기 선택: "기타" → "VideoPlanet" 입력
   - "생성" 클릭
   - 16자리 비밀번호 복사 (공백 제외)

## 2. Railway 환경변수 설정

Railway 대시보드에서 다음 환경변수 추가:

```
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop (공백 제거하여 입력)
DEFAULT_FROM_EMAIL=VideoPlanet <your-email@gmail.com>
```

## 3. 이메일 발송 테스트

```python
# Django shell에서 테스트
python manage.py shell

from django.core.mail import send_mail
send_mail(
    'Test Email',
    'This is a test email from VideoPlanet.',
    'your-email@gmail.com',
    ['recipient@example.com'],
    fail_silently=False,
)
```

## 문제 해결

### "Username and Password not accepted" 오류
- 일반 Gmail 비밀번호가 아닌 앱 비밀번호를 사용했는지 확인
- 2단계 인증이 활성화되어 있는지 확인

### "Please log in via your web browser" 오류
- Gmail 계정에서 "보안 수준이 낮은 앱 액세스"를 허용
- https://myaccount.google.com/lesssecureapps

### 이메일이 발송되지 않는 경우
1. 환경변수가 올바르게 설정되었는지 확인
2. Gmail 계정에서 의심스러운 활동 알림 확인
3. 방화벽이 포트 587을 차단하지 않는지 확인
