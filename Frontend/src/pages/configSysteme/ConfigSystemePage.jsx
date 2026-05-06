import { useState, useEffect } from 'react'
import { colors, radius, shadows } from '../../theme'
import { mailingApi } from '../../api/index'
import { useTheme } from '../../contexts/ThemeContext'

const MENU_ITEMS = [
  { key: 'accueil',       label: 'Tableau de bord',       icon: '🏠' },
  { key: 'pays',          label: 'Pays',                  icon: '🌍' },
  { key: 'ville',         label: 'Ville',                 icon: '🏙️' },
  { key: 'parametres',    label: 'Paramètres système',    icon: '⚙️' },
  { key: 'mailing',       label: 'Configuration mailing', icon: '📧' },
  { key: 'environnement', label: 'Environnement',         icon: '🌿' },
  { key: 'preferences',   label: 'Préférences',           icon: '🎨' },
]

/* ── Champ générique ─────────────────────────────────────────────────────── */
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: colors.gray700, marginBottom: 6, letterSpacing: '.2px',
      }}>
        {label} {required && <span style={{ color: colors.danger }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: `1.5px solid ${colors.gray300}`,
  borderRadius: radius.sm, fontSize: 13,
  color: colors.gray900, background: colors.gray50,
  outline: 'none', transition: 'border-color .2s, box-shadow .2s',
  fontFamily: 'inherit',
}

/* ── Modal configuration mailing ────────────────────────────────────────── */
function MailingModal({ onClose }) {
  const EMPTY = { host: '', port: '587', encryption: 'tls', username: '', password: '', fromName: 'SenMed', fromEmail: '', testEmail: '' }
  const [form,     setForm]     = useState(EMPTY)
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [testing,  setTesting]  = useState(false)
  const [testMsg,  setTestMsg]  = useState(null)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Charger la config existante
  useEffect(() => {
    mailingApi.get()
      .then(res => {
        if (res.data.data) {
          const d = res.data.data
          setForm({
            host: d.host || '', port: String(d.port || 587),
            encryption: d.encryption || 'tls',
            username: d.username || '', password: d.password || '',
            fromName: d.from_name || 'SenMed', fromEmail: d.from_email || '',
            testEmail: '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      await mailingApi.save({
        host: form.host, port: Number(form.port),
        encryption: form.encryption,
        username: form.username, password: form.password,
        from_name: form.fromName, from_email: form.fromEmail,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors de l\'enregistrement.')
    }
    setSaving(false)
  }

  const handleTest = async () => {
    if (!form.testEmail) return
    setTesting(true)
    setTestMsg(null)
    try {
      const res = await mailingApi.test(form.testEmail)
      setTestMsg({ type: 'success', text: res.data.message })
    } catch (e) {
      setTestMsg({ type: 'error', text: e?.response?.data?.message || 'Échec de l\'envoi.' })
    }
    setTesting(false)
  }

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Carte modale */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 580,
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,.22), 0 4px 16px rgba(0,0,0,.12)',
          overflow: 'hidden',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── En-tête ── */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: colors.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>📧</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>
                Configuration mailing
              </div>
              <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 1 }}>
                Paramètres SMTP pour l'envoi d'emails
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,.15)', border: 'none',
              color: '#fff', cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.15)'}
          >×</button>
        </div>

        {/* ── Corps scrollable ── */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>

          {/* Loader initial */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: colors.gray400 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 13 }}>Chargement de la configuration…</div>
            </div>
          )}

          {/* Erreur sauvegarde */}
          {error && !loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', marginBottom: 16,
              background: colors.dangerBg, border: `1px solid ${colors.danger}30`,
              borderRadius: radius.sm, fontSize: 13, color: colors.danger,
            }}>
              ❌ {error}
            </div>
          )}

          {!loading && <>

          {/* Section serveur */}
          <div style={{ marginBottom: 22 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 14,
              paddingBottom: 10, borderBottom: `1px solid ${colors.gray200}`,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: 6,
                background: colors.infoBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
              }}>🖥️</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray800 }}>
                Serveur SMTP
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 12 }}>
              <Field label="Hôte SMTP" required>
                <input
                  style={inputStyle}
                  type="text"
                  value={form.host}
                  onChange={e => set('host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                  onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                />
              </Field>
              <Field label="Port" required>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.port}
                  onChange={e => set('port', e.target.value)}
                >
                  <option value="25">25</option>
                  <option value="465">465</option>
                  <option value="587">587</option>
                  <option value="2525">2525</option>
                </select>
              </Field>
            </div>

            <Field label="Chiffrement">
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { val: 'none', label: 'Aucun' },
                  { val: 'ssl',  label: 'SSL'   },
                  { val: 'tls',  label: 'TLS / STARTTLS' },
                ].map(opt => (
                  <label
                    key={opt.val}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px', borderRadius: radius.sm, cursor: 'pointer',
                      border: `1.5px solid ${form.encryption === opt.val ? colors.orange : colors.gray200}`,
                      background: form.encryption === opt.val ? `var(--app-accent-10, #ff763110)` : colors.gray50,
                      fontSize: 12, fontWeight: 600,
                      color: form.encryption === opt.val ? colors.orange : colors.gray600,
                      transition: 'all .15s',
                    }}
                  >
                    <input
                      type="radio" name="encryption" value={opt.val}
                      checked={form.encryption === opt.val}
                      onChange={() => set('encryption', opt.val)}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${form.encryption === opt.val ? colors.orange : colors.gray400}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {form.encryption === opt.val && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.orange, display: 'block' }}/>
                      )}
                    </span>
                    {opt.label}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Section authentification */}
          <div style={{ marginBottom: 22 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 14,
              paddingBottom: 10, borderBottom: `1px solid ${colors.gray200}`,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: 6,
                background: colors.successBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
              }}>🔐</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray800 }}>
                Authentification
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Nom d'utilisateur" required>
                <input
                  style={inputStyle}
                  type="text"
                  value={form.username}
                  onChange={e => set('username', e.target.value)}
                  placeholder="user@gmail.com"
                  onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                  onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                />
              </Field>
              <Field label="Mot de passe" required>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 38 }}
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="••••••••"
                    onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                    onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(p => !p)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, color: colors.gray400, padding: 2,
                      transition: 'color .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = colors.gray700}
                    onMouseLeave={e => e.currentTarget.style.color = colors.gray400}
                  >
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </Field>
            </div>
          </div>

          {/* Section expéditeur */}
          <div style={{ marginBottom: 22 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 14,
              paddingBottom: 10, borderBottom: `1px solid ${colors.gray200}`,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: 6,
                background: colors.warningBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
              }}>✉️</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray800 }}>
                Expéditeur
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Nom affiché" required>
                <input
                  style={inputStyle}
                  type="text"
                  value={form.fromName}
                  onChange={e => set('fromName', e.target.value)}
                  placeholder="SenMed"
                  onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                  onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                />
              </Field>
              <Field label="Email expéditeur" required>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.fromEmail}
                  onChange={e => set('fromEmail', e.target.value)}
                  placeholder="no-reply@senmed.sn"
                  onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                  onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                />
              </Field>
            </div>
          </div>

          {/* Section test */}
          <div style={{
            background: colors.gray50,
            border: `1px solid ${colors.gray200}`,
            borderRadius: radius.md,
            padding: 16,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: 6,
                background: colors.infoBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
              }}>🧪</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray800 }}>
                Tester la configuration
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Field label="Adresse email de test">
                  <input
                    style={inputStyle}
                    type="email"
                    value={form.testEmail}
                    onChange={e => set('testEmail', e.target.value)}
                    placeholder="test@example.com"
                    onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                    onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                  />
                </Field>
              </div>
              <button
                onClick={handleTest}
                disabled={!form.testEmail || testing}
                style={{
                  padding: '10px 16px', borderRadius: radius.sm,
                  border: `1.5px solid ${colors.bleu}`,
                  background: 'transparent', color: colors.bleu,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'all .15s',
                  opacity: !form.testEmail || testing ? .5 : 1,
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (form.testEmail && !testing) { e.currentTarget.style.background = colors.bleu; e.currentTarget.style.color = '#fff' }}}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.bleu }}
              >
                {testing ? '⏳ Envoi…' : '📤 Envoyer test'}
              </button>
            </div>

            {testMsg && (
              <div style={{
                marginTop: 10, padding: '9px 12px', borderRadius: radius.sm,
                background: testMsg.type === 'success' ? colors.successBg : colors.dangerBg,
                border: `1px solid ${testMsg.type === 'success' ? colors.success : colors.danger}30`,
                fontSize: 12, fontWeight: 600,
                color: testMsg.type === 'success' ? colors.success : colors.danger,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {testMsg.type === 'success' ? '✅' : '❌'} {testMsg.text}
              </div>
            )}
          </div>
          </>}
        </div>

        {/* ── Pied de modal ── */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${colors.gray200}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          background: colors.gray50, flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: radius.sm,
              border: `1.5px solid ${colors.gray300}`,
              background: '#fff', color: colors.gray700,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = colors.gray500}
            onMouseLeave={e => e.currentTarget.style.borderColor = colors.gray300}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: radius.sm,
              border: 'none',
              background: saved
                ? colors.success
                : `linear-gradient(135deg, ${colors.orange}, #e8520a)`,
              color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
              boxShadow: `0 3px 10px var(--app-accent-35, #ff763135)`,
              transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {saving ? '⏳ Enregistrement…'
              : saved ? '✅ Enregistré !'
              : '💾 Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Modal Préférences ───────────────────────────────────────────────────── */
const PRESET_THEMES = [
  { name: 'Marine',   primary: '#002f59', accent: '#ff7631' },
  { name: 'Forêt',    primary: '#1a5276', accent: '#27ae60' },
  { name: 'Santé',    primary: '#922b21', accent: '#e67e22' },
  { name: 'Violet',   primary: '#4a235a', accent: '#8e44ad' },
  { name: 'Nature',   primary: '#1e6b3c', accent: '#f39c12' },
]

const PAGES = [
  { val: '/',          label: 'Tableau de bord' },
  { val: '/patients',  label: 'Patients' },
  { val: '/visites',   label: 'Visites' },
  { val: '/planning',  label: 'Planning' },
]

function SectionTitle({ icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 14, paddingBottom: 10,
      borderBottom: `1px solid ${colors.gray200}`,
    }}>
      <span style={{
        width: 28, height: 28, borderRadius: 7,
        background: colors.infoBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray800 }}>{label}</span>
    </div>
  )
}

