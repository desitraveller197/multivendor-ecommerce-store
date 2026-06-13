import { useEffect, useMemo, useState } from 'react'
import DateRangePicker from '../../components/DateRangePicker'
import PageFrame from '../../components/PageFrame'
import { products } from '../../data/mockData'

const ANALYTICS_STORAGE_KEY = 'adminSalesAnalyticsSnapshot'
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000

function formatPkr(value) {
  return `PKR ${Math.round(value).toLocaleString()}`
}

function buildSellerBase() {
  const totals = products.reduce((acc, product) => {
    const saleValue = product.discountPrice * Math.max(3, Math.ceil(product.stock * 0.35))
    acc[product.seller] = (acc[product.seller] ?? 0) + saleValue
    return acc
  }, {})

  return Object.entries(totals)
    .map(([seller, value]) => ({ seller, value }))
    .sort((a, b) => b.value - a.value)
}

function buildSellerTrend(value, seed) {
  const change = ((seed % 7) - 3) * 0.02
  const previous = value * (1 - change)
  const direction = value >= previous ? 'increase' : 'decrease'
  const deltaPercent = (Math.abs(value - previous) / previous) * 100

  return {
    current: value,
    previous,
    direction,
    deltaPercent,
  }
}

function createSnapshot() {
  const periodSeed = Math.floor(Date.now() / FIFTEEN_DAYS_MS)
  const sellerBase = buildSellerBase()
  const sellerTrends = sellerBase.map((item, index) => ({
    seller: item.seller,
    ...buildSellerTrend(item.value, periodSeed + index),
  }))

  const totalCurrentSales = sellerTrends.reduce((sum, item) => sum + item.current, 0)
  const totalPreviousSales = sellerTrends.reduce((sum, item) => sum + item.previous, 0)
  const totalOrders = Math.round(totalCurrentSales / 3200)

  return {
    createdAt: Date.now(),
    nextUpdateAt: Date.now() + FIFTEEN_DAYS_MS,
    sellerTrends,
    totalCurrentSales,
    totalPreviousSales,
    totalOrders,
  }
}

function loadOrRefreshSnapshot() {
  const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY)
  if (!stored) {
    const snapshot = createSnapshot()
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(snapshot))
    return snapshot
  }

  const parsed = JSON.parse(stored)
  if (Date.now() >= parsed.nextUpdateAt) {
    const refreshed = createSnapshot()
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(refreshed))
    return refreshed
  }

  return parsed
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
  const [snapshot, setSnapshot] = useState(() => loadOrRefreshSnapshot())

  useEffect(() => {
    const timer = setInterval(() => {
      const nextSnapshot = loadOrRefreshSnapshot()
      setSnapshot((current) => (current.createdAt === nextSnapshot.createdAt ? current : nextSnapshot))
    }, 60 * 1000)

    return () => clearInterval(timer)
  }, [])

  const companyTrend = useMemo(() => {
    const delta = snapshot.totalCurrentSales - snapshot.totalPreviousSales
    const deltaPercent = (Math.abs(delta) / snapshot.totalPreviousSales) * 100
    return {
      direction: delta >= 0 ? 'increase' : 'decrease',
      deltaPercent,
    }
  }, [snapshot.totalCurrentSales, snapshot.totalPreviousSales])

  return (
    <PageFrame
      title="Sales Report"
      description="Seller-wise trend analytics and company-wide sales movement, auto-refreshed every 15 days."
      actions={<DateRangePicker from={range.from} to={range.to} onChange={setRange} />}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Gross Sales', value: formatPkr(snapshot.totalCurrentSales) },
          { label: 'Net Revenue', value: formatPkr(snapshot.totalCurrentSales * 0.18) },
          { label: 'Total Orders', value: snapshot.totalOrders.toLocaleString() },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">
          Admin update: Company sales {companyTrend.direction} by {companyTrend.deltaPercent.toFixed(1)}%
          compared to the previous period.
        </p>
        <p className="mt-1 text-blue-800">
          Analytics refresh automatically every 15 days. Next update:{' '}
          {new Date(snapshot.nextUpdateAt).toLocaleDateString()}.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Traders Wise Overall Company Graph</h2>
          <span className="text-sm text-slate-500">Current period vs previous period</span>
        </div>

        <div className="mt-4 space-y-3">
          {snapshot.sellerTrends.map((seller, index) => {
            const maxSales = snapshot.sellerTrends[0]?.current ?? 1
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
                    className={`h-3 rounded-full ${
                      index % 2 === 0 ? 'bg-blue-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.max(width, 8)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Current: {formatPkr(seller.current)}</span>
                  <span>Previous: {formatPkr(seller.previous)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PageFrame>
  )
}

export default SalesReport
