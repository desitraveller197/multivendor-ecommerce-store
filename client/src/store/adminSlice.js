import { createSlice } from '@reduxjs/toolkit'

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats: {},
    settings: {},
  },
  reducers: {
    setAdminStats: (state, action) => {
      state.stats = action.payload
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload }
    },
  },
})

export const { setAdminStats, updateSettings } = adminSlice.actions
export default adminSlice.reducer
