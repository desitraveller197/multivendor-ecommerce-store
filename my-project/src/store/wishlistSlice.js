import { createSlice } from '@reduxjs/toolkit'

const loadWishlistFromStorage = () => {
  try {
    const raw = localStorage.getItem('wishlist')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveWishlistToStorage = (items) => {
  try {
    localStorage.setItem('wishlist', JSON.stringify(items))
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

const initialState = {
  items: loadWishlistFromStorage(),
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const exists = state.items.some((item) => item.id === action.payload.id)
      if (!exists) {
        state.items.push(action.payload)
      }
      saveWishlistToStorage(state.items)
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
      saveWishlistToStorage(state.items)
    },
    clearWishlist: (state) => {
      state.items = []
      saveWishlistToStorage(state.items)
    },
  },
})

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
