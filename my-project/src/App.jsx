import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { fetchProducts, fetchCategories } from './store/productSlice'
import { fetchNotifications, addNotification } from './store/notificationSlice'
import { fetchWishlist, syncWishlist } from './store/wishlistSlice'
import { connectSocket, disconnectSocket } from './api/socket'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import AllOrders from './pages/admin/AllOrders'
import ManageCategories from './pages/admin/ManageCategories'
import ManageSellers from './pages/admin/ManageSellers'
import ManageUsers from './pages/admin/ManageUsers'
import PlatformSettings from './pages/admin/PlatformSettings'
import RefundRequests from './pages/admin/RefundRequests'
import SalesReport from './pages/admin/SalesReport'
import Transactions from './pages/admin/Transactions'
import WithdrawalRequests from './pages/admin/WithdrawalRequests'
import ManagePosters from './pages/admin/ManagePosters'
import ForgotPassword from './pages/auth/ForgotPassword'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ResetPassword from './pages/auth/ResetPassword'
import Checkout from './pages/customer/Checkout'
import CheckoutCancel from './pages/customer/CheckoutCancel'
import CheckoutSuccess from './pages/customer/CheckoutSuccess'
import MyOrders from './pages/customer/MyOrders'
import MyProfile from './pages/customer/MyProfile'
import Notifications from './pages/customer/Notifications'
import OrderDetail from './pages/customer/OrderDetail'
import Wishlist from './pages/customer/Wishlist'
import MyVouchers from './pages/customer/MyVouchers'
import AddProduct from './pages/seller/AddProduct'
import EditProduct from './pages/seller/EditProduct'
import ManageDiscounts from './pages/seller/ManageDiscounts'
import MyShop from './pages/seller/MyShop'
import SellerCharges from './pages/seller/SellerCharges'
import Products from './pages/seller/Products'
import SellerDashboard from './pages/seller/SellerDashboard'
import SellerOrders from './pages/seller/SellerOrders'
import WithdrawEarnings from './pages/seller/WithdrawEarnings'
import Cart from './pages/public/Cart'
import Home from './pages/public/Home'
import GenericHome from './pages/public/GenericHome'
import ProductDetail from './pages/public/ProductDetail'
import ProductListing from './pages/public/ProductListing'
import Regional from './pages/public/Regional'
import ShopBrowse from './pages/public/ShopBrowse'
import ShopPage from './pages/public/ShopPage'
import Messages from './pages/customer/Messages'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, token } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated && token) {
      // Sync guest wishlist from local storage to database
      try {
        const raw = localStorage.getItem('wishlist');
        const localWishlist = raw ? JSON.parse(raw) : [];
        const localIds = localWishlist.map((item) => item.id || item._id).filter(Boolean);
        dispatch(syncWishlist(localIds)).then(() => {
          dispatch(fetchWishlist());
        });
      } catch (err) {
        console.error('Failed to parse local wishlist:', err);
        dispatch(fetchWishlist());
      }

      dispatch(fetchNotifications())
      const socket = connectSocket(token)
      if (socket) {
        socket.on('new_notification', (data) => {
          dispatch(addNotification(data))
        })
      }
      return () => {
        if (socket) {
          socket.off('new_notification')
        }
      }
    } else {
      disconnectSocket()
    }
  }, [isAuthenticated, token, dispatch])

  return (
    <BrowserRouter>
      <div className="app-shell-background min-h-screen w-full overflow-x-hidden">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl overflow-x-hidden p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<GenericHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/regional" element={<Regional />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/shops" element={<ShopBrowse />} />
            <Route path="/shops/:id" element={<ShopPage />} />
            <Route path="/cart" element={<Cart />} />

            <Route
              path="/messages"
              element={
                <ProtectedRoute roles={['customer', 'seller', 'admin']}>
                  <Messages />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sellers"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ManageSellers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AllOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ManageCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/withdrawals"
              element={
                <ProtectedRoute roles={['admin']}>
                  <WithdrawalRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/refunds"
              element={
                <ProtectedRoute roles={['admin']}>
                  <RefundRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sales-report"
              element={
                <ProtectedRoute roles={['admin']}>
                  <SalesReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/platform-settings"
              element={
                <ProtectedRoute roles={['admin']}>
                  <PlatformSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/posters"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ManagePosters />
                </ProtectedRoute>
              }
            />

            <Route
              path="/seller/dashboard"
              element={
                <ProtectedRoute roles={['seller']}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products"
              element={
                <ProtectedRoute roles={['seller']}>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products/add"
              element={
                <ProtectedRoute roles={['seller']}>
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products/edit/:id"
              element={
                <ProtectedRoute roles={['seller']}>
                  <EditProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/discounts"
              element={
                <ProtectedRoute roles={['seller']}>
                  <ManageDiscounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/orders"
              element={
                <ProtectedRoute roles={['seller']}>
                  <SellerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/shop"
              element={
                <ProtectedRoute roles={['seller']}>
                  <MyShop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/charges"
              element={
                <ProtectedRoute roles={['seller']}>
                  <SellerCharges />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/withdraw"
              element={
                <ProtectedRoute roles={['seller']}>
                  <WithdrawEarnings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customer/cart"
              element={
                <ProtectedRoute roles={['customer']}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/notifications"
              element={
                <ProtectedRoute roles={['customer']}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute roles={['customer']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <ProtectedRoute roles={['customer']}>
                  <CheckoutSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/cancel"
              element={
                <ProtectedRoute roles={['customer']}>
                  <CheckoutCancel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute roles={['customer']}>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-vouchers"
              element={
                <ProtectedRoute roles={['customer']}>
                  <MyVouchers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute roles={['customer']}>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders/:id"
              element={
                <ProtectedRoute roles={['customer']}>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-profile"
              element={
                <ProtectedRoute roles={['customer']}>
                  <MyProfile />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