function PreferencesModal({ onClose }) {
  const { prefs, previewPrefs, revertPrefs, savePrefs } = useTheme()

  // Capture les prefs d'origine une seule fois à l'ouverture
  const [form,   setForm]   = useState({ ...prefs })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState(null)

  // Utilise le form courant comme source de vérité; évite le stale-closure
  const setField = (k, v) => {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      previewPrefs(next) // aperçu live
      return next
    })
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      await savePrefs(form)
      setSaving(false)
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 1000)
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur lors de l\'enregistrement.')
      setSaving(false)
    }
  }

  const handleClose = () => {
    revertPrefs()
    onClose()
  }

  const applyPreset = (p) => {
    setForm(prev => {
      const next = { ...prev, primary_color: p.primary, accent_color: p.accent }
      previewPrefs(next)
      return next
    })
  }

  const radioStyle = (active) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: '9px 8px', borderRadius: radius.sm, cursor: 'pointer',
    border: `1.5px solid ${active ? colors.orange : colors.gray200}`,
    background: active ? `var(--app-accent-12, #ff763112)` : colors.gray50,
    fontSize: 12, fontWeight: 600,
    color: active ? colors.orange : colors.gray600,
    transition: 'all .15s',
  })

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640,
          background: '#fff', borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,.22)',
          overflow: 'hidden', maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: colors.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🎨</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Préférences</div>
              <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 1 }}>
                Personnalisation de la plateforme
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,.15)', border: 'none',
              color: '#fff', cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.15)'}
          >×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {error && (
            <div style={{
              padding: '10px 14px', background: colors.dangerBg,
              border: `1px solid ${colors.danger}30`,
              borderRadius: radius.sm, fontSize: 13, color: colors.danger,
            }}>❌ {error}</div>
          )}

          {/* ── Section 1 : Identité ── */}
          <div>
            <SectionTitle icon="🏷️" label="Identité de l'application" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                  Nom de la plateforme <span style={{ color: colors.danger }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  value={form.app_name}
                  onChange={e => setField('app_name', e.target.value)}
                  placeholder="SenMed"
                  onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                  onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                  Initiales
                </label>
                <input
                  style={{ ...inputStyle, textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' }}
                  value={form.app_initial}
                  onChange={e => setField('app_initial', e.target.value.slice(0, 3).toUpperCase())}
                  placeholder="SM"
                  maxLength={3}
                  onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                  onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                Slogan / Sous-titre
              </label>
              <input
                style={inputStyle}
                value={form.app_slogan || ''}
                onChange={e => setField('app_slogan', e.target.value)}
                placeholder="Soins Médicaux"
                onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
              />
            </div>
            {/* Preview */}
            <div style={{
              marginTop: 12, padding: '12px 16px',
              background: form.primary_color,
              borderRadius: radius.md,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, background: form.accent_color,
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff',
              }}>{form.app_initial || 'SM'}</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{form.app_name || 'SenMed'}</div>
                <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>{form.app_slogan || 'Soins Médicaux'}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,.4)', fontStyle: 'italic' }}>
                Aperçu
              </div>
            </div>
          </div>

          {/* ── Section 2 : Couleurs ── */}
          <div>
            <SectionTitle icon="🎨" label="Charte graphique" />

            {/* Presets */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.gray600, marginBottom: 8 }}>
                Thèmes prédéfinis
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_THEMES.map(p => {
                  const active = form.primary_color === p.primary && form.accent_color === p.accent
                  return (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 12px', borderRadius: 20,
                        border: `1.5px solid ${active ? p.accent : colors.gray200}`,
                        background: active ? `${p.primary}12` : '#fff',
                        cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        color: active ? p.primary : colors.gray600,
                        transition: 'all .15s',
                      }}
                    >
                      <span style={{
                        display: 'flex', gap: 2,
                      }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.primary, display: 'inline-block' }}/>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.accent, display: 'inline-block' }}/>
                      </span>
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                  Couleur principale (menu/en-têtes)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={e => setField('primary_color', e.target.value)}
                    style={{ width: 44, height: 38, border: `1.5px solid ${colors.gray300}`, borderRadius: 6, padding: 2, cursor: 'pointer' }}
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.primary_color}
                    onChange={e => setField('primary_color', e.target.value)}
                    placeholder="#002f59"
                    onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                    onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                  Couleur d'accent (boutons/badges)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={e => setField('accent_color', e.target.value)}
                    style={{ width: 44, height: 38, border: `1.5px solid ${colors.gray300}`, borderRadius: 6, padding: 2, cursor: 'pointer' }}
                  />
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.accent_color}
                    onChange={e => setField('accent_color', e.target.value)}
                    placeholder="#ff7631"
                    onFocus={e => { e.target.style.borderColor = colors.orange; e.target.style.boxShadow = `0 0 0 3px var(--app-accent-20, #ff763120)` }}
                    onBlur={e => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3 : Apparence (Mode) ── */}
          <div>
            <SectionTitle icon="🌗" label="Mode d'affichage" />
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { val: 'light', icon: '☀️', label: 'Clair', desc: 'Interface lumineuse' },
                { val: 'dark',  icon: '🌙', label: 'Sombre', desc: 'Interface sombre' },
              ].map(opt => {
                const active = form.theme_mode === opt.val
                return (
                  <button
                    key={opt.val}
                    onClick={() => setField('theme_mode', opt.val)}
                    style={{
                      flex: 1, padding: '14px 16px', borderRadius: radius.md,
                      border: `2px solid ${active ? colors.orange : colors.gray200}`,
                      background: active ? `var(--app-accent-08, #ff763108)` : colors.gray50,
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{opt.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: active ? colors.orange : colors.gray700 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: colors.gray500, marginTop: 2 }}>{opt.desc}</div>
                    {active && (
                      <div style={{
                        display: 'inline-block', marginTop: 8,
                        padding: '2px 10px', borderRadius: 20,
                        background: colors.orange, color: '#fff',
                        fontSize: 10, fontWeight: 700,
                      }}>Actif</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Section 4 : Mise en page ── */}
          <div>
            <SectionTitle icon="📐" label="Mise en page" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 8 }}>
                Densité d'affichage
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { val: 'compact',      label: 'Compact',      desc: 'Plus d\'infos' },
                  { val: 'normal',       label: 'Normal',       desc: 'Équilibré' },
                  { val: 'comfortable',  label: 'Aéré',         desc: 'Plus lisible' },
                ].map(opt => {
                  const active = form.density === opt.val
                  return (
                    <label key={opt.val} style={{ ...radioStyle(active), flexDirection: 'column', gap: 2, flex: 1, cursor: 'pointer' }}>
                      <input
                        type="radio" name="density" value={opt.val}
                        checked={active} onChange={() => setField('density', opt.val)}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontWeight: 700 }}>{opt.label}</span>
                      <span style={{ fontSize: 10, opacity: .75 }}>{opt.desc}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 8 }}>
                Sidebar par défaut
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { val: 'expanded',  label: '← Déployée',  icon: '📂' },
                  { val: 'collapsed', label: 'Réduite →',   icon: '📁' },
                ].map(opt => {
                  const active = form.sidebar_default === opt.val
                  return (
                    <label key={opt.val} style={{ ...radioStyle(active), flex: 1, cursor: 'pointer' }}>
                      <input
                        type="radio" name="sidebar_default" value={opt.val}
                        checked={active} onChange={() => setField('sidebar_default', opt.val)}
                        style={{ display: 'none' }}
                      />
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Section 5 : Régionalisation ── */}
          <div>
            <SectionTitle icon="🌐" label="Régionalisation" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                  Langue
                </label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.language}
                  onChange={e => setField('language', e.target.value)}
                >
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                  Devise
                </label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.currency}
                  onChange={e => setField('currency', e.target.value)}
                >
                  <option value="FCFA">FCFA</option>
                  <option value="EUR">EUR €</option>
                  <option value="USD">USD $</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                  Format date
                </label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.date_format}
                  onChange={e => setField('date_format', e.target.value)}
                >
                  <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                  <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
                  <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>
                Page d'accueil après connexion
              </label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.default_page}
                onChange={e => setField('default_page', e.target.value)}
              >
                {PAGES.map(p => (
                  <option key={p.val} value={p.val}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${colors.gray200}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          background: colors.gray50, flexShrink: 0,
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px', borderRadius: radius.sm,
              border: `1.5px solid ${colors.gray300}`,
              background: '#fff', color: colors.gray700,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = colors.gray500}
            onMouseLeave={e => e.currentTarget.style.borderColor = colors.gray300}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: radius.sm, border: 'none',
              background: saved
                ? colors.success
                : `linear-gradient(135deg, ${colors.orange}, #e8520a)`,
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: `0 3px 10px var(--app-accent-35, #ff763135)`,
              transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {saving ? '⏳ Enregistrement…' : saved ? '✅ Enregistré !' : '💾 Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Placeholder autres onglets ──────────────────────────────────────────── */
function PlaceholderTab({ item }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.lg,
      padding: 48, textAlign: 'center',
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{item?.icon || '📌'}</div>
      <h3 style={{ margin: '0 0 8px', color: colors.gray700, fontSize: 18, fontWeight: 700 }}>
        {item?.label || 'Section'} — Bientôt disponible
      </h3>
      <p style={{ margin: 0, color: colors.gray500, fontSize: 13 }}>
        Cette fonctionnalité sera disponible prochainement.
      </p>
    </div>
  )
}

/* ── Tableau de bord ─────────────────────────────────────────────────────── */
function AccueilTab() {
  const cards = [
    { label: 'Pays configurés',    val: '5',  icon: '🌍', color: colors.bleu,    bg: colors.infoBg    },
    { label: 'Villes configurées', val: '12', icon: '🏙️', color: colors.success, bg: colors.successBg },
    { label: 'Config. mailing',    val: '1',  icon: '📧', color: colors.warning, bg: colors.warningBg },
    { label: 'Environnements',     val: '3',  icon: '🌿', color: colors.danger,  bg: colors.dangerBg  },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: colors.white, borderRadius: radius.md,
            padding: '20px 24px', boxShadow: shadows.sm,
            border: `1px solid ${colors.gray200}`,
            borderLeft: `4px solid ${c.color}`,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: radius.md,
              background: c.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: colors.gray500, fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color, lineHeight: 1.2 }}>{c.val}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        background: colors.white, borderRadius: radius.md, padding: 32,
        boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
        textAlign: 'center', color: colors.gray500,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
          Naviguez dans le menu ci-dessus pour configurer le système.
        </p>
      </div>
    </div>
  )
}

