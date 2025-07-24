import React, { useEffect, useState } from 'react'
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
import '../src/styles/reset.scss'
import '../src/styles/design-system.scss'
import '../src/styles/global.scss'
import '../src/styles/components.scss'
import '../src/css/Common/LayoutFix.scss'
import '../src/components/PageTemplate.scss'
import 'react-datepicker/dist/react-datepicker.css'
import '../src/css/Home.scss'
import '../src/css/HomeAlignment.scss'
import '../src/css/User/Auth.scss'
import '../src/css/Cms/CmsCommon.scss'
import '../src/css/Cms/CmsHomeEnhanced.scss'
import '../src/css/Cms/CmsHomeImproved.scss'
import '../src/css/Cms/HomeLayoutFix.scss'
import '../src/css/Cms/HomeActivityLayout.scss'
import '../src/page/Cms/VideoPlanning.scss'
import '../src/css/Cms/VideoPlanningImproved.scss'
import '../src/css/Cms/VideoPlanningEnhanced.scss'
import '../src/page/Cms/VideoPlanningButtons.scss'
import '../src/css/Cms/CalendarLayout.scss'
import '../src/css/Cms/CalendarToolbar.scss'
import '../src/css/Cms/CalendarResponsive.scss'
import '../src/components/CalendarEnhanced.scss'
import '../src/css/Cms/ProjectCreate.scss'
import '../src/css/Cms/ProjectCreateImproved.scss'
import '../src/components/ProjectScheduleSection.scss'
import '../src/tasks/Project/ProcessDateEnhanced.scss'
import '../src/components/Navigation/EnhancedSidebar.scss'
import '../src/css/Cms/UXEnhancements.scss'
import '../src/css/Cms/ProjectInfoModal.scss'
import '../src/components/ProjectDashboard.scss'
import '../src/components/ProjectPhaseBoard.scss'
import '../src/components/ProjectForm.scss'
// 피드백 페이지 스타일
import '../src/css/Cms/FeedbackPage.scss'
import '../src/css/Cms/FeedbackPageRedesign.scss'
import '../src/page/User/MyPage.scss'
// Video.js 스타일
import 'video.js/dist/video-js.css'
import '../src/css/Cms/VideoPlayerFix.scss'
// 로딩 애니메이션 스타일
import '../src/css/Cms/LoadingAnimationFix.scss'
import { checkSession } from '../src/util/util'

// 한국 시간대 설정
moment.locale('ko')

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 세션 체크만 수행 (프로젝트 로드는 각 페이지에서 처리)
    const session = checkSession()
    console.log('App initialized with session:', !!session)
  }, [])

  useEffect(() => {
    // 라우트 변경 시 로딩 상태 관리
    const handleStart = (url) => {
      console.log('Loading start:', url)
      setLoading(true)
    }
    const handleComplete = (url) => {
      console.log('Loading complete:', url)
      setLoading(false)
    }
    const handleError = (err, url) => {
      console.error('Loading error:', err)
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
        <AppInitializer>
          {loading && <div className="route-loading" />}
          <Component {...pageProps} />
          <GlobalLoading />
        </AppInitializer>
      </ConfigProvider>
    </Provider>
  )
}

export default MyApp
