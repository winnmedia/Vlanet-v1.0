import {
  legacy_createStore as createStore,
  applyMiddleware,
  combineReducers,
} from '@reduxjs/toolkit'
import logger from 'redux-logger'
import ProjectStore from './project'

let store
if (process.env.NODE_ENV === 'production') {
  // 프로덕션 환경
  store = createStore(
    combineReducers({
      ProjectStore,
    }),
    // Redux DevTools Extension 비활성화
  )
} else {
  // 개발환경에선 로거 사용
  const middleware = []
  if (process.env.NODE_ENV === 'development') {
    middleware.push(logger)
  }
  
  store = createStore(
    combineReducers({
      ProjectStore,
    }),
    applyMiddleware(...middleware),
  )
}
export default store
