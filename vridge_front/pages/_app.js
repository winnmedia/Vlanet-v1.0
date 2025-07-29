import React, { useEffect, useState } from 'react'
import UnifiedModal from '../src/components/unified/UnifiedModal';
import { Provider } from 'react-redux'
import store from '../src/redux/store'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'
import moment from 'moment'
import 'moment/locale/ko'
import { useRouter } from 'next/router'
import LoadingAnimation from '../src/components/LoadingAnimation'
import AppInitializer from '../src/components/AppInitializer'
import GlobalLoading from '../src/components/GlobalLoading'
import ErrorBoundary from '../src/components/ErrorBoundary'
import { setupGlobalErrorHandlers } from '../src/utils/errorHandler'
import '../src/styles/reset.scss'
import '../src/styles/design-system.scss'
import '../src/styles/global.scss'
// import '../src/styles/components.scss' // removed - undefined mixins
// import '../src/css/Common/LayoutFix.scss' // removed - file deleted
import '../src/components/PageTemplate.scss'
import 'react-datepicker/dist/react-datepicker.css'
import '../src/css/Home.scss'
// import '../src/css/HomeAlignment-improved.scss' // 임시 비활성화 - 너무 많은 변수 필요
import '../src/css/User/Auth.scss'
import '../src/css/Cms/Cms.scss'
import '../src/css/Cms/CmsCommon.scss'
import '../src/css/Cms/CmsHomeEnhanced.scss'
// import '../src/css/Cms/CmsHomeImproved.scss' // removed - undefined mixins
// import '../src/css/Cms/HomeLayoutFix.scss' // removed - file deleted
// import '../src/css/Cms/HomeActivityLayout.scss' // removed - file deleted
import '../src/page/Cms/VideoPlanning.scss'
// import '../src/css/Cms/VideoPlanningImproved.scss' // removed - undefined mixins
// import '../src/css/Cms/VideoPlanningEnhanced.scss' // removed - file deleted
// import '../src/page/Cms/VideoPlanningButtons.scss' // removed - file deleted
// import '../src/css/Cms/VideoPlanning.scss' // use page specific import instead
// import '../src/css/Cms/CalendarLayout.scss' // removed - file deleted
// import '../src/css/Cms/CalendarToolbar.scss' // removed - file deleted
// import '../src/css/Cms/CalendarResponsive.scss' // removed - file deleted
import '../src/components/CalendarEnhanced.scss'
// import '../src/css/Cms/ProjectCreate.scss' // removed - file deleted
// import '../src/css/Cms/ProjectCreateImproved.scss' // removed - file deleted
import '../src/tasks/Project/ProcessDateEnhanced.scss'
// import '../src/components/Navigation/EnhancedSidebar.scss' // removed - undefined mixins
// import '../src/css/Cms/UXEnhancements.scss' // removed - undefined mixins
// import '../src/css/Cms/ProjectInfoModal.scss' // removed - file deleted
import '../src/components/ProjectDashboard.scss'
// import '../src/components/ProjectPhaseBoard.scss' // Now using CSS Module
import '../src/components/ProjectForm.scss'
// 피드백 페이지 스타일
// import '../src/css/Cms/FeedbackPage.scss' // removed - file deleted
// import '../src/css/Cms/FeedbackPageRedesign.scss' // removed - file deleted
import '../src/page/User/MyPage.scss'
// Video.js 스타일
import 'video.js/dist/video-js.css'
// import '../src/css/Cms/VideoPlayerFix.scss' // removed - file deleted
// 로딩 애니메이션 스타일
// import '../src/css/Cms/LoadingAnimationFix.scss' // removed - file deleted
import { checkSession } from '../src/util/util'
import { getCSRFToken } from '../src/config/axios'

// 한국 시간대 설정
moment.locale('ko')

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 세션 체크만 수행 (프로젝트 로드는 각 페이지에서 처리)
    const session = checkSession()
    
    // 전역 에러 핸들러 설정
    setupGlobalErrorHandlers();
    
    // 앱 초기화 시 CSRF 토큰 미리 가져오기
    // 로그인/회원가입 페이지가 아닌 경우에만 실행
    if (typeof window !== 'undefined' && 
        !window.location.pathname.includes('/login') && 
        !window.location.pathname.includes('/Login') &&
        !window.location.pathname.includes('/signup') &&
        !window.location.pathname.includes('/Signup')) {
      getCSRFToken().catch(error => {
        // CSRF 토큰 가져오기 실패 시 조용히 처리
        // 사용자가 로그인하지 않았을 수 있음
        
      });
    }
  }, [])

  useEffect(() => {
    // 라우트 변경 시 로딩 상태 관리
    const handleStart = (url) => {
      // 로그인에서 홈으로 이동하는 경우 로딩 표시하지 않음
      const currentPath = router.pathname.toLowerCase()
      const targetPath = url.toLowerCase()
      
      // 로그인 페이지에서 나가는 모든 경우 로딩 표시 안함
      if (currentPath === '/login') {
        setLoading(false)
        return
      }
      
      // 그 외의 경우에만 로딩 표시
      setLoading(true)
    }
    const handleComplete = (url) => {
      setLoading(false)
    }
    const handleError = (err, url) => {
      setLoading(false)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleError)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleError)
    }
  }, [router])

  return (
    <Provider store={store}>
      <ConfigProvider locale={koKR}>
        <ErrorBoundary>
          <AppInitializer>
            {loading && <div className="route-loading" />}
            <Component {...pageProps} />
            <GlobalLoading />
          </AppInitializer>
        </ErrorBoundary>
      </ConfigProvider>
    </Provider>
  )
}

export default MyApp
