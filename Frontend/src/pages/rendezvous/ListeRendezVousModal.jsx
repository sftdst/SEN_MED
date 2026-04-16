import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { rendezVousApi, personnelApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import { showToast } from '../../components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtTime = (t) => {
  if (!t) return '—'
  try {
    const d = new Date(t)
    if (!isNaN(d)) return format(d, 'HH:mm')
    // cas "HH:mm:ss" brut
    return String(t).slice(0, 5)
  } catch { return String(t).slice(0, 5) }
}

const fmtDate = (d) => {
  if (!d) return '—'
  try { return format(parseISO(String(d).slice(0, 10)), 'dd/MM/yyyy') } catch { return d }
}

const fmtDateLong = (d) => {
  if (!d) return '—'
  try { return format(parseISO(String(d).slice(0, 10)), 'EEEE d MMMM yyyy', { locale: fr }) }
  catch { return d }
}

const initiales = (nom = '') => {
  const p = nom.trim().split(/\s+/).filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase()
  return (p[0]?.[0] || '?').toUpperCase()
}

const AVATAR_COLORS = [
  '#1565c0','#2e7d32','#ad1457','#f57c00',
  '#6a1b9a','#00838f','#4e342e','#0277bd',
]
const avatarColor = (nom = '') => AVATAR_COLORS[nom.charCodeAt(0) % AVATAR_COLORS.length]

const todayISO = () => {
  const d = new Date()
  return format(d, 'yyyy-MM-dd')
}
const plus30ISO = () => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return format(d, 'yyyy-MM-dd')
}

// ── Statuts ────────────────────────────────────────────────────────────────────
const STATUTS = {
  0: { label: 'En attente',  color: '#f57c00', bg: '#fff3e0', dot: '#f57c00' },
  1: { label: 'Confirmé',    color: '#1565c0', bg: '#e3f2fd', dot: '#1565c0' },
  2: { label: 'Annulé',      color: '#c62828', bg: '#fdecea', dot: '#c62828' },
  3: { label: 'Terminé',     color: '#2e7d32', bg: '#e8f5e9', dot: '#2e7d32' },
  4: { label: 'Absent',      color: '#7b1fa2', bg: '#f3e5f5', dot: '#7b1fa2' },
}

// ── Badge statut ──────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const s = STATUTS[statut] ?? STATUTS[0]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: radius.full,
      background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
      border: `1px solid ${s.color}30`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

// ── Bouton d'action petite taille ─────────────────────────────────────────────
function ActionBtn({ label, icon, c, onClick, variant = 'outline' }) {
  const [h, setH] = useState(false)
  const filled = variant === 'filled'
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 11px', borderRadius: radius.sm, cursor: 'pointer',
        border: `1.5px solid ${c}`,
        background: filled ? (h ? `${c}dd` : c) : (h ? c : `${c}12`),
        color: filled ? '#fff' : (h ? '#fff' : c),
        fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
    >
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      {label}
    </button>
  )
}

