import { useState, useEffect, useCallback } from 'react'
import { colors, radius, shadows } from '../../theme'
import { rolePermissionApi } from '../../api'

// ── Composant Badge ────────────────────────────────────────────────────────────
function Badge({ children, variant = 'default' }) {
  const MAP = {
    success: { bg: colors.successBg, color: colors.success },
    danger:  { bg: colors.dangerBg,  color: colors.danger  },
    warning: { bg: colors.warningBg, color: colors.warning },
    info:    { bg: colors.infoBg,    color: colors.info    },
    orange:  { bg: '#fff3ee',        color: colors.orange  },
    default: { bg: colors.gray100,   color: colors.gray700 },
    bleu:    { bg: `${colors.bleu}15`,  color: colors.bleu  },
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

// ── Toggle Switch ───────────────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        position: 'relative',
        width: 42, height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        background: enabled ? colors.orange : colors.gray300,
        transition: 'background 0.2s',
        outline: 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${enabled ? `${colors.orange}40` : 'rgba(0,0,0,0.1)'}`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <span style={{
        position: 'absolute', top: 2, right: enabled ? 2 : 22,
        width: 20, height: 20,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        transition: 'all 0.2s',
      }} />
    </button>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: radius.md,
          background: `linear-gradient(135deg, ${colors.bleu}, #003f7a)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, boxShadow: `0 4px 10px ${colors.bleu}30`,
        }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: colors.gray900 }}>{title}</div>
          <div style={{ fontSize: 10, color: colors.gray500, marginTop: 1 }}>
            <strong style={{ color: colors.bleu }}>{count}</strong> module{count > 1 ? 's' : ''} activé{count > 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Module Item ─────────────────────────────────────────────────────────────────
function ModuleItem({ module, enabled, onToggle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      background: '#fff',
      borderRadius: radius.md,
      border: `1px solid ${colors.gray200}`,
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = colors.orange}
      onMouseLeave={e => e.currentTarget.style.borderColor = colors.gray200}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18 }}>📦</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: colors.gray800 }}>{module.label}</div>
          <div style={{ fontSize: 11, color: colors.gray500 }}>{module.key}</div>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onToggle} />
    </div>
  )
}

