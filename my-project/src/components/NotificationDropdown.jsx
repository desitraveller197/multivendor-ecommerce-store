import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { markNotificationRead } from '../store/notificationSlice'

function NotificationDropdown({ notifications = [] }) {
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length
  const latestNotifications = notifications.slice(0, 5)

  const handleItemClick = (item) => {
    setOpen(false)
    if (!item.isRead && !item.read) {
      dispatch(markNotificationRead(item.id))
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        aria-label={`Notifications (${unreadCount})`}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-slate-900">Latest updates</h4>
            <Link
              to="/customer/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {latestNotifications.length ? (
              latestNotifications.map((item) => {
                const isRead = item.isRead || item.read
                return (
                  <Link
                    key={item.id}
                    to={item.link || '/customer/notifications'}
                    onClick={() => handleItemClick(item)}
                    className={`block rounded-lg border p-2 hover:bg-slate-50 transition ${
                      !isRead ? 'bg-blue-50/20 border-blue-100' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <p className={`text-sm font-medium ${!isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.title}
                      </p>
                      {!isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 mt-1.5" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                  </Link>
                )
              })
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No notifications.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default NotificationDropdown