// ── Carte RDV ────────────────────────────────────────────────────────────────
function RdvCard({ rdv, onAnnuler, onReporter, selected, onClick }) {
  const nomPatient = rdv.patient_nom_complet?.trim() || rdv.nom_patient || 'Patient inconnu'
  const nomMedecin = rdv.medecin_nom || rdv.medecin || 'Médecin'
  const motif      = rdv.motif || rdv.reason || '—'
  const typeCons   = rdv.type_consultation || rdv.type || 'Habituel'
  const heureD     = fmtTime(rdv.start_time)
  const heureF     = fmtTime(rdv.end_time)
  const dateRdv    = fmtDate(rdv.appointment_date)
  const dateLong   = fmtDateLong(rdv.appointment_date)
  const avCouleur  = avatarColor(nomPatient)

  const isUpcoming = rdv.statut_app !== 2 && rdv.statut_app !== 3

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? `${colors.bleu}06` : '#fff',
        border: `1.5px solid ${selected ? colors.bleu : '#e9ecef'}`,
        borderLeft: `4px solid ${selected ? colors.orange : (STATUTS[rdv.statut_app]?.color ?? '#dee2e6')}`,
        borderRadius: radius.lg,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: selected ? `0 4px 16px ${colors.bleu}18` : '0 1px 4px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

        {/* Avatar patient */}
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: avCouleur, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 16, fontWeight: 800,
          boxShadow: `0 3px 10px ${avCouleur}50`,
        }}>
          {initiales(nomPatient)}
        </div>

        {/* Infos principales */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            {/* Nom + badge */}
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#212529', marginBottom: 2 }}>
                {nomPatient}
              </div>
              <div style={{ fontSize: 11, color: '#6c757d' }}>
                {nomMedecin}
              </div>
            </div>
            <StatutBadge statut={rdv.statut_app} />
          </div>

          {/* Horaires + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#2e7d32', fontWeight: 700 }}>{heureD}</span>
              <span style={{ fontSize: 11, color: '#adb5bd' }}>→</span>
              <span style={{ fontSize: 13, color: '#1565c0', fontWeight: 700 }}>{heureF}</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: radius.full,
              background: '#fff8e1', border: '1px solid #ffe08250',
            }}>
              <span style={{ fontSize: 11 }}>📅</span>
              <span style={{ fontSize: 11, color: '#f57c00', fontWeight: 700 }}>{dateRdv}</span>
            </div>
            <span style={{ fontSize: 10, color: '#adb5bd', textTransform: 'capitalize' }}>{dateLong}</span>
          </div>

          {/* Motif */}
          <div style={{
            fontSize: 12, color: '#495057',
            padding: '5px 10px', background: '#f8f9fa',
            borderRadius: radius.sm, display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 11 }}>🩺</span>
            <span style={{ fontWeight: 600, color: '#1565c0' }}>{nomPatient}</span>
            <span style={{ color: '#adb5bd' }}>({typeCons})</span>
            <span style={{ color: '#6c757d' }}>:</span>
            <span>{motif}</span>
          </div>

          {/* Pied de carte : type + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, color: isUpcoming ? '#1565c0' : '#6c757d',
                fontStyle: 'italic', fontWeight: 500,
              }}>
                {isUpcoming ? '🔵 Rendez-vous à venir' : '⚫ Passé'} ·
              </span>
              <span style={{ fontSize: 10, color: '#f57c00', fontWeight: 700 }}>Docteur</span>
              {rdv.medecin_numero && (
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff3e0', border: '1px solid #f57c00',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: '#f57c00',
                }}>{rdv.medecin_numero}</span>
              )}
            </div>

            {/* Boutons action */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <ActionBtn
                label="Rappel SMS" icon="📱" c="#6a1b9a"
                onClick={e => { e.stopPropagation(); showToast(`SMS envoyé à ${nomPatient}`) }}
              />
              <ActionBtn
                label="Consulter" icon="👁" c={colors.bleu}
                onClick={e => { e.stopPropagation(); showToast(`Ouverture consultation : ${nomPatient}`) }}
              />
              <ActionBtn
                label="Reporter" icon="📅" c="#1976d2" variant="filled"
                onClick={e => { e.stopPropagation(); onReporter(rdv) }}
              />
              {isUpcoming && (
                <ActionBtn
                  label="Annuler" icon="✕" c="#c62828" variant="filled"
                  onClick={e => { e.stopPropagation(); onAnnuler(rdv) }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function ListeRendezVousModal({ open, onClose }) {
  // ── Filtres ────────────────────────────────────────────────────────────────
  const [dateDebut,    setDateDebut]    = useState(todayISO())
  const [dateFin,      setDateFin]      = useState(plus30ISO())
  const [nomPatient,   setNomPatient]   = useState('')
  const [medecinId,    setMedecinId]    = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')

  // ── Données ────────────────────────────────────────────────────────────────
  const [rdvs,      setRdvs]      = useState([])
  const [medecins,  setMedecins]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [selected,  setSelected]  = useState(null)

  // ── Confirmation annulation ────────────────────────────────────────────────
  const [confirmData, setConfirmData] = useState(null)  // { rdv } | null
  const [annulLoading, setAnnulLoading] = useState(false)

  // ── Chargement médecins ────────────────────────────────────────────────────
  useEffect(() => {
    personnelApi.liste({ per_page: 200 })
      .then(r => {
        const list = r.data?.data?.data ?? r.data?.data ?? []
        setMedecins(list)
      })
      .catch(() => {})
  }, [])

  // ── Chargement RDV ─────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    try {
      const params = { date_debut: dateDebut, date_fin: dateFin, per_page: 200 }
      if (medecinId)  params.medecin_id   = medecinId
      if (nomPatient.trim()) params.nom_patient = nomPatient.trim()
      const res = await rendezVousApi.liste(params)
      const data = res.data?.data?.data ?? res.data?.data ?? res.data ?? []
      setRdvs(Array.isArray(data) ? data : [])
    } catch {
      showToast('Erreur lors du chargement des rendez-vous', 'error')
      setRdvs([])
    } finally {
      setLoading(false)
    }
  }, [dateDebut, dateFin, medecinId, nomPatient])

  useEffect(() => { if (open) charger() }, [open])

  // ── Filtrage local ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...rdvs]
    if (filtreStatut !== 'tous') {
      const codeStatut = { attente: 0, confirme: 1, annule: 2, termine: 3, absent: 4 }
      const code = codeStatut[filtreStatut]
      list = list.filter(r => r.statut_app == code)
    }
    if (nomPatient.trim()) {
      const q = nomPatient.toLowerCase()
      list = list.filter(r =>
        (r.patient_nom_complet || r.nom_patient || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [rdvs, filtreStatut, nomPatient])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    rdvs.length,
    confirme: rdvs.filter(r => r.statut_app == 1).length,
    attente:  rdvs.filter(r => r.statut_app == 0).length,
    annule:   rdvs.filter(r => r.statut_app == 2).length,
    termine:  rdvs.filter(r => r.statut_app == 3).length,
  }), [rdvs])

  const effacer = () => {
    setDateDebut(todayISO())
    setDateFin(plus30ISO())
    setNomPatient('')
    setMedecinId('')
    setFiltreStatut('tous')
  }

  const handleAnnuler = (rdv) => {
    setConfirmData({ rdv })
  }

  const confirmerAnnulation = async () => {
    if (!confirmData) return
    setAnnulLoading(true)
    try {
      await rendezVousApi.modifier(confirmData.rdv.appointment_id, { statut_app: 2 })
      showToast('Rendez-vous annulé avec succès', 'success')
      setConfirmData(null)
      charger()
    } catch {
      showToast('Erreur lors de l\'annulation', 'error')
    } finally {
      setAnnulLoading(false)
    }
  }

  const handleReporter = (rdv) => {
    showToast(`Reportage de ${rdv.patient_nom_complet || 'ce RDV'} — fonctionnalité à venir`)
  }

  if (!open) return null

  const nomConfirm = confirmData?.rdv?.patient_nom_complet || confirmData?.rdv?.nom_patient || 'ce patient'
  const heureConfirm = fmtTime(confirmData?.rdv?.start_time)
  const dateConfirm  = fmtDate(confirmData?.rdv?.appointment_date)

  // ── Champs de filtre helpers ───────────────────────────────────────────────
  const FilterLabel = ({ children }) => (
    <div style={{ fontSize: 9, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>
      {children}
    </div>
  )

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid #dee2e6', borderRadius: radius.sm,
    padding: '8px 12px', fontSize: 12, color: '#343a40',
    background: '#fff', outline: 'none', transition: 'border-color 0.15s',
  }

  const FILTRE_TABS = [
    { key: 'tous',     label: 'Tous',        val: stats.total,    c: colors.bleu },
    { key: 'attente',  label: 'En attente',  val: stats.attente,  c: '#f57c00' },
    { key: 'confirme', label: 'Confirmés',   val: stats.confirme, c: '#1565c0' },
    { key: 'annule',   label: 'Annulés',     val: stats.annule,   c: '#c62828' },
    { key: 'termine',  label: 'Terminés',    val: stats.termine,  c: '#2e7d32' },
  ]

  return (
    <>
      {/* ── Overlay ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,20,50,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: 'fadeIn 0.18s ease',
        }}
      />

      {/* ── Panneau ── */}
      <div style={{
        position: 'fixed', top: '3%', left: '50%',
        transform: 'translateX(-50%)',
        width: '92%', maxWidth: 1100,
        maxHeight: '94vh',
        background: '#f8f9fa',
        borderRadius: radius.xl,
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        zIndex: 1001,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.22s ease',
      }}>

        {/* ══ EN-TÊTE MODAL ══ */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: colors.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 4px 12px rgba(255,118,49,0.45)',
            }}>📋</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Liste des Rendez-vous</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>
                Consultation et gestion de tous les rendez-vous
              </div>
            </div>
          </div>

          {/* Stats rapides en header */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Total',     val: stats.total,    c: 'rgba(255,255,255,0.9)' },
              { label: 'À venir',   val: stats.attente + stats.confirme, c: '#81d4fa' },
              { label: 'Annulés',   val: stats.annule,   c: '#ef9a9a' },
            ].map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '6px 14px',
                background: 'rgba(255,255,255,0.1)', borderRadius: radius.md,
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <div style={{ color: s.c, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Fermer */}
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,40,40,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >✕</button>
        </div>

        {/* ══ BARRE DE FILTRES ══ */}
        <div style={{
          background: '#fff',
          padding: '16px 24px',
          borderBottom: '1px solid #e9ecef',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>

            {/* Date début */}
            <div style={{ flex: '1 1 160px', maxWidth: 200 }}>
              <FilterLabel>Date Début</FilterLabel>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e  => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            {/* Date fin */}
            <div style={{ flex: '1 1 160px', maxWidth: 200 }}>
              <FilterLabel>Date Fin</FilterLabel>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e  => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            {/* Nom patient */}
            <div style={{ flex: '2 1 200px' }}>
              <FilterLabel>Nom du Patient</FilterLabel>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 13, color: '#adb5bd', pointerEvents: 'none',
                }}>🔍</span>
                <input
                  value={nomPatient}
                  onChange={e => setNomPatient(e.target.value)}
                  placeholder="Nom ou prénom du patient..."
                  style={{ ...inputStyle, paddingLeft: 30 }}
                  onFocus={e => e.target.style.borderColor = colors.bleu}
                  onBlur={e  => e.target.style.borderColor = '#dee2e6'}
                  onKeyDown={e => e.key === 'Enter' && charger()}
                />
              </div>
            </div>

            {/* Médecin */}
            <div style={{ flex: '2 1 200px' }}>
              <FilterLabel>Médecin</FilterLabel>
              <select
                value={medecinId} onChange={e => setMedecinId(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e  => e.target.style.borderColor = '#dee2e6'}
              >
                <option value="">Tous les médecins</option>
                {medecins.map(m => (
                  <option key={m.id} value={String(m.id)}>
                    Dr. {m.first_name} {m.last_name}{m.specialization ? ` — ${m.specialization}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 0 }}>
              <button
                onClick={charger}
                disabled={loading}
                style={{
                  padding: '8px 20px', borderRadius: radius.sm, cursor: 'pointer',
                  border: 'none', background: colors.bleu, color: '#fff',
                  fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                  opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#003f7a' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = colors.bleu }}
              >
                🔍 Rechercher
              </button>
              <button
                onClick={effacer}
                style={{
                  padding: '8px 14px', borderRadius: radius.sm, cursor: 'pointer',
                  border: '1.5px solid #dee2e6', background: '#f8f9fa',
                  color: '#6c757d', fontSize: 12, fontWeight: 700,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e9ecef'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8f9fa'}
              >
                ↺ Effacer
              </button>
            </div>
          </div>

          {/* Filtres statut */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#6c757d', fontWeight: 600, marginRight: 4 }}>Filtrer :</span>
            {FILTRE_TABS.map(f => (
              <button
                key={f.key}
                onClick={() => setFiltreStatut(f.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: radius.full, cursor: 'pointer',
                  border: `1.5px solid ${filtreStatut === f.key ? f.c : '#dee2e6'}`,
                  background: filtreStatut === f.key ? f.c : '#fff',
                  color: filtreStatut === f.key ? '#fff' : '#495057',
                  fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                }}
              >
                {f.label}
                <span style={{
                  padding: '1px 6px', borderRadius: radius.full, fontSize: 9, fontWeight: 800,
                  background: filtreStatut === f.key ? 'rgba(255,255,255,0.25)' : '#f1f3f5',
                  color: filtreStatut === f.key ? '#fff' : '#6c757d',
                }}>{f.val}</span>
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6c757d' }}>
              <strong style={{ color: colors.bleu }}>{filtered.length}</strong> résultat{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ══ LISTE DES RDV ══ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#adb5bd' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Chargement des rendez-vous...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#adb5bd' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#495057', marginBottom: 6 }}>Aucun rendez-vous trouvé</div>
              <div style={{ fontSize: 12 }}>Modifiez vos critères de recherche ou élargissez la période</div>
            </div>
          ) : (
            filtered.map(rdv => (
              <RdvCard
                key={rdv.appointment_id ?? rdv.id}
                rdv={rdv}
                selected={selected === rdv.appointment_id}
                onClick={() => setSelected(prev => prev === rdv.appointment_id ? null : rdv.appointment_id)}
                onAnnuler={handleAnnuler}
                onReporter={handleReporter}
              />
            ))
          )}
        </div>

        {/* ══ PIED MODAL ══ */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #e9ecef',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: '#adb5bd' }}>
            Période : {fmtDate(dateDebut)} → {fmtDate(dateFin)}
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 22px', borderRadius: radius.sm, cursor: 'pointer',
              border: `1.5px solid ${colors.bleu}`, background: 'transparent',
              color: colors.bleu, fontSize: 12, fontWeight: 700,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.bleu; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.bleu }}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* ══ POPUP CONFIRMATION ANNULATION ══ */}
      {confirmData && (
        <>
          {/* Overlay du popup (par-dessus le modal) */}
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1100,
            animation: 'fadeIn 0.15s ease',
          }} />

          {/* Boîte de confirmation */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1101,
            width: 420, maxWidth: '90vw',
            background: '#fff',
            borderRadius: radius.xl,
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {/* Bandeau rouge en haut */}
            <div style={{
              background: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)',
              padding: '18px 22px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>⚠️</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>
                  Confirmer l'annulation
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
                  Cette action est irréversible
                </div>
              </div>
            </div>

            {/* Corps */}
            <div style={{ padding: '22px 24px' }}>
              {/* Info RDV concerné */}
              <div style={{
                background: '#fdecea',
                border: '1px solid #ef9a9a',
                borderRadius: radius.md,
                padding: '14px 16px',
                marginBottom: 18,
              }}>
                <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Rendez-vous concerné
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: avatarColor(nomConfirm),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 13, fontWeight: 800,
                  }}>
                    {initiales(nomConfirm)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#212529', fontSize: 13 }}>{nomConfirm}</div>
                    <div style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>
                      🕐 {heureConfirm} · 📅 {dateConfirm}
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#495057', lineHeight: 1.6 }}>
                Êtes-vous sûr de vouloir annuler ce rendez-vous ?<br />
                <span style={{ color: '#c62828', fontWeight: 600 }}>Le patient ne sera pas automatiquement notifié.</span>
              </p>

              {/* Boutons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmData(null)}
                  disabled={annulLoading}
                  style={{
                    padding: '9px 22px', borderRadius: radius.sm, cursor: 'pointer',
                    border: '1.5px solid #dee2e6', background: '#f8f9fa',
                    color: '#495057', fontSize: 13, fontWeight: 700,
                    transition: 'all 0.15s', opacity: annulLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!annulLoading) e.currentTarget.style.background = '#e9ecef' }}
                  onMouseLeave={e => { if (!annulLoading) e.currentTarget.style.background = '#f8f9fa' }}
                >
                  Non, conserver
                </button>
                <button
                  onClick={confirmerAnnulation}
                  disabled={annulLoading}
                  style={{
                    padding: '9px 22px', borderRadius: radius.sm, cursor: annulLoading ? 'not-allowed' : 'pointer',
                    border: 'none', background: '#c62828',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.15s', opacity: annulLoading ? 0.75 : 1,
                    boxShadow: '0 4px 12px rgba(198,40,40,0.35)',
                  }}
                  onMouseEnter={e => { if (!annulLoading) e.currentTarget.style.background = '#b71c1c' }}
                  onMouseLeave={e => { if (!annulLoading) e.currentTarget.style.background = '#c62828' }}
                >
                  {annulLoading ? (
                    <>
                      <span style={{
                        width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        display: 'inline-block', animation: 'spin 0.6s linear infinite',
                      }} />
                      Annulation...
                    </>
                  ) : (
                    <>✕ Oui, annuler le RDV</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Animations CSS */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
        @keyframes popIn   { from { opacity: 0; transform: translate(-50%, -50%) scale(0.85) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}
