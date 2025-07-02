import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  profile: null,
  isLoading: false,
  error: null
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload
      state.error = null
    },
    setProfileLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setProfileError: (state, action) => {
      state.error = action.payload
      state.isLoading = false
    },
    clearProfile: (state) => {
      state.profile = null
      state.error = null
      state.isLoading = false
    }
  }
})

export const { setProfile, setProfileLoading, setProfileError, clearProfile } = profileSlice.actions
export default profileSlice.reducer