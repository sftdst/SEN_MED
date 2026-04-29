import React, { useState, useEffect, useCallback, useRef } from 'react'
import { colors, radius, shadows } from '../../theme'
import api from '../../api/axios'
import { DossierSoinsModal } from './DossierSoinsDetailPage'

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const today = () => new Date().toISOString().slice(0, 10)

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  '#002f59', '#e0621f', '#2e7d32', '#1565c0', '#6a1b9a', '#00838f',
]
function avatarColor(str) {
  let hash = 0
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  if (!msg) return null
  const bg = type === 'error' ? colors.dangerBg : colors.successBg
  const border = type === 'error' ? colors.danger : colors.success
  const text = type === 'error' ? colors.danger : colors.success
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: bg, border: `1.5px solid ${border}`, color: text,
      borderRadius: radius.md, padding: '12px 20px', fontSize: 13, fontWeight: 600,
      boxShadow: shadows.lg, maxWidth: 340, display: 'flex', alignItems: 'center', gap: 10,
      animation: 'fadeIn .25s ease',
    }}>
      <span>{type === 'error' ? '✕' : '✓'}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: text, fontWeight: 700, fontSize: 14 }}>×</button>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.lg, padding: '20px 24px',
      boxShadow: shadows.sm, flex: 1, display: 'flex', alignItems: 'center', gap: 16,
      border: `1px solid ${colors.gray200}`, minWidth: 160,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: radius.md,
        background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: color, lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: colors.gray600, marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Badge Statut ────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const cfg = statut === 'termine'
    ? { bg: colors.successBg, color: colors.success, label: 'Terminé' }
    : { bg: colors.infoBg, color: colors.info, label: 'En cours' }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      borderRadius: radius.full, padding: '3px 12px', fontSize: 11, fontWeight: 700,
      letterSpacing: '.3px', display: 'inline-block',
    }}>{cfg.label}</span>
  )
}

