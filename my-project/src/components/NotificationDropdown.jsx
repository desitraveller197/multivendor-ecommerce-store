import { useState } from 'react'
import { Link } from 'react-router-dom'

function NotificationDropdown({ notifications = [] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Notifications
        <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
          {notifications.length}
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <h4 className="mb-2 text-sm font-semibold text-slate-900">Latest updates</h4>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {notifications.length ? (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  to={item.link || '/customer/notifications'}
                  className="block rounded-lg border border-slate-100 p-2 hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.message}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">No new notifications.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default NotificationDropdown
