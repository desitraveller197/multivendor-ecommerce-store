import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
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
      if (USE_MOCK) {
        await delay(800)
      } else {
        await axiosInstance.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      }
      navigate('/login', { state: { message: 'Account created successfully. Please login.' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Register</h1>
      <p className="mt-1 text-sm text-slate-500">Create an account for your marketplace role.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="reg-name" className="text-sm font-medium text-slate-700">
            Full Name <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="reg-name"
            type="text"
            required
            placeholder="Ali Raza"
            className={inputClass}
            value={formData.name}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="reg-email" className="text-sm font-medium text-slate-700">
            Email <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="reg-email"
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
          <label htmlFor="reg-password" className="text-sm font-medium text-slate-700">
            Password <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            id="reg-password"
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
          <label htmlFor="reg-role" className="text-sm font-medium text-slate-700">Role</label>
          <select
            id="reg-role"
            className={inputClass}
            value={formData.role}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, role: event.target.value }))
            }
          >
            <option value="customer">Customer</option>
            <option value="seller">Seller</option>
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
              Creating account…
            </span>
          ) : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{' '}
        <Link className="font-semibold text-blue-700 hover:text-blue-900" to="/login">
          Login
        </Link>
      </p>
    </section>
  )
}

export default Register
