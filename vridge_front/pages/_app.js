import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import store from '../src/redux/store'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'
import moment from 'moment'
import 'moment/locale/ko'
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
import '../src/css/Cms/FeedbackUnified.scss'
import '../src/css/Cms/FeedbackImproved.scss'
import '../src/css/Cms/FeedbackButtons.scss'
import '../src/css/Cms/OpinionInput.scss'
import '../src/css/Cms/AITeacherModal.scss'
import '../src/css/Cms/FeedbackLayoutFix.scss'
import '../src/css/Cms/FeedbackPlayerFix.scss'
import '../src/css/Cms/InputActivationFix.scss'
import '../src/css/Cms/FeedbackResponsiveLayout.scss'
import '../src/css/Cms/FeedbackButtonLayoutFix.scss'
import '../src/css/Cms/FeedbackHarmonyUI.scss'
import '../src/css/Cms/SubmenuFinal.scss'
import '../src/page/User/MyPage.scss'
import { checkSession } from '../src/util/util'

// 한국 시간대 설정
moment.locale('ko')

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 세션 체크만 수행 (프로젝트 로드는 각 페이지에서 처리)
    const session = checkSession()
    console.log('App initialized with session:', !!session)
  }, [])

  return (
    <Provider store={store}>
      <ConfigProvider locale={koKR}>
        <Component {...pageProps} />
      </ConfigProvider>
    </Provider>
  )
}

export default MyApp
