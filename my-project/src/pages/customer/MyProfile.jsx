import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { updateUser } from '../../store/authSlice'

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

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      
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
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
            />
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
            />
            <input 
              className="rounded border border-slate-300 px-3 py-2" 
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone" 
            />
            <input 
              className="rounded border border-slate-300 px-3 py-2" 
              value={profile.city}
              onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
              placeholder="City" 
            />
          </div>
          <button 
            onClick={handleProfileSave}
            disabled={saving}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {profileSuccess && <p className="mt-2 text-sm font-medium text-green-600">{profileSuccess}</p>}
          {profileError && <p className="mt-2 text-sm font-medium text-red-600">{profileError}</p>}
        </>
      )}

      <hr className="my-8 border-slate-200" />

      <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          type="password"
          className="col-span-full rounded border border-slate-300 px-3 py-2 md:col-span-1"
          placeholder="Current Password"
          value={passwords.currentPassword}
          onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
        />
        <div className="hidden md:block"></div>
        <input
          type="password"
          className="rounded border border-slate-300 px-3 py-2"
          placeholder="New Password"
          value={passwords.newPassword}
          onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
        />
        <input
          type="password"
          className="rounded border border-slate-300 px-3 py-2"
          placeholder="Confirm New Password"
          value={passwords.confirmPassword}
          onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
        />
      </div>
      <button 
        onClick={handlePasswordUpdate}
        disabled={passwordLoading}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {passwordLoading ? 'Updating...' : 'Update Password'}
      </button>
      {passwordSuccess && <p className="mt-2 text-sm font-medium text-green-600">{passwordSuccess}</p>}
      {passwordError && <p className="mt-2 text-sm font-medium text-red-600">{passwordError}</p>}
    </section>
  )
}

export default MyProfile
