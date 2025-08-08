import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { checkSession } from '../util/util'
import LoadingSpinner from './LoadingSpinner'

// 공개 페이지 목록
const PUBLIC_PAGES = [
  '/',
  '/login',
  '/Login',
  '/signup',
  '/Signup',
  '/resetpw',
  '/ResetPw',
  '/terms',
  '/privacy',
  '/emailcheck',
  '/invitation'
];

export default function AuthGuard({ children, requireAuth = false }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const session = checkSession()
      const isPublicPage = PUBLIC_PAGES.some(page => 
        router.pathname === page || 
        router.pathname === page.toLowerCase() ||
        router.pathname.startsWith(page + '/') ||
        router.pathname.startsWith(page.toLowerCase() + '/')
      )

      setIsAuthenticated(!!session)

      // 보호된 페이지인데 인증이 없는 경우
      if (!isPublicPage && !session && requireAuth) {
        router.push(`/login?from=${encodeURIComponent(router.asPath)}`)
      } 
      // 로그인한 사용자가 로그인/회원가입 페이지에 접근하는 경우
      else if (session && (router.pathname === '/login' || router.pathname === '/Login' || 
                          router.pathname === '/signup' || router.pathname === '/Signup')) {
        router.push('/cmshome')
      }
      else {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requireAuth])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return children
}