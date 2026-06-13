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

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Register</h1>
      <p className="mt-1 text-sm text-slate-500">Create an account for your marketplace role.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <input
          type="text"
          required
          placeholder="Full Name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          value={formData.name}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, name: event.target.value }))
          }
        />
        <input
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          value={formData.email}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, email: event.target.value }))
          }
        />
        <input
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          value={formData.password}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, password: event.target.value }))
          }
        />
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          value={formData.role}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, role: event.target.value }))
          }
        >
          <option value="customer">Customer</option>
          <option value="seller">Seller</option>
        </select>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{' '}
        <Link className="font-semibold text-blue-700" to="/login">
          Login
        </Link>
      </p>
    </section>
  )
}

export default Register
