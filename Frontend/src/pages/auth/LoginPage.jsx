import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

/* ── Styles globaux ─────────────────────────────────────────────────────── */
const STYLE_ID = 'senmed-login-v3'
if (!document.getElementById(STYLE_ID)) {
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes blob1 {
      0%,100% { transform: translate(0px,   0px)   scale(1);    }
      33%      { transform: translate(80px, -60px)  scale(1.12); }
      66%      { transform: translate(-40px, 40px)  scale(0.94); }
    }
    @keyframes blob2 {
      0%,100% { transform: translate(0px,   0px)   scale(1);    }
      33%      { transform: translate(-70px, 50px)  scale(1.10); }
      66%      { transform: translate(50px, -30px)  scale(0.96); }
    }
    @keyframes blob3 {
      0%,100% { transform: translate(0px,   0px)   scale(1);    }
      33%      { transform: translate(30px,  70px)  scale(1.08); }
      66%      { transform: translate(-60px,-20px)  scale(1.04); }
    }
    @keyframes cardIn {
      from { opacity:0; transform: translateY(40px) scale(.97); }
      to   { opacity:1; transform: translateY(0)    scale(1);   }
    }
    @keyframes rowIn {
      from { opacity:0; transform: translateX(-14px); }
      to   { opacity:1; transform: translateX(0);     }
    }
    @keyframes shimmer {
      from { background-position: -300% center; }
      to   { background-position: 300% center;  }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes badgePop {
      0%   { transform: scale(0); opacity:0; }
      70%  { transform: scale(1.2); }
      100% { transform: scale(1); opacity:1; }
    }

    /* Card */
    .lg-card { animation: cardIn .6s cubic-bezier(.16,1,.3,1) both; }

    /* Inputs — couleur d'accentuation via variable CSS posée par applyTheme() */
    .lg-input {
      width: 100%;
      height: 50px;
      padding: 0 48px 0 48px;
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 14px;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      color: #111827;
      outline: none;
      transition: border-color .22s, background .22s, box-shadow .22s;
      letter-spacing: .01em;
    }
    .lg-input:focus {
      border-color: var(--app-accent, #ff7631);
      background: #fff;
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--app-accent, #ff7631) 12%, transparent), 0 1px 4px rgba(0,0,0,.06);
    }
    .lg-input::placeholder { color: #9ca3af; font-weight: 400; }
    .lg-input:disabled { opacity: .55; cursor: not-allowed; }

    /* Bouton principal */
    .lg-btn {
      width: 100%;
      height: 52px;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      color: #fff;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      background: var(--app-accent, #ff7631);
      box-shadow: 0 4px 20px color-mix(in srgb, var(--app-accent, #ff7631) 45%, transparent), 0 1px 3px rgba(0,0,0,.15);
      transition: transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s;
      letter-spacing: .02em;
    }
    .lg-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.22) 50%, transparent 70%);
      background-size: 250% auto;
      animation: shimmer 3s linear infinite;
    }
    .lg-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px color-mix(in srgb, var(--app-accent, #ff7631) 55%, transparent), 0 2px 6px rgba(0,0,0,.15);
    }
    .lg-btn:active:not(:disabled) { transform: translateY(0); }
    .lg-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }

    .row-anim { animation: rowIn .4s cubic-bezier(.16,1,.3,1) both; }

    /* Scrollbar invisible */
    .lg-scroll::-webkit-scrollbar { width: 0; }
  `
  document.head.appendChild(el)
}

/* ── Composant ───────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [focus,    setFocus]    = useState(null)
  const emailRef = useRef()

  const { login, error, isAuthenticated } = useAuth()
  const { prefs } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const primary = prefs.primary_color
  const accent  = prefs.accent_color

  useEffect(() => {
    if (isAuthenticated) navigate(location.state?.from?.pathname || '/', { replace: true })
  }, [isAuthenticated])

  useEffect(() => { emailRef.current?.focus() }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    await login(email, password)
    setLoading(false)
  }

  if (isAuthenticated) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
      <span style={{ fontSize:13, color:'#64748b', fontFamily:'Inter,sans-serif' }}>Redirection…</span>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      background: '#06101e',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px 16px',
    }}>

      {/* ── Blobs animés ───────────────────────────────────────────────── */}
      {[
        { w:700, h:700, top:'-15%', left:'-10%', color: primary,  opacity:.55, anim:'blob1 20s ease-in-out infinite' },
        { w:600, h:600, top:'50%',  right:'-8%', color: accent,   opacity:.30, anim:'blob2 16s ease-in-out infinite' },
        { w:500, h:500, bottom:'-5%', left:'30%', color: primary, opacity:.28, anim:'blob3 24s ease-in-out infinite' },
      ].map((b, i) => (
        <div key={i} style={{
          position:'absolute',
          width: b.w, height: b.h,
          top: b.top, left: b.left, right: b.right, bottom: b.bottom,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${b.color}${Math.round(b.opacity*255).toString(16).padStart(2,'0')}, transparent 70%)`,
          filter: 'blur(2px)',
          animation: b.anim,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* ── Grille décorative ──────────────────────────────────────────── */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)',
        backgroundSize:'32px 32px',
      }}/>

      {/* ════════════════════════════════════════════
          CARTE CENTRALE
      ════════════════════════════════════════════ */}
      <div
        className="lg-card lg-scroll"
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 440,
          background: '#ffffff',
          borderRadius: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,.45), 0 8px 24px rgba(0,0,0,.25)',
          border: '1px solid rgba(255,255,255,.12)',
          overflow: 'hidden',
        }}
      >

        {/* ── Bande décorative haute ─────────────────────────────────── */}
        <div style={{
          height: 6,
          background: `linear-gradient(90deg, ${primary} 0%, ${accent} 50%, ${primary} 100%)`,
          backgroundSize: '200% auto',
          animation: 'shimmer 4s linear infinite',
        }}/>

        <div style={{ padding:'36px 36px 32px' }}>

          {/* ── Logo & titre ─────────────────────────────────────────── */}
          <div style={{ textAlign:'center', marginBottom:28 }}>

            {/* Cercle logo avec glow */}
            <div style={{ position:'relative', display:'inline-block', marginBottom:20 }}>
              <div style={{
                width:72, height:72, borderRadius:'50%',
                background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`,
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto',
                boxShadow:`0 0 0 8px ${primary}14, 0 8px 28px ${primary}4d`,
                position:'relative', zIndex:1,
              }}>
                {/* Croix médicale */}
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="13" y="6"  width="6" height="20" rx="2" fill="white" opacity=".95"/>
                  <rect x="6"  y="13" width="20" height="6"  rx="2" fill="white" opacity=".95"/>
                </svg>
              </div>
              {/* Anneau tournant */}
              <div style={{
                position:'absolute', inset:-5,
                borderRadius:'50%',
                border:'2.5px solid transparent',
                borderTopColor: accent,
                borderRightColor: `${accent}59`,
                animation:'spin 3s linear infinite',
              }}/>
              {/* Badge accent */}
              <div style={{
                position:'absolute', bottom:2, right:2,
                width:20, height:20, borderRadius:'50%',
                background: accent,
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'2px solid #fff',
                boxShadow:`0 2px 6px ${accent}66`,
                animation:'badgePop .5s .4s cubic-bezier(.16,1,.3,1) both',
              }}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="white">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Nom de la plateforme */}
            <h1 style={{
              fontSize:26, fontWeight:800, letterSpacing:'-.5px',
              color:'#0f172a', lineHeight:1.15, marginBottom:6,
            }}>
              <span style={{
                background: `linear-gradient(135deg, ${accent}, ${primary})`,
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>
                {prefs.app_name}
              </span>
            </h1>
            <p style={{ fontSize:13, color:'#6b7280', fontWeight:400, letterSpacing:'.01em' }}>
              {prefs.app_slogan || 'Connectez-vous à votre espace de soins'}
            </p>
          </div>

          {/* ── Message d'erreur ──────────────────────────────────────── */}
          {error && (
            <div style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'11px 14px',
              background:'#fef2f2', border:'1px solid #fecaca',
              borderRadius:12, marginBottom:20,
              fontSize:13, color:'#b91c1c', fontWeight:500,
              animation:'rowIn .3s ease both',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ── Formulaire ───────────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="row-anim" style={{ marginBottom:14, animationDelay:'.08s' }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:7, letterSpacing:'.03em' }}>
                Adresse email
              </label>
              <div style={{ position:'relative' }}>
                <span style={{
                  position:'absolute', left:15, top:'50%', transform:'translateY(-50%)',
                  pointerEvents:'none', display:'flex', alignItems:'center',
                  transition:'opacity .2s', opacity: focus==='email' ? 1 : .4,
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={focus==='email' ? accent : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  ref={emailRef}
                  className="lg-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocus('email')}
                  onBlur={() => setFocus(null)}
                  disabled={loading}
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="row-anim" style={{ marginBottom:22, animationDelay:'.14s' }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:7, letterSpacing:'.03em' }}>
                Mot de passe
              </label>
              <div style={{ position:'relative' }}>
                <span style={{
                  position:'absolute', left:15, top:'50%', transform:'translateY(-50%)',
                  pointerEvents:'none', display:'flex', alignItems:'center',
                  transition:'opacity .2s', opacity: focus==='pwd' ? 1 : .4,
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={focus==='pwd' ? accent : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  className="lg-input"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocus('pwd')}
                  onBlur={() => setFocus(null)}
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight:46 }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(p => !p)}
                  style={{
                    position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', padding:4,
                    color:'#9ca3af', display:'flex', alignItems:'center',
                    transition:'color .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = accent}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >
                  {showPwd ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <div className="row-anim" style={{ animationDelay:'.20s' }}>
              <button type="submit" className="lg-btn" disabled={loading || !email || !password}>
                {loading ? (
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, position:'relative', zIndex:1 }}>
                    <span style={{
                      width:18, height:18, borderRadius:'50%',
                      border:'2.5px solid rgba(255,255,255,.35)',
                      borderTopColor:'#fff', display:'inline-block',
                      animation:'spin .75s linear infinite', flexShrink:0,
                    }}/>
                    Connexion en cours…
                  </span>
                ) : (
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, position:'relative', zIndex:1 }}>
                    Se connecter
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* ── Pied de carte ─────────────────────────────────────────── */}
        <div style={{
          padding:'14px 36px',
          background:'#f9fafb',
          borderTop:'1px solid #f3f4f6',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <span style={{ fontSize:11, color:'#d1d5db' }}>
            © {new Date().getFullYear()} {prefs.app_name}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/>
            <span style={{ fontSize:11, color:'#9ca3af', fontWeight:500 }}>Système opérationnel</span>
          </div>
        </div>
      </div>
    </div>
  )
}
