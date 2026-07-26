import { useState, useEffect } from 'react'
import PageFrame from '../../components/PageFrame'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function SellerCharges() {
  const [charges, setCharges] = useState({ deliveryCharges: 200, taxRate: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCharges = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setCharges({ deliveryCharges: 250, taxRate: 0 })
        } else {
          const res = await axiosInstance.get('/shops/my')
          setCharges({
            deliveryCharges: res.data.deliveryCharges ?? 200,
            taxRate: 0,
          })
        }
      } catch (err) {
        console.error('Error fetching charges:', err)
        setError('Failed to load charges configurations.')
      } finally {
        setLoading(false)
      }
    }
    fetchCharges()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      if (USE_MOCK) {
        await delay(800)
        setMessage('Charges configurations updated successfully!')
      } else {
        await axiosInstance.put('/shops/my', {
          deliveryCharges: charges.deliveryCharges,
          taxRate: 0,
        })
        setMessage('Charges configurations updated successfully!')
      }
    } catch (err) {
      console.error('Error saving charges:', err)
      setError('Failed to update charges settings.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50'

  return (
    <PageFrame title="Other Charges Settings" description="Configure delivery fees.">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Sidebar role="seller" />
        </div>
        <div className="lg:col-span-3 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Other Charges Settings</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Configure default delivery charges applicable to all products of your shop.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 max-w-lg">
              {message && (
                <div className="rounded bg-green-50 p-3 text-sm text-green-700">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Delivery Charges (PKR)</label>
                <input
                  type="number"
                  min="0"
                  required
                  className={inputClass}
                  value={charges.deliveryCharges}
                  onChange={(e) =>
                    setCharges((prev) => ({ ...prev, deliveryCharges: Number(e.target.value) || 0 }))
                  }
                  placeholder="200"
                />
                <span className="text-xs text-slate-400">
                  Flat delivery fee applied to any orders containing products from your shop.
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Charges'}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageFrame>
  )
}

export default SellerCharges
