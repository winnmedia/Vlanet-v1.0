# api.vlanet.net 도메인 설정 가이드

## 개요
이 문서는 `api.vlanet.net` 서브도메인을 Railway에 배포된 백엔드 서비스에 연결하는 방법을 설명합니다.

## 현재 상태
- 백엔드: `https://videoplanet.up.railway.app` (Railway)
- 프론트엔드: `https://vlanet.net` (Vercel)
- 목표: `api.vlanet.net` → Railway 백엔드 연결

## 설정 단계

### 1. Railway에서 커스텀 도메인 추가

1. Railway 대시보드에 로그인
2. VideoPlanet 프로젝트 선택
3. Settings → Domains 섹션으로 이동
4. "Add Custom Domain" 클릭
5. `api.vlanet.net` 입력
6. Railway가 제공하는 CNAME 값 복사 (예: `videoplanet.up.railway.app`)

### 2. DNS 설정 (도메인 관리자에서)

vlanet.net 도메인을 관리하는 서비스(예: Cloudflare, Route53, GoDaddy 등)에서:

1. DNS 관리 페이지로 이동
2. 새 레코드 추가:
   - Type: `CNAME`
   - Name: `api`
   - Value: `videoplanet.up.railway.app` (Railway에서 제공한 값)
   - TTL: `300` (또는 기본값)

### 3. SSL 인증서 설정

Railway는 자동으로 Let's Encrypt SSL 인증서를 프로비저닝합니다:
- DNS 설정 후 약 10-15분 대기
- Railway 대시보드에서 SSL 인증서 상태 확인

### 4. 백엔드 CORS 설정 확인

백엔드의 `settings_base.py`에 이미 설정되어 있음:
```python
CORS_ALLOWED_ORIGINS = [
    "https://vlanet.net",
    "https://www.vlanet.net",
    "https://api.vlanet.net",
    # ...
]
```

### 5. 프론트엔드 환경변수 확인

`.env.production`:
```
REACT_APP_API_URL=https://api.vlanet.net
REACT_APP_SOCKET_URI=wss://api.vlanet.net
```

## 문제 해결

### DNS 전파 대기
- DNS 변경사항은 전 세계적으로 전파되는데 최대 48시간이 걸릴 수 있습니다
- 보통 15-30분 내에 대부분의 지역에서 작동합니다

### 확인 방법
```bash
# DNS 레코드 확인
nslookup api.vlanet.net
dig api.vlanet.net CNAME

# HTTPS 연결 테스트
curl https://api.vlanet.net/api/health/
```

### Railway 커스텀 도메인 문제
- Railway 대시보드에서 도메인 상태가 "Active"인지 확인
- SSL 인증서가 "Issued"인지 확인
- 도메인 검증이 실패한 경우 DNS 설정 재확인

## 대체 방법 (Cloudflare 사용 시)

Cloudflare를 사용하는 경우 프록시 설정:
1. DNS 레코드를 추가할 때 "Proxy status" 활성화 (주황색 구름)
2. SSL/TLS 설정을 "Full (strict)"로 설정
3. Page Rules에서 `api.vlanet.net/*`에 대해 "Cache Level: Bypass" 설정

## 참고사항
- Railway의 커스텀 도메인은 무료 플랜에서도 사용 가능
- HTTPS는 자동으로 설정됨
- WebSocket 연결도 자동으로 지원됨