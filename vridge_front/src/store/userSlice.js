import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: '',
  nickname: '',
  accessToken: '',
  profile: null  // Full profile data including is_staff
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
    },
    setNickname: (state, action) => {
      state.nickname = action.payload
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload
    },
    setProfile: (state, action) => {
      state.profile = action.payload
    },
    clearUser: (state) => {
      state.user = ''
      state.nickname = ''
      state.accessToken = ''
      state.profile = null
    }
  }
})

export const { setUser, setNickname, setAccessToken, setProfile, clearUser } = userSlice.actions
export default userSlice.reducer