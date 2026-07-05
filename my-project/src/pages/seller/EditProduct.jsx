import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import SizeSelector from '../../components/SizeSelector'
import MultiSelectChips from '../../components/MultiSelectChips'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { fetchProducts, updateProduct } from '../../store/productSlice'

// Regions used by the storefront's Regional filter (must match those labels).
const REGION_OPTIONS = ['Punjab', 'Sindh', 'KPK', 'Balochistan']
const COLOR_FAMILY_OPTIONS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Brown', 'Pink', 'Gold']
const SEASON_OPTIONS = ['Winter', 'Summer', 'Spring', 'Autumn']

function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const categories = useSelector((state) => state.products.categories)
  const categoryOptions = categories.length > 0 ? categories : [
    'Clothing',
    'Traditional Clothing',
    'Shawls & Dupattas',
    'Embroidered Phulkari Dupatta',
    'Fancy Dupatta Designs',
    'Hand Embroidered Organza Dupatta',
    'Handmade Applique Dresses',
    'Shawls For Men',
    'Shawls For Women',
    'Shawls for Men & Women',
    'Sindhi Ajrak',
    'Sindhi Topi',
    'Susi (Soosi) Fabric Dresses',
    'Electronics',
    'Handicrafts & Decor',
    'Home',
    'Home Accessories',
    'Footwear (Chappals)',
    'Organic Beauty',
    'Beauty',
    'Fashion',
    'Accessories',
    'Jewelry',
    'Local Foods'
  ]
  
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [submitLabel, setSubmitLabel] = useState('Save Changes')

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
            region: 'Punjab',
            price: 3500,
            discountPrice: 2800,
            stock: 15,
            image: '',
            variants: [],
            colorFamilies: ['Pink', 'Gold'],
            seasons: ['Spring', 'Autumn'],
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
      let imageUrl = form.image
      if (selectedFile) {
        setSubmitLabel('Uploading image...')
        if (USE_MOCK) {
          await delay(1000)
          imageUrl = previewUrl
        } else {
          const fd = new FormData()
          fd.append('image', selectedFile)
          const res = await axiosInstance.post('/upload/image', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          imageUrl = res.data.imageUrl
        }
      }

      setSubmitLabel('Saving changes...')
      const payload = {
        ...form,
        image: imageUrl
      }

      if (USE_MOCK) {
        await delay(700)
        dispatch(updateProduct(payload))
      } else {
        await axiosInstance.put(`/products/${id}`, payload)
        dispatch(fetchProducts())
      }
      navigate('/seller/products')
    } catch (err) {
      console.error('Failed to update product:', err)
      setError('Failed to update product. Please try again.')
      setSubmitLabel('Save Changes')
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
                <select
                  required
                  value={form.category || ''}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                >
                  <option value="">Select category…</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
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

            <div className="flex flex-col gap-1 border-t border-slate-100 pt-4">
              <label className="text-sm font-semibold text-slate-700">
                Product Image / Replace Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    setSelectedFile(file)
                    setPreviewUrl(URL.createObjectURL(file))
                  }
                }}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              {(previewUrl || form.image) && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1">Image Preview:</p>
                  <img
                    src={previewUrl || form.image}
                    alt="Preview"
                    className="h-40 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
                  />
                </div>
              )}
            </div>

            <SizeSelector
              selected={(form.variants || []).map((v) => v.size).filter(Boolean)}
              onChange={(sizes) =>
                setForm((prev) => ({ ...prev, variants: sizes.map((size) => ({ size })) }))
              }
            />
            <MultiSelectChips
              title="Color Families"
              description="Select the main color families customers can filter by."
              options={COLOR_FAMILY_OPTIONS}
              selected={form.colorFamilies || []}
              onChange={(colorFamilies) => setForm((prev) => ({ ...prev, colorFamilies }))}
            />
            <MultiSelectChips
              title="Season"
              description="Choose the seasons this product is most suitable for."
              options={SEASON_OPTIONS}
              selected={form.seasons || []}
              onChange={(seasons) => setForm((prev) => ({ ...prev, seasons }))}
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
                    {submitLabel}
                  </span>
                ) : submitLabel}
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
