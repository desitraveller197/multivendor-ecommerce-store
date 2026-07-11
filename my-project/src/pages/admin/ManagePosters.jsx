import { useState, useEffect, useRef } from 'react'
import PageFrame from '../../components/PageFrame'
import Sidebar from '../../components/Sidebar'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

const EMPTY_FORM = { imageUrl: '', linkUrl: '', active: true }

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function ManagePosters() {
  const [posters, setPosters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      if (USE_MOCK) {
        await delay(400)
        setPosters([
          { id: 'p1', title: 'Eid Sale 2024', subtitle: 'Up to 50% off on selected items', imageUrl: '', linkUrl: '/products', active: true, order: 0 },
        ])
      } else {
        // Admin call — token attached via axiosInstance interceptor
        const res = await axiosInstance.get('/posters')
        setPosters(res.data || [])
      }
    } catch (err) {
      setError('Failed to load posters.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateField = (field) => (e) => {
    const val = field === 'active' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: val }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await axiosInstance.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm((f) => ({ ...f, imageUrl: res.data.imageUrl }))
    } catch {
      setError('Image upload failed. Please try again.')
    } finally {
      setUploadingImage(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.imageUrl.trim()) { setError('Please upload a poster image.'); return }
    setSaving(true)
    try {
      if (USE_MOCK) {
        await delay(400)
        setPosters((p) => [...p, { id: Date.now().toString(), ...form, order: Number(form.order) }])
      } else {
        const res = await axiosInstance.post('/posters', { ...form, order: Number(form.order) })
        setPosters((p) => [...p, res.data])
      }
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create poster.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (poster) => {
    const next = !poster.active
    try {
      if (USE_MOCK) {
        await delay(300)
      } else {
        await axiosInstance.patch(`/posters/${poster.id}`, { active: next })
      }
      setPosters((p) => p.map((x) => (x.id === poster.id ? { ...x, active: next } : x)))
    } catch {
      setError('Failed to update poster.')
    }
  }

  const handleDelete = async (poster) => {
    setDeleting(true)
    setError('')
    try {
      if (!USE_MOCK) await axiosInstance.delete(`/posters/${poster.id || poster._id}`)
      setPosters((p) => p.filter((x) => (x.id || x._id) !== (poster.id || poster._id)))
      setConfirmDeleteId(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete poster.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageFrame title="Manage Posters" description="Upload and manage hero slideshow posters for the home page.">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Sidebar role="admin" />
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* Create form */}
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Add New Poster</h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Upload an event poster image that will slide on the home page hero.</p>
            {error && <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Poster Image *</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700"
                  />
                  {uploadingImage && <span className="text-xs text-blue-600">Uploading…</span>}
                  {form.imageUrl && !uploadingImage && (
                    <img src={form.imageUrl} alt="preview" className="h-12 w-20 rounded object-cover ring-1 ring-slate-200" />
                  )}
                </div>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={updateField('imageUrl')}
                  className={`${inputClass} mt-2 text-xs`}
                  placeholder="Or paste image URL directly"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Button Link (optional)</label>
                <input type="text" value={form.linkUrl} onChange={updateField('linkUrl')} className={inputClass} placeholder="e.g. /products?event=eid" />
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <input id="active-toggle" type="checkbox" checked={form.active} onChange={updateField('active')} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="active-toggle" className="text-sm font-medium text-slate-700">Active (visible on homepage)</label>
              </div>

              <div className="sm:col-span-2">
                <button type="submit" disabled={saving || uploadingImage} className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {saving ? 'Saving…' : 'Add Poster'}
                </button>
              </div>
            </form>
          </div>

          {/* Posters list */}
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Existing Posters</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : posters.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No posters yet. Add one above.</p>
            ) : (
              <div className="space-y-3">
                {posters.map((poster) => (
                  <div key={poster.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center">
                    {poster.imageUrl ? (
                      <img src={poster.imageUrl} alt={poster.title} className="h-16 w-28 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded bg-blue-50 text-3xl">🖼️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs text-slate-400">{poster.linkUrl || 'No link'}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(poster)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          poster.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {poster.active ? 'Active' : 'Inactive'}
                      </button>
                      {confirmDeleteId === (poster.id || poster._id) ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-600 font-medium">Sure?</span>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => handleDelete(poster)}
                            className="rounded px-2.5 py-1 text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
                          >
                            {deleting ? '…' : 'Yes, Delete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(poster.id || poster._id)}
                          className="rounded px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageFrame>
  )
}

export default ManagePosters
