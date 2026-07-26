import { Link } from 'react-router-dom'

const linksByRole = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/sellers', label: 'Manage Sellers' },
    { to: '/admin/orders', label: 'All Orders' },
    { to: '/admin/users', label: 'Manage Users' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/transactions', label: 'Transactions' },
    { to: '/admin/withdrawals', label: 'Withdrawal Requests' },
    { to: '/admin/refunds', label: 'Refund Requests' },
    { to: '/admin/sales-report', label: 'Sales Report' },
    { to: '/admin/platform-settings', label: 'Platform Settings' },
    { to: '/admin/posters', label: 'Manage Posters' },
    { to: '/admin/vouchers', label: 'Manage Vouchers' },
    { to: '/messages', label: 'Messages' },
  ],
  seller: [
    { to: '/seller/dashboard', label: 'Dashboard' },
    { to: '/seller/shop', label: 'My Shop' },
    { to: '/seller/charges', label: 'Other Charges' },
    { to: '/seller/products', label: 'Products' },
    { to: '/seller/products/bulk-upload', label: 'Bulk Upload' },
    { to: '/seller/discounts', label: 'Manage Discounts' },
    { to: '/seller/orders', label: 'Orders' },
    { to: '/seller/withdraw', label: 'Withdraw Earnings' },
    { to: '/messages', label: 'Messages' },
  ],
  customer: [
    { to: '/products', label: 'Products' },
    { to: '/wishlist', label: 'Wishlist' },
    { to: '/customer/cart', label: 'Cart' },
    { to: '/my-orders', label: 'My Orders' },
    { to: '/my-vouchers', label: 'Vouchers' },
    { to: '/customer/notifications', label: 'Notifications' },
    { to: '/messages', label: 'Messages' },
  ],
}

function Sidebar({ role }) {
  const links = linksByRole[role] || []

  return (
    <aside className="h-fit rounded-lg bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold capitalize text-slate-900">{role} Panel</h2>
      <nav className="mt-3 flex overflow-x-auto gap-1.5 pb-1 lg:pb-0 lg:flex-col lg:space-y-1 lg:gap-0 scrollbar-none">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold sm:text-sm text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 lg:bg-transparent lg:hover:bg-slate-100 transition-colors shrink-0"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
