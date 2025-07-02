import { Route, Routes } from 'react-router-dom'
import { lazy } from 'react'
import LazyWrapper from 'components/LazyWrapper'

// Lazy load components for better performance
const Home = lazy(() => import('page/Home'))
const Login = lazy(() => import('page/User/Login'))
const Signup = lazy(() => import('page/User/Signup'))
const ResetPw = lazy(() => import('page/User/ResetPw'))
const MyPage = lazy(() => import('page/User/MyPage'))
const AdminDashboard = lazy(() => import('page/Admin/AdminDashboard'))
const ProjectCreate = lazy(() => import('page/Cms/ProjectCreate'))
const ProjectEdit = lazy(() => import('page/Cms/ProjectEdit'))
const ProjectView = lazy(() => import('page/Cms/ProjectView'))
const Calendar = lazy(() => import('page/Cms/Calendar'))
const Feedback = lazy(() => import('page/Cms/Feedback'))
const Elearning = lazy(() => import('page/Cms/Elearning'))
const CmsHome = lazy(() => import('page/Cms/CmsHome'))
const EmailCheck = lazy(() => import('page/User/EmailCheck'))
const FeedbackAll = lazy(() => import('page/Cms/FeedbackAll'))
const PrivacyPolicy = lazy(() => import('page/Policy/PrivacyPolicy'))
const TermsOfService = lazy(() => import('page/Policy/TermsOfService'))

export default function AppRoute() {
  const routes = [
    { path: '/', component: <LazyWrapper><Home /></LazyWrapper> },
    { path: '/privacy', component: <LazyWrapper><PrivacyPolicy /></LazyWrapper> },
    { path: '/terms', component: <LazyWrapper><TermsOfService /></LazyWrapper> },
    { path: '/Login', component: <LazyWrapper><Login /></LazyWrapper> },
    { path: '/Signup', component: <LazyWrapper><Signup /></LazyWrapper> },
    { path: '/ResetPw', component: <LazyWrapper><ResetPw /></LazyWrapper> },
    { path: '/MyPage', component: <LazyWrapper><MyPage /></LazyWrapper> },
    { path: '/AdminDashboard', component: <LazyWrapper><AdminDashboard /></LazyWrapper> },
    { path: '/Calendar', component: <LazyWrapper><Calendar /></LazyWrapper> },
    { path: '/ProjectCreate', component: <LazyWrapper><ProjectCreate /></LazyWrapper> },
    { path: '/ProjectEdit/:project_id', component: <LazyWrapper><ProjectEdit /></LazyWrapper> },
    { path: '/ProjectView/:project_id', component: <LazyWrapper><ProjectView /></LazyWrapper> },
    { path: '/CmsHome', component: <LazyWrapper><CmsHome /></LazyWrapper> },
    { path: '/Feedback/:project_id', component: <LazyWrapper><Feedback /></LazyWrapper> },
    { path: '/Elearning', component: <LazyWrapper><Elearning /></LazyWrapper> },
    { path: '/EmailCheck', component: <LazyWrapper><EmailCheck /></LazyWrapper> },
    { path: '/FeedbackAll', component: <LazyWrapper><FeedbackAll /></LazyWrapper> },
    {
      path: '*',
      component: (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>404 - 페이지를 찾을 수 없습니다</h2>
          <p>URL을 확인해주세요.</p>
        </div>
      ),
    },
  ]
  return (
    <Routes>
      {routes.map((route, index) => (
        <Route key={index} path={route.path} element={route.component} />
      ))}
    </Routes>
  )
}
