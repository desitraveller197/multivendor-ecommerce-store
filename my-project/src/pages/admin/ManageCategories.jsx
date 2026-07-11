import { useEffect, useState } from 'react'
import PageFrame from '../../components/PageFrame'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function ManageCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  // Track which category is being edited inline
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [savingId, setSavingId] = useState(null)

  async function loadCategories() {
    setLoading(true)
    setError('')
    try {
      if (USE_MOCK) {
        await delay(400)
        setCategories([
          { _id: '1', id: '1', name: 'Clothing' },
          { _id: '2', id: '2', name: 'Home Accessories' },
        ])
      } else {
        const res = await axiosInstance.get('/categories')
        setCategories(res.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    try {
      if (USE_MOCK) {
        await delay(500)
        const mockNew = { _id: Date.now().toString(), name: newName.trim() }
        setCategories((prev) => [...prev, mockNew])
        setNewName('')
      } else {
        const res = await axiosInstance.post('/categories', { name: newName.trim() })
        setCategories((prev) => [...prev, res.data])
        setNewName('')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category.')
    } finally {
      setAdding(false)
    }
  }

  const handleStartEdit = (cat) => {
    setEditingId(cat._id || cat.id)
    setEditingName(cat.name)
  }

  const handleSaveEdit = async (catId) => {
    if (!editingName.trim()) return
    setSavingId(catId)
    setError('')
    try {
      if (USE_MOCK) {
        await delay(400)
        setCategories((prev) =>
          prev.map((c) => ((c._id || c.id) === catId ? { ...c, name: editingName.trim() } : c))
        )
      } else {
        const res = await axiosInstance.put(`/categories/${catId}`, { name: editingName.trim() })
        setCategories((prev) =>
          prev.map((c) => ((c._id || c.id) === catId ? res.data : c))
        )
      }
      setEditingId(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category.')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    setError('')
    try {
      if (USE_MOCK) {
        await delay(400)
        setCategories((prev) => prev.filter((c) => (c._id || c.id) !== catId))
      } else {
        await axiosInstance.delete(`/categories/${catId}`)
        setCategories((prev) => prev.filter((c) => (c._id || c.id) !== catId))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.')
    }
  }

  const inputClass = 'rounded border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50'

  return (
    <PageFrame title="Manage Categories" description="Add, edit, or remove product categories.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="admin" />
        
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Add New Category</h3>
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                required
                type="text"
                disabled={adding}
                placeholder="Category name, e.g. Handicrafts"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={`${inputClass} flex-1`}
              />
              <button
                type="submit"
                disabled={adding || !newName.trim()}
                className="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Existing Categories</h3>
            {error && <p className="mb-3 text-xs text-red-500 font-semibold">{error}</p>}
            
            {loading && categories.length === 0 ? (
              <p className="text-sm text-slate-500">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-slate-400">No categories found.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {categories.map((cat) => {
                  const catId = cat._id || cat.id
                  const isEditing = editingId === catId
                  const isSaving = savingId === catId

                  return (
                    <div key={catId} className="flex items-center justify-between py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 mr-4">
                          <input
                            type="text"
                            disabled={isSaving}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className={`${inputClass} flex-1`}
                          />
                          <button
                            onClick={() => handleSaveEdit(catId)}
                            disabled={isSaving || !editingName.trim()}
                            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={isSaving}
                            className="rounded bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm text-slate-900 font-medium">{cat.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartEdit(cat)}
                              className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(catId)}
                              className="rounded bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
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

export default ManageCategories
