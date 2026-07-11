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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const mobileMenuRef = useRef(null)
  const mobileMenuButtonRef = useRef(null)
  const accountMenuRef = useRef(null)

  const navLinkBase =
    'rounded-md px-2 py-1.5 font-medium text-slate-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap xl:px-2.5'
  const navLinkActive = 'bg-blue-100 text-blue-800 shadow-sm'
  const mobileNavLinkBase =
    'block px-4 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700'

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

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
    setIsMenuOpen(false)
    setIsAccountOpen(false)
  }

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const target = event.target
      if (!target) return

      if (isMenuOpen) {
        const clickedButton = mobileMenuButtonRef.current?.contains(target)
        const clickedMenu = mobileMenuRef.current?.contains(target)
        if (!clickedButton && !clickedMenu) setIsMenuOpen(false)
      }

      if (isAccountOpen) {
        const clickedAccount = accountMenuRef.current?.contains(target)
        if (!clickedAccount) setIsAccountOpen(false)
      }
    }

    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [isMenuOpen, isAccountOpen])

  const accountLinks =
    role === 'customer'
      ? [
          { to: '/wishlist', label: 'Wishlist', badge: wishlistCount },
          { to: '/my-orders', label: 'Orders' },
          { to: '/my-profile', label: 'Profile' },
          { to: '/messages', label: 'Messages' },
          { to: '/my-vouchers', label: 'My Vouchers' },
          { to: '/customer/notifications', label: 'Alerts' },
        ]
      : role === 'seller'
        ? [
            { to: '/messages', label: 'Messages' },
            { to: '/seller/dashboard', label: 'Seller Panel' },
          ]
        : role === 'admin'
          ? [
              { to: '/messages', label: 'Messages' },
              { to: '/admin/dashboard', label: 'Admin Panel' },
            ]
          : []

  const publicLinks = (
    <>
      <NavLink to="/" className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}>
        Home
      </NavLink>
      <NavLink to="/browse" className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}>
        Browse
      </NavLink>
      <NavLink to="/products" className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}>
        Products
      </NavLink>
      <NavLink to="/regional" className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}>
        Regional
      </NavLink>
      <NavLink to="/shops" className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}>
        Shops
      </NavLink>
    </>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        <Link
          to="/"
          className="shrink-0 rounded-md px-2 py-1 text-lg font-bold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
        >
          Bazarix
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 text-xs xl:flex xl:gap-1.5 xl:text-sm">
          {publicLinks}

          {isAuthenticated && role === 'customer' && (
            <NavLink
              to="/cart"
              className={({ isActive }) => `${navLinkBase} relative ${isActive ? navLinkActive : ''}`}
            >
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </NavLink>
          )}

          {isAuthenticated ? (
            <>
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsAccountOpen((prev) => !prev)}
                  className={`${navLinkBase} inline-flex items-center gap-1`}
                  aria-expanded={isAccountOpen}
                  aria-haspopup="menu"
                >
                  Account
                  <span className="text-[10px]">{isAccountOpen ? '▲' : '▼'}</span>
                </button>
                {isAccountOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    {accountLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                        className={({ isActive }) =>
                          `relative block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 ${
                            isActive ? 'bg-blue-50 font-semibold text-blue-800' : ''
                          }`
                        }
                      >
                        {link.label}
                        {link.badge > 0 ? (
                          <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                            {link.badge}
                          </span>
                        ) : null}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>

              <NotificationDropdown notifications={notifications} />

              <span className="max-w-[7rem] truncate rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 xl:max-w-[9rem]">
                {user?.name || 'User'}
              </span>

              <button
                type="button"
                className="shrink-0 rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-600 xl:px-3 xl:text-sm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}>
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

        <button
          ref={mobileMenuButtonRef}
          type="button"
          className="shrink-0 rounded-md px-3 py-2 text-lg font-semibold text-slate-700 hover:bg-slate-100 xl:hidden"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {isMenuOpen ? (
        <div ref={mobileMenuRef} className="border-b border-slate-200 bg-white xl:hidden">
          <nav className="flex max-h-[70vh] flex-col overflow-y-auto text-sm">
            <NavLink
              to="/"
              className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/browse"
              className={({ isActive }) => `${mobileNavLinkBase} ${isActive ? navLinkActive : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Browse
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
            {isAuthenticated && role === 'customer' && (
              <NavLink
                to="/cart"
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
            )}

            {isAuthenticated
              ? accountLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `${mobileNavLinkBase} relative ${isActive ? navLinkActive : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                    {link.badge > 0 && (
                      <span className="absolute right-4 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                ))
              : null}

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
              {isAuthenticated ? <NotificationDropdown notifications={notifications} /> : <span />}
              {isAuthenticated ? (
                <button
                  type="button"
                  className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600"
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
        <div className="fixed bottom-6 right-4 z-50 max-w-[calc(100vw-2rem)] animate-bounce rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg sm:right-6 sm:px-5">
          ✓ &quot;{lastAdded}&quot; added to cart!
        </div>
      )}
    </header>
  )
}

export default Navbar
