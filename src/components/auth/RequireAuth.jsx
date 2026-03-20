import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

/**
 * Wraps protected routes. Redirects to /login if not authenticated.
 * Optionally checks allowed roles.
 */
export default function RequireAuth({ children, roles }) {
  const { currentUser, profile, isLoading } = useAuthContext()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-blue">
        <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
