import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setOrders([
            { id: 'ORD-001', customer: 'Ali Raza', amount: 3200, status: 'Pending', paymentReceipt: '/images/jazzcash_qr.jpg' },
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
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-indigo-100 text-indigo-800'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <PageFrame title="Seller Orders" description="View orders containing your products and update their status.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {loading ? (
            <>
              <div className="h-14 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
            </>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">{order.id}</p>
                  <p className="text-slate-500">{order.customer}</p>
                  <p className="font-bold text-blue-700">PKR {order.amount}</p>
                  {order.paymentReceipt && (
                    <button
                      onClick={() => setSelectedReceipt(order.paymentReceipt)}
                      className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-850 font-semibold transition-all border border-blue-200 hover:border-blue-300 bg-blue-50 px-2 py-1 rounded shadow-sm hover:shadow"
                    >
                      📄 View Payment Receipt
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                  {order.status === 'Pending' && order.paymentReceipt && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'Processing')}
                      disabled={updatingId === order.id}
                      className="rounded bg-green-600 hover:bg-green-700 active:bg-green-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow disabled:opacity-50"
                    >
                      Confirm Order
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      className="rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
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
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>

      {/* Payment Receipt Lightbox/Modal */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedReceipt(null)}
        >
          <div 
            className="relative max-w-lg w-full bg-white rounded-xl overflow-hidden shadow-2xl p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 w-full border-b pb-2 flex justify-between items-center">
              <span>Payment Receipt Screenshot</span>
              <button 
                onClick={() => setSelectedReceipt(null)} 
                className="text-slate-400 hover:text-slate-600 font-normal text-xl"
              >
                ✕
              </button>
            </h3>
            <div className="w-full flex justify-center bg-slate-50 border rounded-lg p-2 max-h-[70vh] overflow-auto">
              <img 
                src={selectedReceipt} 
                alt="Payment Receipt Screenshot" 
                className="max-w-full h-auto object-contain rounded"
              />
            </div>
            <div className="w-full flex justify-end">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  )
}

export default SellerOrders
