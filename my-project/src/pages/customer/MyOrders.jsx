import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { clearCart } from '../../store/cartSlice'

function MyOrders() {
  const dispatch = useDispatch()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stripePaidBanner, setStripePaidBanner] = useState(false)
  const flashMessage = location.state?.message

  useEffect(() => {
    if (searchParams.get('stripe_success') !== '1') return
    dispatch(clearCart())
    setStripePaidBanner(true)
    const next = new URLSearchParams(searchParams)
    next.delete('stripe_success')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, dispatch])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setOrders([
            { id: 'ORD-001', status: 'Delivered', amount: 3200, date: '2026-05-01', paymentMethod: 'Stripe' },
            { id: 'ORD-002', status: 'Processing', amount: 1800, date: '2026-05-04', paymentMethod: 'COD' },
            { id: 'ORD-003', status: 'Pending', amount: 950, date: '2026-05-07', paymentMethod: 'Stripe' },
          ])
        } else {
          const res = await axiosInstance.get('/orders/myorders')
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

  const getBadgeClass = (statusStr) => {
    switch (String(statusStr).toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>

      {flashMessage ? (
        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{flashMessage}</div>
      ) : null}

      {stripePaidBanner ? (
        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Payment completed successfully. Your order should appear below once processing finishes.
        </div>
      ) : null}

      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <>
            <div className="h-14 animate-pulse rounded bg-slate-100" />
            <div className="h-14 animate-pulse rounded bg-slate-100" />
            <div className="h-14 animate-pulse rounded bg-slate-100" />
          </>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-3"
            >
              <div>
                <p className="font-medium text-slate-800">{order.id}</p>
                <p className="text-xs text-slate-500">{formatDate(order.date)}</p>
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${getBadgeClass(order.status)}`}>
                  {order.status}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {String(order.status).toLowerCase() === 'pending' && 'Placed'}
                  {String(order.status).toLowerCase() === 'processing' && 'Processing'}
                  {String(order.status).toLowerCase() === 'shipped' && 'Shipped (About to reach)'}
                  {String(order.status).toLowerCase() === 'delivered' && 'Delivered'}
                  {String(order.status).toLowerCase() === 'cancelled' && 'Cancelled'}
                </span>
                <span className="text-[10px] text-slate-400">{order.paymentMethod}</span>
              </div>
              <Link to={`/my-orders/${order.id}`} className="text-sm font-semibold text-blue-700">
                View Detail
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default MyOrders
