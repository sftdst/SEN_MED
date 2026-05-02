import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { colors, radius, shadows } from '../../theme'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, error, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Rediriger si authentifié via useEffect (pas pendant le rendu)
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    // La redirection se fera automatiquement via useEffect
  }

  // Si en train de rediriger après authentification, afficher un indicateur de chargement
  if (isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.gray500,
      }}>
        ⏳ Redirection...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${colors.bleu} 0%, ${colors.bleuLight} 100%)`,
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: radius.lg,
        width: '100%',
        maxWidth: 420,
        padding: '40px 36px',
        boxShadow: shadows.xl,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: radius.md,
            background: `linear-gradient(135deg, ${colors.orange} 0%, #ff8a65 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28, fontWeight: 800, color: '#fff',
            boxShadow: `0 4px 12px ${colors.orange}40`,
          }}>S</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: colors.gray900 }}>
            Sen<span style={{ color: colors.orange }}>Med</span>
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: colors.gray500 }}>
            Connexion à la plateforme
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: `${colors.danger}15`,
            border: `1px solid ${colors.danger}40`,
            borderRadius: radius.sm,
            marginBottom: 20,
            fontSize: 13,
            color: colors.danger,
          }}>
            ❌ {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: colors.gray700,
              marginBottom: 8,
            }}>
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: radius.sm,
                border: `1px solid ${colors.gray300}`,
                fontSize: 14,
                color: colors.gray900,
                background: '#fff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              placeholder="votre@email.com"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: colors.gray700,
              marginBottom: 8,
            }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: radius.sm,
                border: `1px solid ${colors.gray300}`,
                fontSize: 14,
                color: colors.gray900,
                background: '#fff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: radius.sm,
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              background: `linear-gradient(135deg, ${colors.bleu} 0%, ${colors.bleuDark} 100%)`,
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !email || !password ? 0.7 : 1,
              transition: 'opacity 0.2s, transform 0.2s',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
