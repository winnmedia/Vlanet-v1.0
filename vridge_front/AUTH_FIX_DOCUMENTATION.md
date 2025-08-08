# 401 Unauthorized 오류 해결 문서

## 문제 진단

### 근본 원인
1. **axios 인터셉터의 과도한 리다이렉션**: 모든 401 에러를 로그인 페이지로 리다이렉트
2. **공개 페이지에서도 인증 API 호출**: AppInitializer가 모든 페이지에서 사용자 정보를 로드
3. **라우트 보호 로직 부재**: 공개/비공개 페이지 구분 없이 모든 페이지가 동일하게 처리

### 영향
- 랜딩 페이지(`/`) 접근 불가
- 로그인 페이지(`/login`) 무한 리다이렉트
- 회원가입 페이지(`/signup`) 접근 불가
- 약관 및 개인정보처리방침 페이지 접근 불가

## 해결 방안

### 1. axios 인터셉터 개선 (`src/config/axios.js`)
```javascript
// 공개 페이지 목록 정의
const PUBLIC_PAGES = [
  '/', '/login', '/signup', '/terms', '/privacy', '/emailcheck'
];

// 공개 페이지에서는 401 에러 시 리다이렉트하지 않음
if (!isPublicPage() && error.response?.status === 401) {
  // 보호된 페이지에서만 로그인으로 리다이렉트
}
```

### 2. AppInitializer 조건부 실행 (`src/components/AppInitializer.jsx`)
```javascript
// 공개 페이지에서는 사용자 정보 로드하지 않음
if (isPublicPage) {
  setIsInitialized(true);
  return;
}
```

### 3. Next.js 미들웨어 추가 (`middleware.js`)
- 라우트 레벨에서 인증 체크
- 공개/보호 페이지 구분
- 쿠키 기반 세션 확인
- 자동 리다이렉션 처리

### 4. AuthGuard 컴포넌트 (`src/components/AuthGuard.jsx`)
- 페이지별 인증 요구사항 관리
- 클라이언트 사이드 보호
- 로딩 상태 관리

### 5. 로그인 후 리다이렉션 개선 (`src/page/User/Login.jsx`)
```javascript
// from 파라미터로 원래 페이지로 돌아가기
const fromPage = urlParams.get('from');
if (fromPage) {
  navigate(fromPage);
}
```

## 공개 페이지 목록

다음 페이지는 인증 없이 접근 가능:
- `/` - 랜딩 페이지
- `/login`, `/Login` - 로그인
- `/signup`, `/Signup` - 회원가입
- `/resetpw`, `/ResetPw` - 비밀번호 재설정
- `/terms` - 이용약관
- `/privacy` - 개인정보처리방침
- `/emailcheck` - 이메일 확인
- `/invitation/*` - 초대 링크

## 보호된 페이지 목록

다음 페이지는 로그인 필요:
- `/cmshome` - 대시보드
- `/calendar` - 캘린더
- `/mypage` - 마이페이지
- `/project/*` - 프로젝트 관련
- `/videoplanning` - 비디오 기획
- `/feedback/*` - 피드백 관련
- `/admin/*` - 관리자 페이지

## 테스트 방법

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. 테스트 스크립트 실행
```bash
node test-auth-fix.js
```

### 3. 수동 테스트
1. 브라우저 시크릿 모드에서 테스트
2. 공개 페이지 접근 확인
   - http://localhost:3000/
   - http://localhost:3000/login
   - http://localhost:3000/signup
3. 보호된 페이지 접근 시 로그인 리다이렉트 확인
   - http://localhost:3000/cmshome
   - http://localhost:3000/mypage
4. 로그인 후 원래 페이지로 복귀 확인

## 배포 시 주의사항

1. **환경변수 확인**
   - `NEXT_PUBLIC_API_URL` 설정 확인
   - Railway, Vercel 환경변수 동기화

2. **빌드 테스트**
   ```bash
   npm run build
   npm start
   ```

3. **프로덕션 테스트**
   - vlanet.net에서 공개 페이지 접근 확인
   - 401 에러 발생 여부 모니터링

## 롤백 계획

문제 발생 시:
1. `middleware.js` 파일 삭제
2. `src/config/axios.js` 이전 버전으로 복원
3. `src/components/AppInitializer.jsx` 이전 버전으로 복원

## 개선 효과

- ✅ 공개 페이지 정상 접근
- ✅ 불필요한 API 호출 제거
- ✅ 사용자 경험 개선
- ✅ 서버 부하 감소
- ✅ 명확한 인증 플로우

## 추가 권장사항

1. **JWT 토큰 관리 개선**
   - Refresh 토큰 구현
   - 토큰 만료 시간 관리

2. **에러 메시지 개선**
   - 사용자 친화적 메시지
   - 다국어 지원

3. **성능 최적화**
   - 불필요한 재렌더링 방지
   - API 호출 캐싱

## 문의사항

문제 발생 시 다음 정보와 함께 보고:
- 접근하려던 URL
- 브라우저 콘솔 에러
- 네트워크 탭 스크린샷
- 시크릿 모드 테스트 결과