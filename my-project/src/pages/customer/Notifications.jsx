import { useSelector } from 'react-redux'
import NotificationDropdown from '../../components/NotificationDropdown'
import PageFrame from '../../components/PageFrame'

function Notifications() {
  const notifications = useSelector((state) => state.notifications.items)

  return (
    <PageFrame
      title="Your Notifications"
      description="Track order updates, offers, and important account alerts."
      actions={<NotificationDropdown notifications={notifications} />}
    >
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {notifications.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-100 p-3">
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <p className="text-sm text-slate-600">{item.message}</p>
          </article>
        ))}
      </div>
    </PageFrame>
  )
}

export default Notifications
