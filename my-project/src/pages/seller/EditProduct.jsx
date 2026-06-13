import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { fetchProducts } from '../../store/productSlice'

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
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="seller" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
        
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
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={form.name}
                className="rounded border border-slate-300 px-3 py-2"
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                value={form.category}
                className="rounded border border-slate-300 px-3 py-2"
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              />
              <input
                type="number"
                value={form.price}
                className="rounded border border-slate-300 px-3 py-2"
                onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
              />
              <input
                type="number"
                value={form.discountPrice}
                className="rounded border border-slate-300 px-3 py-2"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, discountPrice: Number(event.target.value) }))
                }
              />
            </div>
            
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            
            <button 
              disabled={submitting}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

export default EditProduct
