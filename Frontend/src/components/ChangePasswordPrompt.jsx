import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ChangePasswordPrompt() {
  const { user, mustChangePassword, changePassword, keepPassword } = useAuth()
  const [step, setStep]       = useState('ask')   // 'ask' | 'change' | 'done'
  const [current, setCurrent] = useState('')
  const [newPwd, setNewPwd]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  if (!mustChangePassword) return null

  const handleKeep = async () => {
    setLoading(true)
    try { await keepPassword() } catch {}
    finally { setLoading(false) }
  }

  const handleChange = async (e) => {
    e.preventDefault()
    setErr('')
    if (newPwd.length < 6) return setErr('Le mot de passe doit contenir au moins 6 caractères.')
    if (newPwd !== confirm) return setErr('Les mots de passe ne correspondent pas.')
    setLoading(true)
    try {
      const res = await changePassword(current, newPwd)
      if (res.success) setStep('done')
      else setErr(res.message || 'Erreur lors du changement.')
    } catch (e) {
      setErr(e?.response?.data?.message || 'Erreur lors du changement.')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: 9, fontSize: 13,
    border: '1.5px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Inter', sans-serif",
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,18,40,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16, fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 70px rgba(0,0,0,0.35)', overflow: 'hidden',
      }}>
        {/* Bande déco */}
        <div style={{ height: 5, background: 'linear-gradient(90deg, #003268, #ff7631)' }} />

        <div style={{ padding: '28px 28px 24px' }}>

          {/* ── Étape 1 : Demander ── */}
          {step === 'ask' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ fontSize: 46, marginBottom: 10 }}>👋</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', marginBottom: 6 }}>
                  Bienvenue, {user?.name?.split(' ')[0]} !
                </div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                  C'est votre première connexion. Souhaitez-vous conserver votre mot de passe actuel ou en définir un nouveau ?
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  disabled={loading}
                  onClick={handleKeep}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                    border: '1.5px solid #e2e8f0', background: '#f8fafc',
                    fontWeight: 600, fontSize: 13, color: '#374151',
                  }}
                >
                  {loading ? '...' : 'Conserver'}
                </button>
                <button
                  onClick={() => setStep('change')}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 10, cursor: 'pointer',
                    border: 'none', background: 'linear-gradient(135deg,#003268,#002050)',
                    fontWeight: 700, fontSize: 13, color: '#fff',
                  }}
                >
                  🔒 Changer mon mot de passe
                </button>
              </div>
            </>
          )}

          {/* ── Étape 2 : Formulaire ── */}
          {step === 'change' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <button onClick={() => setStep('ask')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, padding: 0, marginBottom: 12 }}>
                  ← Retour
                </button>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>Définir un nouveau mot de passe</div>
              </div>

              {err && (
                <div style={{ background: '#fef2f2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
                  {err}
                </div>
              )}

              <form onSubmit={handleChange} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Mot de passe actuel (temporaire)
                  </label>
                  <input style={inp} type="password" value={current} onChange={e => { setCurrent(e.target.value); setErr('') }} placeholder="Votre mot de passe actuel" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Nouveau mot de passe
                  </label>
                  <input style={inp} type="password" value={newPwd} onChange={e => { setNewPwd(e.target.value); setErr('') }} placeholder="Min. 6 caractères" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Confirmer le nouveau mot de passe
                  </label>
                  <input style={inp} type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setErr('') }} placeholder="Répéter le mot de passe" />
                </div>
                <button type="submit" disabled={loading || !current || !newPwd || !confirm} style={{
                  padding: '12px', borderRadius: 10, border: 'none', marginTop: 4,
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg,#ff7631,#c94f1a)',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                  {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
                </button>
              </form>
            </>
          )}

          {/* ── Étape 3 : Succès ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#1e293b', marginBottom: 8 }}>Mot de passe mis à jour !</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Votre nouveau mot de passe est actif. Vous pouvez continuer.</div>
              <button onClick={keepPassword} style={{
                marginTop: 20, padding: '11px 32px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#003268,#002050)',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>Continuer →</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
