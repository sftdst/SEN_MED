import { useState, useEffect, useRef } from 'react'
import api from '../../api/axios'
import { colors, shadows } from '../../theme'
import { Avatar } from './UserSelectorModal'

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
const getRoleInfo = t => ROLES[t?.toLowerCase()] || ROLES.autre

export default function NewConversationModal({ currentUser, onClose, onCreated }) {
  const [users,    setUsers]    = useState([])
  const [q,        setQ]        = useState('')
  const [selected, setSelected] = useState([])
  const [groupName, setGroupName] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [creating, setCreating] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    api.get('/chat/users')
      .then(r => { setUsers(r.data.data || []); setLoading(false) })
      .catch(() => setLoading(false))
    setTimeout(() => searchRef.current?.focus(), 100)
  }, [])

  const others = users.filter(u => u.id !== currentUser.id)
  const filtered = q
    ? others.filter(u =>
        u.display_name?.toLowerCase().includes(q.toLowerCase()) ||
        u.specialization?.toLowerCase().includes(q.toLowerCase()) ||
        getRoleInfo(u.staff_type).label.toLowerCase().includes(q.toLowerCase())
      )
    : others

  const toggle = u =>
    setSelected(prev => prev.find(x => x.id === u.id) ? prev.filter(x => x.id !== u.id) : [...prev, u])

  const create = async () => {
    if (!selected.length) return
    setCreating(true)
    try {
      const type = selected.length === 1 ? 'direct' : 'groupe'
      const { data } = await api.post('/chat/conversations', {
        staff_id: currentUser.id,
        type,
        nom: type === 'groupe' ? (groupName.trim() || selected.map(u => u.display_name).join(', ')) : null,
        participant_ids: selected.map(u => u.id),
      })
      onCreated(data.data)
    } catch { setCreating(false) }
  }

  const isGroup = selected.length > 1

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,20,60,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2100, padding: 16,
    }}>
      <div style={{
        background: colors.white, borderRadius: 20,
        width: '100%', maxWidth: 480, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: `1px solid ${colors.gray100}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.bleu}, #1a4a80)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>{isGroup ? '👥' : '💬'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: colors.bleu }}>
              {isGroup ? 'Créer un groupe' : 'Nouvelle conversation'}
            </div>
            <div style={{ fontSize: 11, color: colors.gray500 }}>
              {isGroup ? `${selected.length} participant${selected.length > 1 ? 's' : ''} sélectionné${selected.length > 1 ? 's' : ''}` : 'Choisissez un interlocuteur'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: colors.gray100, border: 'none', borderRadius: 8,
              width: 30, height: 30, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: colors.gray600,
            }}
          >✕</button>
        </div>

        {/* ── Chips sélection ── */}
        {selected.length > 0 && (
          <div style={{
            padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap',
            background: colors.gray50, borderBottom: `1px solid ${colors.gray100}`,
          }}>
            {selected.map(u => (
              <span key={u.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: colors.white,
                border: `1.5px solid ${colors.gray200}`,
                borderRadius: 20, padding: '4px 10px 4px 5px',
                fontSize: 12, fontWeight: 600, color: colors.gray700,
              }}>
                <Avatar name={u.display_name} size={20} role={u.staff_type} />
                {u.display_name.split(' ')[0]}
                <button
                  onClick={() => toggle(u)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: colors.gray400, padding: 0, lineHeight: 1, marginLeft: 1 }}
                >×</button>
              </span>
            ))}
          </div>
        )}

        {/* ── Nom du groupe ── */}
        {isGroup && (
          <div style={{ padding: '10px 16px 4px', borderBottom: `1px solid ${colors.gray100}` }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>✏️</span>
              <input
                placeholder="Nom du groupe…"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 34px',
                  borderRadius: 10, border: `1.5px solid ${colors.gray200}`,
                  fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  background: colors.gray50,
                }}
                onFocus={e  => e.target.style.borderColor = colors.bleu}
                onBlur={e => e.target.style.borderColor = colors.gray200}
              />
            </div>
          </div>
        )}

        {/* ── Recherche ── */}
        <div style={{ padding: '10px 16px 6px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: colors.gray400, fontSize: 14 }}>🔍</span>
            <input
              ref={searchRef}
              placeholder="Rechercher un membre du personnel…"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 34px',
                borderRadius: 10, border: `1.5px solid ${colors.gray200}`,
                fontSize: 13, outline: 'none', boxSizing: 'border-box',
                background: colors.gray50,
              }}
              onFocus={e  => e.target.style.borderColor = colors.bleu}
              onBlur={e => e.target.style.borderColor = colors.gray200}
            />
          </div>
        </div>

        {/* ── Liste ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px' }}>
          {loading && (
            <div style={{ padding: 32, textAlign: 'center', color: colors.gray400, fontSize: 13 }}>Chargement…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: colors.gray400, fontSize: 13 }}>
              Aucun résultat
            </div>
          )}
          {!loading && filtered.map(u => {
            const isSel = !!selected.find(x => x.id === u.id)
            const role  = getRoleInfo(u.staff_type)
            return (
              <button
                key={u.id}
                onClick={() => toggle(u)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '9px 12px',
                  background: isSel ? '#e8f0fe' : 'none',
                  border: isSel ? '1.5px solid #c5d5f5' : '1.5px solid transparent',
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  marginBottom: 2, transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = colors.gray50 }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'none' }}
              >
                <Avatar name={u.display_name} photo={u.photo_url} size={38} role={u.staff_type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: colors.gray900, marginBottom: 3 }}>
                    {u.display_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      background: role.bg, color: role.color,
                      borderRadius: 5, padding: '1px 6px', fontSize: 10, fontWeight: 700,
                    }}>
                      {role.icon} {role.label}
                    </span>
                    {u.specialization && (
                      <span style={{ fontSize: 11, color: colors.gray500 }}>· {u.specialization}</span>
                    )}
                  </div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: isSel ? colors.bleu : colors.gray200,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: isSel ? '#fff' : 'transparent',
                  transition: 'all 0.15s', flexShrink: 0,
                }}>✓</div>
              </button>
            )
          })}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${colors.gray100}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: colors.gray50,
        }}>
          <span style={{ fontSize: 12, color: colors.gray500 }}>
            {selected.length === 0 ? 'Aucune sélection' : `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: `1.5px solid ${colors.gray200}`,
                background: colors.white, cursor: 'pointer',
                fontSize: 13, color: colors.gray700, fontWeight: 600,
              }}
            >Annuler</button>
            <button
              onClick={create}
              disabled={selected.length === 0 || creating}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: selected.length === 0
                  ? colors.gray200
                  : `linear-gradient(135deg, ${colors.bleu}, #1a4a80)`,
                color: selected.length === 0 ? colors.gray400 : '#fff',
                cursor: selected.length === 0 ? 'default' : 'pointer',
                fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
              }}
            >
              {creating ? '…' : isGroup ? '👥 Créer le groupe' : '💬 Démarrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
