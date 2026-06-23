import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import SizeSelector from '../../components/SizeSelector'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { fetchProducts } from '../../store/productSlice'

// Regions used by the storefront's Regional filter (must match those labels).
const REGION_OPTIONS = ['Punjab', 'Sindh', 'KPK', 'Balochistan']

function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setForm({
            id: Number(id),
            name: 'Phulkari Dupatta',
            description: 'Traditional handcrafted dupatta from Punjab.',
            category: 'Clothing',
            price: 3500,
            discountPrice: 2800,
            stock: 15,
            image: '',
            variants: [],
          })
        } else {
          const res = await axiosInstance.get(`/products/${id}`)
          setForm(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch product:', err)
        setError('Failed to load product data.')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    
    try {
      if (USE_MOCK) {
        await delay(700)
      } else {
        await axiosInstance.put(`/products/${id}`, form)
        dispatch(fetchProducts())
      }
      navigate('/seller/products')
    } catch (err) {
      console.error('Failed to update product:', err)
      setError('Failed to update product.')
      setSubmitting(false)
    }
  }

  return (
    <PageFrame title="Edit Product" description="Update your product's details, price, region, and available sizes.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
        {loading ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
          </div>
        ) : !form ? (
          <p className="mt-4 text-slate-600">Product not found.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Product Name
                </label>
                <input
                  required
                  value={form.name || ''}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <input
                  required
                  value={form.category || ''}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Region
                </label>
                <select
                  value={form.region || ''}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onChange={(event) => setForm((prev) => ({ ...prev, region: event.target.value }))}
                >
                  <option value="">Select region…</option>
                  {REGION_OPTIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Price (Rs.)
                </label>
                <input
                  required
                  type="number"
                  value={form.price || 0}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Discount Price (Rs.)
                </label>
                <input
                  type="number"
                  value={form.discountPrice || 0}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, discountPrice: Number(event.target.value) }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Stock Quantity (Available)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.stock !== undefined ? form.stock : 0}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none font-semibold text-blue-700"
                  onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Update this value to increase/decrease stock.
                </p>
              </div>
            </div>

            <SizeSelector
              selected={(form.variants || []).map((v) => v.size).filter(Boolean)}
              onChange={(sizes) =>
                setForm((prev) => ({ ...prev, variants: sizes.map((size) => ({ size })) }))
              }
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                required
                rows="4"
                value={form.description || ''}
                className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving…
                  </span>
                ) : 'Save Changes'}
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
                onClick={() => navigate('/seller/products')}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </PageFrame>
  )
}

export default EditProduct
