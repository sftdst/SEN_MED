import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, permission = null }) {
  const { isAuthenticated, loading, hasPermission } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
      }}>
        ⏳ Chargement...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 64 }}>🚫</div>
        <h2 style={{ margin: 0, fontSize: 24, color: '#111827' }}>
          Accès refusé
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#4b5563', maxWidth: 400 }}>
          Vous n'avez pas la permission nécessaire pour accéder à cette page.
        </p>
      </div>
    )
  }

  return children
}
