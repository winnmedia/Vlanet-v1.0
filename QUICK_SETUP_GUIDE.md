# VideoPlanet 빠른 설정 가이드

## 🚨 현재 문제점
1. **vlanet.net에서 회원가입/로그인 불가** (CORS 에러)
2. **구글 로그인 작동 안함** (백엔드 설정 누락)
3. **이메일 발송 안됨** (SMTP 설정 누락)

## 🔧 즉시 해결 방법

### 1. 로컬 개발 환경에서 테스트
```bash
# 백엔드 시작
cd vridge_back
python manage.py runserver

# 프론트엔드 시작 (새 터미널)
cd vridge_front
npm start
```
http://localhost:3000 에서 테스트 (CORS 문제 없음)

### 2. Railway 환경 변수 설정 (프로덕션)

#### Railway 대시보드 → vridge-back → Variables 추가:

```env
# 이메일 설정 (Gmail)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=16자리-앱-비밀번호

# Google OAuth
GOOGLE_CLIENT_ID=819428355790-8kc9kvlddt1ems7k2gtka0svrpen5k4l.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# CORS 설정 (vlanet.net 포함)
CORS_ALLOWED_ORIGINS=https://vridge-front-production.up.railway.app,https://vlanet.net,https://www.vlanet.net
```

### 3. Gmail 앱 비밀번호 생성
1. [Google 계정 설정](https://myaccount.google.com/security)
2. 2단계 인증 활성화
3. 앱 비밀번호 → 메일 선택 → 생성
4. 16자리 비밀번호 복사

### 4. 배포 후 확인
Railway에 환경 변수 설정 후 자동으로 재배포됩니다.

## 📝 테스트 체크리스트
- [ ] 회원가입 시 이메일 인증번호 발송
- [ ] 이메일 인증번호 입력 확인
- [ ] 구글 로그인
- [ ] 일반 로그인

## 🐛 디버깅
```bash
# 백엔드 로그 확인
railway logs -s vridge-back

# 프론트엔드 콘솔 확인
브라우저 개발자 도구 (F12) → Console
```

## 💡 임시 해결책
vlanet.net에서 CORS 에러가 계속되면:
1. https://vridge-front-production.up.railway.app 사용
2. 또는 로컬 개발 환경 사용 (http://localhost:3000)