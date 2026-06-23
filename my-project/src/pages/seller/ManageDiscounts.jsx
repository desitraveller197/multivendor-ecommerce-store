import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import ConfirmModal from '../../components/ConfirmModal'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { fetchProducts } from '../../store/productSlice'

const SCOPES = [
  { value: 'product', label: 'Specific product' },
  { value: 'category', label: 'Whole category' },
  { value: 'shop', label: 'Entire shop' },
]

const EMPTY_FORM = {
  scope: 'product',
  product: '',
  category: '',
  type: 'percentage',
  value: '',
  name: '',
}

/** Human-readable summary of what a discount targets. */
function scopeLabel(d) {
  if (d.scope === 'shop') return 'Entire shop'
  if (d.scope === 'category') return `Category: ${d.category}`
  return `Product: ${d.product?.name || '—'}`
}

function ManageDiscounts() {
  const dispatch = useDispatch()
  const [discounts, setDiscounts] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)

  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        if (USE_MOCK) {
          await delay(500)
          setProducts([
            { id: 'p1', name: 'Embroidered Shalwar Kameez (Men)', category: 'Clothing' },
            { id: 'p2', name: 'Phulkari Dupatta', category: 'Shawls & Dupattas' },
          ])
          setCategories([
            { id: 'c1', name: 'Clothing' },
            { id: 'c2', name: 'Shawls & Dupattas' },
            { id: 'c3', name: 'Footwear (Chappals)' },
          ])
          setDiscounts([
            { id: 'd1', name: 'Eid Sale', scope: 'shop', type: 'percentage', value: 10, active: true },
          ])
        } else {
          const [discRes, prodRes, catRes] = await Promise.all([
            axiosInstance.get('/seller/discounts'),
            axiosInstance.get('/products?mine=true'),
            axiosInstance.get('/categories'),
          ])
          setDiscounts(discRes.data || [])
          setProducts(prodRes.data || [])
          setCategories(catRes.data || [])
        }
      } catch (err) {
        console.error('Failed to load discounts:', err)
        setError('Could not load discount data from the server.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')

    const value = Number(form.value)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a discount value greater than 0.')
      return
    }
    if (form.type === 'percentage' && value > 100) {
      setError('A percentage discount cannot exceed 100.')
      return
    }
    if (form.scope === 'product' && !form.product) {
      setError('Select a product to discount.')
      return
    }
    if (form.scope === 'category' && !form.category) {
      setError('Select a category to discount.')
      return
    }

    const payload = {
      name: form.name.trim(),
      scope: form.scope,
      type: form.type,
      value,
      ...(form.scope === 'product' ? { product: form.product } : {}),
      ...(form.scope === 'category' ? { category: form.category } : {}),
    }

    setSaving(true)
    try {
      if (USE_MOCK) {
        await delay(400)
        setDiscounts((list) => [
          { id: `d${Date.now()}`, active: true, ...payload },
          ...list,
        ])
      } else {
        const res = await axiosInstance.post('/seller/discounts', payload)
        setDiscounts((list) => [res.data, ...list])
        // Refresh the site-wide product store so the new prices show on
        // Home, Regional and the product listing immediately.
        dispatch(fetchProducts())
      }
      setForm(EMPTY_FORM)
    } catch (err) {
      console.error('Failed to create discount:', err)
      setError(err.response?.data?.message || 'Failed to create discount.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (discount) => {
    const next = !discount.active
    // Optimistic update.
    setDiscounts((list) => list.map((d) => (d.id === discount.id ? { ...d, active: next } : d)))
    try {
      if (USE_MOCK) {
        await delay(200)
      } else {
        await axiosInstance.patch(`/seller/discounts/${discount.id}`, { active: next })
        dispatch(fetchProducts())
      }
    } catch (err) {
      console.error('Failed to toggle discount:', err)
      setError('Failed to update discount.')
      setDiscounts((list) => list.map((d) => (d.id === discount.id ? { ...d, active: !next } : d)))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      if (USE_MOCK) {
        await delay(300)
      } else {
        await axiosInstance.delete(`/seller/discounts/${deleteTarget.id}`)
        dispatch(fetchProducts())
      }
      setDiscounts((list) => list.filter((d) => d.id !== deleteTarget.id))
    } catch (err) {
      console.error('Failed to delete discount:', err)
      setError('Failed to delete discount.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const inputClass =
    'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

  return (
    <PageFrame title="Manage Discounts" description="Apply a discount to a specific product, an entire category, or every product in your shop.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        <div className="space-y-4">
        {/* ─── Create discount ─── */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create a discount</h2>

          {error && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Apply to</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SCOPES.map((s) => (
                  <button
                    type="button"
                    key={s.value}
                    onClick={() => setForm((f) => ({ ...f, scope: s.value }))}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                      form.scope === s.value
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {form.scope === 'product' && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Product</label>
                <select value={form.product} onChange={updateField('product')} className={inputClass}>
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.scope === 'category' && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select value={form.category} onChange={updateField('category')} className={inputClass}>
                  <option value="">Select a category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">Discount type</label>
              <select value={form.type} onChange={updateField('type')} className={inputClass}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (PKR)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                {form.type === 'percentage' ? 'Percent off' : 'Amount off (PKR)'}
              </label>
              <input
                type="number"
                min="0"
                step={form.type === 'percentage' ? '1' : '10'}
                value={form.value}
                onChange={updateField('value')}
                className={inputClass}
                placeholder={form.type === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Label (optional)</label>
              <input
                type="text"
                value={form.name}
                onChange={updateField('name')}
                className={inputClass}
                placeholder="e.g. Eid Sale"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Applying…' : 'Apply discount'}
              </button>
            </div>
          </form>
        </div>

        {/* ─── Active discounts ─── */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Your discounts</h2>

          {loading ? (
            <div className="mt-4 space-y-2">
              <div className="h-14 animate-pulse rounded border border-slate-200 bg-slate-100" />
              <div className="h-14 animate-pulse rounded border border-slate-200 bg-slate-100" />
            </div>
          ) : discounts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No discounts yet. Create one above.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {discounts.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {d.name || scopeLabel(d)}
                      {!d.active && (
                        <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          paused
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500">
                      {scopeLabel(d)} ·{' '}
                      {d.type === 'percentage' ? `${d.value}% off` : `PKR ${d.value} off`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(d)}
                      className="rounded border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {d.active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(d)}
                      className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Discount"
        message={`Remove "${deleteTarget?.name || (deleteTarget && scopeLabel(deleteTarget))}"? Affected products return to their normal price.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
      </div>
    </PageFrame>
  )
}

export default ManageDiscounts
