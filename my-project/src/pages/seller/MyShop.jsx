import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function MyShop() {
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchShop = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setShop({
            name: 'My Demo Shop',
            description: 'A trusted seller of traditional Pakistani crafts.',
            logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400',
          })
        } else {
          const res = await axiosInstance.get('/shops/my')
          setShop(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch shop:', err)
        setErrorMsg('Failed to load shop details.')
      } finally {
        setLoading(false)
      }
    }
    fetchShop()
  }, [])

  const handleSave = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    setSaving(true)

    try {
      if (USE_MOCK) {
        await delay(700)
      } else {
        await axiosInstance.put('/shops/my', shop)
      }
      setSuccessMsg('Shop updated successfully')
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    } catch (err) {
      console.error('Failed to update shop:', err)
      setErrorMsg('Failed to update shop details.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <PageFrame title="My Shop" description="Update your shop name, description, and logo shown to customers.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
        {loading ? (
          <div className="mt-4 grid gap-3">
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-20 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-24 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Shop Name</label>
                <input
                  className={inputClass}
                  value={shop?.name || ''}
                  onChange={(event) => setShop((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Shop Name"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={shop?.description || ''}
                  onChange={(event) => setShop((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Tell customers about your shop…"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Logo URL</label>
                <input
                  className={inputClass}
                  value={shop?.logo || ''}
                  onChange={(event) => setShop((prev) => ({ ...prev, logo: event.target.value }))}
                  placeholder="https://…"
                />
              </div>
              {shop?.logo && (
                <img
                  src={shop.logo}
                  alt="Shop logo preview"
                  className="h-24 w-24 rounded-lg object-cover shadow-sm ring-1 ring-slate-200"
                />
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving…
                </span>
              ) : 'Save Changes'}
            </button>
            
            {successMsg && <p className="mt-2 text-sm text-green-700">{successMsg}</p>}
            {errorMsg && <p className="mt-2 text-sm text-red-500">{errorMsg}</p>}
          </>
        )}
        </div>
      </div>
    </PageFrame>
  )
}

export default MyShop
