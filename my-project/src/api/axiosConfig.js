import axios from 'axios'

/** Paths should be relative to this base (e.g. `/auth/login`, `/products`) — do not prefix `/api` again. */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// If a stale/expired token is rejected by the API (401), clear the session and
// send the user to login so they can get a fresh, valid token.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const hadToken = Boolean(localStorage.getItem('token'))
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register')

    if (status === 401 && hadToken && !isAuthRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login?session=expired')
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
