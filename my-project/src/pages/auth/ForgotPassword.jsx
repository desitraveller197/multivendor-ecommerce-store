import { useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function ForgotPassword() {
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
        setSuccess('Password reset link sent to your email.')
      } else {
        await axiosInstance.post('/auth/forgot-password', { email })
        setSuccess('Password reset link sent to your email.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your email to receive a reset link.</p>
      
      {success ? (
        <div className="mt-5 p-3 rounded-md bg-green-50 text-green-700 border border-green-200">
          {success}
        </div>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <Link to="/login" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline">
        Back to login
      </Link>
    </section>
  )
}

export default ForgotPassword
