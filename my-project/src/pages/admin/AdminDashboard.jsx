import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
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

    const fetchRecentOrders = async () => {
      try {
        if (USE_MOCK) {
          await delay(400)
          setRecentOrders([])
        } else {
          const res = await axiosInstance.get('/admin/orders')
          // Take latest 5 orders
          setRecentOrders((res.data || []).slice(0, 5))
        }
      } catch {
        // non-critical — just show empty
        setRecentOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchStats()
    fetchRecentOrders()
  }, [])

  return (
    <PageFrame title="Admin Dashboard" description="Platform overview — users, orders, revenue, and recent activity.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="admin" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
          {/* Stat cards */}
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

          {/* Recent Orders */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {ordersLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">No orders yet.</p>
              ) : (
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
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            #{String(order.orderNumber || order.id).slice(-8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {order.customer || <span className="italic text-slate-400">Guest</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-blue-700">
                            PKR {Number(order.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                              {order.status || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  )
}

export default AdminDashboard
