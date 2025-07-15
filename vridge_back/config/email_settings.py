"""
이메일 설정 모듈
Gmail App Password 사용법 포함
"""

import os
from django.core.exceptions import ImproperlyConfigured

def configure_email_settings():
    """
    이메일 설정을 구성하고 검증합니다.
    SendGrid API를 우선적으로 사용합니다.
    """
    # SendGrid API 키가 있으면 SendGrid 사용
    if os.environ.get('SENDGRID_API_KEY'):
        settings = {
            'EMAIL_BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
            'EMAIL_HOST': 'smtp.sendgrid.net',
            'EMAIL_PORT': 587,
            'EMAIL_USE_TLS': True,
            'EMAIL_HOST_USER': 'apikey',
            'EMAIL_HOST_PASSWORD': os.environ.get('SENDGRID_API_KEY'),
            'DEFAULT_FROM_EMAIL': os.environ.get('DEFAULT_FROM_EMAIL', 'VideoPlanet <noreply@vlanet.net>')
        }
        print("✅ SendGrid 이메일 설정 활성화")
    else:
        # SendGrid가 없으면 Gmail 사용
        settings = {
            'EMAIL_BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
            'EMAIL_HOST': 'smtp.gmail.com',
            'EMAIL_PORT': 587,
            'EMAIL_USE_TLS': True,
            'EMAIL_HOST_USER': os.environ.get('EMAIL_HOST_USER', ''),
            'EMAIL_HOST_PASSWORD': os.environ.get('EMAIL_HOST_PASSWORD', ''),
            'DEFAULT_FROM_EMAIL': os.environ.get('DEFAULT_FROM_EMAIL', 'VideoPlanet <noreply@vlanet.net>')
        }
    
    # 개발 환경에서도 실제 이메일 발송 가능하도록 설정
    # 이메일 설정이 있으면 실제 발송, 없으면 콘솔 백엔드 사용
    if os.environ.get('DEBUG', 'False').lower() == 'true':
        if not settings['EMAIL_HOST_PASSWORD']:
            settings['EMAIL_BACKEND'] = 'django.core.mail.backends.console.EmailBackend'
            return settings
        # 이메일 설정이 있으면 실제 발송 진행
    
    # 프로덕션 환경에서는 이메일 설정 검증
    if not settings['EMAIL_HOST_PASSWORD']:
        # 환경변수가 설정되지 않은 경우 경고
        print("""
        ⚠️  이메일 환경변수가 설정되지 않았습니다!
        
        SendGrid 설정 방법:
        1. SendGrid 계정 생성: https://sendgrid.com
        2. API 키 생성:
           - Settings → API Keys → Create API Key
           - Full Access 권한 부여
           - 생성된 API 키 복사
        
        3. Railway 환경변수 설정:
           SENDGRID_API_KEY=SG.실제-api-키-입력
           DEFAULT_FROM_EMAIL=VideoPlanet <noreply@vlanet.net>
        
        또는 Gmail 앱 비밀번호 설정 방법:
        1. Google 계정 설정으로 이동: https://myaccount.google.com/security
        2. 2단계 인증 활성화
        3. 앱 비밀번호 생성:
           - https://myaccount.google.com/apppasswords
           - 앱 선택: 메일
           - 기기 선택: 기타 (VideoPlanet)
           - 생성된 16자리 비밀번호 복사
        
        4. Railway 환경변수 설정:
           EMAIL_HOST_USER=your-email@gmail.com
           EMAIL_HOST_PASSWORD=16자리-앱-비밀번호 (공백 없이)
           DEFAULT_FROM_EMAIL=VideoPlanet <your-email@gmail.com>
        
        참고: 일반 Gmail 비밀번호는 작동하지 않습니다. 반드시 앱 비밀번호를 사용하세요.
        """)
        
        # 이메일 기능을 비활성화하지 않고 콘솔 백엔드로 폴백
        settings['EMAIL_BACKEND'] = 'django.core.mail.backends.console.EmailBackend'
    
    return settings


# 이메일 설정 가이드 문서
EMAIL_SETUP_GUIDE = """
# 이메일 발송 설정 가이드

## SendGrid 설정 (권장)

### 장점
- 높은 발송 성공률
- 이메일 분석 기능 (오픈율, 클릭률)
- 일일 발송 한도 없음 (무료 플랜 100통/일)
- 더 나은 스팸 필터 회피

### 설정 방법

1. **SendGrid 계정 생성**
   - https://sendgrid.com 접속
   - 무료 계정 생성

2. **API 키 생성**
   - Settings → API Keys → Create API Key
   - API Key Name: VideoPlanet
   - API Key Permissions: Full Access
   - Create & View 클릭
   - 생성된 API 키 복사 (한 번만 표시됨!)

3. **Railway 환경변수 설정**
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   DEFAULT_FROM_EMAIL=VideoPlanet <noreply@vlanet.net>
   ```

4. **발신자 인증 (선택사항)**
   - Settings → Sender Authentication
   - Single Sender Verification 또는 Domain Authentication
   - 인증하면 발송 성공률 향상

## Gmail 설정 (대안)

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
"""

def save_email_guide():
    """이메일 설정 가이드를 파일로 저장"""
    with open('/home/winnmedia/VideoPlanet/vridge_back/EMAIL_SETUP_GUIDE.md', 'w', encoding='utf-8') as f:
        f.write(EMAIL_SETUP_GUIDE)
    print("이메일 설정 가이드가 EMAIL_SETUP_GUIDE.md 파일로 저장되었습니다.")

if __name__ == "__main__":
    save_email_guide()