import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import PageFrame from '../../components/PageFrame'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

const columns = [
  { key: 'seller', label: 'Seller' },
  { key: 'amount', label: 'Requested Amount' },
  { key: 'method', label: 'Method' },
  { key: 'details', label: 'Account Details' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

function WithdrawalRequests() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadWithdrawals() {
    setLoading(true)
    setError('')
    try {
      if (USE_MOCK) {
        await delay(500)
        setWithdrawals([
          { _id: '1', seller: { name: 'StyleNest' }, amount: 30000, method: 'Bank Transfer', accountDetails: 'HBL 123456789', status: 'pending' },
          { _id: '2', seller: { name: 'GadgetHub' }, amount: 18500, method: 'JazzCash', accountDetails: '03001234567', status: 'approved' },
        ])
      } else {
        const res = await axiosInstance.get('/admin/withdrawals')
        setWithdrawals(res.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch withdrawal requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWithdrawals()
  }, [])

  const handleAction = async (id, status) => {
    try {
      if (USE_MOCK) {
        await delay(400)
        setWithdrawals((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status } : item))
        )
      } else {
        await axiosInstance.patch(`/admin/withdrawals/${id}`, { status })
        loadWithdrawals()
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to update withdrawal to ${status}.`)
    }
  }

  const rows = withdrawals.map((w) => {
    const statusFormatted = w.status.charAt(0).toUpperCase() + w.status.slice(1)
    let statusClass = 'text-slate-600 font-medium'
    if (w.status === 'paid' || w.status === 'approved') statusClass = 'text-emerald-600 font-semibold'
    if (w.status === 'rejected') statusClass = 'text-rose-600 font-semibold'
    if (w.status === 'pending') statusClass = 'text-amber-600 font-semibold animate-pulse'

    let actions = null
    if (w.status === 'pending') {
      actions = (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction(w.id, 'approved')}
            className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(w.id, 'rejected')}
            className="rounded bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
          >
            Reject
          </button>
        </div>
      )
    } else if (w.status === 'approved') {
      actions = (
        <button
          onClick={() => handleAction(w.id, 'paid')}
          className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          Mark Paid
        </button>
      )
    } else {
      actions = <span className="text-xs text-slate-400">Processed</span>
    }

    return {
      id: w.id,
      seller: w.seller?.name || 'Seller',
      amount: `PKR ${w.amount.toLocaleString()}`,
      method: w.method,
      details: w.accountDetails,
      status: <span className={statusClass}>{statusFormatted}</span>,
      actions,
    }
  })

  return (
    <PageFrame
      title="Withdrawal Requests"
      description="Review and approve seller payout requests with confidence."
    >
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="admin" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
          {loading && withdrawals.length === 0 ? (
            <div className="space-y-3">
              <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500">{error}</p>
          ) : withdrawals.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">No payout requests found.</p>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </div>
      </div>
    </PageFrame>
  )
}

export default WithdrawalRequests
