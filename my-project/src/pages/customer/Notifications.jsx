import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../store/notificationSlice'
import PageFrame from '../../components/PageFrame'

function Notifications() {
  const dispatch = useDispatch()
  const { items: notifications, loading, error } = useSelector((state) => state.notifications)

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead())
  }

  const handleMarkRead = (id, read) => {
    if (!read) {
      dispatch(markNotificationRead(id))
    }
  }

  const hasUnread = notifications.some((n) => !n.isRead && !n.read)

  return (
    <div className="mx-auto max-w-[983px]">
      <PageFrame
        title="Your Notifications"
        description="Track order updates, offers, and important account alerts."
        actions={
          hasUnread ? (
            <button
              onClick={handleMarkAllRead}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Mark all as read
            </button>
          ) : null
        }
      >
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          {loading && notifications.length === 0 ? (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500">{error}</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-sm mt-1">You have no new notifications.</p>
            </div>
          ) : (
            notifications.map((item) => {
              const isRead = item.isRead || item.read
              return (
                <article
                  key={item.id}
                  onClick={() => handleMarkRead(item.id, isRead)}
                  className={`relative rounded-lg border border-slate-100 p-4 transition duration-200 cursor-pointer hover:border-slate-200 hover:shadow-sm ${
                    !isRead ? 'bg-blue-50/30 border-l-4 border-l-blue-600' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    {!isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  {item.createdAt && (
                    <span className="mt-2 block text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  )}
                </article>
              )
            })
          )}
        </div>
      </PageFrame>
    </div>
  )
}

export default Notifications
