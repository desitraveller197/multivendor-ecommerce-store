import { configureStore } from '@reduxjs/toolkit'
import adminReducer from './adminSlice'
import authReducer from './authSlice'
import cartReducer from './cartSlice'
import notificationReducer from './notificationSlice'
import orderReducer from './orderSlice'
import paymentReducer from './paymentSlice'
import productReducer from './productSlice'
import sellerReducer from './sellerSlice'
import wishlistReducer from './wishlistSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    orders: orderReducer,
    seller: sellerReducer,
    admin: adminReducer,
    notifications: notificationReducer,
    payments: paymentReducer,
  },
})
