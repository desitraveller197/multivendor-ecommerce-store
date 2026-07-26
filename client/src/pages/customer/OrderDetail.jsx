import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import StartChatButton from '../../components/StartChatButton'
import InvoiceDownloadBtn from '../../components/InvoiceDownloadBtn'
import StarRating from '../../components/StarRating'
import PageFrame from '../../components/PageFrame'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const [refundReason, setRefundReason] = useState('')
  const [showRefundForm, setShowRefundForm] = useState(false)
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [refundSuccess, setRefundSuccess] = useState('')
  const [refundError, setRefundError] = useState('')

  const fetchOrder = async () => {
    try {
      if (USE_MOCK) {
        await delay(600)
        setOrder({
          id: 'ORD-001',
          orderNumber: 'ORD-2026-00001',
          status: 'Delivered',
          paymentMethod: 'Stripe',
          amount: 3200,
          date: '2026-05-01',
          isPaid: true,
          address: { street: 'Street 22', city: 'Lahore', province: 'Punjab', postal: '54000' },
          items: [
            { id: 1, name: 'Phulkari Dupatta', quantity: 1, price: 2800 },
            { id: 2, name: 'Lahori Jutti', quantity: 1, price: 400 },
          ]
        })
      } else {
        const res = await axiosInstance.get(`/orders/${id}`)
        setOrder(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err)
      setError('Failed to load order details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      if (USE_MOCK) {
        await delay(500)
        setOrder((prev) => ({ ...prev, status: 'Cancelled' }))
      } else {
        const res = await axiosInstance.patch(`/orders/${id}/cancel`)
        setOrder(res.data.order)
      }
      alert('Order cancelled successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  const handleRefundRequest = async (e) => {
    e.preventDefault()
    if (!refundReason.trim()) return
    setRefundSubmitting(true)
    setRefundError('')
    setRefundSuccess('')
    try {
      if (USE_MOCK) {
        await delay(500)
        setRefundSuccess('Refund request submitted successfully!')
      } else {
        await axiosInstance.post(`/orders/${id}/refund-request`, { reason: refundReason.trim() })
        setRefundSuccess('Refund request submitted successfully!')
      }
      setShowRefundForm(false)
      setRefundReason('')
    } catch (err) {
      setRefundError(err.response?.data?.message || 'Failed to submit refund request.')
    } finally {
      setRefundSubmitting(false)
    }
  }

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

  const isCancellable = order && ['pending', 'processing'].includes(String(order.status).toLowerCase())
  const isRefundable = order && (order.status === 'Delivered' || (order.isPaid && String(order.status).toLowerCase() !== 'cancelled' && String(order.status).toLowerCase() !== 'refunded'))

  return (
    <PageFrame title="Order Detail" description="Full details and shipping status for your order.">
      <section className="rounded-lg bg-white p-6 shadow-sm">
      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-4 space-y-4">
          <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
          <div className="h-6 w-1/4 animate-pulse rounded bg-slate-100" />
          <div className="h-6 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="h-32 w-full animate-pulse rounded bg-slate-100" />
        </div>
      ) : !order && !error ? (
        <p className="mt-4 text-slate-600">Order not found.</p>
      ) : order ? (
        <div className="mt-6 space-y-6 text-slate-700">
          {String(order.status).toLowerCase() === 'cancelled' ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              ⚠️ This order has been cancelled.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">Shipping Journey</h3>
              <div className="mt-6 relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-slate-200" />
                <div 
                  className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-blue-600 transition-all duration-500" 
                  style={{
                    width: `${
                      (String(order.status).toLowerCase() === 'pending' ? 0 :
                       String(order.status).toLowerCase() === 'processing' ? 1 :
                       String(order.status).toLowerCase() === 'shipped' ? 3 :
                       String(order.status).toLowerCase() === 'delivered' ? 4 : 0) / 4 * 100
                    }%`
                  }}
                />

                {[
                  { label: 'Placed', desc: 'Order received' },
                  { label: 'Processing', desc: 'Seller preparing' },
                  { label: 'Shipped', desc: 'On the way' },
                  { label: 'About to Reach', desc: 'Out for delivery' },
                  { label: 'Delivered', desc: 'Handed over' },
                ].map((step, idx) => {
                  const currentStep = 
                    String(order.status).toLowerCase() === 'pending' ? 0 :
                    String(order.status).toLowerCase() === 'processing' ? 1 :
                    String(order.status).toLowerCase() === 'shipped' ? 3 :
                    String(order.status).toLowerCase() === 'delivered' ? 4 : 0;
                  
                  const isCompleted = idx < currentStep;
                  const isActive = idx === currentStep;
                  
                  return (
                    <div key={step.label} className="relative z-10 flex flex-col items-center">
                      <div 
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ring-4 ${
                          isCompleted
                            ? 'bg-blue-600 text-white ring-blue-100'
                            : isActive
                              ? 'bg-blue-600 text-white ring-blue-100 animate-pulse'
                              : 'bg-white text-slate-400 ring-slate-100 border border-slate-200'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`mt-2 text-xs font-semibold ${isActive || isCompleted ? 'text-blue-700' : 'text-slate-500'}`}>
                        {step.label}
                      </span>
                      <span className="hidden sm:block text-[10px] text-slate-400 mt-0.5">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-500">Order number</p>
              <p className="font-bold text-slate-950 text-base">{order.orderNumber || order.id}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Date</p>
              <p>{formatDate(order.date)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Payment Method</p>
              <p>{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Status</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getBadgeClass(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Shipping Address</h2>
            <p className="mt-2">
              {order.address?.street}, {order.address?.city}, {order.address?.province} {order.address?.postal}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Order Items</h2>
            <table className="mt-3 w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">Qty</th>
                  <th className="py-2 font-medium text-right">Unit Price</th>
                  <th className="py-2 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2 text-right">PKR {item.price.toLocaleString()}</td>
                    <td className="py-2 text-right">PKR {(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="3" className="py-3 text-right font-bold text-slate-900">Total</td>
                  <td className="py-3 text-right font-bold text-slate-900">PKR {order.amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {order.status === 'Delivered' && (
            <div className="pt-2">
              <p className="mb-1 text-sm text-slate-500 font-semibold">Rate your purchase</p>
              <StarRating value={4} />
            </div>
          )}

          {showRefundForm && (
            <form onSubmit={handleRefundRequest} className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Submit Refund Request</h3>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 font-medium">Reason for Refund</label>
                <textarea
                  required
                  rows={2}
                  disabled={refundSubmitting}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain why you are requesting a refund..."
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={refundSubmitting || !refundReason.trim()}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {refundSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRefundForm(false)}
                  className="rounded bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {refundSuccess && <p className="text-xs text-green-600 font-semibold">{refundSuccess}</p>}
          {refundError && <p className="text-xs text-red-500">{refundError}</p>}
          
          <div className="flex flex-wrap gap-3 pt-2">
            {[...new Set((order.items || []).map((item) => String(item.sellerId || '')).filter(Boolean))].slice(0, 1).map(
              (sellerId) => (
                <StartChatButton
                  key={sellerId}
                  recipientId={sellerId}
                  type="order"
                  orderId={order.id}
                  subject={`Order #${String(order.orderNumber || order.id).slice(-6)}`}
                  label="Chat about this order"
                />
              ),
            )}
            <InvoiceDownloadBtn orderId={order.id} orderNumber={order.orderNumber} />

            {isCancellable && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}

            {isRefundable && !showRefundForm && !refundSuccess && (
              <button
                type="button"
                onClick={() => setShowRefundForm(true)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Request Refund
              </button>
            )}
          </div>
        </div>
      ) : null}
      </section>
    </PageFrame>
  )
}

export default OrderDetail
