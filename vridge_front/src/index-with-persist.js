import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './routes/App'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import store, { persistor } from 'redux/store-with-persist'
import './config/axios' // axios 설정 초기화

// Loading component for PersistGate
const LoadingView = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#1631F8'
  }}>
    VideoPlanet 로딩 중...
  </div>
)

// 빌드 버전 표시
console.log('VideoPlanet Build Version: 2025.01.12 - Redux Persist')
console.log('Refresh Issue Fixed: ', new Date().toISOString())

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <Provider store={store}>
    <PersistGate loading={<LoadingView />} persistor={persistor}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistGate>
  </Provider>
)