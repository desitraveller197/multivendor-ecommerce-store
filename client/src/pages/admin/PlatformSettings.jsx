import { useEffect, useState } from 'react'
import CommissionInput from '../../components/CommissionInput'
import PageFrame from '../../components/PageFrame'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function PlatformSettings() {
  const [commission, setCommission] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      setError('')
      try {
        if (USE_MOCK) {
          await delay(400)
          setCommission(10)
        } else {
          const res = await axiosInstance.get('/admin/settings')
          setCommission(res.data?.commissionPercent ?? 10)
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch platform settings.')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (USE_MOCK) {
        await delay(500)
        setSuccess('Settings saved successfully!')
      } else {
        await axiosInstance.put('/admin/settings', { commissionPercent: commission })
        setSuccess('Settings saved successfully!')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageFrame
      title="Platform Settings"
      description="Configure key marketplace controls and monetization rules."
    >
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="admin" />
        <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-slate-700">Default Seller Commission</label>
              <CommissionInput value={commission} onChange={setCommission} />
              
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4" defaultChecked />
                Enable automatic refund approval under PKR 1,000
              </label>

              {error && <p className="text-xs text-red-500">{error}</p>}
              {success && <p className="text-xs text-green-600 font-semibold">{success}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </>
          )}
        </div>
      </div>
    </PageFrame>
  )
}

export default PlatformSettings
