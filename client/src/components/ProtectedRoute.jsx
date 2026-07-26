import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ children, roles }) {
  const location = useLocation()
  const { isAuthenticated, role } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
