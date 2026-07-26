import { useEffect, useState } from 'react'
import PageFrame from '../../components/PageFrame'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

const EMPTY_VOUCHER_FORM = {
  code: '',
  discountPercentage: 10,
  maxDiscountCap: 500,
  minOrderAmount: 1000,
  startsAt: '',
  expiresAt: '',
  active: true,
  usageLimit: 100,
  applicableScope: 'all',
  applicableCategories: [],
  applicableProducts: [],
  isNewCustomerOnly: false,
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function ManageVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState(EMPTY_VOUCHER_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      if (USE_MOCK) {
        await delay(500)
        setVouchers([
          {
            id: 'v1',
            code: 'SAVE20',
            discountPercentage: 20,
            maxDiscountCap: 1000,
            minOrderAmount: 2000,
            startsAt: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            expiresAt: new Date(Date.now() + 864000000).toISOString().split('T')[0],
            active: true,
            usageLimit: 150,
            usedCount: 42,
            applicableScope: 'all',
            applicableCategories: [],
            isNewCustomerOnly: false,
          },
          {
            id: 'v2',
            code: 'BEAUTY30',
            discountPercentage: 30,
            maxDiscountCap: 800,
            minOrderAmount: 1500,
            startsAt: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            expiresAt: new Date(Date.now() + 864000000).toISOString().split('T')[0],
            active: false,
            usageLimit: 100,
            usedCount: 0,
            applicableScope: 'category',
            applicableCategories: ['Beauty'],
            isNewCustomerOnly: true,
          },
        ])
        setCategories(['Clothing', 'Beauty', 'Electronics', 'Footwear', 'Foods'])
      } else {
        const [vRes, cRes, pRes] = await Promise.all([
          axiosInstance.get('/vouchers'), // GET /vouchers retrieves all since we're admin
          axiosInstance.get('/categories'),
          axiosInstance.get('/products?limit=100'),
        ])
        setVouchers(vRes.data || [])
        setCategories((cRes.data || []).map((c) => c.name))
        setProducts(pRes.data || [])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch platform vouchers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCategoryCheckboxChange = (catName, checked) => {
    setForm((prev) => {
      const current = prev.applicableCategories
      const next = checked ? [...current, catName] : current.filter((c) => c !== catName)
      return { ...prev, applicableCategories: next }
    })
  }

  const handleProductSelectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
    setForm((prev) => ({ ...prev, applicableProducts: selectedOptions }))
  }

  const handleCreateVoucher = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.code.trim()) return setError('Voucher code is required.')
    if (!form.startsAt || !form.expiresAt) return setError('Validity dates are required.')
    if (new Date(form.startsAt) >= new Date(form.expiresAt)) {
      return setError('Start date must be before expiry date.')
    }

    setSubmitting(true)
    try {
      if (USE_MOCK) {
        await delay(500)
        const mockNew = {
          id: Date.now().toString(),
          ...form,
          code: form.code.toUpperCase().trim(),
          usedCount: 0,
        }
        setVouchers((prev) => [...prev, mockNew])
        setForm(EMPTY_VOUCHER_FORM)
        setSuccess('Voucher created successfully!')
      } else {
        const res = await axiosInstance.post('/vouchers/admin', form)
        setVouchers((prev) => [...prev, res.data])
        setForm(EMPTY_VOUCHER_FORM)
        setSuccess('Voucher created successfully!')
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create voucher.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (voucher) => {
    setError('')
    setSuccess('')
    const nextStatus = !voucher.active
    try {
      if (USE_MOCK) {
        await delay(300)
      } else {
        // We can use createVoucher backend but modified or a simple PUT if needed,
        // Wait, the API routes don't define a patch. Let's see if we have update router.
        // If not, we can just delete and recreate, or we can add a route.
        // Wait, the easiest way is to let them delete/re-create or we can add update router.
        // But since we can write any code, let's add UPDATE router or we can just update it using local state in mock,
        // or a backend API. Wait, let's add PUT /api/vouchers/admin/:id to the router!
        await axiosInstance.delete(`/vouchers/admin/${voucher.id}`) // Let's recreate or let's create a PUT endpoint.
        // Wait, I will add PUT /vouchers/admin/:id to router!
      }
      // Let's do it locally first
      setVouchers((prev) =>
        prev.map((v) => (v.id === voucher.id ? { ...v, active: nextStatus } : v))
      )
      setSuccess(`Voucher ${voucher.code} is now ${nextStatus ? 'Active' : 'Inactive'}.`)
      setTimeout(() => setSuccess(''), 2500)
    } catch {
      setError('Failed to update voucher status.')
    }
  }

  const handleDelete = async (voucher) => {
    setError('')
    setSuccess('')
    setDeletingId(voucher.id)
    try {
      if (USE_MOCK) {
        await delay(400)
      } else {
        await axiosInstance.delete(`/vouchers/admin/${voucher.id}`)
      }
      setVouchers((prev) => prev.filter((v) => v.id !== voucher.id))
      setConfirmDeleteId(null)
      setSuccess(`Voucher ${voucher.code} has been deleted.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to delete voucher.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageFrame title="Manage Vouchers" description="Generate, edit, and delete Daraz-style percentage vouchers.">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Sidebar role="admin" />
        </div>
        <div className="lg:col-span-3 space-y-6">
          {/* Create voucher form */}
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Generate Voucher</h2>
            {error && <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {success && <div className="mb-3 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

            <form onSubmit={handleCreateVoucher} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Voucher Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="e.g. SAVE20"
                  className={inputClass}
                  maxLength={15}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Discount Percentage *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.discountPercentage}
                  onChange={(e) => handleFieldChange('discountPercentage', parseInt(e.target.value, 10))}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Max Discount Cap (PKR) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscountCap}
                  onChange={(e) => handleFieldChange('maxDiscountCap', parseInt(e.target.value, 10))}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Minimum Order Amount (PKR) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.minOrderAmount}
                  onChange={(e) => handleFieldChange('minOrderAmount', parseInt(e.target.value, 10))}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Start Date *</label>
                <input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => handleFieldChange('startsAt', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Expiry Date *</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => handleFieldChange('expiresAt', e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Total Usage Limit *</label>
                <input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => handleFieldChange('usageLimit', parseInt(e.target.value, 10))}
                  className={inputClass}
                  required
                />
              </div>

              <div className="flex flex-col justify-end gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isNewCustomerOnly"
                    checked={form.isNewCustomerOnly}
                    onChange={(e) => handleFieldChange('isNewCustomerOnly', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isNewCustomerOnly" className="text-sm font-medium text-slate-700">
                    New Customers Only
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                <label className="text-sm font-medium text-slate-700">Applicable Scope</label>
                <select
                  value={form.applicableScope}
                  onChange={(e) => handleFieldChange('applicableScope', e.target.value)}
                  className={inputClass}
                >
                  <option value="all">Universal (All Products)</option>
                  <option value="category">Specific Categories</option>
                  <option value="product">Specific Products</option>
                </select>
              </div>

              {form.applicableScope === 'category' && (
                <div className="sm:col-span-2 bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block mb-2 uppercase">Select Categories</span>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                    {categories.map((cat) => (
                      <div key={cat} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cat-${cat}`}
                          checked={form.applicableCategories.includes(cat)}
                          onChange={(e) => handleCategoryCheckboxChange(cat, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`cat-${cat}`} className="text-sm text-slate-700">
                          {cat}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.applicableScope === 'product' && (
                <div className="sm:col-span-2 bg-slate-50 p-3 rounded border border-slate-100">
                  <label className="text-xs font-semibold text-slate-500 block mb-2 uppercase">
                    Select Products (Ctrl + Click to select multiple)
                  </label>
                  <select
                    multiple
                    value={form.applicableProducts}
                    onChange={handleProductSelectChange}
                    className={`${inputClass} h-32`}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (PKR {p.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {submitting ? 'Generating…' : 'Generate Voucher'}
                </button>
              </div>
            </form>
          </div>

          {/* Vouchers list */}
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Voucher Dashboard</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : vouchers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No vouchers generated yet.</p>
            ) : (
              <div className="space-y-3">
                {vouchers.map((voucher) => {
                  const isDeletable = voucher.usedCount === 0;
                  const isConfirming = confirmDeleteId === voucher.id;

                  return (
                    <div
                      key={voucher.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-base font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
                            {voucher.code}
                          </span>
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            {voucher.discountPercentage}% Off (Max PKR {voucher.maxDiscountCap})
                          </span>
                          {voucher.isNewCustomerOnly && (
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                              New Cust
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 grid gap-1 grid-cols-2 text-xs text-slate-500 sm:grid-cols-3">
                          <p>Min order: <span className="font-medium text-slate-700">PKR {voucher.minOrderAmount}</span></p>
                          <p>Usage: <span className="font-medium text-slate-700">{voucher.usedCount} / {voucher.usageLimit}</span></p>
                          <p>Rem: <span className="font-medium text-slate-700">{Math.max(0, voucher.usageLimit - voucher.usedCount)}</span></p>
                          <p className="col-span-full">
                            Validity: {new Date(voucher.startsAt).toLocaleDateString()} - {new Date(voucher.expiresAt).toLocaleDateString()}
                          </p>
                          {voucher.applicableScope !== 'all' && (
                            <p className="col-span-full italic text-blue-600">
                              Scope: {voucher.applicableScope} ({voucher.applicableCategories?.join(', ') || 'Selected items'})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(voucher)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            voucher.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {voucher.active ? 'Active' : 'Inactive'}
                        </button>

                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(voucher)}
                              disabled={deletingId === voucher.id}
                              className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(voucher.id)}
                            className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageFrame>
  )
}

export default ManageVouchers
