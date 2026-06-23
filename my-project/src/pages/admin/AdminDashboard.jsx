import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
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
    <PageFrame title="Admin Dashboard" description="Platform overview — users, orders, revenue, and recent activity.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="admin" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mt-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
            </>
          ) : error ? (
            <div className="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : stats && (
            <>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm text-slate-500">Users</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stats.users}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm text-slate-500">Orders</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stats.orders}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm text-slate-500">Revenue (PKR)</p>
                <p className="mt-1 text-2xl font-bold text-blue-700">{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-sm text-slate-500">Products</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stats.products}</p>
              </div>
            </>
          )}
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Order ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3 text-slate-600">{order.id}</td>
                      <td className="px-4 py-3 text-slate-600">{order.customer}</td>
                      <td className="px-4 py-3 font-medium text-blue-700">PKR {order.amount}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </div>
    </PageFrame>
  )
}

export default AdminDashboard
