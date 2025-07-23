import { Route, Routes } from 'react-router-dom'
import { lazy } from 'react'
import LazyWrapper from 'components/LazyWrapper'

// Lazy load components for better performance with named chunks
const Home = lazy(() => import(/* webpackChunkName: "home" */ 'page/Home'))
const Login = lazy(() => import(/* webpackChunkName: "login" */ 'page/User/Login'))
const Signup = lazy(() => import(/* webpackChunkName: "signup" */ 'page/User/Signup'))
const ResetPw = lazy(() => import(/* webpackChunkName: "reset-pw" */ 'page/User/ResetPw'))
const MyPage = lazy(() => import(/* webpackChunkName: "my-page" */ 'page/User/MyPage'))
const AdminDashboard = lazy(() => import(/* webpackChunkName: "admin-dashboard" */ 'page/Admin/AdminDashboard'))
const ProjectCreate = lazy(() => import(/* webpackChunkName: "project-create" */ 'page/Cms/ProjectCreate'))
const ProjectEdit = lazy(() => import(/* webpackChunkName: "project-edit" */ 'page/Cms/ProjectEdit'))
const ProjectView = lazy(() => import(/* webpackChunkName: "project-view" */ 'page/Cms/ProjectView'))
const VideoPlanning = lazy(() => import(/* webpackChunkName: "video-planning" */ 'page/Cms/VideoPlanning'))
const Calendar = lazy(() => import(/* webpackChunkName: "calendar" */ 'page/Cms/Calendar'))
const Feedback = lazy(() => import(/* webpackChunkName: "feedback" */ 'page/Cms/Feedback'))
const CmsHome = lazy(() => import(/* webpackChunkName: "cms-home" */ 'page/Cms/CmsHome'))
const EmailCheck = lazy(() => import(/* webpackChunkName: "email-check" */ 'page/User/EmailCheck'))
const FeedbackAll = lazy(() => import(/* webpackChunkName: "feedback-all" */ 'page/Cms/FeedbackAll'))
const PrivacyPolicy = lazy(() => import(/* webpackChunkName: "privacy-policy" */ 'page/Policy/PrivacyPolicy'))
const TermsOfService = lazy(() => import(/* webpackChunkName: "terms-of-service" */ 'page/Policy/TermsOfService'))
const MobileDebug = lazy(() => import(/* webpackChunkName: "mobile-debug" */ 'page/MobileDebug'))
const FrameworkManagement = lazy(() => import(/* webpackChunkName: "framework-mgmt" */ 'page/Cms/FrameworkManagement'))
const EmailMonitor = lazy(() => import(/* webpackChunkName: "email-monitor" */ 'page/Admin/EmailMonitor'))
const AdminRedirect = lazy(() => import(/* webpackChunkName: "admin-redirect" */ 'page/Admin/AdminRedirect'))
const InvitationAccept = lazy(() => import(/* webpackChunkName: "invitation-accept" */ 'page/Cms/InvitationAccept'))
const NotFound = lazy(() => import(/* webpackChunkName: "not-found" */ 'page/NotFound'))

export default function AppRoute() {
  const routes = [
    { path: '/', component: <LazyWrapper><Home /></LazyWrapper> },
    { path: '/privacy', component: <LazyWrapper><PrivacyPolicy /></LazyWrapper> },
    { path: '/terms', component: <LazyWrapper><TermsOfService /></LazyWrapper> },
    { path: '/Login', component: <LazyWrapper><Login /></LazyWrapper> },
    { path: '/Signup', component: <LazyWrapper><Signup /></LazyWrapper> },
    { path: '/ResetPw', component: <LazyWrapper><ResetPw /></LazyWrapper> },
    { path: '/MyPage', component: <LazyWrapper><MyPage /></LazyWrapper> },
    { path: '/admin', component: <LazyWrapper><AdminRedirect /></LazyWrapper> },
    { path: '/AdminDashboard', component: <LazyWrapper><AdminDashboard /></LazyWrapper> },
    { path: '/VideoPlanning', component: <LazyWrapper><VideoPlanning /></LazyWrapper> },
    { path: '/Calendar', component: <LazyWrapper><Calendar /></LazyWrapper> },
    { path: '/ProjectCreate', component: <LazyWrapper><ProjectCreate /></LazyWrapper> },
    { path: '/ProjectEdit/:project_id', component: <LazyWrapper><ProjectEdit /></LazyWrapper> },
    { path: '/ProjectView/:project_id', component: <LazyWrapper><ProjectView /></LazyWrapper> },
    { path: '/CmsHome', component: <LazyWrapper><CmsHome /></LazyWrapper> },
    { path: '/Feedback/:project_id', component: <LazyWrapper><Feedback /></LazyWrapper> },
    { path: '/EmailCheck', component: <LazyWrapper><EmailCheck /></LazyWrapper> },
    { path: '/FeedbackAll', component: <LazyWrapper><FeedbackAll /></LazyWrapper> },
    { path: '/mobile-debug', component: <LazyWrapper><MobileDebug /></LazyWrapper> },
    { path: '/FrameworkManagement', component: <LazyWrapper><FrameworkManagement /></LazyWrapper> },
    { path: '/EmailMonitor', component: <LazyWrapper><EmailMonitor /></LazyWrapper> },
    { path: '/invitation/accept/:token', component: <LazyWrapper><InvitationAccept /></LazyWrapper> },
    { path: '/invitation/:uid/:token', component: <LazyWrapper><InvitationAccept /></LazyWrapper> },
    { path: '/invitation/:token', component: <LazyWrapper><InvitationAccept /></LazyWrapper> },
    {
      path: '*',
      component: <LazyWrapper><NotFound /></LazyWrapper>,  // 404 페이지
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
