import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import PageFrame from '../../components/PageFrame'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

const columns = [
  { key: 'orderNumber', label: 'Order Number' },
  { key: 'customer', label: 'Customer' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

function RefundRequests() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadRefunds() {
    setLoading(true)
    setError('')
    try {
      if (USE_MOCK) {
        await delay(500)
        setRefunds([
          { _id: '1', order: { orderNumber: 'ORD-2026-00001' }, customer: { name: 'Ali Khan' }, reason: 'Damaged item', status: 'pending' },
          { _id: '2', order: { orderNumber: 'ORD-2026-00002' }, customer: { name: 'Sara Noor' }, reason: 'Wrong variant', status: 'approved' },
        ])
      } else {
        const res = await axiosInstance.get('/admin/refunds')
        setRefunds(res.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch refund requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRefunds()
  }, [])

  const handleAction = async (id, action) => {
    try {
      if (USE_MOCK) {
        await delay(400)
        setRefunds((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' } : item))
        )
      } else {
        await axiosInstance.patch(`/admin/refunds/${id}`, { action })
        loadRefunds()
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} refund.`)
    }
  }

  const rows = refunds.map((r) => {
    const statusFormatted = r.status.charAt(0).toUpperCase() + r.status.slice(1)
    let statusClass = 'text-slate-600'
    if (r.status === 'approved') statusClass = 'text-emerald-600 font-semibold'
    if (r.status === 'rejected') statusClass = 'text-rose-600 font-semibold'
    if (r.status === 'pending') statusClass = 'text-amber-600 font-semibold animate-pulse'

    return {
      id: r._id,
      orderNumber: r.order?.orderNumber || r.order?._id || 'N/A',
      customer: r.customer?.name || 'Customer',
      reason: r.reason,
      status: <span className={statusClass}>{statusFormatted}</span>,
      actions:
        r.status === 'pending' ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(r._id, 'approve')}
              className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(r._id, 'reject')}
              className="rounded bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Processed</span>
        ),
    }
  })

  return (
    <PageFrame title="Refund Requests" description="Handle return and refund workflows centrally.">
      {loading && refunds.length === 0 ? (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-500">{error}</p>
      ) : refunds.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-6 bg-white border rounded-xl">No refund requests found.</p>
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}
    </PageFrame>
  )
}

export default RefundRequests
