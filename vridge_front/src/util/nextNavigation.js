import { useRouter as useNextRouter } from 'next/router'

// URL 매핑 테이블 (대문자 -> 소문자)
const urlMapping = {
  '/Login': '/login',
  '/Signup': '/signup',
  '/ResetPw': '/resetpw',
  '/MyPage': '/mypage',
  '/AdminDashboard': '/admindashboard',
  '/ProjectCreate': '/project/create',
  '/CmsHome': '/cmshome',
  '/EmailCheck': '/emailcheck',
  '/FeedbackAll': '/feedbackall',
  '/VideoPlanning': '/videoplanning',
  '/Calendar': '/calendar',
  '/EmailMonitor': '/emailmonitor',
  // 동적 라우트는 함수로 처리
}

// 동적 라우트 변환 함수
const convertDynamicRoute = (path) => {
  // /ProjectEdit/123 -> /project/123/edit
  if (path.startsWith('/ProjectEdit/')) {
    const id = path.split('/')[2]
    return `/project/${id}/edit`
  }
  // /ProjectView/123 -> /project/123
  if (path.startsWith('/ProjectView/')) {
    const id = path.split('/')[2]
    return `/project/${id}`
  }
  // /Feedback/123 -> /feedback/123
  if (path.startsWith('/Feedback/')) {
    const id = path.split('/')[2]
    return `/feedback/${id}`
  }
  return path
}

// React Router의 useNavigate를 Next.js router로 대체
export const useRouter = () => {
  const router = useNextRouter()
  
  // navigate 함수를 router.push로 매핑
  const navigate = (path, options = {}) => {
    // URL 매핑 적용
    let mappedPath = urlMapping[path] || path
    
    // 동적 라우트 처리
    if (mappedPath === path) {
      mappedPath = convertDynamicRoute(path)
    }
    
    if (options.replace) {
      router.replace(mappedPath)
    } else {
      router.push(mappedPath)
    }
  }
  
  return {
    ...router,
    navigate,
  }
}

// React Router의 useParams를 Next.js router.query로 대체
export const useParams = () => {
  const router = useNextRouter()
  return router.query
}

// React Router의 useLocation을 Next.js router로 대체
export const useLocation = () => {
  const router = useNextRouter()
  return {
    pathname: router.pathname,
    search: router.asPath.includes('?') ? router.asPath.split('?')[1] : '',
    hash: '',
    state: null,
  }
}

// React Router의 useSearchParams를 Next.js router로 대체
export const useSearchParams = () => {
  const router = useNextRouter()
  const searchParams = new URLSearchParams(router.asPath.includes('?') ? router.asPath.split('?')[1] : '')
  
  const setSearchParams = (newParams) => {
    const params = new URLSearchParams(newParams)
    router.push(`${router.pathname}?${params.toString()}`)
  }
  
  return [searchParams, setSearchParams]
}