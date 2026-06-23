import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { loginSuccess } from '../../store/authSlice'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'customer',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let data
      if (USE_MOCK) {
        await delay(800)
        data = {
          token: 'mock-jwt-token',
          role: formData.role,
          user: { name: formData.email.split('@')[0], email: formData.email }
        }
      } else {
        const res = await axiosInstance.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
        data = res.data
      }
      dispatch(loginSuccess({ token: data.token, role: data.role, user: data.user }))
      const from = location.state?.from?.pathname
      if (data.role === 'admin') navigate('/admin/dashboard')
      else if (data.role === 'seller') navigate('/seller/dashboard')
      else navigate(from || '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="mt-1 text-sm text-slate-500">Login for multi-role.</p>
      
      {location.state?.message && (
        <div className="mt-4 rounded bg-green-100 p-3 text-sm text-green-700">
          {location.state.message}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="text-sm font-medium text-slate-700">Email</label>
          <input
            id="login-email"
            type="email"
            required
            placeholder="you@example.com"
            className={inputClass}
            value={formData.email}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, email: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</label>
          <input
            id="login-password"
            type="password"
            required
            placeholder="••••••••"
            className={inputClass}
            value={formData.password}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, password: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-role" className="text-sm font-medium text-slate-700">Role</label>
          <select
            id="login-role"
            className={inputClass}
            value={formData.role}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, role: event.target.value }))
            }
          >
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Logging in…
            </span>
          ) : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        New user?{' '}
        <Link className="font-semibold text-blue-700 hover:text-blue-900" to="/register">
          Register here
        </Link>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Forgot password?{' '}
        <Link className="font-semibold text-blue-700 hover:text-blue-900" to="/forgot-password">
          Reset it
        </Link>
      </p>
    </section>
  )
}

export default Login
