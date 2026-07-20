import { useState, useEffect, useCallback } from 'react'
import { colors, radius, shadows } from '../../theme'
import { rolePermissionApi } from '../../api'

// ── Helpers visuels ────────────────────────────────────────────────────────────
function Badge({ children, variant = 'default' }) {
  const MAP = {
    success: { bg: colors.successBg, color: colors.success },
    danger:  { bg: colors.dangerBg,  color: colors.danger  },
    warning: { bg: colors.warningBg, color: colors.warning },
    info:    { bg: colors.infoBg,    color: colors.info    },
    default: { bg: colors.gray100,   color: colors.gray700 },
    bleu:    { bg: `var(--app-primary-15, #002f5915)`, color: colors.bleu },
  }
  const s = MAP[variant] || MAP.default
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: radius.full,
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {children}
    </span>
  )
}

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      title={enabled ? 'Désactiver' : 'Activer'}
      style={{
        position: 'relative', width: 42, height: 24,
        borderRadius: 12, border: 'none', cursor: 'pointer',
        background: enabled ? 'var(--app-accent, #ff7631)' : colors.gray300,
        transition: 'background 0.2s', outline: 'none', flexShrink: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${enabled ? 'var(--app-accent-30,#ff763130)' : 'rgba(0,0,0,0.08)'}`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <span style={{
        position: 'absolute', top: 2, left: enabled ? 'calc(100% - 22px)' : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

// ── Module Item (une permission dans la liste) ──────────────────────────────────
function ModuleItem({ perm, enabled, onToggle, onEdit, onDelete }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: radius.md,
        background: enabled ? '#fff' : '#f8fafc',
        border: `1.5px solid ${enabled ? 'var(--app-accent-30,#ff763130)' : colors.gray200}`,
        transition: 'all 0.15s',
        boxShadow: enabled && hover ? '0 2px 8px rgba(0,0,0,0.07)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <ToggleSwitch enabled={enabled} onChange={onToggle} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 13,
            color: enabled ? colors.gray800 : colors.gray500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {perm.label}
          </div>
          <div style={{ fontSize: 10, color: colors.gray400, marginTop: 1 }}>clé : {perm.key}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0, opacity: hover ? 1 : 0, transition: 'opacity 0.15s' }}>
        <button onClick={onEdit}
          title="Modifier cette fonctionnalité"
          style={{
            padding: '4px 8px', borderRadius: 6, border: `1px solid var(--app-primary-30,#002f5930)`,
            background: `var(--app-primary-08,#002f5908)`, color: colors.bleu,
            fontSize: 11, cursor: 'pointer',
          }}>✏️</button>
        <button onClick={onDelete}
          title="Supprimer cette fonctionnalité"
          style={{
            padding: '4px 8px', borderRadius: 6, border: `1px solid ${colors.danger}30`,
            background: `${colors.danger}08`, color: colors.danger,
            fontSize: 11, cursor: 'pointer',
          }}>🗑</button>
      </div>
    </div>
  )
}

