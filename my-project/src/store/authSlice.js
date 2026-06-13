import { createSlice } from '@reduxjs/toolkit'

const storedUser = localStorage.getItem('user')
const storedToken = localStorage.getItem('token')

const initialState = {
  isAuthenticated: Boolean(storedToken),
  token: storedToken || null,
  role: storedUser ? JSON.parse(storedUser).role : null,
  user: storedUser ? JSON.parse(storedUser) : null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true
      state.token = action.payload.token
      state.role = action.payload.role
      state.user = action.payload.user

      localStorage.setItem('token', action.payload.token)
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...action.payload.user,
          role: action.payload.role,
        }),
      )
    },
    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return {
        isAuthenticated: false,
        token: null,
        role: null,
        user: null,
      }
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem('user', JSON.stringify(state.user))
      }
    },
  },
})

export const { loginSuccess, logout, updateUser } = authSlice.actions
export default authSlice.reducer
