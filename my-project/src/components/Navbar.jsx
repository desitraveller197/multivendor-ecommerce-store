import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../store/authSlice'
import { clearLastAdded } from '../store/cartSlice'
import NotificationDropdown from './NotificationDropdown'

function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, role, user } = useSelector((state) => state.auth)
  const notifications = useSelector((state) => state.notifications.items)
  const cartItems = useSelector((state) => state.cart.items)
  const lastAdded = useSelector((state) => state.cart.lastAdded)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const wishlistItems = useSelector((state) => state.wishlist.items)
  const wishlistCount = wishlistItems.length
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (lastAdded) {
      setShowToast(true)
      const timer = setTimeout(() => {
        setShowToast(false)
        dispatch(clearLastAdded())
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [lastAdded, dispatch])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const mobileMenuRef = useRef(null)
  const mobileMenuButtonRef = useRef(null)
  const navLinkBase =
    'rounded-md px-3 py-1.5 font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm whitespace-nowrap'
  const navLinkActive = 'bg-blue-100 text-blue-800 shadow-sm'
  const mobileNavLinkBase =
    'block px-4 py-2 font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    setIsMenuOpen(false)
  }

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!isMenuOpen) return
      const target = event.target
      if (!target) return

      const clickedButton = mobileMenuButtonRef.current?.contains(target)
      const clickedMenu = mobileMenuRef.current?.contains(target)
      if (clickedButton || clickedMenu) return

      setIsMenuOpen(false)
    }

    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [isMenuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="rounded-md px-2 py-1 text-lg font-bold text-blue-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-800"
        >
          Bazarix
        </Link>

        <div className="flex items-center gap-3">
          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="block rounded-md px-3 py-2 text-lg font-semibold text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>

          <div className="hidden md:block">
            <nav className="flex items-center gap-4 text-sm">
              <NavLink to="/" className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}>
                Home
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
              >
                Products
              </NavLink>
              <NavLink
                to="/regional"
                className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
              >
                Regional
              </NavLink>
              <NavLink
                to="/shops"
                className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
              >
                Shops
              </NavLink>
              <NavLink
                to="/cart"
                className={({ isActive }) => `${navLinkBase} relative ${isActive ? navLinkActive : ''}`}
              >
                Cart
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </NavLink>
              {isAuthenticated && role === 'customer' ? (
                <>
                  <NavLink
                    to="/wishlist"
                    className={({ isActive }) => `${navLinkBase} relative ${isActive ? navLinkActive : ''}`}
                  >
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {wishlistCount}
                      </span>
                    )}
                  </NavLink>
                  <NavLink
                    to="/my-orders"
                    className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
                  >
                    Orders
                  </NavLink>
                  <NavLink
                    to="/my-profile"
                    className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
                  >
                    Profile
                  </NavLink>
                  <NavLink
                    to="/customer/notifications"
                    className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
                  >
                    Alerts
                  </NavLink>
                </>
              ) : null}
              {isAuthenticated && role === 'seller' ? (
                <NavLink
                  to="/seller/dashboard"
                  className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
                >
                  Seller Panel
                </NavLink>
              ) : null}
              {isAuthenticated && role === 'admin' ? (
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
                >
                  Admin Panel
                </NavLink>
              ) : null}
              {isAuthenticated ? <NotificationDropdown notifications={notifications} /> : null}
              {isAuthenticated ? (
                <>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    {user?.name || 'User'}
                  </span>
                  <button
                    className="rounded-md bg-red-500 px-3 py-1.5 font-semibold text-white hover:bg-red-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
                  >
                    Register
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      {isMenuOpen ? (
        <div ref={mobileMenuRef} className="border-b border-slate-200 bg-white md:hidden">
          <nav className="flex flex-col text-sm">
            <NavLink
              to="/"
              className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </NavLink>
            <NavLink
              to="/regional"
              className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Regional
            </NavLink>
            <NavLink
              to="/shops"
              className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Shops
            </NavLink>

            {isAuthenticated && role === 'customer' ? (
              <>
                <NavLink
                  to="/customer/cart"
                  className={({ isActive }) => `${mobileNavLinkBase} relative ${isActive ? navLinkActive : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute right-4 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </NavLink>
                <NavLink
                  to="/wishlist"
                  className={({ isActive }) => `${mobileNavLinkBase} relative ${isActive ? navLinkActive : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="absolute right-4 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {wishlistCount}
                    </span>
                  )}
                </NavLink>
                <NavLink
                  to="/my-orders"
                  className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Orders
                </NavLink>
                <NavLink
                  to="/my-profile"
                  className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </NavLink>
                <NavLink
                  to="/customer/notifications"
                  className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Alerts
                </NavLink>
              </>
            ) : null}

            {isAuthenticated && role === 'seller' ? (
              <NavLink
                to="/seller/dashboard"
                className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Seller Panel
              </NavLink>
            ) : null}

            {isAuthenticated && role === 'admin' ? (
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Admin Panel
              </NavLink>
            ) : null}

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              {isAuthenticated ? <NotificationDropdown notifications={notifications} /> : <span />}
              {isAuthenticated ? (
                <button
                  className="rounded-md bg-red-500 px-3 py-1.5 font-semibold text-white hover:bg-red-600"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              ) : (
                <div className="flex w-full items-center gap-2">
                  <NavLink
                    to="/login"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </NavLink>
                </div>
              )}
            </div>
          </nav>
        </div>
      ) : null}

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          ✓ "{lastAdded}" added to cart!
        </div>
      )}
    </header>
  )
}

export default Navbar
