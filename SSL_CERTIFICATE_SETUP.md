# 🔒 SSL 인증서 설정 가이드

## 🚨 현재 문제: SSL 인증서 오류

**에러**: `net::ERR_CERT_COMMON_NAME_INVALID`
**원인**: vlanet.net 도메인에 적절한 SSL 인증서가 설정되지 않음

## 🔧 해결 방법

### 1단계: 가비아 SSL 인증서 신청

#### 가비아 무료 SSL (Let's Encrypt) - 권장
1. **My가비아** 로그인: https://my.gabia.com
2. **서비스 관리** → **웹호스팅** → **호스팅 관리**
3. **SSL 인증서 관리** 메뉴
4. **무료 SSL 인증서 신청** (Let's Encrypt)
5. **도메인**: vlanet.net 입력
6. **신청 완료** → 자동 설치 (보통 10-30분 소요)

#### 가비아 유료 SSL (더 안전함)
- **AlphaSSL**: 연 55,000원
- **RapidSSL**: 연 110,000원
- **와일드카드 SSL**: 연 330,000원

### 2단계: 임시 해결책 (개발 테스트용)

SSL 설치 전까지 **HTTP**로 접속:

```
❌ https://vlanet.net (SSL 오류)
✅ http://vlanet.net (임시 접속 가능)
```

### 3단계: 브라우저에서 강제 접속 (임시)

Chrome에서 임시로 접속하려면:
1. **고급** 버튼 클릭
2. **vlanet.net에 접속하기(안전하지 않음)** 클릭
3. ⚠️ 개발 테스트용으로만 사용

### 4단계: Django 설정 수정

SSL 설치 후 Django에서 HTTPS 강제 설정:

```python
# config/settings/production.py
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

## 🚀 가비아 SSL 신청 상세 단계

### 1. My가비아 접속 및 로그인
- https://my.gabia.com
- winnmedia 계정으로 로그인

### 2. 호스팅 관리 접속
- **서비스 관리** → **웹호스팅**
- vlanet.net 호스팅 **"관리"** 버튼 클릭

### 3. SSL 인증서 신청
- **SSL 인증서 관리** 또는 **보안** 메뉴
- **Let's Encrypt 무료 SSL** 선택
- **도메인명**: vlanet.net
- **www 포함 여부**: 체크 (www.vlanet.net도 포함)

### 4. 설치 완료 대기
- 신청 후 10-30분 대기
- 이메일로 설치 완료 알림 수신

## 📋 체크리스트

SSL 설정 전:
- [ ] HTTP로 사이트 접속 확인: http://vlanet.net
- [ ] 가비아에서 무료 SSL 신청
- [ ] DNS 전파 확인 (24-48시간 소요 가능)

SSL 설정 후:
- [ ] HTTPS 접속 확인: https://vlanet.net
- [ ] SSL 인증서 유효성 확인
- [ ] Django HTTPS 설정 활성화

## 💡 추가 팁

### 도메인 전파 확인
```bash
# 도메인이 올바른 IP를 가리키는지 확인
nslookup vlanet.net
dig vlanet.net
```

### SSL 상태 확인 도구
- https://www.ssllabs.com/ssltest/
- https://whatsmychaincert.com/

## ⚠️ 주의사항

1. **SSL 신청 전에 도메인이 호스팅에 연결되어 있어야 함**
2. **DNS 전파가 완료된 후 SSL 신청**
3. **무료 SSL은 90일마다 자동 갱신**

## 🔄 현재 할 일

1. **가비아에서 SSL 인증서 신청** (가장 중요!)
2. **임시로 HTTP로 사이트 테스트**
3. **SSL 설치 완료 후 HTTPS 전환**

SSL 신청하시고 설치 완료되면 알려주세요! 🚀