import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import ConfirmModal from '../../components/ConfirmModal'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'

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

  const roleBadge = (role) => {
    const map = {
      admin: 'bg-indigo-100 text-indigo-700',
      seller: 'bg-blue-100 text-blue-700',
      customer: 'bg-slate-100 text-slate-700',
    }
    return map[role] || 'bg-slate-100 text-slate-700'
  }

  return (
    <PageFrame title="Manage Users" description="Search platform users and remove accounts when needed.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="admin" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
        <input
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 md:w-1/2"
          placeholder="Search by name or email…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="mt-4 space-y-2">
          {state.loading ? (
            <>
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
            </>
          ) : state.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{state.error}</div>
          ) : (
            filtered.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${roleBadge(user.role)}`}>
                    {user.role}
                  </span>
                  <button
                    className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-sm"
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
      </div>
      <ConfirmModal
        open={Boolean(pendingDeleteUser)}
        title="Delete user"
        message="Are you sure you want to delete this user?"
        onCancel={() => setPendingDeleteUser(null)}
        onConfirm={confirmDelete}
      />
    </PageFrame>
  )
}

export default ManageUsers
