/**
 * 프로젝트 단계별 완료 상태를 관리하는 Redux slice
 */
import { createSlice } from '@reduxjs/toolkit'

// localStorage에서 저장된 상태 불러오기
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('projectPhasesState')
    if (serializedState === null) {
      return undefined
    }
    return JSON.parse(serializedState)
  } catch (err) {
    console.error('Failed to load projectPhases state from localStorage:', err)
    return undefined
  }
}

// localStorage에 상태 저장하기
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem('projectPhasesState', serializedState)
  } catch (err) {
    console.error('Failed to save projectPhases state to localStorage:', err)
  }
}

const initialState = loadState() || {
  // projectId -> phaseKey -> completed
  completedStates: {}
}

const projectPhasesSlice = createSlice({
  name: 'projectPhases',
  initialState,
  reducers: {
    setPhaseCompleted: (state, action) => {
      const { projectId, phaseKey, completed } = action.payload
      
      if (!state.completedStates[projectId]) {
        state.completedStates[projectId] = {}
      }
      
      state.completedStates[projectId][phaseKey] = completed
    },
    
    setProjectPhases: (state, action) => {
      const { projectId, phases } = action.payload
      state.completedStates[projectId] = phases
    },
    
    clearProjectPhases: (state, action) => {
      const { projectId } = action.payload
      delete state.completedStates[projectId]
    },
    
    clearAllPhases: (state) => {
      state.completedStates = {}
    }
  }
})

export const { 
  setPhaseCompleted, 
  setProjectPhases, 
  clearProjectPhases, 
  clearAllPhases 
} = projectPhasesSlice.actions

export default projectPhasesSlice.reducer

// Selectors
export const selectPhaseCompleted = (state, projectId, phaseKey) => {
  return state.projectPhases?.completedStates?.[projectId]?.[phaseKey] || false
}

export const selectProjectPhases = (state, projectId) => {
  return state.projectPhases?.completedStates?.[projectId] || {}
}

// Redux 미들웨어: 상태 변경 시 localStorage에 저장
export const projectPhasesMiddleware = (store) => (next) => (action) => {
  const result = next(action)
  
  // projectPhases 관련 액션일 때만 저장
  if (action.type?.startsWith('projectPhases/')) {
    const state = store.getState()
    saveState(state.projectPhases)
  }
  
  return result
}