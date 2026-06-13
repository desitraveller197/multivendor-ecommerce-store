import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [
    { id: 1, title: 'Order shipped', message: 'Your order #10021 is on the way.', read: false },
    { id: 2, title: 'Flash sale', message: 'Weekend sale starts tonight.', read: false },
  ],
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload)
    },
    markAsRead: (state, action) => {
      const target = state.items.find((item) => item.id === action.payload)
      if (target) target.read = true
    },
  },
})

export const { addNotification, markAsRead } = notificationSlice.actions
export default notificationSlice.reducer
