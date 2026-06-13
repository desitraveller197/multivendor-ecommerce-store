import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setOrders([
            { id: 'ORD-001', customer: 'Ali Raza', amount: 3200, status: 'Pending' },
            { id: 'ORD-002', customer: 'Sara Khan', amount: 1800, status: 'Processing' },
            { id: 'ORD-003', customer: 'Omar Tariq', amount: 5400, status: 'Delivered' },
          ])
        } else {
          const res = await axiosInstance.get('/orders/seller')
          setOrders(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err)
        setError('Failed to load orders.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const handleStatusChange = async (id, newStatus) => {
    const previousOrders = [...orders]
    
    // Optimistic update
    setOrders((prev) => prev.map((order) => order.id === id ? { ...order, status: newStatus } : order))
    setUpdatingId(id)

    try {
      if (USE_MOCK) {
        await delay(400)
      } else {
        await axiosInstance.put(`/orders/${id}/status`, { status: newStatus })
      }
    } catch (err) {
      console.error('Failed to update status:', err)
      // Revert optimistic update
      setOrders(previousOrders)
      setError('Failed to update order status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const getBadgeClass = (statusStr) => {
    switch (String(statusStr).toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="seller" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Seller Orders</h1>
        
        {error && (
          <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {loading ? (
            <>
              <div className="h-12 animate-pulse rounded border border-slate-200 bg-slate-100" />
              <div className="h-12 animate-pulse rounded border border-slate-200 bg-slate-100" />
              <div className="h-12 animate-pulse rounded border border-slate-200 bg-slate-100" />
            </>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-5 items-center gap-2 rounded border border-slate-200 p-3 text-sm"
              >
                <span>{order.id}</span>
                <span>PKR {order.amount}</span>
                <span>{order.customer}</span>
                <span className={`w-fit rounded px-2 py-0.5 text-xs font-medium capitalize ${getBadgeClass(order.status)}`}>
                  {order.status}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    className="rounded border border-slate-300 px-2 py-1 outline-none focus:border-blue-500"
                    onChange={(event) => handleStatusChange(order.id, event.target.value)}
                    disabled={updatingId === order.id}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  {updatingId === order.id && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default SellerOrders
