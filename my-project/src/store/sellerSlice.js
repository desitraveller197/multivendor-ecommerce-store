import { createSlice } from '@reduxjs/toolkit'

const sellerSlice = createSlice({
  name: 'seller',
  initialState: {
    profile: null,
    earnings: 0,
  },
  reducers: {
    setSellerProfile: (state, action) => {
      state.profile = action.payload
    },
    setEarnings: (state, action) => {
      state.earnings = action.payload
    },
  },
})

export const { setSellerProfile, setEarnings } = sellerSlice.actions
export default sellerSlice.reducer
