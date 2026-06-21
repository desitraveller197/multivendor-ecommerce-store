import { createSlice } from '@reduxjs/toolkit'

const loadCartFromStorage = () => {
  try {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const saveCartToStorage = (items) => {
  try {
    localStorage.setItem('cart', JSON.stringify(items))
  } catch {
    // ignore
  }
}

const initialState = {
  items: loadCartFromStorage(),
  lastAdded: null, // track last added item for toast feedback
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      // Support both `id` (mock data) and `_id` (MongoDB)
      const productId = action.payload._id || action.payload.id
      // Honor an explicit quantity (from the product detail selector); default 1.
      const qty = action.payload.quantity > 0 ? action.payload.quantity : 1
      const existingItem = state.items.find(
        (item) => (item._id || item.id) === productId,
      )
      if (existingItem) {
        existingItem.quantity += qty
      } else {
        state.items.push({ ...action.payload, quantity: qty })
      }
      state.lastAdded = action.payload.name || 'Item'
      saveCartToStorage(state.items)
    },
    decrementQuantity: (state, action) => {
      const productId = action.payload
      const item = state.items.find(
        (item) => (item._id || item.id) === productId,
      )
      if (item && item.quantity > 1) {
        item.quantity -= 1
      } else {
        state.items = state.items.filter(
          (item) => (item._id || item.id) !== productId,
        )
      }
      saveCartToStorage(state.items)
    },
    removeFromCart: (state, action) => {
      const productId = action.payload
      state.items = state.items.filter(
        (item) => (item._id || item.id) !== productId,
      )
      saveCartToStorage(state.items)
    },
    clearCart: (state) => {
      state.items = []
      state.lastAdded = null
      saveCartToStorage(state.items)
    },
    clearLastAdded: (state) => {
      state.lastAdded = null
    },
  },
})

export const { addToCart, decrementQuantity, removeFromCart, clearCart, clearLastAdded } =
  cartSlice.actions
export default cartSlice.reducer
