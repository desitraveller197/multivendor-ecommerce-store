import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import Sidebar from '../../components/Sidebar'
import { orders } from '../../data/mockData'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let data
        if (USE_MOCK) {
          await delay(600)
          data = { users: 24, orders: 18, revenue: 284500, products: 42 }
        } else {
          const res = await axiosInstance.get('/admin/stats')
          data = res.data
        }
        setStats(data)
      } catch (err) {
        setError('Failed to load dashboard stats.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="admin" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <div className="h-20 animate-pulse rounded bg-slate-100" />
              <div className="h-20 animate-pulse rounded bg-slate-100" />
              <div className="h-20 animate-pulse rounded bg-slate-100" />
              <div className="h-20 animate-pulse rounded bg-slate-100" />
            </>
          ) : error ? (
            <div className="col-span-full rounded bg-red-50 p-4 text-red-700">
              {error}
            </div>
          ) : stats && (
            <>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm text-slate-500">Users</p>
                <p className="text-xl font-bold text-slate-900">{stats.users}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm text-slate-500">Orders</p>
                <p className="text-xl font-bold text-slate-900">{stats.orders}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm text-slate-500">Revenue (PKR)</p>
                <p className="text-xl font-bold text-slate-900">{stats.revenue}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm text-slate-500">Products</p>
                <p className="text-xl font-bold text-slate-900">{stats.products}</p>
              </div>
            </>
          )}
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <div className="mt-2 space-y-2">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-4 rounded border border-slate-200 p-3 text-sm"
              >
                <span>{order.id}</span>
                <span>{order.customer}</span>
                <span>PKR {order.amount}</span>
                <span className="capitalize">{order.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminDashboard
