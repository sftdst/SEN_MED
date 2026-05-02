import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('senmed_token'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Charger l'utilisateur depuis l'API si token présent
  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const res = await api.get('/auth/me')
      if (res.data.success) {
        setUser(res.data.data.user)
        setError(null)
      }
    } catch (err) {
      console.error('Erreur chargement user:', err)
      localStorage.removeItem('senmed_token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [token, loadUser])

  // Connexion
  const login = async (email, password) => {
    try {
      setError(null)
      const res = await api.post('/auth/login', { email, password })
      if (res.data.success) {
        const { token: newToken, user: userData } = res.data.data
        localStorage.setItem('senmed_token', newToken)
        setToken(newToken)
        setUser(userData)
        return { success: true }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion'
      setError(message)
      return { success: false, error: message }
    }
  }

  // Inscription
  const register = async (userData) => {
    try {
      setError(null)
      const res = await api.post('/auth/register', userData)
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data.data
        localStorage.setItem('senmed_token', newToken)
        setToken(newToken)
        setUser(newUser)
        return { success: true }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur d\'inscription'
      setError(message)
      return { success: false, error: message }
    }
  }

  // Déconnexion
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Erreur déconnexion:', err)
    } finally {
      localStorage.removeItem('senmed_token')
      setToken(null)
      setUser(null)
    }
  }

  // Vérifie si l'utilisateur a une permission spécifique
  const hasPermission = (permissionKey) => {
    if (!user || !user.role) return false
    return user.role.permissions?.some(p => p.key === permissionKey) || false
  }

  // Vérifie si l'utilisateur a un rôle spécifique
  const hasRole = (roleKey) => {
    return user?.role?.key === roleKey
  }

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    hasPermission,
    hasRole,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
