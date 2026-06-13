import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      if (USE_MOCK) {
        await delay(800)
        navigate('/login', { state: { message: 'Password reset successful. Please login.' } })
      } else {
        await axiosInstance.post(`/auth/reset-password/${token}`, { password: newPassword })
        navigate('/login', { state: { message: 'Password reset successful. Please login.' } })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
      <p className="mt-2 text-sm text-slate-600">Create a strong new password for your account.</p>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <input
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button 
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <Link to="/login" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline">
        Go to login
      </Link>
    </section>
  )
}

export default ResetPassword
