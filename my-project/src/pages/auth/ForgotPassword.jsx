import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (USE_MOCK) {
        await delay(800)
        setSuccess('Password reset OTP sent to your email.')
      } else {
        await axiosInstance.post('/auth/forgot-password', { email })
        setSuccess('Password reset OTP sent to your email.')
      }
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`)
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your email to receive a 6-digit numeric OTP code.</p>
      
      {success ? (
        <div className="mt-5 rounded bg-green-100 p-3 text-sm text-green-700">
          {success} Redirecting to enter code...
        </div>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <label htmlFor="forgot-email" className="text-sm font-medium text-slate-700">Email</label>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending OTP…
              </span>
            ) : 'Send Reset OTP'}
          </button>
        </form>
      )}

      <Link to="/login" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:text-blue-900">
        ← Back to login
      </Link>
    </section>
  )
}

export default ForgotPassword