// ─── Modal Création DSI ──────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated, toast }) {
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [dateDebut, setDateDebut] = useState(today())
  const [loading, setLoading] = useState(false)
  const [loadingSugg, setLoadingSugg] = useState(false)
  const searchTimeout = useRef(null)
  const dropdownRef = useRef(null)

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 3) { setSuggestions([]); return }
    setLoadingSugg(true)
    try {
      // starts_with = recherche prénom/nom commence par les lettres (insensible casse)
      const res = await api.get('/patients', { params: { starts_with: q, per_page: 8 } })
      const list = res.data?.data?.data ?? res.data?.data ?? []
      setSuggestions(Array.isArray(list) ? list : [])
    } catch { setSuggestions([]) }
    finally { setLoadingSugg(false) }
  }, [])

  useEffect(() => {
    if (selectedPatient) return
    clearTimeout(searchTimeout.current)
    // Délai court: dès 3 lettres on cherche immédiatement
    searchTimeout.current = setTimeout(() => fetchSuggestions(search), 200)
    return () => clearTimeout(searchTimeout.current)
  }, [search, fetchSuggestions, selectedPatient])

  const handleSelectPatient = (p) => {
    setSelectedPatient(p)
    const nom = [p.first_name, p.last_name].filter(Boolean).join(' ')
    setSearch(nom)
    setSuggestions([])
  }

  const handleCreate = async () => {
    if (!selectedPatient) { toast('Veuillez sélectionner un patient', 'error'); return }
    if (!selectedPatient.patient_id) { toast('Patient invalide — patient_id manquant', 'error'); return }
    setLoading(true)
    try {
      await api.post('/nursing-dossiers', {
        patient_id: selectedPatient.patient_id,
        date_debut: dateDebut,
        statut: 'en_cours',
      })
      onCreated()
      onClose()
    } catch (e) {
      const msg = e.response?.data?.message
        || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(' | ') : null)
        || 'Erreur lors de la création'
      toast(msg, 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: colors.white, borderRadius: radius.xl, padding: 32, width: 480,
        boxShadow: shadows.lg, position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.bleu }}>Nouveau Dossier de Soins</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: colors.gray500, lineHeight: 1 }}>×</button>
        </div>

        {/* Recherche Patient */}
        <div style={{ marginBottom: 18, position: 'relative' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>Patient *</label>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedPatient(null) }}
            placeholder="Taper 3 lettres du prénom ou nom..."
            autoComplete="off"
            style={inputStyle}
          />
          {search.length > 0 && search.length < 3 && !selectedPatient && (
            <div style={{ fontSize: 11, color: colors.gray500, marginTop: 4 }}>
              Tapez encore {3 - search.length} lettre{3 - search.length > 1 ? 's' : ''}...
            </div>
          )}
          {loadingSugg && (
            <div style={{ position: 'absolute', right: 12, top: 36, fontSize: 12, color: colors.gray500 }}>...</div>
          )}
          {suggestions.length > 0 && !selectedPatient && (
            <div ref={dropdownRef} style={{
              position: 'absolute', top: '100%', left: 0, right: 0, background: colors.white,
              border: `1px solid ${colors.gray300}`, borderRadius: radius.md, boxShadow: shadows.md,
              zIndex: 200, maxHeight: 220, overflowY: 'auto',
            }}>
              {suggestions.map(p => (
                <div key={p.patient_id} onClick={() => handleSelectPatient(p)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 13, transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.gray50}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: radius.full, background: avatarColor(p.first_name + p.last_name),
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{getInitials(p.first_name + ' ' + p.last_name)}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: colors.bleu }}>{p.first_name} {p.last_name}</div>
                    <div style={{ fontSize: 11, color: colors.gray500 }}>
                      {p.patient_code || p.patient_id || '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedPatient && (
            <div style={{
              marginTop: 8, padding: '8px 12px', background: colors.infoBg,
              borderRadius: radius.sm, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
            }}>
              <span style={{ color: colors.info, fontWeight: 600 }}>✓ Patient sélectionné:</span>
              <span style={{ color: colors.bleu }}>{selectedPatient.first_name} {selectedPatient.last_name}</span>
              <button onClick={() => { setSelectedPatient(null); setSearch('') }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: colors.gray500, fontSize: 14 }}>×</button>
            </div>
          )}
        </div>

        {/* Date début */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>Date de début *</label>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary}>Annuler</button>
          <button onClick={handleCreate} disabled={loading} style={loading ? { ...btnPrimary, opacity: .7 } : btnPrimary}>
            {loading ? 'Création...' : 'Créer le dossier'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Styles communs ───────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  border: `1.5px solid ${colors.gray300}`, borderRadius: radius.md,
  fontSize: 13, color: colors.gray900, background: colors.white,
  outline: 'none', transition: 'border-color .15s',
  fontFamily: 'inherit',
}
const btnPrimary = {
  background: colors.orange, color: colors.white, border: 'none',
  borderRadius: radius.md, padding: '9px 20px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', transition: 'background .15s',
}
const btnSecondary = {
  background: colors.gray100, color: colors.gray700, border: `1px solid ${colors.gray300}`,
  borderRadius: radius.md, padding: '9px 20px', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', transition: 'background .15s',
}
const btnDanger = {
  background: colors.dangerBg, color: colors.danger, border: `1px solid ${colors.danger}20`,
  borderRadius: radius.md, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

// ─── Page Principale ──────────────────────────────────────────────────────────
export default function DossierSoinsPage() {
  const [dossiers, setDossiers] = useState([])
  const [stats, setStats] = useState({ total: 0, en_cours: 0, termine: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState(null)
  const [terminating, setTerminating] = useState(null)
  const [openDossierId, setOpenDossierId] = useState(null)

  const showToast = (msg, type = 'success') => setToast({ msg, type })

  const fetchDossiers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (search) params.search = search
      if (statut) params.statut = statut
      const res = await api.get('/nursing-dossiers', { params })
      const data = res.data?.data || res.data || {}
      setDossiers(data.data || data || [])
      setMeta(data.meta || null)
      if (res.data?.stats) setStats(res.data.stats)
    } catch (e) {
      showToast('Erreur de chargement', 'error')
    } finally { setLoading(false) }
  }, [search, statut, page])

  useEffect(() => { fetchDossiers() }, [fetchDossiers])

  const handleTerminer = async (dossier) => {
    if (!window.confirm(`Terminer le dossier de ${dossier.patient?.first_name} ${dossier.patient?.last_name} ?`)) return
    setTerminating(dossier.id)
    try {
      await api.put(`/nursing-dossiers/${dossier.id}`, { statut: 'termine', date_fin: today() })
      showToast('Dossier terminé avec succès')
      fetchDossiers()
    } catch (e) {
      showToast('Erreur lors de la clôture', 'error')
    } finally { setTerminating(null) }
  }

  const handleSearch = () => { setPage(1); fetchDossiers() }

  // Calcul stats depuis les données si pas retournées par l'API
  const computedStats = {
    total: meta?.total || dossiers.length,
    en_cours: dossiers.filter(d => d.statut === 'en_cours').length,
    termine: dossiers.filter(d => d.statut === 'termine').length,
  }
  const displayStats = (stats.total > 0) ? stats : computedStats

  return (
    <div style={{ minHeight: '100vh', background: colors.gray50, padding: 0 }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        .dsi-row:hover { background: ${colors.gray50} !important; }
        .dsi-btn-open:hover { background: ${colors.bleuLight} !important; }
        .dsi-btn-end:hover { background: ${colors.warningBg} !important; }
        input:focus, select:focus, textarea:focus { border-color: ${colors.orange} !important; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {openDossierId && (
        <DossierSoinsModal
          dossierId={openDossierId}
          onClose={() => { setOpenDossierId(null); fetchDossiers() }}
        />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchDossiers(); showToast('Dossier créé avec succès') }}
          toast={showToast}
        />
      )}

      {/* ── Header ── */}
      <div style={{
        background: colors.white, borderBottom: `1px solid ${colors.gray200}`,
        padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: shadows.sm,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: radius.md,
            background: colors.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>📋</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.bleu }}>Dossier de Soins Infirmiers</h1>
            <p style={{ margin: 0, fontSize: 12, color: colors.gray500, marginTop: 2 }}>Gestion des suivis infirmiers patients</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: 13 }}
          onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
          onMouseLeave={e => e.currentTarget.style.background = colors.orange}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Nouveau DSI
        </button>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* ── Stats Cards ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard label="Total dossiers" value={displayStats.total} icon="📁" color={colors.bleu} />
          <StatCard label="En cours" value={displayStats.en_cours} icon="⏳" color={colors.info} />
          <StatCard label="Terminés" value={displayStats.termine} icon="✅" color={colors.success} />
        </div>

        {/* ── Filtres ── */}
        <div style={{
          background: colors.white, borderRadius: radius.lg, padding: '16px 20px',
          boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
          display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: colors.gray400 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Rechercher un patient..."
              style={{ ...inputStyle, paddingLeft: 34 }}
            />
          </div>
          <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1) }}
            style={{ ...inputStyle, width: 180, cursor: 'pointer' }}>
            <option value="">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
          <button onClick={handleSearch} style={{ ...btnPrimary, padding: '9px 22px', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
            onMouseLeave={e => e.currentTarget.style.background = colors.orange}>
            Rechercher
          </button>
        </div>

        {/* ── Tableau ── */}
        <div style={{
          background: colors.white, borderRadius: radius.lg, boxShadow: shadows.sm,
          border: `1px solid ${colors.gray200}`, overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.gray500 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 14 }}>Chargement des dossiers...</div>
            </div>
          ) : dossiers.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center', color: colors.gray500 }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: .5 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: colors.gray700, marginBottom: 6 }}>Aucun dossier trouvé</div>
              <div style={{ fontSize: 13 }}>Créez un nouveau DSI pour commencer</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                  {['#', 'Patient', 'Date début', 'Date fin', 'Statut', 'Actions'].map(col => (
                    <th key={col} style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: 11,
                      fontWeight: 700, color: colors.gray500, letterSpacing: '.5px',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dossiers.map((d, i) => {
                  const patient = d.patient || {}
                  const nom = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || '—'
                  const initials = getInitials(nom)
                  const bgAvatar = avatarColor(nom)
                  const rowNum = ((page - 1) * (meta?.per_page || 15)) + i + 1
                  return (
                    <tr key={d.id} className="dsi-row" style={{
                      borderBottom: `1px solid ${colors.gray100}`,
                      background: colors.white, transition: 'background .12s',
                    }}>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: colors.gray500, fontWeight: 600 }}>
                        #{rowNum}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: radius.full,
                            background: bgAvatar, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                          }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: colors.gray900, fontSize: 13 }}>{nom}</div>
                            <div style={{ fontSize: 11, color: colors.gray500 }}>
                              {patient.patient_code || patient.patient_id || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: colors.gray700 }}>{fmt(d.date_debut)}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: colors.gray700 }}>{fmt(d.date_fin)}</td>
                      <td style={{ padding: '13px 16px' }}><StatutBadge statut={d.statut} /></td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            className="dsi-btn-open"
                            onClick={() => setOpenDossierId(d.id)}
                            style={{
                              background: colors.bleu, color: colors.white,
                              border: 'none', borderRadius: radius.sm, padding: '6px 14px',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background .15s',
                              whiteSpace: 'nowrap',
                            }}>
                            Ouvrir
                          </button>
                          {d.statut === 'en_cours' && (
                            <button
                              className="dsi-btn-end"
                              onClick={() => handleTerminer(d)}
                              disabled={terminating === d.id}
                              style={{
                                background: colors.warningBg, color: colors.warning,
                                border: `1px solid ${colors.warning}30`, borderRadius: radius.sm,
                                padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                transition: 'background .15s', whiteSpace: 'nowrap',
                                opacity: terminating === d.id ? .6 : 1,
                              }}>
                              {terminating === d.id ? '...' : 'Terminer'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {/* ── Pagination ── */}
          {meta && meta.last_page > 1 && (
            <div style={{
              padding: '14px 20px', borderTop: `1px solid ${colors.gray200}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: colors.gray50,
            }}>
              <span style={{ fontSize: 12, color: colors.gray600 }}>
                Affichage {meta.from}–{meta.to} sur {meta.total} dossiers
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{
                    ...btnSecondary, padding: '6px 14px', fontSize: 12,
                    opacity: page === 1 ? .5 : 1,
                  }}>← Précédent</button>
                {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                  const p = Math.max(1, Math.min(meta.last_page - 4, page - 2)) + i
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{
                      padding: '6px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: 'none', borderRadius: radius.sm,
                      background: p === page ? colors.orange : colors.gray100,
                      color: p === page ? colors.white : colors.gray700,
                      transition: 'background .15s',
                    }}>{p}</button>
                  )
                })}
                <button
                  disabled={page === meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    ...btnSecondary, padding: '6px 14px', fontSize: 12,
                    opacity: page === meta.last_page ? .5 : 1,
                  }}>Suivant →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
