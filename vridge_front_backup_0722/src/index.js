import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './routes/App'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import store from 'redux/store'
import './config/axios' // axios 설정 초기화
import './utils/logger' // 프로덕션 환경에서 console.log 비활성화
import './styles/global.scss' // 전역 스타일

// 청크 로드 오류 처리
window.addEventListener('error', e => {
  if (e.message && e.message.includes('Loading chunk')) {
    console.error('청크 로드 오류 발생:', e.message);
    // 페이지 새로고침
    window.location.reload();
  }
});

// Promise rejection 처리
window.addEventListener('unhandledrejection', e => {
  if (e.reason && e.reason.message && e.reason.message.includes('Loading chunk')) {
    console.error('청크 로드 Promise 오류:', e.reason.message);
    // 페이지 새로고침
    window.location.reload();
  }
});

// 빌드 버전 표시 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  console.log('VideoPlanet Build Version: 2025.01.08.02')
  console.log('Button Styles Updated: ', new Date().toISOString())
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  // <React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  //</React.StrictMode>,
)
