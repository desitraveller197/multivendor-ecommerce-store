import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../api/axiosConfig'

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
    // ignore storage errors
  }
}

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/wishlist')
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const syncWishlist = createAsyncThunk(
  'wishlist/syncWishlist',
  async (productIds, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put('/wishlist', { productIds })
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (product, { getState, dispatch, rejectWithValue }) => {
    dispatch(addToWishlistLocal(product))
    const state = getState()
    if (state.auth.isAuthenticated) {
      try {
        const productIds = state.wishlist.items.map((item) => item.id)
        const res = await axiosInstance.put('/wishlist', { productIds })
        return res.data
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message)
      }
    }
    return null
  }
)

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { getState, dispatch, rejectWithValue }) => {
    dispatch(removeFromWishlistLocal(productId))
    const state = getState()
    if (state.auth.isAuthenticated) {
      try {
        const productIds = state.wishlist.items.map((item) => item.id)
        const res = await axiosInstance.put('/wishlist', { productIds })
        return res.data
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message)
      }
    }
    return null
  }
)

export const clearWishlist = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { getState, dispatch, rejectWithValue }) => {
    dispatch(clearWishlistLocal())
    const state = getState()
    if (state.auth.isAuthenticated) {
      try {
        await axiosInstance.put('/wishlist', { productIds: [] })
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message)
      }
    }
    return null
  }
)

const initialState = {
  items: loadWishlistFromStorage(),
  loading: false,
  error: null,
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlistLocal: (state, action) => {
      const exists = state.items.some((item) => item.id === action.payload.id)
      if (!exists) {
        state.items.push(action.payload)
      }
      saveWishlistToStorage(state.items)
    },
    removeFromWishlistLocal: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
      saveWishlistToStorage(state.items)
    },
    clearWishlistLocal: (state) => {
      state.items = []
      saveWishlistToStorage(state.items)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        saveWishlistToStorage(state.items)
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(syncWishlist.fulfilled, (state, action) => {
        state.items = action.payload
        saveWishlistToStorage(state.items)
      })
  },
})

export const { addToWishlistLocal, removeFromWishlistLocal, clearWishlistLocal } = wishlistSlice.actions
export default wishlistSlice.reducer
