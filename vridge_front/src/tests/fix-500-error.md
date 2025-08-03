# Next.js 500 에러 해결 가이드

## 🔍 문제 분석
사용자가 파일 업로드 시 500 에러를 겪고 있습니다:
```
POST http://localhost:3000/api/projects/1011/feedback/upload 500 (Internal Server Error)
Error: Cannot find module './chunks/vendor-chunks/next.js'
```

## 🚨 원인
1. Next.js 개발 서버가 API 요청을 백엔드로 프록시하지 않고 있음
2. Next.js가 `/api/*` 경로를 내부 API 라우트로 처리하려고 시도
3. webpack 번들링 문제로 내부 에러 발생

## ✅ 해결 방법

### 1. Next.js 서버 재시작
```bash
# 터미널 1에서 Next.js 서버 중지 (Ctrl+C)
# 그리고 캐시 삭제 후 재시작
rm -rf .next
npm run dev
```

### 2. 백엔드 서버 확인
```bash
# 터미널 2에서 Django 서버가 실행 중인지 확인
cd /home/winnmedia/VideoPlanet/vridge_back
python3 manage.py runserver
```

### 3. 환경 변수 확인
`.env.local` 파일에 다음이 설정되어 있는지 확인:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. API 프록시 설정 적용
`next.config.js`에 추가된 rewrites 설정이 적용되도록:
1. Next.js 서버 완전히 종료
2. `.next` 폴더 삭제
3. 서버 재시작

## 🔧 추가 해결책 (위 방법이 안 될 경우)

### 방법 1: 직접 백엔드 URL 사용
임시로 axios 설정을 변경하여 직접 백엔드로 요청:
```javascript
// src/config/axios.js
const API_BASE_URL = 'http://localhost:8000'; // 직접 지정
```

### 방법 2: 프록시 미들웨어 사용
```bash
npm install http-proxy-middleware
```

그리고 `src/middleware.js` 생성:
```javascript
import { NextResponse } from 'next/server';

export function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone();
    url.hostname = 'localhost';
    url.port = '8000';
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: '/api/:path*',
};
```

## 📝 정리
이 500 에러는 API 요청이 Django 백엔드로 전달되지 않고 Next.js 내부에서 처리되려다 실패한 것입니다. 서버를 재시작하고 프록시 설정이 적용되면 해결됩니다.