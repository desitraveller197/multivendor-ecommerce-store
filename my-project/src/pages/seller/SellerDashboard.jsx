import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function SellerDashboard() {
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [statsError, setStatsError] = useState('')
  const [chartError, setChartError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setStats({ products: 12, revenue: 184500, orders: 34 })
        } else {
          const res = await axiosInstance.get('/seller/stats')
          setStats(res.data)
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err)
        setStats({ products: 0, revenue: 0, orders: 0 })
        setStatsError('Could not load stats from server.')
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        if (USE_MOCK) {
          await delay(700)
          setChartData([
            { month: 'Dec', revenue: 12000 },
            { month: 'Jan', revenue: 18500 },
            { month: 'Feb', revenue: 14200 },
            { month: 'Mar', revenue: 22000 },
            { month: 'Apr', revenue: 19800 },
            { month: 'May', revenue: 27400 },
          ])
        } else {
          const res = await axiosInstance.get('/seller/stats/revenue-chart')
          setChartData(res.data || [])
        }
      } catch (err) {
        console.error("Failed to fetch chart data:", err)
        setChartData([])
        setChartError('Could not load revenue chart.')
      } finally {
        setChartLoading(false)
      }
    }
    fetchChartData()
  }, [])

  return (
    <PageFrame title="Seller Dashboard" description="Track your products, revenue, and recent orders at a glance.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
        {statsError && (
          <p className="mt-2 text-sm text-amber-600">{statsError}</p>
        )}

        {statsLoading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-24 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Products</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.products ?? 0}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Revenue</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">PKR {stats?.revenue?.toLocaleString() || 0}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm text-slate-500">Recent Orders</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.orders ?? 0}</p>
            </div>
          </div>
        )}

        {chartLoading ? (
          <div className="mt-6 h-48 animate-pulse rounded-lg bg-slate-100" />
        ) : chartData.length > 0 ? (
          <>
            <h2 className="mt-6 text-lg font-semibold text-slate-900">Monthly Revenue</h2>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `PKR ${v.toLocaleString()}`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`PKR ${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-6 text-lg font-semibold text-slate-900">Monthly Revenue</h2>
            {chartError && <p className="mt-2 text-sm text-amber-600">{chartError}</p>}
            <p className="mt-2 text-sm text-slate-500">No revenue data available yet. Start selling to see your chart!</p>
          </>
        )}
        </div>
      </div>
    </PageFrame>
  )
}

export default SellerDashboard
