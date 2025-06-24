# 🔐 보안 가이드

## 🚨 중요 보안 사항

### 환경 변수 관리
모든 민감한 정보는 환경 변수로 관리해야 합니다.

#### GitHub Secrets 설정 필요
```
GABIA_HOST=your-domain.com
GABIA_USERNAME=호스팅계정명
GABIA_PASSWORD=호스팅비밀번호
DJANGO_SECRET_KEY=your-secret-key
DB_PASSWORD=your-db-password
TWELVE_LABS_API_KEY=your-api-key
```

### Django 보안 설정

#### 프로덕션 환경
```python
# config/settings/production.py
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
```

### 데이터베이스 보안
- 강력한 비밀번호 사용
- 최소 권한 원칙 적용
- 정기적인 백업 실시

### API 키 관리
- 환경 변수로 저장
- 정기적인 로테이션
- 최소 권한 부여

## 📋 보안 체크리스트

- [ ] 모든 API 키가 환경 변수로 관리되는지 확인
- [ ] DEBUG=False로 설정되어 있는지 확인
- [ ] HTTPS가 활성화되어 있는지 확인
- [ ] 데이터베이스 접근 권한이 적절한지 확인
- [ ] 정기적인 보안 업데이트 적용

## 🔒 보고된 취약점

보안 취약점을 발견하셨다면 다음 이메일로 연락해주세요:
security@videoplanet.com

## 📞 지원

보안 관련 문의:
- 이메일: security@videoplanet.com
- 긴급: urgent-security@videoplanet.com