/* ── Page principale ─────────────────────────────────────────────────────── */
export default function ConfigSystemePage() {
  const [activeTab,        setActiveTab]        = useState('accueil')
  const [mailingOpen,      setMailingOpen]      = useState(false)
  const [preferencesOpen,  setPreferencesOpen]  = useState(false)

  const activeItem = MENU_ITEMS.find(m => m.key === activeTab)

  const handleTabClick = (key) => {
    setActiveTab(key)
    if (key === 'mailing')     setMailingOpen(true)
    if (key === 'preferences') setPreferencesOpen(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {mailingOpen     && <MailingModal     onClose={() => { setMailingOpen(false);     setActiveTab('accueil') }} />}
      {preferencesOpen && <PreferencesModal onClose={() => { setPreferencesOpen(false); setActiveTab('accueil') }} />}

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
        borderRadius: radius.lg, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, boxShadow: shadows.md,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: colors.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>⚙️</div>
          <div>
            <h1 style={{ margin: 0, color: colors.white, fontSize: 20, fontWeight: 800 }}>
              Configuration Système
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {activeItem?.label ?? 'Paramètres globaux'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu + contenu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          background: colors.bleu, borderRadius: radius.lg,
          padding: '12px 16px', boxShadow: shadows.md,
        }}>
          {MENU_ITEMS.map(item => {
            const active = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 20,
                  border: 'none', cursor: 'pointer',
                  background: active ? colors.orange : 'rgba(255,255,255,0.1)',
                  color: colors.white,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13, transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'accueil' && <AccueilTab />}
          {['pays', 'ville', 'parametres', 'environnement'].includes(activeTab) && (
            <PlaceholderTab item={activeItem} />
          )}
        </div>
      </div>
    </div>
  )
}
