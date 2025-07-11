# VideoPlanet DNS 설정 가이드

## 🌐 도메인 구조

### 권장 도메인 설정
```
vlanet.net          → 프론트엔드 (Vercel)
www.vlanet.net      → 프론트엔드 (Vercel)
api.vlanet.net      → 백엔드 API (Railway)
ws.vlanet.net       → 웹소켓 서버 (Railway)
cdn.vlanet.net      → 정적 자원 CDN
```

## 📝 DNS 레코드 설정

### 1. Vercel로 프론트엔드 연결
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 2. Railway로 백엔드 API 연결
```
Type: CNAME
Name: api
Value: videoplanet.up.railway.app
```

### 3. 웹소켓 서버 (선택사항)
```
Type: CNAME
Name: ws
Value: videoplanet.up.railway.app
```

### 4. 이메일 설정 (SendGrid 사용 시)
```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all

Type: CNAME
Name: em1234
Value: u1234567.wl123.sendgrid.net

Type: CNAME
Name: s1._domainkey
Value: s1.domainkey.u1234567.wl123.sendgrid.net

Type: CNAME
Name: s2._domainkey
Value: s2.domainkey.u1234567.wl123.sendgrid.net
```

## 🔧 플랫폼별 설정

### Vercel 설정
1. Vercel 대시보드에서 프로젝트 선택
2. Settings → Domains
3. "vlanet.net" 추가
4. "www.vlanet.net" 추가
5. DNS 레코드 추가 안내 따르기

### Railway 설정
1. Railway 대시보드에서 프로젝트 선택
2. Settings → Domains
3. "api.vlanet.net" 추가
4. CNAME 레코드 값 복사하여 DNS에 추가

### Cloudflare 사용 시 (권장)
1. Cloudflare에 도메인 추가
2. 네임서버를 Cloudflare로 변경
3. DNS 레코드 추가 시 주의사항:
   - API 서브도메인: 프록시 상태 OFF (DNS only)
   - 프론트엔드: 프록시 상태 ON (Proxied)

## ⚠️ 주의사항

### SSL/TLS 설정
- Cloudflare 사용 시: SSL/TLS 모드를 "Full (strict)"로 설정
- Vercel과 Railway는 자동으로 SSL 인증서 제공

### 프록시 설정
- API 엔드포인트는 Cloudflare 프록시를 통하지 않도록 설정
- 이유: 업로드 크기 제한, 웹소켓 연결 문제 방지

### TTL 설정
- 개발 중: 60초 (빠른 변경 적용)
- 프로덕션: 3600초 이상 (캐싱 효율)

## 🔍 DNS 전파 확인

### 명령어로 확인
```bash
# A 레코드 확인
dig vlanet.net

# CNAME 확인
dig www.vlanet.net
dig api.vlanet.net

# 전체 DNS 레코드 확인
dig vlanet.net ANY
```

### 온라인 도구
- [DNS Checker](https://dnschecker.org)
- [What's My DNS](https://www.whatsmydns.net)

## 🚨 문제 해결

### DNS 전파 지연
- 일반적으로 24-48시간 소요
- Cloudflare 사용 시 즉시 적용

### SSL 인증서 오류
1. DNS 레코드가 올바른지 확인
2. 도메인 소유권 검증 완료 확인
3. 인증서 발급 대기 (최대 24시간)

### API 연결 실패
1. CORS 설정 확인
2. HTTPS 리다이렉트 확인
3. 프록시 설정 확인

## 📊 모니터링

### 가동시간 모니터링
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)

### DNS 모니터링
- [DNSPerf](https://www.dnsperf.com)
- [DNS Analytics](Cloudflare Dashboard)

## 🔐 보안 강화

### DNSSEC 활성화
Cloudflare에서 DNSSEC 활성화:
1. DNS → DNSSEC
2. "Enable DNSSEC" 클릭
3. DS 레코드를 도메인 등록업체에 추가

### CAA 레코드 추가
```
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"
Value: 0 issue "digicert.com"
```

### 보안 헤더 검증
배포 후 [Security Headers](https://securityheaders.com)에서 확인

---

## 체크리스트

- [ ] 도메인 등록 완료
- [ ] 네임서버 설정 (Cloudflare 권장)
- [ ] A/CNAME 레코드 추가
- [ ] SSL 인증서 발급 확인
- [ ] CORS 설정 확인
- [ ] API 엔드포인트 테스트
- [ ] 웹소켓 연결 테스트
- [ ] 모니터링 설정
- [ ] DNSSEC 활성화
- [ ] 보안 헤더 검증