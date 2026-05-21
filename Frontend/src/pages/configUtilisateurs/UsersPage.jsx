import { useState, useEffect, useRef, useCallback } from 'react'
import { userApi, rolePermissionApi, personnelApi } from '../../api/index'

const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://127.0.0.1:8001/storage'
const photoUrl = (p) => p ? `${STORAGE_URL}/${p}` : null

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ user, size = 38 }) {
  const initials = user?.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
    : 'U'
  const url = photoUrl(user?.photo)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: url ? 'transparent' : 'linear-gradient(135deg,#ff7631,#c94f1a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: '#fff',
      overflow: 'hidden', border: '2px solid rgba(0,50,104,0.12)',
    }}>
      {url
        ? <img src={url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  )
}

function Badge({ active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)',
      color: active ? '#16a34a' : '#dc2626',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? '#22c55e' : '#ef4444',
      }} />
      {active ? 'Actif' : 'Inactif'}
    </span>
  )
}

// ─── Modal Utilisateur ────────────────────────────────────────────────────────
function UserModal({ user, roles, onClose, onSaved }) {
  const isEdit = !!user
  const fileRef = useRef()
  const debounceRef = useRef()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role_id: user?.role_id || '',
    personnel_id: user?.personnel_id || '',
    is_active: user?.is_active !== false,
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(photoUrl(user?.photo))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleNameChange = (value) => {
    set('name', value)
    set('personnel_id', '')
    clearTimeout(debounceRef.current)
    if (value.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await personnelApi.liste({ search: value, per_page: 6 })
        const list = res.data?.data?.data ?? res.data?.data ?? []
        setSuggestions(list)
        setShowSuggestions(list.length > 0)
      } catch { setSuggestions([]); setShowSuggestions(false) }
    }, 300)
  }

  const selectPersonnel = (p) => {
    setForm(f => ({
      ...f,
      name: p.staff_name || '',
      email: p.email_adress || f.email,
      personnel_id: p.id,
    }))
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nom requis'
    if (!form.email.trim()) e.email = 'Email requis'
    if (!isEdit && !form.password) e.password = 'Mot de passe requis'
    if (form.password && form.password.length < 6) e.password = 'Minimum 6 caractères'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('email', form.email)
      if (form.password) fd.append('password', form.password)
      if (form.role_id) fd.append('role_id', form.role_id)
      if (form.personnel_id) fd.append('personnel_id', form.personnel_id)
      fd.append('is_active', form.is_active ? '1' : '0')
      if (photoFile) fd.append('photo', photoFile)

      if (isEdit) {
        await userApi.modifier(user.id, fd)
      } else {
        await userApi.creer(fd)
      }
      onSaved()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Une erreur est survenue'
      const apiErrors = err?.response?.data?.errors || {}
      if (Object.keys(apiErrors).length) setErrors(apiErrors)
      else setErrors({ _global: msg })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    border: `1.5px solid ${hasErr ? '#ef4444' : '#e2e8f0'}`,
    outline: 'none', background: '#fff', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  })
  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }
  const errStyle = { fontSize: 11, color: '#ef4444', marginTop: 3 }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg,#003268,#001e3d)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
            {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            color: '#fff', width: 30, height: 30, borderRadius: 8,
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errors._global && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
              {errors._global}
            </div>
          )}

          {/* Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
              <Avatar user={{ name: form.name, photo: null }} size={64} />
              {photoPreview && (
                <img src={photoPreview} alt="" style={{
                  position: 'absolute', inset: 0, width: 64, height: 64,
                  borderRadius: '50%', objectFit: 'cover',
                }} />
              )}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                background: '#ff7631', borderRadius: '50%', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#fff', border: '2px solid #fff',
              }}>✎</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Photo de profil</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>JPG, PNG · max 2 Mo</div>
              <button type="button" onClick={() => fileRef.current?.click()} style={{
                marginTop: 6, padding: '4px 10px', borderRadius: 6, fontSize: 12,
                border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer',
                color: '#374151', fontWeight: 500,
              }}>Choisir une photo</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          </div>

          {/* Nom & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Nom avec autocomplete personnel */}
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>Nom complet *</label>
              <input
                style={inputStyle(errors.name)}
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Prénom Nom"
                autoComplete="off"
              />
              {errors.name && <div style={errStyle}>{errors.name}</div>}
              {form.personnel_id && (
                <div style={{ fontSize: 11, color: '#16a34a', marginTop: 3 }}>
                  ✓ Personnel lié
                </div>
              )}
              {/* Dropdown suggestions */}
              {showSuggestions && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: '#fff', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0', marginTop: 2, overflow: 'hidden',
                }}>
                  {suggestions.map(p => (
                    <div
                      key={p.id}
                      onMouseDown={() => selectPersonnel(p)}
                      style={{
                        padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                        borderBottom: '1px solid #f8fafc',
                        display: 'flex', flexDirection: 'column', gap: 2,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.staff_name}</span>
                      {p.email_adress && (
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{p.email_adress}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Adresse email *</label>
              <input style={inputStyle(errors.email)} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" />
              {errors.email && <div style={errStyle}>{errors.email}</div>}
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label style={labelStyle}>{isEdit ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}</label>
            <input style={inputStyle(errors.password)} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={isEdit ? '••••••' : 'Min. 6 caractères'} />
            {errors.password && <div style={errStyle}>{errors.password}</div>}
          </div>

          {/* Rôle & Statut */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Rôle</label>
              <select style={{ ...inputStyle(false), cursor: 'pointer' }} value={form.role_id} onChange={e => set('role_id', e.target.value)}>
                <option value="">-- Aucun rôle --</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                cursor: 'pointer', background: '#fff',
              }} onClick={() => set('is_active', !form.is_active)}>
                <div style={{
                  width: 36, height: 20, borderRadius: 10, transition: 'background 0.2s',
                  background: form.is_active ? '#22c55e' : '#d1d5db',
                  position: 'relative', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: form.is_active ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                  {form.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151',
            }}>Annuler</button>
            <button type="submit" disabled={saving} style={{
              padding: '9px 24px', borderRadius: 8, border: 'none',
              background: saving ? '#9ca3af' : 'linear-gradient(135deg,#ff7631,#c94f1a)',
              color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
            }}>
              {saving ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Créer l\'utilisateur')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal Reset Password ──────────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose, onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return setErr('Minimum 6 caractères')
    if (password !== confirm) return setErr('Les mots de passe ne correspondent pas')
    setSaving(true)
    try {
      await userApi.resetPassword(user.id, { password })
      onDone()
    } catch {
      setErr('Erreur lors de la réinitialisation')
    } finally {
      setSaving(false)
    }
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, border: '1.5px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Réinitialiser le mot de passe</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Définir un nouveau mot de passe pour <strong>{user.name}</strong>
          </div>
          {err && <div style={{ background: '#fef2f2', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: '#dc2626' }}>{err}</div>}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nouveau mot de passe</label>
            <input style={inp} type="password" value={password} onChange={e => { setPassword(e.target.value); setErr('') }} placeholder="Min. 6 caractères" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Confirmer</label>
            <input style={inp} type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setErr('') }} placeholder="Répéter le mot de passe" />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
            <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#003268', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
              {saving ? '...' : 'Réinitialiser'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]             = useState([])
  const [roles, setRoles]             = useState([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)
  const [perPage]                     = useState(12)
  const [search, setSearch]           = useState('')
  const [filterRole, setFilterRole]   = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [loading, setLoading]         = useState(false)
  const [toast, setToast]             = useState(null)

  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal]     = useState(null)
  const [resetModal, setResetModal]   = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: perPage }
      if (search) params.search = search
      if (filterRole) params.role_id = filterRole
      if (filterActive !== '') params.is_active = filterActive
      const res = await userApi.liste(params)
      const d = res.data?.data
      setUsers(d?.data ?? [])
      setTotal(d?.total ?? 0)
    } catch {
      showToast('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, perPage, search, filterRole, filterActive])

  useEffect(() => { loadUsers() }, [loadUsers])

  useEffect(() => {
    rolePermissionApi.roles().then(r => setRoles(r.data?.data ?? []))
  }, [])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await userApi.supprimer(deleteConfirm.id)
      showToast('Utilisateur supprimé')
      setDeleteConfirm(null)
      loadUsers()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur', 'error')
      setDeleteConfirm(null)
    }
  }

  const handleToggle = async (user) => {
    try {
      await userApi.toggleActif(user.id)
      showToast(user.is_active ? 'Compte désactivé' : 'Compte activé')
      loadUsers()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur', 'error')
    }
  }

  const totalPages = Math.ceil(total / perPage)
  const btnStyle = (variant = 'primary') => ({
    padding: variant === 'sm' ? '5px 10px' : '9px 18px',
    borderRadius: variant === 'sm' ? 6 : 8,
    border: 'none', cursor: 'pointer', fontWeight: 600,
    fontSize: variant === 'sm' ? 11 : 13,
    background: variant === 'primary' ? 'linear-gradient(135deg,#ff7631,#c94f1a)'
      : variant === 'danger' ? '#fef2f2'
      : variant === 'ghost' ? 'rgba(0,50,104,0.07)'
      : '#f1f5f9',
    color: variant === 'primary' ? '#fff'
      : variant === 'danger' ? '#dc2626'
      : variant === 'ghost' ? '#003268'
      : '#374151',
    transition: 'opacity 0.15s',
  })

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: toast.type === 'error' ? '#dc2626' : '#16a34a',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
        }}>
          {toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b' }}>Gestion des utilisateurs</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            {total} utilisateur{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}
          </p>
        </div>
        <button style={btnStyle('primary')} onClick={() => setCreateModal(true)}>
          + Nouvel utilisateur
        </button>
      </div>

      {/* Filtres */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '14px 18px',
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', marginBottom: 20,
      }}>
        <input
          type="text" placeholder="Rechercher par nom ou email..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{
            flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, fontSize: 13,
            border: '1.5px solid #e2e8f0', outline: 'none',
          }}
        />
        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1) }}
          style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, border: '1.5px solid #e2e8f0', outline: 'none', background: '#fff' }}>
          <option value="">Tous les rôles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
        </select>
        <select value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1) }}
          style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, border: '1.5px solid #e2e8f0', outline: 'none', background: '#fff' }}>
          <option value="">Tous les statuts</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>
        {(search || filterRole || filterActive) && (
          <button onClick={() => { setSearch(''); setFilterRole(''); setFilterActive(''); setPage(1) }}
            style={{ ...btnStyle('ghost'), padding: '7px 12px' }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Chargement...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
            <div style={{ fontWeight: 600, color: '#374151', fontSize: 15 }}>Aucun utilisateur trouvé</div>
            <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
              {search || filterRole || filterActive ? 'Essayez de modifier vos filtres' : 'Créez le premier utilisateur'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['Utilisateur', 'Email', 'Rôle', 'Statut', 'Personnel lié', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{
                  borderBottom: i < users.length - 1 ? '1px solid #f8fafc' : 'none',
                  transition: 'background 0.12s',
                }}>
                  {/* Utilisateur */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar user={u} size={36} />
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{u.name}</div>
                    </div>
                  </td>
                  {/* Email */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{u.email}</td>
                  {/* Rôle */}
                  <td style={{ padding: '12px 16px' }}>
                    {u.role ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: `${u.role.color || '#003268'}18`,
                        color: u.role.color || '#003268',
                        border: `1px solid ${u.role.color || '#003268'}30`,
                      }}>
                        {u.role.icon} {u.role.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                    )}
                  </td>
                  {/* Statut */}
                  <td style={{ padding: '12px 16px' }}><Badge active={u.is_active} /></td>
                  {/* Personnel lié */}
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>
                    {u.personnel?.staff_name || <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button style={btnStyle('ghost')} onClick={() => setEditModal(u)} title="Modifier">✎</button>
                      <button style={btnStyle('ghost')} onClick={() => setResetModal(u)} title="Réinitialiser mot de passe">🔑</button>
                      <button
                        style={{ ...btnStyle('sm'), background: u.is_active ? '#fef3c7' : '#f0fdf4', color: u.is_active ? '#d97706' : '#16a34a' }}
                        onClick={() => handleToggle(u)}
                        title={u.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button style={btnStyle('danger')} onClick={() => setDeleteConfirm(u)} title="Supprimer">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            style={{ ...btnStyle('ghost'), padding: '7px 14px', opacity: page === 1 ? 0.4 : 1 }}>
            ← Précédent
          </button>
          <span style={{ fontSize: 13, color: '#64748b', padding: '0 8px' }}>
            Page {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            style={{ ...btnStyle('ghost'), padding: '7px 14px', opacity: page === totalPages ? 0.4 : 1 }}>
            Suivant →
          </button>
        </div>
      )}

      {/* Modals */}
      {createModal && (
        <UserModal roles={roles} onClose={() => setCreateModal(false)} onSaved={() => { setCreateModal(false); showToast('Utilisateur créé avec succès'); loadUsers() }} />
      )}
      {editModal && (
        <UserModal user={editModal} roles={roles} onClose={() => setEditModal(null)} onSaved={() => { setEditModal(null); showToast('Utilisateur modifié avec succès'); loadUsers() }} />
      )}
      {resetModal && (
        <ResetPasswordModal user={resetModal} onClose={() => setResetModal(null)} onDone={() => { setResetModal(null); showToast('Mot de passe réinitialisé') }} />
      )}

      {/* Confirmation suppression */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 8 }}>Supprimer l'utilisateur</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteConfirm.name}</strong> ? Cette action est irréversible.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={btnStyle('default')}>Annuler</button>
              <button onClick={handleDelete} style={{ ...btnStyle('primary'), background: '#dc2626' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
