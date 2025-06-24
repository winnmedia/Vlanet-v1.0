import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  nickname: null,
  sample_files: [],
  project_list: [],
  this_month_project: [],
  next_month_project: [],
}

export const ProjectSlice = createSlice({
  name: 'project',
  initialState: initialState,
  reducers: {
    // 툴킷에서 자체적으로 immer 사용해서 불변성 유지함
    updateProjectStore: (state, action) => {
      return (state = {
        ...state,
        ...action.payload,
      })
    },
    resetProjectStore: (state, action) => {
      return initialState
    },
  },
})

// 외부에서 액션 사용하기위해 export
export const { updateProjectStore, resetProjectStore } = ProjectSlice.actions

// store에 reducer 등록하기위해 export
export default ProjectSlice.reducer
