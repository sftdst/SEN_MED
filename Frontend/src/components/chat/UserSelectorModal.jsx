import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { colors, shadows } from '../../theme'

// ── Rôle config ──────────────────────────────────────────────────────────────
const ROLES = {
  medecin:          { label: 'Médecin',          bg: '#e3f2fd', color: '#1565c0', icon: '🩺' },
  infirmier:        { label: 'Infirmier(e)',      bg: '#e8f5e9', color: '#2e7d32', icon: '💉' },
  sage_femme:       { label: 'Sage-femme',        bg: '#fce4ec', color: '#ad1457', icon: '👶' },
  pharmacien:       { label: 'Pharmacien(ne)',    bg: '#e0f2f1', color: '#00695c', icon: '💊' },
  technicien:       { label: 'Technicien(ne)',    bg: '#ede7f6', color: '#6a1b9a', icon: '🔬' },
  kinesitherapeute: { label: 'Kinésithérapeute', bg: '#fff3e0', color: '#e65100', icon: '🦴' },
  administratif:    { label: 'Administratif',    bg: '#fff8e1', color: '#f57c00', icon: '📋' },
  secretaire:       { label: 'Secrétaire',        bg: '#fff8e1', color: '#f57c00', icon: '🗂️' },
  autre:            { label: 'Autre',             bg: '#f5f5f5', color: '#616161', icon: '👤' },
}

function getRoleInfo(type = '') {
  return ROLES[type?.toLowerCase()] || ROLES.autre
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name = '', photo, size = 36, fontSize, role }) {
  const initials = (() => {
    const parts = (name || '').trim().split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return (name || '').substring(0, 2).toUpperCase()
  })()
  const fs  = fontSize || Math.round(size * 0.38)
  const bg  = role ? getRoleInfo(role).color : stringColor(name)

  if (photo) {
    return (
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={photo.startsWith('http') ? photo : `${import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/storage'}/${photo}`}
          alt={name}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
        />
        <div style={{
          display: 'none', width: size, height: size, borderRadius: '50%',
          background: bg, color: '#fff', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: fs, userSelect: 'none',
          position: 'absolute', top: 0, left: 0,
        }}>{initials}</div>
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: fs, flexShrink: 0, userSelect: 'none',
    }}>
      {initials}
    </div>
  )
}

function stringColor(str = '') {
  const palette = ['#1565c0','#2e7d32','#c62828','#f57c00','#6a1b9a','#00838f','#ad1457','#558b2f']
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

// ── UserSelectorModal ─────────────────────────────────────────────────────────
export default function UserSelectorModal({ onSelect }) {
  const [users,   setUsers]   = useState([])
  const [q,       setQ]       = useState('')
  const [filter,  setFilter]  = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/chat/users')
      .then(r => { setUsers(r.data.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const roleGroups = [...new Set(users.map(u => u.staff_type).filter(Boolean))]

  const filtered = users.filter(u => {
    const matchQ = !q ||
      u.display_name?.toLowerCase().includes(q.toLowerCase()) ||
      u.specialization?.toLowerCase().includes(q.toLowerCase())
    const matchRole = filter === 'all' || u.staff_type === filter
    return matchQ && matchRole
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,20,60,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16,
    }}>
      <div style={{
        background: colors.white, borderRadius: 20,
        width: '100%', maxWidth: 520, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #1a4a80 100%)`,
          padding: '28px 24px 22px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 12px',
          }}>💬</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
            Qui êtes-vous ?
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
            Sélectionnez votre profil pour accéder à la messagerie
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{ padding: '16px 20px 8px', borderBottom: `1px solid ${colors.gray100}` }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: colors.gray400, fontSize: 15, pointerEvents: 'none',
            }}>🔍</span>
            <input
              autoFocus
              placeholder="Rechercher par nom ou spécialité…"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                borderRadius: 10, border: `1.5px solid ${colors.gray200}`,
                fontSize: 13, outline: 'none', boxSizing: 'border-box',
                background: colors.gray50,
                transition: 'border-color 0.15s',
              }}
              onFocus={e  => e.target.style.borderColor = colors.bleu}
              onBlur={e => e.target.style.borderColor = colors.gray200}
            />
          </div>
        </div>

        {/* ── Filtre par rôle ── */}
        {roleGroups.length > 1 && (
          <div style={{
            padding: '8px 20px', display: 'flex', gap: 6,
            overflowX: 'auto', borderBottom: `1px solid ${colors.gray100}`,
            scrollbarWidth: 'none',
          }}>
            <RoleChip label="Tous" active={filter === 'all'} onClick={() => setFilter('all')} />
            {roleGroups.map(r => (
              <RoleChip
                key={r}
                label={getRoleInfo(r).label}
                icon={getRoleInfo(r).icon}
                color={getRoleInfo(r).color}
                active={filter === r}
                onClick={() => setFilter(r)}
              />
            ))}
          </div>
        )}

        {/* ── Liste ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 12px' }}>
          {loading && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
              <div style={{ color: colors.gray400, fontSize: 13 }}>Chargement du personnel…</div>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <div style={{ color: colors.gray500, fontSize: 13 }}>Aucun résultat pour « {q} »</div>
            </div>
          )}

          {!loading && filtered.map(u => {
            const role = getRoleInfo(u.staff_type)
            return (
              <button
                key={u.id}
                onClick={() => onSelect(u)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '11px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', borderRadius: 12,
                  transition: 'background 0.12s',
                  marginBottom: 2,
                }}
                onMouseEnter={e => e.currentTarget.style.background = colors.gray50}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Avatar name={u.display_name} photo={u.photo_url} size={44} role={u.staff_type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray900, marginBottom: 3 }}>
                    {u.display_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      background: role.bg, color: role.color,
                      borderRadius: 6, padding: '2px 8px',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {role.icon} {role.label}
                    </span>
                    {u.specialization && (
                      <span style={{ fontSize: 12, color: colors.gray500 }}>· {u.specialization}</span>
                    )}
                  </div>
                </div>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: colors.bleu, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0,
                }}>→</div>
              </button>
            )
          })}
        </div>

        {/* ── Count ── */}
        {!loading && (
          <div style={{
            padding: '10px 20px', borderTop: `1px solid ${colors.gray100}`,
            textAlign: 'center', fontSize: 11, color: colors.gray400,
          }}>
            {filtered.length} membre{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

function RoleChip({ label, icon, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 20,
        border: active ? `1.5px solid ${color || colors.bleu}` : `1.5px solid ${colors.gray200}`,
        background: active ? (color ? `${color}15` : colors.infoBg) : colors.white,
        color: active ? (color || colors.bleu) : colors.gray600,
        fontSize: 12, fontWeight: active ? 700 : 500,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all 0.12s',
      }}
    >
      {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
      {label}
    </button>
  )
}
