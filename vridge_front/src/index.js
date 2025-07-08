import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './routes/App'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import store from 'redux/store'
import './config/axios' // axios 설정 초기화

// 빌드 버전 표시
console.log('VideoPlanet Build Version: 2025.01.08.02')
console.log('Button Styles Updated: ', new Date().toISOString())

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
