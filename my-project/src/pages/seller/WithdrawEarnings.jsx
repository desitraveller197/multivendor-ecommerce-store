import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function WithdrawEarnings() {
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Bank Transfer')
  const [accountDetails, setAccountDetails] = useState('')
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      if (USE_MOCK) {
        await delay(500)
        setBalance(124000)
        setWithdrawals([
          { id: '1', amount: 30000, method: 'Bank Transfer', status: 'approved', requestedAt: new Date().toISOString() },
          { id: '2', amount: 15000, method: 'JazzCash', status: 'pending', requestedAt: new Date().toISOString() },
        ])
      } else {
        const [balRes, listRes] = await Promise.all([
          axiosInstance.get('/seller/balance'),
          axiosInstance.get('/seller/withdrawals'),
        ])
        setBalance(balRes.data.balance || 0)
        setWithdrawals(listRes.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payout data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const val = Number(amount)
    if (!val || val <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (val > balance) {
      setError(`Insufficient balance. Maximum available is PKR ${balance.toLocaleString()}`)
      return
    }

    if (!accountDetails.trim()) {
      setError('Please provide account details')
      return
    }

    setSubmitting(true)
    try {
      if (USE_MOCK) {
        await delay(600)
        setSuccess('Payout request submitted successfully!')
        setBalance((b) => b - val)
        setWithdrawals((prev) => [
          {
            id: Date.now().toString(),
            amount: val,
            method,
            status: 'pending',
            requestedAt: new Date().toISOString(),
          },
          ...prev,
        ])
        setAmount('')
        setAccountDetails('')
      } else {
        await axiosInstance.post('/seller/withdrawals', {
          amount: val,
          method,
          accountDetails: accountDetails.trim(),
        })
        setSuccess('Payout request submitted successfully!')
        setAmount('')
        setAccountDetails('')
        loadData()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payout request.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50'

  return (
    <PageFrame
      title="Withdraw Earnings"
      description="Request payouts and keep your revenue flowing on schedule."
    >
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        
        <div className="space-y-6">
          <div className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Available Balance</p>
              <p className="mt-1 text-4xl font-extrabold text-blue-700">
                PKR {loading ? '...' : balance.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Computed from delivered/paid orders minus platform commission and withdrawals.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Request Payout</h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Withdrawal Amount (PKR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  disabled={loading || submitting}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className={inputClass}
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Payout Method</label>
                <select
                  disabled={loading || submitting}
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className={inputClass}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Account Details</label>
                <textarea
                  required
                  rows={2}
                  disabled={loading || submitting}
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder="e.g. Bank Name, IBAN, Account Title, or Wallet Number"
                  className={inputClass}
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
              {success && <p className="text-xs text-green-600 font-semibold">{success}</p>}

              <button
                type="submit"
                disabled={loading || submitting || !amount}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Request Payout'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-3">Past Payout Requests</h3>
            {loading && withdrawals.length === 0 ? (
              <p className="text-sm text-slate-500">Loading history...</p>
            ) : withdrawals.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No past requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Amount</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Method</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawals.map((w) => {
                      const statusFormatted = w.status.charAt(0).toUpperCase() + w.status.slice(1)
                      let statusClass = 'text-slate-600 font-medium'
                      if (w.status === 'paid' || w.status === 'approved') statusClass = 'text-emerald-600 font-semibold'
                      if (w.status === 'rejected') statusClass = 'text-rose-600 font-semibold'
                      if (w.status === 'pending') statusClass = 'text-amber-600 font-semibold animate-pulse'

                      return (
                        <tr key={w.id || w._id}>
                          <td className="px-3 py-2 text-slate-500">
                            {new Date(w.requestedAt || w.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-slate-800 font-medium">
                            PKR {w.amount.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{w.method}</td>
                          <td className="px-3 py-2">
                            <span className={statusClass}>{statusFormatted}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageFrame>
  )
}

export default WithdrawEarnings