// ── Modal création/édition d'une fonctionnalité (permission) ───────────────────
function PermissionModal({ perm, groups, onClose, onSave }) {
  const [form, setForm] = useState({
    label:       perm?.label       || '',
    key:         perm?.key         || '',
    group_label: perm?.group_label || (groups[0] || ''),
    newGroup:    '',
    useNewGroup: false,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const ch = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.label.trim()) return setError('Le libellé est obligatoire.')
    if (!form.key.trim())   return setError('La clé technique est obligatoire.')
    const group = form.useNewGroup ? form.newGroup.trim() : form.group_label
    if (!group) return setError('Choisissez ou créez un groupe.')
    setSaving(true)
    setError('')
    try {
      await onSave({ label: form.label.trim(), key: form.key.trim(), group_label: group })
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde.')
    } finally { setSaving(false) }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, zIndex: 2500,
      background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: 460,
        boxShadow: shadows.xl, overflow: 'hidden',
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
          padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>
            {perm ? '✏️ Modifier la fonctionnalité' : '➕ Nouvelle fonctionnalité'}
          </span>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: `${colors.danger}10`, border: `1px solid ${colors.danger}30`,
              color: colors.danger, fontSize: 12, fontWeight: 600,
            }}>⚠️ {error}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Libellé affiché *
              </label>
              <input value={form.label} onChange={e => ch('label', e.target.value)}
                placeholder="Ex : Gestion des rendez-vous"
                style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${colors.gray300}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Clé technique * <span style={{ fontWeight: 400, color: colors.gray400 }}>(minuscules, underscores)</span>
              </label>
              <input value={form.key}
                onChange={e => ch('key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="ex : gestion_rdv"
                disabled={!!perm}
                style={{
                  width: '100%', padding: '9px 12px', boxSizing: 'border-box',
                  border: `1.5px solid ${colors.gray300}`, borderRadius: 8, fontSize: 13,
                  fontFamily: 'monospace', background: perm ? colors.gray50 : '#fff',
                }} />
              {perm && <div style={{ fontSize: 10, color: colors.gray400, marginTop: 4 }}>La clé ne peut pas être modifiée</div>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Groupe / Module parent *
              </label>
              {!form.useNewGroup ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={form.group_label} onChange={e => ch('group_label', e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', border: `1.5px solid ${colors.gray300}`, borderRadius: 8, fontSize: 13 }}>
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <button type="button" onClick={() => ch('useNewGroup', true)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid var(--app-primary-40,#002f5940)`, background: `var(--app-primary-08,#002f5908)`, color: colors.bleu, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    + Nouveau groupe
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.newGroup} onChange={e => ch('newGroup', e.target.value)}
                    placeholder="Nom du nouveau groupe"
                    autoFocus
                    style={{ flex: 1, padding: '9px 12px', border: `1.5px solid var(--app-accent,#ff7631)`, borderRadius: 8, fontSize: 13 }} />
                  <button type="button" onClick={() => ch('useNewGroup', false)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${colors.gray300}`, background: '#fff', color: colors.gray600, fontSize: 12, cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px', borderRadius: 8,
              border: `1.5px solid ${colors.gray300}`, background: '#fff',
              color: colors.gray600, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Annuler</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '10px', borderRadius: 8, border: 'none',
              background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Enregistrement...' : (perm ? 'Mettre à jour' : 'Créer la fonctionnalité')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Formulaire Rôle ───────────────────────────────────────────────────────
function RoleModal({ role, allPermissions, onClose, onSave }) {
  const [form, setForm] = useState({
    name:           role?.name        || '',
    key:            role?.key         || '',
    icon:           role?.icon        || '',
    color:          role?.color       || '',
    description:    role?.description || '',
    permission_ids: role?.permissions?.map(p => p.id) || [],
  })
  const [saving, setSaving] = useState(false)

  const ch = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const togglePerm = (id) => setForm(p => ({
    ...p,
    permission_ids: p.permission_ids.includes(id)
      ? p.permission_ids.filter(x => x !== id)
      : [...p.permission_ids, id],
  }))

  const permsByGroup = {}
  allPermissions.forEach(p => {
    if (!permsByGroup[p.group_label]) permsByGroup[p.group_label] = []
    permsByGroup[p.group_label].push(p)
  })

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.key.trim()) return alert('Nom et clé obligatoires.')
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: radius.lg,
        width: '90%', maxWidth: 700, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: shadows.xl, overflow: 'hidden',
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
          padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 800 }}>
            {role ? 'Modifier le profil' : 'Nouveau profil'}
          </h3>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>Nom du profil *</label>
              <input value={form.name} onChange={e => ch('name', e.target.value)}
                style={{ width: '100%', padding: 10, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, fontSize: 13, boxSizing: 'border-box' }}
                placeholder="Ex: Médecin" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>Clé technique *</label>
              <input value={form.key}
                onChange={e => ch('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                style={{ width: '100%', padding: 10, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, fontSize: 13, boxSizing: 'border-box', background: role?.is_system ? colors.gray50 : '#fff' }}
                placeholder="ex: medecin"
                disabled={!!role?.is_system} />
              {role?.is_system && <div style={{ fontSize: 10, color: colors.danger, marginTop: 4 }}>La clé système ne peut être modifiée</div>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>Icône</label>
              <input value={form.icon} onChange={e => ch('icon', e.target.value)}
                style={{ width: '100%', padding: 10, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, fontSize: 13, boxSizing: 'border-box' }}
                placeholder="Ex: 👨‍⚕️" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>Couleur</label>
              <input type="color" value={form.color || '#2196f3'} onChange={e => ch('color', e.target.value)}
                style={{ width: '100%', height: 38, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, cursor: 'pointer' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => ch('description', e.target.value)}
                style={{ width: '100%', padding: 10, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, fontSize: 13, minHeight: 60, boxSizing: 'border-box' }}
                placeholder="Description optionnelle..." />
            </div>
          </div>

          <h4 style={{ margin: '0 0 16px 0', fontSize: 14, color: colors.gray800 }}>Modules autorisés</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(permsByGroup).map(([groupName, perms]) => (
              <div key={groupName}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${colors.gray100}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>📁</span>
                    <span style={{ fontWeight: 800, fontSize: 12, color: colors.bleu, textTransform: 'uppercase' }}>{groupName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button"
                      onClick={() => setForm(p => ({ ...p, permission_ids: [...new Set([...p.permission_ids, ...perms.map(x => x.id)])] }))}
                      style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: `1px solid ${colors.gray300}`, background: '#fff', cursor: 'pointer', color: colors.gray600 }}>
                      Tout cocher
                    </button>
                    <button type="button"
                      onClick={() => setForm(p => ({ ...p, permission_ids: p.permission_ids.filter(id => !perms.map(x => x.id).includes(id)) }))}
                      style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: `1px solid ${colors.gray300}`, background: '#fff', cursor: 'pointer', color: colors.gray600 }}>
                      Tout décocher
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {perms.map(p => (
                    <label key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', background: form.permission_ids.includes(p.id) ? `var(--app-accent-08,#ff763108)` : '#f9fafb',
                      borderRadius: radius.sm, border: `1px solid ${form.permission_ids.includes(p.id) ? 'var(--app-accent-30,#ff763130)' : colors.gray200}`,
                      cursor: 'pointer', fontSize: 12, color: colors.gray700,
                    }}>
                      <input type="checkbox" checked={form.permission_ids.includes(p.id)} onChange={() => togglePerm(p.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--app-accent,#ff7631)' }} />
                      <span style={{ fontWeight: 500 }}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.gray200}`, display: 'flex', justifyContent: 'flex-end', gap: 10, background: colors.gray50 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: radius.sm, border: `1px solid ${colors.gray300}`, background: '#fff', color: colors.gray700, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '8px 20px', borderRadius: radius.sm, border: 'none', background: colors.orange, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Enregistrement...' : (role ? 'Mettre à jour' : 'Créer le profil')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ──────────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: radius.lg, width: 400, padding: 24, boxShadow: shadows.xl }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: colors.gray900 }}>{title}</h3>
        <p style={{ margin: '0 0 24px 0', fontSize: 13, color: colors.gray600, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: radius.sm, border: `1px solid ${colors.gray300}`, background: '#fff', color: colors.gray700, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: radius.sm, border: 'none', background: danger ? colors.danger : colors.orange, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

// ── Toast inline ───────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const bg = type === 'success' ? `${colors.success}15` : `${colors.danger}15`
  const cl = type === 'success' ? colors.success : colors.danger
  const bd = type === 'success' ? `${colors.success}40` : `${colors.danger}40`
  return (
    <div style={{ padding: '12px 16px', background: bg, border: `1px solid ${bd}`, borderRadius: radius.md, color: cl, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: cl, fontSize: 14 }}>×</button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProfilDroitsPage() {
  const [roles, setRoles]                     = useState([])
  const [permissionsGrouped, setPermissionsGrouped] = useState({})
  const [activeRoleId, setActiveRoleId]       = useState(null)
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)
  const [toast, setToast]                     = useState(null)

  // Modals rôle
  const [roleModalOpen, setRoleModalOpen]     = useState(false)
  const [editingRole, setEditingRole]         = useState(null)
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState(null)

  // Modals permission
  const [permModal, setPermModal]             = useState(false)
  const [editingPerm, setEditingPerm]         = useState(null)
  const [deletePermConfirm, setDeletePermConfirm] = useState(null)

  // Filtre de recherche des fonctionnalités
  const [search, setSearch]                   = useState('')

  const notify = (msg, type = 'success') => setToast({ msg, type })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rolePermissionApi.roles(),
        rolePermissionApi.permissions(),
      ])
      if (rolesRes.data.success)  setRoles(rolesRes.data.data)
      if (permsRes.data.success)  setPermissionsGrouped(permsRes.data.data)
    } catch {
      notify('Erreur lors du chargement des données', 'error')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!activeRoleId && roles.length > 0) setActiveRoleId(roles[0].id)
  }, [roles, activeRoleId])

  const activeRole = roles.find(r => r.id === activeRoleId)
  const allPermissionsFlat = Object.values(permissionsGrouped).flat()
  const groups = Object.keys(permissionsGrouped)

  // ── Toggle permission pour le rôle actif ──────────────────────────────────
  const handleToggle = (permId) => {
    setRoles(prev => prev.map(role => {
      if (role.id !== activeRoleId) return role
      const current = role.permissions.map(p => p.id)
      const next = current.includes(permId)
        ? current.filter(id => id !== permId)
        : [...current, permId]
      return { ...role, permissions: next.map(id => ({ id })) }
    }))
  }

  // ── Tout cocher/décocher un groupe ─────────────────────────────────────────
  const toggleGroup = (perms, checkAll) => {
    setRoles(prev => prev.map(role => {
      if (role.id !== activeRoleId) return role
      const current = new Set(role.permissions.map(p => p.id))
      if (checkAll) perms.forEach(p => current.add(p.id))
      else          perms.forEach(p => current.delete(p.id))
      return { ...role, permissions: [...current].map(id => ({ id })) }
    }))
  }

  // ── Enregistrer les permissions du rôle actif ──────────────────────────────
  const handleSavePermissions = async () => {
    if (!activeRole) return
    setSaving(true)
    try {
      const permIds = activeRole.permissions.map(p => p.id)
      await rolePermissionApi.syncPermissions(activeRole.id, { permission_ids: permIds })
      notify('Permissions mises à jour avec succès')
    } catch { notify('Erreur sauvegarde', 'error') }
    finally  { setSaving(false) }
  }

  // ── Sauvegarder un rôle ────────────────────────────────────────────────────
  const handleSaveRole = async (formData) => {
    if (editingRole) {
      await rolePermissionApi.modifierRole(editingRole.id, formData)
      notify('Profil mis à jour')
    } else {
      await rolePermissionApi.creerRole({ ...formData, is_system: false })
      notify('Profil créé')
    }
    setRoleModalOpen(false)
    await loadData()
  }

  const handleDeleteRole = async () => {
    if (!deleteRoleConfirm) return
    setSaving(true)
    try {
      await rolePermissionApi.supprimerRole(deleteRoleConfirm.id)
      notify('Profil supprimé')
      setDeleteRoleConfirm(null)
      if (activeRoleId === deleteRoleConfirm.id) setActiveRoleId(null)
      await loadData()
    } catch { notify('Erreur suppression profil', 'error') }
    finally  { setSaving(false) }
  }

  // ── Sauvegarder une permission ─────────────────────────────────────────────
  const handleSavePerm = async (formData) => {
    if (editingPerm) {
      await rolePermissionApi.modifierPermission(editingPerm.id, formData)
      notify('Fonctionnalité mise à jour')
    } else {
      await rolePermissionApi.creerPermission(formData)
      notify('Fonctionnalité créée')
    }
    setPermModal(false)
    setEditingPerm(null)
    await loadData()
  }

  const handleDeletePerm = async () => {
    if (!deletePermConfirm) return
    try {
      await rolePermissionApi.supprimerPermission(deletePermConfirm.id)
      notify('Fonctionnalité supprimée')
      setDeletePermConfirm(null)
      await loadData()
    } catch { notify('Erreur suppression fonctionnalité', 'error') }
  }

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>Chargement...</div>
  }

  // Filtrer les permissions par recherche
  const filteredGrouped = {}
  Object.entries(permissionsGrouped).forEach(([g, perms]) => {
    const f = perms.filter(p =>
      !search || p.label.toLowerCase().includes(search.toLowerCase()) || p.key.toLowerCase().includes(search.toLowerCase())
    )
    if (f.length > 0) filteredGrouped[g] = f
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
        borderRadius: radius.lg, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: shadows.md, flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: radius.md, background: colors.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: `0 4px 12px var(--app-accent-50,#ff763150)` }}>👥</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>Profils et Droits</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 3 }}>
              {roles.length} profil{roles.length > 1 ? 's' : ''} · {allPermissionsFlat.length} fonctionnalité{allPermissionsFlat.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { setEditingPerm(null); setPermModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: radius.sm, border: `1px solid rgba(255,255,255,0.4)`, background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ⚙️ Ajouter une fonctionnalité
          </button>
          <button onClick={() => { setEditingRole(null); setRoleModalOpen(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: radius.sm, border: `1px solid ${colors.gray400}`, background: '#fff', color: colors.gray700, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            ＋ Nouveau profil
          </button>
          <button onClick={handleSavePermissions} disabled={saving || !activeRole}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: radius.sm, border: 'none', background: colors.orange, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: (saving || !activeRole) ? 0.6 : 1, boxShadow: `0 3px 10px var(--app-accent-40,#ff763140)` }}>
            💾 Enregistrer
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Onglets profils ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: colors.bleu, borderRadius: radius.lg, padding: '12px 16px', boxShadow: shadows.md }}>
        {roles.map(role => {
          const active = activeRoleId === role.id
          const count  = role.permissions?.length || 0
          return (
            <button key={role.id} onClick={() => setActiveRoleId(role.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 16px', borderRadius: radius.sm,
                border: active ? `1.5px solid ${role.color || colors.orange}` : '1.5px solid transparent',
                background: active ? `${(role.color || colors.orange)}18` : 'rgba(255,255,255,0.1)',
                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                fontSize: 12, fontWeight: active ? 700 : 600,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                boxShadow: active ? `0 2px 8px ${(role.color || colors.orange)}25` : 'none',
              }}>
              <span style={{ fontSize: 14 }}>{role.icon || '👤'}</span>
              <span>{role.name}</span>
              <span style={{ padding: '1px 7px', borderRadius: radius.full, fontSize: 9, fontWeight: 700, background: active ? (role.color || colors.orange) : 'rgba(255,255,255,0.2)', color: '#fff' }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Contenu principal ── */}
      {activeRole ? (
        <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`, overflow: 'hidden' }}>

          {/* En-tête du profil actif */}
          <div style={{
            padding: '16px 24px', borderBottom: `1px solid ${colors.gray100}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: radius.md, background: `linear-gradient(135deg, ${colors.bleu}, #003f7a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{activeRole.icon || '👤'}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: colors.gray900 }}>{activeRole.name}</div>
                <div style={{ fontSize: 11, color: colors.gray500, marginTop: 1 }}>
                  <strong style={{ color: colors.bleu }}>{activeRole.permissions?.length || 0}</strong> / {allPermissionsFlat.length} fonctionnalités activées
                </div>
              </div>
              {activeRole.is_system && <Badge variant="info">Rôle système</Badge>}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Barre de recherche */}
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une fonctionnalité..."
                style={{ padding: '7px 12px', border: `1.5px solid ${colors.gray200}`, borderRadius: 8, fontSize: 12, width: 220, outline: 'none' }}
              />
              {!activeRole.is_system && (
                <>
                  <button onClick={() => { setEditingRole(activeRole); setRoleModalOpen(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: radius.sm, border: `1px solid var(--app-primary-40,#002f5940)`, background: `var(--app-primary-08,#002f5908)`, color: colors.bleu, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    ✏️ Modifier le profil
                  </button>
                  <button onClick={() => setDeleteRoleConfirm(activeRole)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: radius.sm, border: `1px solid ${colors.danger}40`, background: `${colors.danger}08`, color: colors.danger, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    🗑 Supprimer
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: `var(--app-primary-08,#002f5908)`, borderRadius: radius.md, border: `1px solid var(--app-primary-20,#002f5920)`, fontSize: 12, color: colors.gray700, lineHeight: 1.5 }}>
            <strong style={{ color: colors.bleu }}>ℹ️</strong> Activez ou désactivez les fonctionnalités pour le profil <strong>{activeRole.name}</strong>. Cliquez sur <strong>Enregistrer</strong> pour appliquer les changements.
          </div>

          {/* Liste des groupes + permissions */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Object.entries(filteredGrouped).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.gray400 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                Aucune fonctionnalité trouvée pour « {search} »
              </div>
            ) : (
              Object.entries(filteredGrouped).map(([groupName, perms]) => {
                const activeCount = perms.filter(p => activeRole.permissions?.some(rp => rp.id === p.id)).length
                const allChecked  = activeCount === perms.length
                return (
                  <div key={groupName}>
                    {/* En-tête du groupe */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${colors.gray100}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>📁</span>
                        <span style={{ fontWeight: 800, fontSize: 13, color: colors.bleu, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{groupName}</span>
                        <span style={{ padding: '2px 8px', borderRadius: radius.full, background: `var(--app-primary-12,#002f5912)`, color: colors.bleu, fontSize: 10, fontWeight: 700 }}>
                          {activeCount}/{perms.length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={() => toggleGroup(perms, true)}
                          disabled={allChecked}
                          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: `1px solid var(--app-accent-40,#ff763140)`, background: allChecked ? colors.gray50 : `var(--app-accent-08,#ff763108)`, color: allChecked ? colors.gray400 : colors.orange, cursor: allChecked ? 'default' : 'pointer', fontWeight: 600 }}>
                          Tout activer
                        </button>
                        <button type="button" onClick={() => toggleGroup(perms, false)}
                          disabled={activeCount === 0}
                          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: `1px solid ${colors.gray300}`, background: activeCount === 0 ? colors.gray50 : '#fff', color: activeCount === 0 ? colors.gray400 : colors.gray600, cursor: activeCount === 0 ? 'default' : 'pointer', fontWeight: 600 }}>
                          Tout désactiver
                        </button>
                      </div>
                    </div>

                    {/* Grille des permissions */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                      {perms.map(perm => (
                        <ModuleItem
                          key={perm.id}
                          perm={perm}
                          enabled={activeRole.permissions?.some(p => p.id === perm.id)}
                          onToggle={() => handleToggle(perm.id)}
                          onEdit={() => { setEditingPerm(perm); setPermModal(true) }}
                          onDelete={() => setDeletePermConfirm(perm)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, padding: 48, textAlign: 'center', color: colors.gray500 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p>Sélectionnez un profil ou créez-en un nouveau.</p>
        </div>
      )}

      {/* ── Modals ── */}
      {roleModalOpen && (
        <RoleModal
          role={editingRole}
          allPermissions={allPermissionsFlat}
          onClose={() => { setRoleModalOpen(false); setEditingRole(null) }}
          onSave={handleSaveRole}
        />
      )}

      {permModal && (
        <PermissionModal
          perm={editingPerm}
          groups={groups}
          onClose={() => { setPermModal(false); setEditingPerm(null) }}
          onSave={handleSavePerm}
        />
      )}

      {deleteRoleConfirm && (
        <ConfirmDialog
          title="Supprimer le profil"
          message={`Supprimer le profil "${deleteRoleConfirm.name}" ? Cette action est irréversible.`}
          onConfirm={handleDeleteRole}
          onCancel={() => setDeleteRoleConfirm(null)}
        />
      )}

      {deletePermConfirm && (
        <ConfirmDialog
          title="Supprimer la fonctionnalité"
          message={`Supprimer la fonctionnalité "${deletePermConfirm.label}" ? Elle sera retirée de tous les profils.`}
          onConfirm={handleDeletePerm}
          onCancel={() => setDeletePermConfirm(null)}
        />
      )}

    </div>
  )
}
