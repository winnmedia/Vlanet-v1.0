import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLoading: false,
  loadingMessage: '',
  loadingVariant: 'default',
  loadingStack: [] // 중복 방지를 위한 스택
}

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    showLoading: (state, action) => {
      const { message = '로딩 중', variant = 'default', id = 'default' } = action.payload || {}
      
      // 이미 같은 ID의 로딩이 있으면 무시
      if (state.loadingStack.find(item => item.id === id)) {
        return
      }
      
      state.loadingStack.push({ id, message, variant })
      state.isLoading = true
      state.loadingMessage = message
      state.loadingVariant = variant
    },
    hideLoading: (state, action) => {
      const { id = 'default' } = action.payload || {}
      
      // 스택에서 해당 ID 제거
      state.loadingStack = state.loadingStack.filter(item => item.id !== id)
      
      // 스택이 비어있으면 로딩 종료
      if (state.loadingStack.length === 0) {
        state.isLoading = false
        state.loadingMessage = ''
        state.loadingVariant = 'default'
      } else {
        // 스택에 아직 항목이 있으면 가장 최근 것으로 업데이트
        const lastItem = state.loadingStack[state.loadingStack.length - 1]
        state.loadingMessage = lastItem.message
        state.loadingVariant = lastItem.variant
      }
    },
    clearAllLoading: (state) => {
      state.isLoading = false
      state.loadingMessage = ''
      state.loadingVariant = 'default'
      state.loadingStack = []
    }
  }
})

export const { showLoading, hideLoading, clearAllLoading } = loadingSlice.actions
export default loadingSlice.reducer