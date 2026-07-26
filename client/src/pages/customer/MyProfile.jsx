import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { updateUser } from '../../store/authSlice'
import PageFrame from '../../components/PageFrame'

function MyProfile() {
  const dispatch = useDispatch()
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', city: '' })
  const [loading, setLoading] = useState(true)
  
  const [saving, setSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (USE_MOCK) {
          await delay(500)
          setProfile({ name: 'Ali Raza', email: 'ali@example.com', phone: '03001234567', city: 'Lahore' })
        } else {
          const res = await axiosInstance.get('/auth/profile')
          setProfile({
            name: res.data.name || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            city: res.data.city || ''
          })
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        setProfileError('Failed to load profile details.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleProfileSave = async () => {
    setProfileError('')
    setProfileSuccess('')
    setSaving(true)

    try {
      let updatedUser
      if (USE_MOCK) {
        await delay(700)
        updatedUser = { ...profile }
      } else {
        const res = await axiosInstance.put('/auth/profile', profile)
        updatedUser = res.data
      }
      dispatch(updateUser(updatedUser))
      setProfileSuccess('Profile updated successfully')
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to update profile:', err)
      setProfileError('Failed to update profile details.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPasswordError('Please fill out all password fields.')
      return
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordLoading(true)
    try {
      if (USE_MOCK) {
        await delay(700)
      } else {
        /* TODO: await axiosInstance.put('/auth/change-password',
             { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }) */
        /* NOTE: ask Esha to add PUT /auth/change-password endpoint */
      }
      
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordSuccess('Password updated successfully')
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to update password:', err)
      setPasswordError(err?.response?.data?.message || 'Failed to update password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400'

  return (
    <div className="mx-auto max-w-[983px]">
    <PageFrame title="My Profile" description="Manage your account details and password.">
      <section className="rounded-lg bg-white p-6 shadow-sm">
      {loading ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="h-10 animate-pulse rounded bg-slate-100" />
          <div className="h-10 animate-pulse rounded bg-slate-100" />
          <div className="h-10 animate-pulse rounded bg-slate-100" />
          <div className="h-10 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                className={inputClass}
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                className={inputClass}
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input
                className={inputClass}
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">City</label>
              <input
                className={inputClass}
                value={profile.city}
                onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>
          </div>
          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving…
              </span>
            ) : 'Save Changes'}
          </button>
          {profileSuccess && <p className="mt-2 text-sm text-green-700">{profileSuccess}</p>}
          {profileError && <p className="mt-2 text-sm text-red-500">{profileError}</p>}
        </>
      )}

      <hr className="my-8 border-slate-200" />

      <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="col-span-full flex flex-col gap-1 md:col-span-1">
          <label className="text-sm font-medium text-slate-700">Current Password</label>
          <input
            type="password"
            className={inputClass}
            placeholder="Current Password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
          />
        </div>
        <div className="hidden md:block" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">New Password</label>
          <input
            type="password"
            className={inputClass}
            placeholder="New Password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
          <input
            type="password"
            className={inputClass}
            placeholder="Confirm New Password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
          />
        </div>
      </div>
      <button
        onClick={handlePasswordUpdate}
        disabled={passwordLoading}
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {passwordLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Updating…
          </span>
        ) : 'Update Password'}
      </button>
      {passwordSuccess && <p className="mt-2 text-sm text-green-700">{passwordSuccess}</p>}
      {passwordError && <p className="mt-2 text-sm text-red-500">{passwordError}</p>}
      </section>
    </PageFrame>
    </div>
  )
}

export default MyProfile
