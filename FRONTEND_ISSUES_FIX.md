# 🔧 프론트엔드 문제 해결 가이드

## 🚨 발견된 문제들

### 1. 중복 로딩 애니메이션
- **원인**: 여러 컴포넌트에서 동시에 LoadingAnimation 표시
- **위치**: 전역 로딩과 컴포넌트별 로딩이 겹침

### 2. Project ID Missing 오류
- **원인**: Next.js 라우터 파라미터 처리 문제
- **코드**: `const { project_id } = useParams()` 
- **문제**: `project_id`가 undefined로 반환됨

### 3. 마이페이지 데이터 로딩 실패
- **원인**: API 엔드포인트 또는 인증 토큰 문제

## ✅ 해결 방법

### 1. 중복 로딩 애니메이션 수정
```jsx
// _app.js에서 전역 로딩 상태 관리
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleStart = () => setLoading(true)
    const handleComplete = () => setLoading(false)

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  return (
    <>
      {loading && <LoadingAnimation />}
      <Component {...pageProps} />
    </>
  )
}
```

### 2. Project ID 문제 수정
```jsx
// src/page/Cms/ProjectView.jsx 수정
import { useRouter } from 'next/router'

export default function ProjectView() {
  const router = useRouter()
  const { id: project_id } = router.query // id로 변경
  
  // 또는 pages/project/[id].js에서 props 전달
  // export async function getServerSideProps({ params }) {
  //   return {
  //     props: {
  //       project_id: params.id
  //     }
  //   }
  // }
}
```

### 3. API 호출 수정
```jsx
// src/api/framework.js 확인
// 토큰이 제대로 전달되는지 확인
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }
)
```

## 🚀 즉시 적용 가능한 수정

### ProjectView.jsx 긴급 패치
```jsx
// 라인 14 수정
import { useRouter } from 'next/router'

// 라인 30-34 수정
export default function ProjectView() {
  const router = useRouter()
  const { handleNotFound } = useNavigationFlow()
  const { project_list, user, profileImage } = useSelector((s) => s.ProjectStore)
  const [current_project, set_current_project] = useState(null)
  const project_id = router.query.id // 직접 가져오기
```

## 📝 테스트 방법
1. 로그인 후 프로젝트 페이지 접속
2. URL에서 project_id 확인: `/project/123`
3. 콘솔에서 오류 메시지 확인
4. 네트워크 탭에서 API 호출 확인

---
**핵심**: Next.js 라우터와 커스텀 라우터 간의 충돌 문제입니다!