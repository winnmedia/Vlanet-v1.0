import {
  legacy_createStore as createStore,
  applyMiddleware,
  combineReducers,
} from '@reduxjs/toolkit'
import logger from 'redux-logger'
import ProjectStore from './project'

let store
if (process.env.REACT_APP_MODE === 'production') {
  // 빌드제품
  store = createStore(
    combineReducers({
      ProjectStore,
    }), // store 불러올때는 ProjectStore로 사용됨
  )
} else {
  // 개발환경에선 로거 사용
  store = createStore(
    combineReducers({
      ProjectStore,
    }),
    applyMiddleware(logger),
  )
}
export default store
