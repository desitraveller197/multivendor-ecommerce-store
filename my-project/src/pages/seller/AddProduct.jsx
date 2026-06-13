import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import VariantBuilder from '../../components/VariantBuilder'
import { addProduct, fetchProducts } from '../../store/productSlice'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function AddProduct() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [submitLabel, setSubmitLabel] = useState('Save Product')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Clothing',
    price: 0,
    discountPrice: 0,
    stock: 0,
    image: '',
    variants: [],
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
      if (USE_MOCK) {
        await delay(600)
        dispatch(
          addProduct({
            ...form,
            id: Date.now(),
            image: imageUrl,
            seller: 'My Shop',
            rating: 0,
          })
        )
      } else {
        await axiosInstance.post('/products', {
          ...form,
          image: imageUrl,
          seller: 'My Shop',
          rating: 0,
        })
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
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="seller" />
      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Add Product</h1>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            required
            placeholder="Name"
            className="rounded border border-slate-300 px-3 py-2"
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            required
            placeholder="Category"
            className="rounded border border-slate-300 px-3 py-2"
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
          />
          <input
            required
            type="number"
            placeholder="Price"
            className="rounded border border-slate-300 px-3 py-2"
            onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
          />
          <input
            required
            type="number"
            placeholder="Discount Price"
            className="rounded border border-slate-300 px-3 py-2"
            onChange={(event) =>
              setForm((prev) => ({ ...prev, discountPrice: Number(event.target.value) }))
            }
          />
          <input
            required
            type="number"
            placeholder="Stock"
            className="rounded border border-slate-300 px-3 py-2"
            onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
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
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            {previewUrl && (
              <img src={previewUrl} alt="Preview"
                className="mt-2 h-40 w-full rounded border object-contain" />
            )}
          </div>

          <textarea
            required
            placeholder="Description"
            className="col-span-full rounded border border-slate-300 px-3 py-2"
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <div className="col-span-full">
            <VariantBuilder
              onCreate={(variant) =>
                setForm((prev) => ({ ...prev, variants: [...prev.variants, variant] }))
              }
            />
          </div>
        </div>
        <button 
          disabled={submitting}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </section>
  )
}

export default AddProduct
