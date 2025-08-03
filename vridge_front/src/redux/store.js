import {
  legacy_createStore as createStore,
  applyMiddleware,
  combineReducers,
} from '@reduxjs/toolkit'
import logger from 'redux-logger'
import { thunk } from 'redux-thunk'
import ProjectStore from './project'
import loadingReducer from './loading'
import workflowReducer from './workflow'
import projectPhasesReducer, { projectPhasesMiddleware } from './projectPhases'

let store
if (process.env.NODE_ENV === 'production') {
  // 프로덕션 환경 - thunk와 projectPhasesMiddleware 사용
  store = createStore(
    combineReducers({
      ProjectStore,
      loading: loadingReducer,
      workflow: workflowReducer,
      projectPhases: projectPhasesReducer,
    }),
    applyMiddleware(thunk, projectPhasesMiddleware)
  )
} else {
  // 개발환경에선 로거, thunk, projectPhasesMiddleware 사용
  const middleware = [thunk, projectPhasesMiddleware]
  if (process.env.NODE_ENV === 'development') {
    middleware.push(logger)
  }
  
  store = createStore(
    combineReducers({
      ProjectStore,
      loading: loadingReducer,
      workflow: workflowReducer,
      projectPhases: projectPhasesReducer,
    }),
    applyMiddleware(...middleware),
  )
}
export default store
