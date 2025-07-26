import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { Router } from 'next/router'
import { createMemoryHistory } from 'history'

// Redux reducers import
import AuthStore from '@redux/Auth'
import ProjectStore from '@redux/project'
import VideoStore from '@redux/video'
import FeedbackStore from '@redux/feedback'
import UIStore from '@redux/ui'
import NotificationStore from '@redux/notification'

// 테스트용 Redux store 생성
export const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      AuthStore,
      ProjectStore,
      VideoStore,
      FeedbackStore,
      UIStore,
      NotificationStore,
    },
    preloadedState: initialState,
  })
}

// 커스텀 render 함수 타입
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any
  store?: any
  route?: string
}

// 모든 Provider를 포함한 wrapper
const AllTheProviders = ({ children, store }: { children: React.ReactNode; store: any }) => {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}

// 커스텀 render 함수
export const customRender = (
  ui: ReactElement,
  {
    initialState,
    store = createTestStore(initialState),
    route = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders store={store}>{children}</AllTheProviders>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
  }
}

// 테스트 데이터 생성 헬퍼
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  nickname: 'Test User',
  profileImage: null,
  role: 'member',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: '1',
  name: 'Test Project',
  client: 'Test Client',
  description: 'Test Description',
  color: '#1631F8',
  status: 'active',
  current_phase: 'planning',
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner: createMockUser(),
  members: [],
  feedback: [],
  videos: [],
  is_important: false,
  ...overrides,
})

export const createMockVideo = (overrides = {}) => ({
  id: '1',
  project_id: '1',
  title: 'Test Video',
  description: 'Test Video Description',
  url: 'https://example.com/video.mp4',
  thumbnail: 'https://example.com/thumbnail.jpg',
  duration: 120,
  status: 'ready',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: createMockUser(),
  tags: [],
  ...overrides,
})

export const createMockFeedback = (overrides = {}) => ({
  id: '1',
  project_id: '1',
  video_id: '1',
  user: createMockUser(),
  text: 'Test feedback',
  timestamp: 30,
  status: 'open',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  replies: [],
  attachments: [],
  ...overrides,
})

// 비동기 작업 대기 헬퍼
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Mock API 응답 헬퍼
export const mockApiResponse = <T>(data: T, delay = 0) => 
  new Promise<T>(resolve => setTimeout(() => resolve(data), delay))

export const mockApiError = (message: string, code = 'ERROR', delay = 0) => 
  new Promise((_, reject) => 
    setTimeout(() => reject({ message, code }), delay)
  )

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }