import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isGlobalLoading: false,
  loadingMessage: '',
  componentLoading: {}
}

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setGlobalLoading: (state, action) => {
      state.isGlobalLoading = action.payload.loading
      state.loadingMessage = action.payload.message || ''
    },
    setComponentLoading: (state, action) => {
      const { componentName, loading } = action.payload
      state.componentLoading[componentName] = loading
    },
    clearComponentLoading: (state, action) => {
      delete state.componentLoading[action.payload]
    },
    resetLoading: (state) => {
      state.isGlobalLoading = false
      state.loadingMessage = ''
      state.componentLoading = {}
    }
  }
})

export const { setGlobalLoading, setComponentLoading, clearComponentLoading, resetLoading } = loadingSlice.actions
export default loadingSlice.reducer