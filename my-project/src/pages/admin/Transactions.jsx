import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import PageFrame from '../../components/PageFrame'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

const columns = [
  { key: 'id', label: 'Transaction ID' },
  { key: 'seller', label: 'Seller' },
  { key: 'amount', label: 'Amount' },
  { key: 'gateway', label: 'Gateway' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
]

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let isMounted = true
    async function loadTransactions() {
      setLoading(true)
      setError('')
      try {
        if (USE_MOCK) {
          await delay(600)
          setTransactions([
            { id: 'TXN-1001', seller: 'UrbanCraft', amount: 'PKR 8,500', gateway: 'Stripe', status: 'Succeeded', date: new Date().toLocaleDateString() },
            { id: 'TXN-1002', seller: 'TechHive', amount: 'PKR 12,000', gateway: 'JazzCash', status: 'Pending', date: new Date().toLocaleDateString() },
          ])
          setTotalPages(1)
        } else {
          const res = await axiosInstance.get(`/admin/transactions?page=${page}&limit=10`)
          const data = res.data
          if (isMounted) {
            const formatted = (data.transactions || []).map((t) => ({
              id: t.gatewayReference || t._id || t.id,
              seller: t.seller?.name || 'Platform / N/A',
              amount: `PKR ${t.amount.toLocaleString()}`,
              gateway: t.gateway || t.paymentMethod || 'Unknown',
              status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
              date: new Date(t.createdAt).toLocaleString(),
            }))
            setTransactions(formatted)
            setTotalPages(data.pages || 1)
          }
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Failed to fetch transactions.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadTransactions()
    return () => { isMounted = false }
  }, [page])

  return (
    <PageFrame title="Transactions" description="Monitor all payment and settlement transactions.">
      {loading ? (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-500">{error}</p>
      ) : transactions.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-6 bg-white border rounded-xl">No transactions found.</p>
      ) : (
        <div className="space-y-4">
          <DataTable columns={columns} rows={transactions} />
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-3 border rounded-xl shadow-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </PageFrame>
  )
}

export default Transactions
