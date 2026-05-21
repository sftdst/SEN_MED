import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]                       = useState(null)
  const [token, setToken]                     = useState(() => localStorage.getItem('senmed_token'))
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState(null)
  const [mustChangePassword, setMustChange]   = useState(false)

  const loadUser = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      const res = await api.get('/auth/me')
      if (res.data.success) {
        const u = res.data.data.user
        setUser(u)
        setMustChange(!!u.must_change_password)
        setError(null)
      }
    } catch {
      localStorage.removeItem('senmed_token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) loadUser()
    else setLoading(false)
  }, [token, loadUser])

  const login = async (email, password) => {
    try {
      setError(null)
      const res = await api.post('/auth/login', { email, password })
      if (res.data.success) {
        const { token: newToken, user: userData } = res.data.data
        localStorage.setItem('senmed_token', newToken)
        setToken(newToken)
        setUser(userData)
        setMustChange(!!userData.must_change_password)
        return { success: true }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion'
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const res = await api.post('/auth/register', userData)
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data.data
        localStorage.setItem('senmed_token', newToken)
        setToken(newToken)
        setUser(newUser)
        setMustChange(!!newUser.must_change_password)
        return { success: true }
      }
    } catch (err) {
      const message = err.response?.data?.message || "Erreur d'inscription"
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    finally {
      localStorage.removeItem('senmed_token')
      setToken(null)
      setUser(null)
      setMustChange(false)
    }
  }

  // Changer son propre mot de passe
  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    if (res.data.success) {
      setMustChange(false)
      setUser(u => ({ ...u, must_change_password: false }))
    }
    return res.data
  }

  // Conserver le mot de passe actuel (première connexion)
  const keepPassword = async () => {
    await api.post('/auth/keep-password')
    setMustChange(false)
    setUser(u => ({ ...u, must_change_password: false }))
  }

  const hasPermission = (permissionKey) => {
    if (!user || !user.role) return false
    return user.role.permissions?.some(p => p.key === permissionKey) || false
  }

  const hasRole = (roleKey) => user?.role?.key === roleKey

  return (
    <AuthContext.Provider value={{
      user, token, loading, error,
      login, register, logout,
      hasPermission, hasRole,
      isAuthenticated: !!user,
      mustChangePassword,
      changePassword,
      keepPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
