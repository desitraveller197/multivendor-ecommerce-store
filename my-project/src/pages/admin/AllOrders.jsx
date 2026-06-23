import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'

const fetchOrders = async () => {
  if (USE_MOCK) {
    await delay(600)
    return [
      { id: 'ORD-001', customer: 'Ali Raza', amount: 3200, status: 'Delivered', date: '2026-05-01' },
      { id: 'ORD-002', customer: 'Sara Khan', amount: 1800, status: 'Pending', date: '2026-05-03' },
      { id: 'ORD-003', customer: 'Omar Tariq', amount: 5400, status: 'Processing', date: '2026-05-05' },
      { id: 'ORD-004', customer: 'Hina Mir', amount: 900, status: 'Cancelled', date: '2026-05-07' },
    ]
  }

  const res = await axiosInstance.get('/admin/orders')
  return res.data
}

function AllOrders() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [state, setState] = useState({ loading: true, error: '', orders: [] })

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      setState({ loading: true, error: '', orders: [] })
      try {
        const orders = await fetchOrders()
        if (!isMounted) return
        setState({ loading: false, error: '', orders: Array.isArray(orders) ? orders : [] })
      } catch (err) {
        if (!isMounted) return
        setState({
          loading: false,
          error: err?.response?.data?.message || err?.message || 'Failed to load orders.',
          orders: [],
        })
      }
    }

    run()
    return () => {
      isMounted = false
    }
  }, [])

  const filtered = state.orders.filter((order) => {
    const matchesQuery =
      order.id.toLowerCase().includes(query.toLowerCase()) ||
      order.customer.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = status === 'all' || String(order.status).toLowerCase() === status
    return matchesQuery && matchesStatus
  })

  const getBadgeClass = (statusStr) => {
    switch (String(statusStr).toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const inputClass = 'rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

  return (
    <PageFrame title="All Orders" description="Browse and filter every order placed across the platform.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="admin" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mt-1 grid gap-3 md:grid-cols-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by order / customer"
            className={inputClass}
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={inputClass}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="mt-4">
          {state.loading ? (
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : state.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{state.error}</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                    {filtered.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 text-slate-600">{order.id}</td>
                        <td className="px-4 py-3 text-slate-600">{order.customer}</td>
                        <td className="px-4 py-3 font-medium text-blue-700">PKR {order.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${getBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                          No orders match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </PageFrame>
  )
}

export default AllOrders
