import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import Sidebar from '../../components/Sidebar'

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
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="admin" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">All Orders</h1>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by order/customer"
            className="rounded border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="mt-4 space-y-2">
          {state.loading ? (
            <>
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
            </>
          ) : state.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
          ) : (
            filtered.map((order) => (
              <div key={order.id} className="grid grid-cols-4 items-center rounded border border-slate-200 p-3 text-sm">
                <span>{order.id}</span>
                <span>{order.customer}</span>
                <span>PKR {order.amount}</span>
                <span className={`w-fit rounded px-2 py-0.5 text-xs font-medium capitalize ${getBadgeClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default AllOrders
