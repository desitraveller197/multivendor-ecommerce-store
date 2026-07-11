import { useState, useEffect } from 'react'
import PageFrame from '../../components/PageFrame'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function MyVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setVouchers([
            { id: 'v1', code: 'VOUCH-EID50', discountValue: 50, isUsed: false, createdAt: new Date().toISOString() },
            { id: 'v2', code: 'VOUCH-OLD30', discountValue: 30, isUsed: true, usedAt: new Date().toISOString() },
          ])
        } else {
          const res = await axiosInstance.get('/vouchers')
          setVouchers(res.data || [])
        }
      } catch (err) {
        console.error('Failed to load vouchers:', err)
        setError('Failed to load vouchers. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchVouchers()
  }, [])

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  return (
    <PageFrame title="My Vouchers" description="View and copy your earned vouchers.">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Sidebar role="customer" />
        </div>
        <div className="lg:col-span-3 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">My Vouchers</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Here are your earned discount vouchers. Copy a code and paste it during checkout to redeem your 50% discount!
          </p>

          {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : vouchers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-12 text-center">
              <p className="text-slate-500">You don't have any vouchers yet.</p>
              <p className="text-xs text-slate-400 mt-1">Buy 3 or more products in a single order to earn a 50% off voucher!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {vouchers.map((v) => (
                <div
                  key={v.id}
                  className={`relative flex flex-col justify-between rounded-lg border p-5 shadow-sm overflow-hidden ${
                    v.isUsed
                      ? 'border-slate-200 bg-slate-50/50'
                      : 'border-blue-200 bg-gradient-to-br from-blue-50/30 to-indigo-50/30'
                  }`}
                >
                  <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full border border-slate-200 bg-white" />
                  <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full border border-slate-200 bg-white" />

                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                          v.isUsed ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'
                        }`}
                      >
                        {v.discountValue}% Off
                      </span>
                      <h3 className="mt-2 text-lg font-bold font-mono tracking-wider text-slate-800 uppercase">
                        {v.code}
                      </h3>
                    </div>
                    <div>
                      {v.isUsed ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          Used
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                    <span className="text-xs text-slate-400">
                      {v.isUsed
                        ? `Used on ${new Date(v.usedAt).toLocaleDateString()}`
                        : `Earned on ${new Date(v.createdAt).toLocaleDateString()}`}
                    </span>
                    {!v.isUsed && (
                      <button
                        onClick={() => copyToClipboard(v.code)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                      >
                        {copiedCode === v.code ? 'Copied!' : 'Copy Code'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageFrame>
  )
}

export default MyVouchers
