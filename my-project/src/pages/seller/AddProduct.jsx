import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import SizeSelector from '../../components/SizeSelector'
import MultiSelectChips from '../../components/MultiSelectChips'
import { addProduct, fetchProducts } from '../../store/productSlice'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

// Regions used by the storefront's Regional filter (must match those labels).
const REGION_OPTIONS = ['Punjab', 'Sindh', 'KPK', 'Balochistan']
const COLOR_FAMILY_OPTIONS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Brown', 'Pink', 'Gold']
const SEASON_OPTIONS = ['Winter', 'Summer', 'Spring', 'Autumn']

function AddProduct() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const categories = useSelector((state) => state.products.categories)
  const categoryOptions = categories.length > 0 ? categories : [
    'Clothing',
    'Shawls & Dupattas',
    'Footwear (Chappals)',
    'Handicrafts & Decor',
    'Organic Beauty',
    'Local Foods'
  ]
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [submitLabel, setSubmitLabel] = useState('Save Product')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Clothing',
    region: 'Punjab',
    price: 0,
    discountPrice: 0,
    stock: 0,
    image: '',
    sizes: [],
    colorFamilies: [],
    seasons: [],
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    
    try {
      setSubmitLabel('Uploading image...')
      setSubmitting(true)
      
      let imageUrl = ''
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
      
      setSubmitLabel('Saving product...')
      // Persist selected sizes as schema-shaped variants ({ size }).
      const { sizes, colorFamilies, seasons, ...rest } = form
      const payload = {
        ...rest,
        variants: sizes.map((size) => ({ size })),
        colorFamilies,
        seasons,
        image: imageUrl,
        seller: 'My Shop',
        rating: 0,
      }
      if (USE_MOCK) {
        await delay(600)
        dispatch(addProduct({ ...payload, id: Date.now() }))
      } else {
        await axiosInstance.post('/products', payload)
        dispatch(fetchProducts())
      }
      navigate('/seller/products')
    } catch (err) {
      console.error(err)
      setError('Failed to save product. Please try again.')
      setSubmitLabel('Save Product')
      setSubmitting(false)
    }
  }

  return (
    <PageFrame title="Add Product" description="List a new product in your shop with images, price, region, and sizes.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mt-1 grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Product Name</label>
            <input
              required
              placeholder="e.g. Embroidered Kameez"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select
              required
              value={form.category}
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Region</label>
            <select
              required
              value={form.region}
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Price (PKR)</label>
            <input
              required
              type="number"
              placeholder="5800"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Discount Price (PKR)</label>
            <input
              required
              type="number"
              placeholder="4990"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, discountPrice: Number(event.target.value) }))
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Stock</label>
            <input
              required
              type="number"
              placeholder="0"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
            />
          </div>
          
          <div className="col-span-full flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">
              Product Image
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setSelectedFile(file)
                  setPreviewUrl(URL.createObjectURL(file))
                }
              }}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            {previewUrl && (
              <img src={previewUrl} alt="Preview"
                className="mt-2 h-40 w-full rounded-lg border border-slate-200 object-contain" />
            )}
          </div>

          <div className="col-span-full flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              required
              rows={3}
              placeholder="Describe your product…"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <div className="col-span-full">
            <SizeSelector
              selected={form.sizes}
              onChange={(sizes) => setForm((prev) => ({ ...prev, sizes }))}
            />
          </div>
          <div className="col-span-full">
            <MultiSelectChips
              title="Color Families"
              description="Select the main color families customers can filter by."
              options={COLOR_FAMILY_OPTIONS}
              selected={form.colorFamilies}
              onChange={(colorFamilies) => setForm((prev) => ({ ...prev, colorFamilies }))}
            />
          </div>
          <div className="col-span-full">
            <MultiSelectChips
              title="Season"
              description="Choose the seasons this product is most suitable for."
              options={SEASON_OPTIONS}
              selected={form.seasons}
              onChange={(seasons) => setForm((prev) => ({ ...prev, seasons }))}
            />
          </div>
        </div>
        <button
          disabled={submitting}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {submitLabel}
            </span>
          ) : submitLabel}
        </button>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </form>
      </div>
    </PageFrame>
  )
}

export default AddProduct
