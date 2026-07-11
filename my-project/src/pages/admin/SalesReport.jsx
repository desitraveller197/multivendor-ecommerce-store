import { useEffect, useMemo, useState } from 'react'
import DateRangePicker from '../../components/DateRangePicker'
import PageFrame from '../../components/PageFrame'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function formatPkr(value) {
  return `PKR ${Math.round(value).toLocaleString()}`
}

function Sparkline({ current, previous }) {
  const maxValue = Math.max(current, previous)
  const minValue = Math.min(current, previous)
  const spread = Math.max(1, maxValue - minValue)
  const normalize = (value) => 30 - ((value - minValue) / spread) * 24
  const d = `5,${normalize(previous)} 35,${normalize(current)}`

  return (
    <svg viewBox="0 0 40 30" className="h-8 w-12" aria-hidden="true">
      <polyline fill="none" stroke="#94a3b8" strokeWidth="2" points={`5,${normalize(previous)} 20,15 35,${normalize(previous)}`} />
      <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={d} />
      <circle cx="35" cy={normalize(current)} r="2.3" fill="#1d4ed8" />
    </svg>
  )
}

function SalesReport() {
  const [range, setRange] = useState({ from: '2026-01-01', to: '2026-12-31' })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadReport() {
      setLoading(true)
      setError('')
      try {
        if (USE_MOCK) {
          await delay(500)
          setReport({
            sellerTrends: [
              { seller: 'UrbanCraft', current: 150000, previous: 120000, direction: 'increase', deltaPercent: 25 },
              { seller: 'TechHive', current: 95000, previous: 110000, direction: 'decrease', deltaPercent: 13.6 },
            ],
            totalCurrentSales: 245000,
            totalPreviousSales: 230000,
            totalOrders: 65,
            commissionPercent: 10,
          })
        } else {
          const res = await axiosInstance.get(`/admin/reports/sales?from=${range.from}&to=${range.to}`)
          if (isMounted) setReport(res.data)
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Failed to load sales report.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadReport()
    return () => { isMounted = false }
  }, [range])

  const companyTrend = useMemo(() => {
    if (!report) return null
    const delta = report.totalCurrentSales - report.totalPreviousSales
    const deltaPercent = report.totalPreviousSales > 0 ? (Math.abs(delta) / report.totalPreviousSales) * 100 : 0
    return {
      direction: delta >= 0 ? 'increase' : 'decrease',
      deltaPercent,
    }
  }, [report])

  return (
    <PageFrame
      title="Sales Report"
      description="Seller-wise trend analytics and company-wide sales movement."
      actions={<DateRangePicker from={range.from} to={range.to} onChange={setRange} />}
    >
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="admin" />
        
        <div className="space-y-6">
          {loading && !report ? (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500">{error}</p>
          ) : report ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Gross Sales', value: formatPkr(report.totalCurrentSales) },
                  {
                    label: 'Net Revenue',
                    value: formatPkr(report.totalCurrentSales * ((report.commissionPercent || 10) / 100)),
                  },
                  { label: 'Total Orders', value: report.totalOrders.toLocaleString() },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {companyTrend && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900">
                  <p className="font-semibold">
                    Admin update: Company sales {companyTrend.direction} by {companyTrend.deltaPercent.toFixed(1)}%
                    compared to the previous period.
                  </p>
                  <p className="mt-1 text-blue-800">
                    Calculated using a default commission of {report.commissionPercent || 10}% on marketplace trades.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">Traders Wise Overall Company Graph</h2>
                  <span className="text-sm text-slate-500">Selected period vs previous period</span>
                </div>

                <div className="mt-4 space-y-3">
                  {report.sellerTrends.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-6">No sales recorded in this period.</p>
                  ) : (
                    report.sellerTrends.map((seller, index) => {
                      const maxSales = report.sellerTrends[0]?.current ?? 1
                      const width = (seller.current / maxSales) * 100
                      return (
                        <div key={seller.seller} className="rounded-lg border border-slate-100 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">{seller.seller}</p>
                            <div className="flex items-center gap-3">
                              <Sparkline current={seller.current} previous={seller.previous} />
                              <p
                                className={`text-sm font-semibold ${
                                  seller.direction === 'increase' ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {seller.direction === 'increase' ? '▲' : '▼'} {seller.deltaPercent.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 h-3 rounded-full bg-slate-100">
                            <div
                              className={`h-3 rounded-full ${index % 2 === 0 ? 'bg-blue-500' : 'bg-indigo-500'}`}
                              style={{ width: `${Math.max(width, 8)}%` }}
                            />
                          </div>
                          <div className="mt-2 flex justify-between text-xs text-slate-500">
                            <span>Current: {formatPkr(seller.current)}</span>
                            <span>Previous: {formatPkr(seller.previous)}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </PageFrame>
  )
}

export default SalesReport
