import { NextResponse } from 'next/server'

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
  '/invitation'  // 초대 링크도 공개 페이지
]

// 정적 리소스 및 API 경로
const STATIC_PATHS = [
  '/_next',
  '/api',
  '/images',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/offline.html'
]

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // 정적 리소스는 무조건 통과
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // 공개 페이지인지 확인
  const isPublicPage = PUBLIC_PAGES.some(page => 
    pathname === page || 
    pathname === page.toLowerCase() ||
    pathname.startsWith(page + '/') ||
    pathname.startsWith(page.toLowerCase() + '/')
  )
  
  // 쿠키에서 세션 확인
  const session = request.cookies.get('vridge_session')
  
  // 보호된 페이지에 세션 없이 접근하려는 경우
  if (!isPublicPage && !session) {
    console.log('[Middleware] Redirecting to login - no session for protected page:', pathname)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 로그인한 사용자가 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
  if (session && (pathname === '/login' || pathname === '/Login' || pathname === '/signup' || pathname === '/Signup')) {
    console.log('[Middleware] Redirecting to dashboard - user already logged in')
    return NextResponse.redirect(new URL('/cmshome', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}