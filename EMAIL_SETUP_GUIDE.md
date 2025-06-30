# 이메일 인증 시스템 설정 가이드

## 1. Gmail SMTP 설정 (권장)

### Gmail 계정 설정
1. [Google 계정 설정](https://myaccount.google.com/) 접속
2. **보안** 탭 이동
3. **2단계 인증** 활성화 (필수)
4. **앱 비밀번호** 생성:
   - 2단계 인증 섹션에서 "앱 비밀번호" 클릭
   - 앱 선택: "메일"
   - 기기 선택: "기타(맞춤 이름)"
   - 이름 입력: "VideoPlanet"
   - 생성된 16자리 비밀번호 복사

### 환경 변수 설정

#### 로컬 개발 (.env 파일)
```env
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-digit-app-password
DEFAULT_FROM_EMAIL=VideoPlanet <your-email@gmail.com>
```

#### Railway 프로덕션
Railway 대시보드에서 환경 변수 추가:
```
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-digit-app-password
DEFAULT_FROM_EMAIL=VideoPlanet <your-email@gmail.com>
```

**중요**: Railway에서 환경 변수 설정 방법
1. [Railway 대시보드](https://railway.app) 접속
2. 프로젝트 선택 → 백엔드 서비스 클릭
3. Settings 탭 → Variables 섹션
4. 위 3개의 환경 변수 추가
5. 변경사항은 자동으로 적용되며 서비스가 재시작됩니다

## 2. 다른 이메일 서비스 사용 시

### SendGrid (대량 발송 시 권장)
```python
# settings_base.py 수정
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'
EMAIL_HOST_PASSWORD = 'your-sendgrid-api-key'
```

### Naver 메일
```python
EMAIL_HOST = 'smtp.naver.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-naver-id'
EMAIL_HOST_PASSWORD = 'your-naver-password'
```

## 3. 이메일 템플릿 확인

### 인증번호 이메일 템플릿
`vridge_back/templates/verify_email.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VideoPlanet 인증번호</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
        <h1 style="color: #333; text-align: center;">VideoPlanet</h1>
        <h2 style="color: #666; text-align: center;">이메일 인증</h2>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 16px; color: #333;">안녕하세요!</p>
            <p style="font-size: 16px; color: #333;">아래 인증번호를 입력해주세요:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #012fff; letter-spacing: 5px;">{{ secret }}</span>
            </div>
            <p style="font-size: 14px; color: #666;">이 인증번호는 10분간 유효합니다.</p>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">
            이 메일은 VideoPlanet에서 발송되었습니다.<br>
            문의사항은 support@vlanet.net으로 연락주세요.
        </p>
    </div>
</body>
</html>
```

### 초대 이메일 템플릿
`vridge_back/templates/invite_email.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VideoPlanet 프로젝트 초대</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
        <h1 style="color: #333; text-align: center;">VideoPlanet</h1>
        <h2 style="color: #666; text-align: center;">프로젝트 초대</h2>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 16px; color: #333;">안녕하세요!</p>
            <p style="font-size: 16px; color: #333;">{{ name }} 프로젝트에 초대되었습니다.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ url }}?uid={{ uid }}&token={{ token }}" 
                   style="display: inline-block; padding: 15px 30px; background: #012fff; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
                    프로젝트 참여하기
                </a>
            </div>
            <p style="font-size: 14px; color: #666;">
                버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
                <a href="{{ url }}?uid={{ uid }}&token={{ token }}" style="color: #012fff;">{{ url }}?uid={{ uid }}&token={{ token }}</a>
            </p>
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">
            이 메일은 VideoPlanet에서 발송되었습니다.<br>
            문의사항은 support@vlanet.net으로 연락주세요.
        </p>
    </div>
</body>
</html>
```

## 4. 테스트 방법

### Django Shell에서 테스트
```bash
cd vridge_back
python manage.py shell
```

```python
from django.core.mail import send_mail
from django.conf import settings

# 테스트 이메일 발송
send_mail(
    'VideoPlanet 테스트 메일',
    '이메일 설정이 정상적으로 작동합니다.',
    settings.DEFAULT_FROM_EMAIL,
    ['your-test-email@example.com'],
    fail_silently=False,
)
```

### API 테스트
```bash
# 회원가입 인증번호 발송 테스트
curl -X POST http://localhost:8000/api/users/send_authnumber/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 5. 문제 해결

### 일반적인 오류

1. **SMTPAuthenticationError**
   - Gmail: 2단계 인증 및 앱 비밀번호 확인
   - 이메일/비밀번호 오타 확인

2. **Connection refused**
   - 포트 번호 확인 (Gmail: 587)
   - 방화벽 설정 확인

3. **이메일이 도착하지 않음**
   - 스팸함 확인
   - DEFAULT_FROM_EMAIL 설정 확인
   - Gmail의 경우 "보안 수준이 낮은 앱 액세스" 확인

4. **Railway 환경에서 이메일이 발송되지 않음**
   - Railway 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
   - 백엔드 서비스 로그에서 [Email] 로그 확인
   - 환경 변수 이름이 정확한지 확인:
     * EMAIL_HOST_USER (이메일 주소)
     * EMAIL_HOST_PASSWORD (앱 비밀번호)
     * DEFAULT_FROM_EMAIL (발신자 표시 이름)

### 디버깅 모드
개발 중에는 콘솔에 이메일을 출력하도록 설정:
```python
# settings_dev.py
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

## 6. 프로덕션 체크리스트

- [ ] 실제 이메일 계정으로 환경 변수 설정
- [ ] Railway에 환경 변수 추가
- [ ] 이메일 템플릿 커스터마이징
- [ ] 발송 제한 설정 (스팸 방지)
- [ ] 이메일 발송 로그 모니터링