# VideoPlanet Next.js Frontend

VideoPlanet 프로젝트의 Next.js 기반 프론트엔드입니다.

## 기술 스택

- Next.js 15.4.2
- React 18.3.1
- Redux Toolkit
- Ant Design
- Styled Components
- Sass/SCSS

## 시작하기

### 개발 환경 설정

1. 의존성 설치
```bash
npm install --legacy-peer-deps
```

2. 환경 변수 설정
`.env.local` 파일 생성:
```
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_VERSION=1.0.0
```

3. 개발 서버 실행
```bash
npm run dev
```

### 빌드 및 배포

1. 프로덕션 빌드
```bash
npm run build
```

2. 프로덕션 서버 실행
```bash
npm start
```

## Vercel 배포

1. Vercel CLI 설치 (선택사항)
```bash
npm i -g vercel
```

2. Vercel에 배포
```bash
vercel
```

또는 GitHub과 연동하여 자동 배포 설정 가능

## 환경 변수

Vercel 대시보드에서 다음 환경 변수 설정 필요:
- `NEXT_PUBLIC_API_URL`: 백엔드 API URL
- `NEXT_PUBLIC_VERSION`: 앱 버전

## 주요 페이지

- `/` - 홈페이지
- `/login` - 로그인
- `/signup` - 회원가입
- `/cmshome` - CMS 홈
- `/project/create` - 프로젝트 생성
- `/feedback/[id]` - 피드백 상세
- `/videoplanning` - 비디오 기획 (임시)

## 알려진 이슈

- VideoPlanning 컴포넌트는 현재 임시 버전 사용 중
- 일부 SCSS import 경고는 무시 가능 (기능에 영향 없음)

## 라이선스

Private