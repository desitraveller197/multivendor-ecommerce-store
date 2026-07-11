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

const REGION_OPTIONS = ['Punjab', 'Sindh', 'KPK', 'Balochistan']
const COLOR_FAMILY_OPTIONS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Brown', 'Pink', 'Gold']
const SEASON_OPTIONS = ['Winter', 'Summer', 'Spring', 'Autumn']

function AddProduct() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const categories = useSelector((state) => state.products.categories)
  const categoryOptions = categories.length > 0 ? categories : [
    'Clothing', 'Traditional Clothing', 'Shawls & Dupattas', 'Handicrafts & Decor', 'Footwear (Chappals)', 'Beauty'
  ]

  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
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

    if (selectedFiles.length === 0) {
      setError('Please upload at least one image')
      return
    }

    try {
      setSubmitLabel('Uploading images...')
      setSubmitting(true)

      let imageUrl = ''
      let imageUrls = []
      if (USE_MOCK) {
        await delay(1000)
        imageUrl = previewUrls[0] || ''
        imageUrls = previewUrls
      } else {
        const fd = new FormData()
        selectedFiles.forEach((file) => fd.append('images', file))
        const res = await axiosInstance.post('/upload/images', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrls = res.data.imageUrls || []
        imageUrl = imageUrls[0] || ''
      }

      setSubmitLabel('Saving product...')
      const { sizes, colorFamilies, seasons, ...rest } = form
      const payload = {
        ...rest,
        variants: sizes.map((size) => ({ size })),
        colorFamilies,
        seasons,
        image: imageUrl,
        images: imageUrls,
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
      setError(err.response?.data?.message || 'Failed to save product. Please try again.')
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
                Product Images (Upload up to 5)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                required
                onChange={(e) => {
                  const files = Array.from(e.target.files)
                  if (files.length > 5) {
                    alert('You can upload a maximum of 5 images')
                    e.target.value = null
                    return
                  }
                  setSelectedFiles(files)
                  setPreviewUrls(files.map((file) => URL.createObjectURL(file)))
                }}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              {previewUrls.length > 0 && (
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {previewUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Preview ${i + 1}`}
                      className="h-20 w-full rounded border border-slate-200 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-full flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                required
                rows={3}
                placeholder="Write a descriptive overview..."
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="col-span-full grid gap-4 sm:grid-cols-3">
              <SizeSelector
                value={form.sizes}
                onChange={(sizes) => setForm((prev) => ({ ...prev, sizes }))}
              />
              <MultiSelectChips
                title="Color Families"
                options={COLOR_FAMILY_OPTIONS}
                selected={form.colorFamilies}
                onChange={(colorFamilies) => setForm((prev) => ({ ...prev, colorFamilies }))}
              />
              <MultiSelectChips
                title="Seasons"
                options={SEASON_OPTIONS}
                selected={form.seasons}
                onChange={(seasons) => setForm((prev) => ({ ...prev, seasons }))}
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-500 font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </PageFrame>
  )
}

export default AddProduct
