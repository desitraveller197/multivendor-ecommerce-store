import { createSlice } from '@reduxjs/toolkit'

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
  },
  reducers: {
    setOrders: (state, action) => {
      state.items = action.payload
    },
    addOrder: (state, action) => {
      state.items.unshift(action.payload)
    },
  },
})

export const { setOrders, addOrder } = orderSlice.actions
export default orderSlice.reducer
