import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Email is required.')
      return
    }
    if (String(otp).trim().length !== 6) {
      setError('OTP must be exactly 6 digits.')
      return
    }
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
        await axiosInstance.post('/auth/reset-password', {
          email: email.trim(),
          otp: otp.trim(),
          password: newPassword,
        })
        navigate('/login', { state: { message: 'Password reset successful. Please login.' } })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your reset code and choose a new password.</p>
      
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="reset-email" className="text-sm font-medium text-slate-700">Email Address</label>
          <input
            id="reset-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="reset-otp" className="text-sm font-medium text-slate-700">6-Digit Reset Code (OTP)</label>
          <input
            id="reset-otp"
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 123456"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-center font-bold tracking-widest outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="reset-new" className="text-sm font-medium text-slate-700">New Password</label>
          <input
            id="reset-new"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="reset-confirm" className="text-sm font-medium text-slate-700">Confirm New Password</label>
          <input
            id="reset-confirm"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
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
              Resetting Password…
            </span>
          ) : 'Reset Password'}
        </button>
      </form>

      <Link to="/login" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:text-blue-900">
        ← Go to login
      </Link>
    </section>
  )
}

export default ResetPassword