// ── Modal Formulaire Rôle ───────────────────────────────────────────────────────
function RoleModal({ role, allPermissions, onClose, onSave }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    key: role?.key || '',
    icon: role?.icon || '',
    color: role?.color || '',
    description: role?.description || '',
    is_system: role?.is_system || false,
    permission_ids: role?.permissions?.map(p => p.id) || [],
  })

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const togglePermission = (permId) => {
    setForm(prev => {
      const current = prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter(id => id !== permId)
        : [...prev.permission_ids, permId]
      return { ...prev, permission_ids: current }
    })
  }

  const handleSubmit = () => {
    onSave(form)
  }

  // Grouper les permissions pour l'affichage
  const permissionsByGroup = {}
  allPermissions.forEach(p => {
    if (!permissionsByGroup[p.group_label]) {
      permissionsByGroup[p.group_label] = []
    }
    permissionsByGroup[p.group_label].push(p)
  })

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
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
          padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 800 }}>
            {role ? 'Modifier le rôle' : 'Nouveau rôle'}
          </h3>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>

        {/* Corps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Infos de base */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Nom du rôle *
              </label>
              <input
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                style={{ width: '100%', padding: 10, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, fontSize: 13 }}
                placeholder="Ex: Médecin"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Clé technique *
              </label>
              <input
                value={form.key}
                onChange={e => handleChange('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                style={{ width: '100%', padding: 10, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, fontSize: 13 }}
                placeholder="ex: medecin"
                disabled={!!role?.is_system}
              />
              {role?.is_system && (
                <div style={{ fontSize: 10, color: colors.danger, marginTop: 4 }}>
                  La clé des rôles système ne peut être modifiée
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Icône
              </label>
              <input
                value={form.icon}
                onChange={e => handleChange('icon', e.target.value)}
                style={{ width: '100%', padding: 10, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, fontSize: 13 }}
                placeholder="Ex: 👨‍⚕️"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Couleur
              </label>
              <input
                type="color"
                value={form.color || '#2196f3'}
                onChange={e => handleChange('color', e.target.value)}
                style={{ width: '100%', height: 38, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, cursor: 'pointer' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                style={{ width: '100%', padding: 10, border: `1px solid ${colors.gray300}`, borderRadius: radius.sm, fontSize: 13, minHeight: 60 }}
                placeholder="Description optionnelle du rôle..."
              />
            </div>
          </div>

          {/* Permissions */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 14, color: colors.gray800 }}>
              Modules autorisés
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(permissionsByGroup).map(([groupName, perms]) => (
                <div key={groupName}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 10, paddingBottom: 6,
                    borderBottom: `2px solid ${colors.gray100}`,
                  }}>
                    <span style={{ fontSize: 14 }}>📁</span>
                    <span style={{ fontWeight: 800, fontSize: 12, color: colors.bleu, textTransform: 'uppercase' }}>
                      {groupName}
                    </span>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 8,
                  }}>
                    {perms.map(p => (
                      <label key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px',
                        background: '#f9fafb',
                        borderRadius: radius.sm,
                        border: `1px solid ${colors.gray200}`,
                        cursor: 'pointer',
                        fontSize: 12,
                        color: colors.gray700,
                      }}>
                        <input
                          type="checkbox"
                          checked={form.permission_ids.includes(p.id)}
                          onChange={() => togglePermission(p.id)}
                          style={{ width: 16, height: 16, accentColor: colors.orange }}
                        />
                        <span style={{ fontWeight: 500 }}>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${colors.gray200}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          background: colors.gray50,
        }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: radius.sm,
            border: `1px solid ${colors.gray300}`,
            background: '#fff', color: colors.gray700,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            Annuler
          </button>
          <button onClick={handleSubmit} style={{
            padding: '8px 16px', borderRadius: radius.sm,
            border: 'none', background: colors.orange, color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            {role ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ──────────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: radius.lg,
        width: 400,
        padding: 24,
        boxShadow: shadows.xl,
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: colors.gray900 }}>{title}</h3>
        <p style={{ margin: '0 0 24px 0', fontSize: 13, color: colors.gray600, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{
            padding: '8px 16px', borderRadius: radius.sm,
            border: `1px solid ${colors.gray300}`,
            background: '#fff', color: colors.gray700,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Annuler</button>
          <button onClick={onConfirm} style={{
            padding: '8px 16px', borderRadius: radius.sm,
            border: 'none', background: colors.danger, color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ─────────────────────────────────────────────────────────────
export default function ProfilDroitsPage() {
  const [roles, setRoles] = useState([])          // tous les rôles
  const [permissionsGrouped, setPermissionsGrouped] = useState({}) // permissions groupées par group_label
  const [activeRoleId, setActiveRoleId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Modals
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Charger les données
  useEffect(() => {
    loadData() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rolePermissionApi.roles(),
        rolePermissionApi.permissions(),
      ])

      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data)
      }
      if (permsRes.data.success) {
        setPermissionsGrouped(permsRes.data.data)
      }
    } catch (err) {
      console.error('Erreur chargement données:', err)
      alert('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [])

  // Sélectionner automatiquement le premier rôle si aucun n'est sélectionné
  useEffect(() => {
    if (!activeRoleId && roles.length > 0) {
      setActiveRoleId(roles[0].id)
    }
  }, [roles, activeRoleId])

  // Rôle actif
  const activeRole = roles.find(r => r.id === activeRoleId)

  // Toggle module permission pour le rôle actif
  const handleToggleModule = (permissionId) => {
    setRoles(prev => prev.map(role => {
      if (role.id !== activeRoleId) return role

      const currentPerms = role.permissions.map(p => p.id)
      const newPerms = currentPerms.includes(permissionId)
        ? currentPerms.filter(id => id !== permissionId)
        : [...currentPerms, permissionId]

      return { ...role, permissions: newPerms.map(id => ({ id })) }
    }))
  }

  // Ouvrir modal création
  const openCreateRole = () => {
    setEditingRole(null)
    setRoleModalOpen(true)
  }

  // Ouvrir modal édition
  const openEditRole = (role) => {
    setEditingRole(role)
    setRoleModalOpen(true)
  }

  // Sauvegarder rôle (création ou édition)
  const handleSaveRole = async (formData) => {
    setSaving(true)
    try {
      if (editingRole) {
        await rolePermissionApi.modifierRole(editingRole.id, {
          name: formData.name,
          key: formData.key,
          icon: formData.icon || null,
          color: formData.color || null,
          description: formData.description || null,
          permission_ids: formData.permission_ids,
        })
        setMessage('Rôle mis à jour avec succès')
      } else {
        await rolePermissionApi.creerRole({
          name: formData.name,
          key: formData.key,
          icon: formData.icon || null,
          color: formData.color || null,
          description: formData.description || null,
          is_system: false,
          permission_ids: formData.permission_ids,
        })
        setMessage('Rôle créé avec succès')
      }
      setRoleModalOpen(false)
      await loadData()
    } catch (err) {
      console.error('Erreur sauvegarde rôle:', err)
      alert('Erreur: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  // Supprimer rôle
  const handleDeleteRole = async () => {
    if (!deleteConfirm) return
    setSaving(true)
    try {
      await rolePermissionApi.supprimerRole(deleteConfirm.id)
      setMessage('Rôle supprimé avec succès')
      setDeleteConfirm(null)
      if (activeRoleId === deleteConfirm.id) {
        setActiveRoleId(roles.length > 1 ? roles.find(r => r.id !== deleteConfirm.id)?.id : null)
      }
      await loadData()
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  // Sauvegarder les modifications de permissions du rôle actif (si on utilise le bouton Enregistrer séparé)
  const handleSavePermissions = async () => {
    if (!activeRole) return
    setSaving(true)
    try {
      const permIds = activeRole.permissions.map(p => p.id)
      await rolePermissionApi.syncPermissions(activeRole.id, { permission_ids: permIds })
      setMessage('Permissions mises à jour avec succès')
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>
        Chargement des profils et permissions...
      </div>
    )
  }

  // Aplatir toutes les permissions pour le toggle
  const allPermissionsFlat = Object.values(permissionsGrouped).flat()

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
          <div style={{
            width: 48, height: 48, borderRadius: radius.md,
            background: colors.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: `0 4px 12px ${colors.orange}50`,
          }}>👥</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>
              Profils et Droits
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 3 }}>
              Gestion des profils utilisateurs et de leurs modules · {roles.length} profils
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={openCreateRole}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: radius.sm,
              border: `1px solid ${colors.gray400}`,
              background: '#fff', color: colors.gray700,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 14 }}>＋</span> Nouveau profil
          </button>
          <button
            onClick={handleSavePermissions}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: radius.sm,
              border: 'none', background: colors.orange,
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', opacity: saving ? 0.7 : 1,
              boxShadow: `0 3px 10px ${colors.orange}40`,
            }}
          >
            <span style={{ fontSize: 14 }}>💾</span> Enregistrer
          </button>
        </div>
      </div>

      {/* ── Message de confirmation ── */}
      {message && (
        <div style={{
          padding: '12px 16px',
          background: `${colors.success}15`,
          border: `1px solid ${colors.success}40`,
          borderRadius: radius.md,
          color: colors.success,
          fontSize: 12,
          fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>✅</span> {message}
        </div>
      )}

      {/* ── Profil Tabs ── */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        background: colors.bleu,
        borderRadius: radius.lg,
        padding: '12px 16px',
        boxShadow: shadows.md,
      }}>
        {roles.map(role => {
          const active = activeRoleId === role.id
          const count = role.permissions?.length || 0
          return (
            <button
              key={role.id}
              onClick={() => setActiveRoleId(role.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 16px', borderRadius: radius.sm,
                border: active ? `1.5px solid ${role.color || colors.orange}` : '1.5px solid transparent',
                background: active ? `${(role.color || colors.orange)}15` : 'rgba(255,255,255,0.1)',
                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                fontSize: 12, fontWeight: active ? 700 : 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                boxShadow: active ? `0 2px 8px ${(role.color || colors.orange)}25` : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            >
              <span style={{ fontSize: 14 }}>{role.icon || '👤'}</span>
              <span>{role.name}</span>
              <span style={{
                padding: '1px 7px', borderRadius: radius.full, fontSize: 9, fontWeight: 700,
                background: active ? (role.color || colors.orange) : 'rgba(255,255,255,0.2)',
                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Contenu principal ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeRole ? (
          <div style={{
            background: '#fff', borderRadius: radius.lg,
            boxShadow: shadows.sm, padding: '24px 28px',
            border: `1px solid ${colors.gray200}`,
          }}>
            {/* En-tête de section */}
            <SectionHeader
              icon={activeRole.icon || '👤'}
              title={`Profil : ${activeRole.name}`}
              count={activeRole.permissions?.length || 0}
            />

            {/* Actions du rôle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {!activeRole.is_system && (
                <>
                  <button
                    onClick={() => openEditRole(activeRole)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: radius.sm,
                      border: `1px solid ${colors.bleu}40`,
                      background: `${colors.bleu}08`, color: colors.bleu,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    ✏️ Modifier le rôle
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(activeRole)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: radius.sm,
                      border: `1px solid ${colors.danger}40`,
                      background: `${colors.danger}08`, color: colors.danger,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    🗑 Supprimer
                  </button>
                </>
              )}
              {activeRole.is_system && (
                <Badge variant="info">Rôle système</Badge>
              )}
            </div>

            {/* Description */}
            <div style={{
              padding: '14px 18px',
              background: `${colors.bleu}08`,
              borderRadius: radius.md,
              border: `1px solid ${colors.bleu}20`,
              marginBottom: 24,
              fontSize: 12,
              color: colors.gray700,
              lineHeight: 1.5,
            }}>
              <strong style={{ color: colors.bleu }}>ℹ️ Information:</strong> Cochez les modules auxquels le profil{' '}
              <strong>{activeRole.name}</strong> aura accès. Les modules non cochés seront invisibles pour les utilisateurs de ce profil.
            </div>

            {/* Liste des modules groupés */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {Object.entries(permissionsGrouped).map(([groupName, perms]) => {
                const activePerms = perms.filter(p =>
                  activeRole.permissions?.some(rp => rp.id === p.id)
                )
                if (activePerms.length === 0) return null

                return (
                  <div key={groupName}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginBottom: 12,
                      paddingBottom: 8,
                      borderBottom: `2px solid ${colors.gray100}`,
                    }}>
                      <span style={{ fontSize: 16 }}>📁</span>
                      <span style={{
                        fontWeight: 800, fontSize: 13,
                        color: colors.bleu, textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>{groupName}</span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: 10,
                    }}>
                      {perms.map(perm => (
                        <ModuleItem
                          key={perm.id}
                          module={{ key: perm.key, label: perm.label }}
                          enabled={activeRole.permissions?.some(p => p.id === perm.id)}
                          onToggle={() => handleToggleModule(perm.id)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Aucun module */}
              {activeRole.permissions?.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  color: colors.gray500, fontSize: 13,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                  <p>Aucun module activé pour ce profil.</p>
                  <p>Cochez les modules ci-dessus pour donner accès aux fonctionnalités.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: '#fff', borderRadius: radius.lg,
            boxShadow: shadows.sm, padding: 48,
            textAlign: 'center', color: colors.gray500,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <p>Sélectionnez un profil ou créez-en un nouveau.</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {roleModalOpen && (
        <RoleModal
          role={editingRole}
          allPermissions={allPermissionsFlat}
          onClose={() => setRoleModalOpen(false)}
          onSave={handleSaveRole}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Supprimer le rôle"
          message={`Êtes-vous sûr de vouloir supprimer le rôle "${deleteConfirm.name}" ? Cette action est irréversible.`}
          onConfirm={handleDeleteRole}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

    </div>
  )
}
