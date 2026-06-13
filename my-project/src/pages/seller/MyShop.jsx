import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
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

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="seller" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">My Shop</h1>
        
        {loading ? (
          <div className="mt-4 grid gap-3">
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-20 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-24 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded border border-slate-300 px-3 py-2"
                value={shop?.name || ''}
                onChange={(event) => setShop((prev) => ({ ...prev, name: event.target.value }))}
              />
              <textarea
                className="rounded border border-slate-300 px-3 py-2"
                value={shop?.description || ''}
                onChange={(event) => setShop((prev) => ({ ...prev, description: event.target.value }))}
              />
              <input
                className="rounded border border-slate-300 px-3 py-2"
                value={shop?.logo || ''}
                onChange={(event) => setShop((prev) => ({ ...prev, logo: event.target.value }))}
              />
              {shop?.logo && (
                <img src={shop.logo} alt="Shop logo preview" className="h-24 w-24 rounded object-cover" />
              )}
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            {successMsg && <p className="mt-2 text-sm font-medium text-green-600">{successMsg}</p>}
            {errorMsg && <p className="mt-2 text-sm font-medium text-red-600">{errorMsg}</p>}
          </>
        )}
      </div>
    </section>
  )
}

export default MyShop
