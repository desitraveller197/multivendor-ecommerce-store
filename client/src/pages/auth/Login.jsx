import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { loginSuccess } from '../../store/authSlice'
import SocialLogin from '../../components/SocialLogin'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('session') === 'expired'
  
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

  const navigateByRole = (data) => {
    dispatch(loginSuccess({ token: data.token, role: data.role, user: data.user }))
    const from = location.state?.from?.pathname
    if (data.role === 'admin') navigate('/admin/dashboard')
    else if (data.role === 'seller') navigate('/seller/dashboard')
    else navigate(from || '/')
  }

  // Exchange a Google ID token / Facebook access token for our app's session.
  const handleSocialToken = async (provider, token) => {
    setError('')
    setLoading(true)
    try {
      const payload = provider === 'google' ? { credential: token } : { accessToken: token }
      const res = await axiosInstance.post(`/auth/${provider}`, payload)
      navigateByRole(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Social login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <section className="card-hover-glow mx-auto max-w-[420px] rounded-2xl border border-slate-100 bg-white p-6 shadow-md md:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="mt-1 text-sm text-slate-500">Log in to access your account.</p>
      
      {location.state?.message && (
        <div className="mt-3 rounded bg-green-100 p-2.5 text-xs text-green-700">
          {location.state.message}
        </div>
      )}

      {sessionExpired && (
        <div className="mt-3 rounded bg-amber-100 p-2.5 text-xs text-amber-800">
          Your session expired. Please log in again to continue.
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
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
          <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
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
          <label htmlFor="login-role" className="text-xs font-bold uppercase tracking-wider text-slate-500">Role</label>
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
          className="btn-interactive w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
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

      <SocialLogin onToken={handleSocialToken} onError={setError} disabled={loading} />

      <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-500">
          New user?{' '}
          <Link className="font-semibold text-blue-700 hover:text-blue-900 transition-colors" to="/register">
            Register here
          </Link>
        </p>
        <p className="text-xs text-slate-500">
          Forgot password?{' '}
          <Link className="font-semibold text-blue-700 hover:text-blue-900 transition-colors" to="/forgot-password">
            Reset it
          </Link>
        </p>
      </div>
    </section>
  )
}

export default Login
