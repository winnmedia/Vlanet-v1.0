# Next.js 마이그레이션 개발 로그

## 프로젝트 정보
- **작업 일시**: 2025-07-22
- **목적**: React (CRA) → Next.js 마이그레이션
- **원본 프로젝트**: `/home/winnmedia/VideoPlanet/vridge_front`
- **마이그레이션 프로젝트**: `/home/winnmedia/VideoPlanet/vridge-front-next`

## 백업 및 마일스톤 기록

### 1. 프로젝트 백업 (✅ 완료)
```bash
# 원본 프로젝트 백업
cp -r vridge_front vridge_front_backup_20250722
```
- **백업 위치**: `/home/winnmedia/VideoPlanet/vridge_front_backup_20250722`
- **목적**: 롤백 가능성에 대비한 원본 보존

### 2. Next.js 프로젝트 생성 (✅ 완료)
```bash
npx create-next-app@latest vridge-front-next --no-app
cd vridge-front-next
```
- **Next.js 버전**: 15.4.2
- **React 버전**: 18.2.0 (19.1.0에서 다운그레이드)
- **Pages Router 사용** (App Router 미사용)

## 진행된 작업 상세

### 1. 의존성 마이그레이션 (✅ 완료)
```bash
# 필수 패키지 설치
npm install @reduxjs/toolkit react-redux axios antd moment
npm install redux-logger
npm install --legacy-peer-deps

# React 버전 조정 (19.x → 18.x)
npm install react@^18.2.0 react-dom@^18.2.0
```

### 2. 소스 코드 이전 (✅ 완료)
```bash
# 주요 디렉토리 복사
cp -r ../vridge_front/src/page src/
cp -r ../vridge_front/src/components src/
cp -r ../vridge_front/src/util src/
cp -r ../vridge_front/src/store src/
cp -r ../vridge_front/src/css src/
cp -r ../vridge_front/src/images src/
cp -r ../vridge_front/src/config src/
cp -r ../vridge_front/src/utils src/
cp -r ../vridge_front/src/redux src/
cp -r ../vridge_front/src/styles src/
```

### 3. 라우팅 시스템 전환 (✅ 완료)

#### React Router → Next.js File-based Routing
```javascript
// 생성된 페이지 구조
pages/
├── _app.js              # 전역 설정
├── _document.js         # HTML 문서 설정
├── index.js             # 홈페이지 (/)
├── login.js             # 로그인 (/login)
├── register.js          # 회원가입 (/register)
├── mypage.js            # 마이페이지 (/mypage)
├── terms.js             # 이용약관 (/terms)
├── privacy.js           # 개인정보처리방침 (/privacy)
├── 404.js               # 404 에러 페이지
└── cms/
    ├── index.js         # CMS 홈 (/cms)
    ├── project-create.js # 프로젝트 생성 (/cms/project-create)
    └── feedback/
        └── [id].js      # 피드백 상세 (/cms/feedback/[id])
```

#### React Router 호환성 어댑터
```javascript
// src/util/nextNavigation.js
import { useRouter as useNextRouter } from 'next/router'
import Link from 'next/link'

export const useRouter = () => {
  const router = useNextRouter()
  const navigate = (path, options = {}) => {
    if (options.replace) {
      router.replace(path)
    } else {
      router.push(path)
    }
  }
  return { ...router, navigate }
}

export { Link, useNextRouter }
```

### 4. 환경 변수 마이그레이션 (✅ 완료)
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_VERSION=0.9.1
```
- `REACT_APP_` → `NEXT_PUBLIC_` 프리픽스 변경

### 5. 전역 설정 구성 (✅ 완료)

#### _app.js 설정
```javascript
import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import store from '../src/redux/store'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'
import moment from 'moment'
import 'moment/locale/ko'
import '../src/styles/global.scss'

moment.locale('ko')

function MyApp({ Component, pageProps }) {
  // Redux Provider와 Ant Design 설정
  return (
    <Provider store={store}>
      <ConfigProvider locale={koKR}>
        <Component {...pageProps} />
      </ConfigProvider>
    </Provider>
  )
}
```

#### next.config.js 설정
```javascript
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app',
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION || '0.9.1',
  },
  webpack: (config, { isServer }) => {
    // React Router를 Next.js 라우터로 대체
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': require.resolve('./src/util/nextNavigation.js'),
    }
    return config
  },
  images: {
    domains: ['videoplanet.up.railway.app', 'vlanet.net'],
  },
  sassOptions: {
    includePaths: ['./src/css'],
  },
}
```

## 해결된 문제들

### 1. React 버전 충돌
- **문제**: Next.js 15.4.2와 React 19.1.0 비호환
- **해결**: React 18.2.0으로 다운그레이드

### 2. 모듈 해석 오류
- **문제**: CSS, store, config 등 모듈을 찾을 수 없음
- **해결**: 누락된 디렉토리 복사 및 import 경로 수정

### 3. Redux Store Import 오류
- **문제**: `setUser`, `setProjectList` export 없음
- **해결**: `updateProjectStore`로 변경

### 4. CSS/SCSS Import 구조
- **문제**: 개별 CSS 파일이 아닌 디렉토리 구조
- **해결**: `styles/global.scss` 사용으로 통합

## 현재 상태

### ✅ 완료된 작업
1. 프로젝트 백업 및 Next.js 프로젝트 생성
2. 모든 소스 코드 및 정적 에셋 이전
3. React Router → Next.js 라우팅 전환
4. Redux 및 전역 설정 구성
5. 환경 변수 마이그레이션

### 🔧 진행 중인 작업
- 개발 서버 정상 실행 확인
- SASS deprecation 경고 해결

### 📋 남은 작업
1. CSS 최적화 및 스타일 점검
2. 모든 페이지 기능 테스트
3. API 연동 테스트
4. Vercel 배포 설정
5. 프로덕션 빌드 테스트

## 롤백 방법

만약 마이그레이션에 문제가 있어 롤백이 필요한 경우:

```bash
# 1. 현재 Next.js 프로젝트 백업
mv vridge-front-next vridge-front-next-failed

# 2. 원본 프로젝트 복원
cp -r vridge_front_backup_20250722 vridge_front

# 3. 원본 프로젝트에서 작업 재개
cd vridge_front
npm install
npm start
```

## 다음 단계

1. **개발 서버 테스트**
   ```bash
   cd vridge-front-next
   npm run dev
   ```

2. **프로덕션 빌드 테스트**
   ```bash
   npm run build
   npm start
   ```

3. **Vercel 배포 준비**
   - vercel.json 설정
   - 환경 변수 설정
   - 도메인 설정

## 주의사항

1. **UI/UX 100% 유지**: 모든 디자인과 사용자 경험은 원본과 동일하게 유지
2. **API 호환성**: 백엔드 API 엔드포인트는 변경 없음
3. **환경 변수**: 모든 `REACT_APP_`를 `NEXT_PUBLIC_`로 변경 필요
4. **동적 라우팅**: `/cms/feedback/:id` → `/cms/feedback/[id]`로 변경

---
*이 문서는 Next.js 마이그레이션 과정을 기록한 개발 로그입니다.*
*작성일: 2025-07-22*