import { useState, useEffect } from 'react'
import PageFrame from '../../components/PageFrame'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function MyVouchers() {
  const [activeTab, setActiveTab] = useState('available') // 'available' | 'collected'
  const [availableVouchers, setAvailableVouchers] = useState([])
  const [collectedVouchers, setCollectedVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedCode, setCopiedCode] = useState('')
  const [collectingId, setCollectingId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      if (USE_MOCK) {
        await delay(500)
        const mockAvailable = [
          {
            id: 'v1',
            code: 'SAVE20',
            discountPercentage: 20,
            maxDiscountCap: 1000,
            minOrderAmount: 2000,
            applicableScope: 'all',
            expiresAt: new Date(Date.now() + 864000000).toISOString(),
            collected: false,
          },
          {
            id: 'v2',
            code: 'BEAUTY30',
            discountPercentage: 30,
            maxDiscountCap: 500,
            minOrderAmount: 1500,
            applicableScope: 'category',
            applicableCategories: ['Beauty'],
            expiresAt: new Date(Date.now() + 432000000).toISOString(),
            collected: true,
          },
          {
            id: 'v3',
            code: 'CLOTHING15',
            discountPercentage: 15,
            maxDiscountCap: 1500,
            minOrderAmount: 3000,
            applicableScope: 'category',
            applicableCategories: ['Clothing'],
            expiresAt: new Date(Date.now() + 604800000).toISOString(),
            collected: false,
          },
        ]
        const mockCollected = [
          {
            id: 'v2',
            code: 'BEAUTY30',
            discountPercentage: 30,
            maxDiscountCap: 500,
            minOrderAmount: 1500,
            applicableScope: 'category',
            applicableCategories: ['Beauty'],
            expiresAt: new Date(Date.now() + 432000000).toISOString(),
            isUsed: false,
            isExpired: false,
          },
          {
            id: 'v4',
            code: 'EID50',
            discountPercentage: 50,
            maxDiscountCap: 2000,
            minOrderAmount: 5000,
            applicableScope: 'all',
            expiresAt: new Date(Date.now() - 86400000).toISOString(),
            isUsed: true,
            isExpired: true,
          },
        ]
        setAvailableVouchers(mockAvailable)
        setCollectedVouchers(mockCollected)
      } else {
        const [aRes, cRes] = await Promise.all([
          axiosInstance.get('/vouchers'), // lists active offered vouchers
          axiosInstance.get('/vouchers/user'), // lists collected user vouchers
        ])
        setAvailableVouchers(aRes.data || [])
        setCollectedVouchers(cRes.data || [])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load vouchers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCollect = async (voucherId) => {
    setError('')
    setSuccess('')
    setCollectingId(voucherId)
    try {
      if (USE_MOCK) {
        await delay(400)
        setAvailableVouchers(prev =>
          prev.map(v => (v.id === voucherId ? { ...v, collected: true } : v))
        )
      } else {
        await axiosInstance.post(`/vouchers/${voucherId}/collect`)
      }
      setSuccess('Voucher collected successfully! You can copy it from your "My Collected Vouchers" tab.')
      fetchData() // Refresh status
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to collect voucher.')
    } finally {
      setCollectingId(null)
    }
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  return (
    <PageFrame title="Voucher Center" description="Browse available vouchers or copy your collected discount codes.">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Sidebar role="customer" />
        </div>
        <div className="lg:col-span-3 rounded-lg bg-white p-6 shadow-sm">
          
          {/* Tab Selector */}
          <div className="flex border-b border-slate-100 pb-4">
            <button
              onClick={() => setActiveTab('available')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-all mr-6 ${
                activeTab === 'available'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Voucher Center (Offered)
            </button>
            <button
              onClick={() => setActiveTab('collected')}
              className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'collected'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              My Collected Vouchers
              {collectedVouchers.filter(v => !v.isUsed && !v.isExpired).length > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                  {collectedVouchers.filter(v => !v.isUsed && !v.isExpired).length}
                </span>
              )}
            </button>
          </div>

          {/* Feedback messages */}
          {error && <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="mt-4 rounded bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : activeTab === 'available' ? (
            /* Tab 1: Offered Vouchers to collect */
            availableVouchers.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-slate-200 py-12 text-center">
                <p className="text-slate-500">No promotional vouchers offered right now. Check back soon!</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {availableVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="relative flex flex-col justify-between rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50/20 to-indigo-50/20 p-5 shadow-sm overflow-hidden"
                  >
                    <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full border border-blue-200 bg-white" />
                    <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full border border-blue-200 bg-white" />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                          {v.discountPercentage}% Off
                        </span>
                        {v.applicableScope !== 'all' && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 border border-slate-200">
                            {v.applicableCategories?.join(', ') || 'Selected Items'}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2.5 text-lg font-bold font-mono tracking-wider text-slate-800 uppercase">
                        {v.code}
                      </h3>
                      
                      <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                        <p>Max Discount: <span className="font-semibold text-slate-700">PKR {v.maxDiscountCap}</span></p>
                        <p>Min Spend: <span className="font-semibold text-slate-700">PKR {v.minOrderAmount}</span></p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                      <span className="text-[10px] text-slate-400">
                        Ends: {new Date(v.expiresAt).toLocaleDateString()}
                      </span>

                      {v.collected ? (
                        <span className="rounded bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                          Collected ✅
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCollect(v.id)}
                          disabled={collectingId === v.id}
                          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {collectingId === v.id ? 'Collecting…' : 'Collect'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Tab 2: User's collected Vouchers */
            collectedVouchers.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-slate-200 py-12 text-center">
                <p className="text-slate-500">You haven't collected any vouchers yet.</p>
                <p className="text-xs text-slate-400 mt-1">Browse the "Voucher Center" tab to find and collect available vouchers!</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {collectedVouchers.map((v) => {
                  const isUsed = v.status === 'used'
                  const isExpired = v.status === 'expired'

                  return (
                    <div
                      key={v.id}
                      className={`relative flex flex-col justify-between rounded-lg border p-5 shadow-sm overflow-hidden ${
                        isUsed || isExpired
                          ? 'border-slate-200 bg-slate-50/50 opacity-60'
                          : 'border-blue-200 bg-gradient-to-br from-blue-50/30 to-indigo-50/30'
                      }`}
                    >
                      <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full border border-slate-200 bg-white" />
                      <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full border border-slate-200 bg-white" />

                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                                isUsed || isExpired ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'
                              }`}
                            >
                              {v.discountPercentage}% Off
                            </span>
                            {v.applicableScope !== 'all' && (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 border border-slate-200">
                                {v.applicableCategories?.join(', ') || 'Selected Items'}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 text-lg font-bold font-mono tracking-wider text-slate-800 uppercase">
                            {v.code}
                          </h3>
                        </div>
                        <div>
                          {isUsed ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                              Used
                            </span>
                          ) : isExpired ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              Expired
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                        <p>Max Discount: <span className="font-semibold text-slate-700">PKR {v.maxDiscountCap}</span></p>
                        <p>Min Spend: <span className="font-semibold text-slate-700">PKR {v.minOrderAmount}</span></p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                        <span className="text-xs text-slate-400">
                          {isUsed
                            ? 'Redeemed'
                            : `Expires on ${new Date(v.expiresAt).toLocaleDateString()}`}
                        </span>
                        {!isUsed && !isExpired && (
                          <button
                            onClick={() => copyToClipboard(v.code)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                          >
                            {copiedCode === v.code ? 'Copied!' : 'Copy Code'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>
    </PageFrame>
  )
}

export default MyVouchers
