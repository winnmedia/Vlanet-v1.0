import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { updateProjectStore } from '../redux/project'
import { ProjectList } from '../api/project'
import { GetUserInfo } from '../api/auth'
import { checkSession } from '../util/util'
import { useRouter } from 'next/router'

// 공개 페이지 목록 정의
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
  '/emailcheck'
];

export default function AppInitializer({ children }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    const initialize = async () => {
      // 현재 페이지가 공개 페이지인지 확인
      const isPublicPage = PUBLIC_PAGES.some(page => 
        router.pathname === page || router.pathname.startsWith(page + '/')
      );
      
      // 공개 페이지에서는 초기화를 건너뛰고 바로 렌더링
      if (isPublicPage) {
        console.log('[AppInitializer] Public page, skipping initialization:', router.pathname)
        setIsInitialized(true)
        return
      }
      
      const session = checkSession()
      
      if (!session) {
        console.log('[AppInitializer] No session found on protected page')
        setIsInitialized(true)
        return
      }
      
      try {
        console.log('[AppInitializer] Starting initialization for protected page...')
        
        // 1. 사용자 정보 로드 (보호된 페이지에서만)
        try {
          const userResponse = await GetUserInfo()
          if (userResponse?.data?.result) {
            dispatch(updateProjectStore({
              user: userResponse.data.result.email,
              profileImage: userResponse.data.result.profile_image || null
            }))
            console.log('[AppInitializer] User loaded:', userResponse.data.result.email)
          }
        } catch (error) {
          console.error('[AppInitializer] Error loading user:', error)
        }
        
        // 2. 프로젝트 리스트 로드 (보호된 페이지에서만)
        try {
          const projectResponse = await ProjectList()
          if (projectResponse?.data?.result) {
            dispatch(updateProjectStore({
              project_list: projectResponse.data.result
            }))
            console.log('[AppInitializer] Projects loaded:', projectResponse.data.result.length)
          }
        } catch (error) {
          console.error('[AppInitializer] Error loading projects:', error)
        }
        
      } catch (error) {
        console.error('[AppInitializer] Initialization error:', error)
      } finally {
        setIsInitialized(true)
      }
    }
    
    initialize()
  }, [dispatch, router.pathname])
  
  // 초기화 완료 전까지는 children을 렌더링
  return children
}