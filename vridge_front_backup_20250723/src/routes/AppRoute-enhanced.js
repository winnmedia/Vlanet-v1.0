import { Route, Routes } from 'react-router-dom'
import { lazy } from 'react'
import LazyWrapper from 'components/LazyWrapper'
import PrivateRoute from 'components/PrivateRoute'

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
const VideoPlanning = lazy(() => import('page/Cms/VideoPlanning'))
const Calendar = lazy(() => import('page/Cms/Calendar'))
const Feedback = lazy(() => import('page/Cms/Feedback'))
const CmsHome = lazy(() => import('page/Cms/CmsHome'))
const EmailCheck = lazy(() => import('page/User/EmailCheck'))
const FeedbackAll = lazy(() => import('page/Cms/FeedbackAll'))
const PrivacyPolicy = lazy(() => import('page/Policy/PrivacyPolicy'))
const TermsOfService = lazy(() => import('page/Policy/TermsOfService'))
const MobileDebug = lazy(() => import('page/MobileDebug'))

export default function AppRoute() {
  // Public routes (no authentication required)
  const publicRoutes = [
    { path: '/', component: <Home /> },
    { path: '/privacy', component: <PrivacyPolicy /> },
    { path: '/terms', component: <TermsOfService /> },
    { path: '/Login', component: <Login /> },
    { path: '/Signup', component: <Signup /> },
    { path: '/ResetPw', component: <ResetPw /> },
    { path: '/EmailCheck', component: <EmailCheck /> },
  ]

  // Private routes (authentication required)
  const privateRoutes = [
    { path: '/MyPage', component: <MyPage /> },
    { path: '/AdminDashboard', component: <AdminDashboard /> },
    { path: '/VideoPlanning', component: <VideoPlanning /> },
    { path: '/Calendar', component: <Calendar /> },
    { path: '/ProjectCreate', component: <ProjectCreate /> },
    { path: '/ProjectEdit/:project_id', component: <ProjectEdit /> },
    { path: '/ProjectView/:project_id', component: <ProjectView /> },
    { path: '/CmsHome', component: <CmsHome /> },
    { path: '/Feedback/:project_id', component: <Feedback /> },
    { path: '/FeedbackAll', component: <FeedbackAll /> },
    { path: '/mobile-debug', component: <MobileDebug /> },
  ]

  return (
    <Routes>
      {/* Public Routes */}
      {publicRoutes.map((route, index) => (
        <Route 
          key={`public-${index}`} 
          path={route.path} 
          element={<LazyWrapper>{route.component}</LazyWrapper>} 
        />
      ))}

      {/* Private Routes with Authentication */}
      {privateRoutes.map((route, index) => (
        <Route 
          key={`private-${index}`} 
          path={route.path} 
          element={
            <PrivateRoute>
              <LazyWrapper>{route.component}</LazyWrapper>
            </PrivateRoute>
          } 
        />
      ))}

      {/* 404 Route */}
      <Route
        path="*"
        element={
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>404 - 페이지를 찾을 수 없습니다</h2>
            <p>URL을 확인해주세요.</p>
          </div>
        }
      />
    </Routes>
  )
}