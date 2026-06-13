import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import ConfirmModal from '../../components/ConfirmModal'
import Sidebar from '../../components/Sidebar'

const fetchUsers = async () => {
  if (USE_MOCK) {
    await delay(600)
    return [
      { id: 1, name: 'Ali Raza', email: 'ali@example.com', role: 'customer' },
      { id: 2, name: 'Sara Khan', email: 'sara@example.com', role: 'seller' },
      { id: 3, name: 'Omar Tariq', email: 'omar@example.com', role: 'customer' },
      { id: 4, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    ]
  }

  const res = await axiosInstance.get('/admin/users')
  return res.data
}

const deleteUser = async (id) => {
  if (USE_MOCK) {
    await delay(400)
    return { success: true }
  }

  await axiosInstance.delete(`/admin/users/${id}`)
  return { success: true }
}

function ManageUsers() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [state, setState] = useState({ loading: true, error: '' })
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null)

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      setState({ loading: true, error: '' })
      try {
        const data = await fetchUsers()
        if (!isMounted) return
        setUsers(Array.isArray(data) ? data : [])
        setState({ loading: false, error: '' })
      } catch (err) {
        if (!isMounted) return
        setState({
          loading: false,
          error: err?.response?.data?.message || err?.message || 'Failed to load users.',
        })
      }
    }

    run()
    return () => {
      isMounted = false
    }
  }, [])

  const filtered = users.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()),
  )

  const confirmDelete = async () => {
    if (!pendingDeleteUser) return
    const id = pendingDeleteUser.id

    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((item) => item.id !== id))
      setPendingDeleteUser(null)
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err?.response?.data?.message || err?.message || 'Failed to delete user.',
      }))
      setPendingDeleteUser(null)
    }
  }

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="admin" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
        <input
          className="mt-4 w-full rounded border border-slate-300 px-3 py-2 md:w-1/2 outline-none focus:border-blue-500"
          placeholder="Search user..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="mt-4 space-y-2">
          {state.loading ? (
            <>
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
            </>
          ) : state.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
          ) : (
            filtered.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-slate-800">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs uppercase text-slate-700">
                    {user.role}
                  </span>
                  <button
                    className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 transition-colors"
                    onClick={() => setPendingDeleteUser(user)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ConfirmModal
        open={Boolean(pendingDeleteUser)}
        title="Delete user"
        message="Are you sure you want to delete this user?"
        onCancel={() => setPendingDeleteUser(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}

export default ManageUsers
