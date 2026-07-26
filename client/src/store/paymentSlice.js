import { createSlice } from '@reduxjs/toolkit'

const paymentSlice = createSlice({
  name: 'payments',
  initialState: {
    methods: ['COD', 'Card', 'Wallet'],
    status: 'idle',
  },
  reducers: {
    setPaymentStatus: (state, action) => {
      state.status = action.payload
    },
  },
})

export const { setPaymentStatus } = paymentSlice.actions
export default paymentSlice.reducer
