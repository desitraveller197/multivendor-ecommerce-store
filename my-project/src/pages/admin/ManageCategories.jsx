import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import Sidebar from '../../components/Sidebar'

const fetchCategories = async () => {
  if (USE_MOCK) {
    await delay(500)
    return [
      { id: 1, name: 'Clothing' },
      { id: 2, name: 'Shawls & Dupattas' },
      { id: 3, name: 'Footwear (Chappals)' },
      { id: 4, name: 'Handicrafts & Decor' },
      { id: 5, name: 'Organic Beauty' },
      { id: 6, name: 'Local Foods' },
    ]
  }
  /* TODO: replace with real endpoint when ready */
  /* const res = await axiosInstance.get('/categories') */
  /* return res.data */
  return []
}

const addCategoryApi = async (name) => {
  if (USE_MOCK) {
    await delay(400)
    return { id: Date.now(), name }
  }
  /* TODO: replace with real endpoint when ready */
  /* const res = await axiosInstance.post('/categories', { name }) */
  /* return res.data */
  return { id: Date.now(), name }
}

const deleteCategoryApi = async (id) => {
  if (USE_MOCK) {
    await delay(400)
    return { success: true }
  }
  /* TODO: replace with real endpoint when ready */
  /* await axiosInstance.delete(`/categories/${id}`) */
  return { success: true }
}

function ManageCategories() {
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [inputError, setInputError] = useState('')

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      setLoading(true)
      try {
        const data = await fetchCategories()
        if (isMounted) setCategories(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    run()
    return () => { isMounted = false }
  }, [])

  const handleAdd = async () => {
    if (!newCategory.trim()) {
      setInputError('Category name cannot be empty')
      return
    }
    setInputError('')
    try {
      const added = await addCategoryApi(newCategory.trim())
      setCategories((prev) => [...prev, added])
      setNewCategory('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteCategoryApi(id)
      setCategories((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="admin" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Manage Categories</h1>
        <div className="mt-4 flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              className={`rounded border px-3 py-2 outline-none focus:border-blue-500 ${inputError ? 'border-red-400' : 'border-slate-300'}`}
              placeholder="New category"
              value={newCategory}
              onChange={(event) => {
                setNewCategory(event.target.value)
                if (inputError) setInputError('')
              }}
            />
            <button
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              onClick={handleAdd}
            >
              Add
            </button>
          </div>
          {inputError && <span className="text-xs text-red-500">{inputError}</span>}
        </div>
        <div className="mt-4 space-y-2">
          {loading ? (
            <>
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
            </>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <span>{category.name}</span>
                <button
                  className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 transition-colors"
                  onClick={() => handleDelete(category.id)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default ManageCategories
