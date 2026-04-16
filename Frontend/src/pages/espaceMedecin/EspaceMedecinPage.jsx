import { useState, useEffect, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, radius, shadows } from '../../theme'
import { patientApi, visiteApi, rendezVousApi, salleAttenteApi, personnelApi, medecinTarifApi, hospitalApi } from '../../api'
import { showToast } from '../../components/ui/Toast'
import RdvRapideModal from './RdvRapideModal'

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
const fmtTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
const todayISO = () => new Date().toISOString().split('T')[0]

const initiales = (nom = '') => {
  const parts = nom.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
}

// ── Mock arrêts de travail ────────────────────────────────────────────────────
const MOCK_ARRETS = [
  { id: 1, ref: 'AT-2024-001', motif: 'Maladie chronique',   date_debut: '15/01/2024', date_fin: '22/01/2024', status: 'Expiré' },
  { id: 2, ref: 'AT-2024-008', motif: 'Accident de travail', date_debut: '10/03/2024', date_fin: '10/04/2024', status: 'Expiré' },
  { id: 3, ref: 'AT-2025-002', motif: 'Chirurgie',           date_debut: '05/02/2025', date_fin: '20/02/2025', status: 'Expiré' },
]

const SESSIONS = [
  { value: '', label: 'Toutes sessions' },
  { value: 'matin',      label: 'Matin' },
  { value: 'apres-midi', label: 'Après-midi' },
  { value: 'soir',       label: 'Soir' },
  { value: 'urgence',    label: 'Urgence' },
]

// ── Status map ────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  'En attente': { bg: '#fff3e0', color: '#f57c00', dot: '#f57c00' },
  'En cours':   { bg: '#e3f2fd', color: '#1565c0', dot: '#1565c0' },
  'Terminé':    { bg: '#e8f5e9', color: '#2e7d32', dot: '#2e7d32' },
  'Annulé':     { bg: '#fdecea', color: '#c62828', dot: '#c62828' },
  'Confirmé':   { bg: '#e8f5e9', color: '#2e7d32', dot: '#2e7d32' },
  'Absent':     { bg: '#f3e5f5', color: '#7b1fa2', dot: '#7b1fa2' },
}

function SBadge({ status }) {
  const s = STATUS_MAP[status] || { bg: '#f5f5f5', color: '#757575', dot: '#9e9e9e' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: radius.full,
      background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

function PayBadge({ statut }) {
  const map = {
    'Payé':     { bg: '#e8f5e9', color: '#2e7d32' },
    'Non payé': { bg: '#fdecea', color: '#c62828' },
    'Partiel':  { bg: '#fff3e0', color: '#f57c00' },
  }
  const s = map[statut] || { bg: '#f5f5f5', color: '#757575' }
  return (
    <span style={{ padding: '2px 8px', borderRadius: radius.full, background: s.bg, color: s.color, fontSize: 10, fontWeight: 700 }}>
      {statut || 'Non payé'}
    </span>
  )
}

// ── Bouton action ──────────────────────────────────────────────────────────────
function ABtn({ label, c, disabled, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      disabled={disabled} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '6px 14px', borderRadius: radius.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1.5px solid ${c}`, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
        background: h && !disabled ? c : `${c}18`,
        color: h && !disabled ? '#fff' : c,
        opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
      }}
    >{label}</button>
  )
}

// ── En-tête panneau droit ─────────────────────────────────────────────────────
function PanelHead({ icon, title, count, extra }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
      padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: `${radius.lg} ${radius.lg} 0 0`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{title}</span>
        {count !== undefined && (
          <span style={{
            background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)',
            fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: radius.full,
          }}>{count}</span>
        )}
      </div>
      {extra}
    </div>
  )
}

// ── Mini tableau panneau droit ────────────────────────────────────────────────
function MiniTbl({ cols, rows, maxH, empty }) {
  return (
    <div style={{ overflowY: 'auto', maxHeight: maxH || 160 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} style={{
                padding: '7px 10px', textAlign: 'left',
                background: '#f8f9fa', color: '#6c757d',
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                borderBottom: '1px solid #e9ecef',
                position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} style={{ padding: '20px', textAlign: 'center', color: '#adb5bd', fontSize: 12 }}>
                {empty || 'Aucune donnée'}
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{
              background: i % 2 === 0 ? '#fff' : '#f8f9fa',
              borderBottom: '1px solid #f1f3f5',
            }}>
              {cols.map((c, j) => (
                <td key={j} style={{ padding: '7px 10px', fontSize: 11, color: '#343a40', verticalAlign: 'middle' }}>
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Avatar médecin ────────────────────────────────────────────────────────────
function AvatarMedecin({ medecin, size = 50 }) {
  const src = medecin?.photo_url || medecin?.photo || null
  const nom = medecin
    ? (medecin.patient_name || `${medecin.first_name || ''} ${medecin.last_name || ''}`.trim())
    : ''
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: src ? 'transparent' : colors.orange,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', border: '2px solid rgba(255,255,255,0.25)',
      boxShadow: '0 3px 12px rgba(255,118,49,0.45)',
    }}>
      {src
        ? <img src={src} alt={nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.42, color: '#fff' }}>👨‍⚕️</span>
      }
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════════════
export default function EspaceMedecinPage() {
  const navigate = useNavigate()

  // ── Horloge ───────────────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Médecin connecté ──────────────────────────────────────────────────────
  const [medecin, setMedecin] = useState(null)
  useEffect(() => {
    personnelApi.liste({ per_page: 5 })
      .then(res => {
        const list = res.data?.data?.data || res.data?.data || []
        // Prendre en priorité un médecin (rôle médecin/docteur) sinon le premier
        const doc = list.find(p =>
          (p.role || p.Role || '').toLowerCase().includes('med') ||
          (p.type || '').toLowerCase().includes('med') ||
          (p.specialite || '').length > 0
        ) || list[0]
        if (doc) setMedecin(doc)
      })
      .catch(() => {})
  }, [])

  // ── Type structure (public/privé) ─────────────────────────────────────────
  const [isPrivate, setIsPrivate] = useState(false)
  useEffect(() => {
    hospitalApi.liste({ per_page: 1 })
      .then(res => {
        const list = res.data?.data?.data ?? res.data?.data ?? []
        const h = list[0]
        if (h) setIsPrivate((h.type_cabinet || '').toLowerCase().includes('priv'))
      })
      .catch(() => {})
  }, [])

  // ── Revenus médecin ────────────────────────────────────────────────────────
  const [revenus,       setRevenus]       = useState(null)
  const [loadingRev,    setLoadingRev]    = useState(false)
  const [revFilter,     setRevFilter]     = useState({ dateDebut: '', dateFin: '', statut: '' })

  const loadRevenus = () => {
    const medecinId = medecin?.user_id || medecin?.id
    if (!medecinId || !isPrivate) return
    setLoadingRev(true)
    medecinTarifApi.revenus(medecinId, {
      date_debut:       revFilter.dateDebut || undefined,
      date_fin:         revFilter.dateFin   || undefined,
      statut_paiement:  revFilter.statut    || undefined,
    })
      .then(r => setRevenus(r.data?.data || null))
      .catch(() => setRevenus(null))
      .finally(() => setLoadingRev(false))
  }
  useEffect(() => { if (isPrivate && medecin) loadRevenus() }, [isPrivate, medecin])

  // ── RDV Rapide modal ──────────────────────────────────────────────────────
  const [rdvRapideOpen, setRdvRapideOpen] = useState(false)
  const [rdvEdit,       setRdvEdit]       = useState(null)   // RDV à modifier

  // ── Données ────────────────────────────────────────────────────────────────
  const [patients,   setPatients]   = useState([])
  const [selected,   setSelected]   = useState(null)
  const [historique, setHistorique] = useState([])
  const [rdvDuJour,  setRdvDuJour]  = useState([])
  const [loading,    setLoading]    = useState(false)
  const [loadingR,   setLoadingR]   = useState(false)

  // ── Filtres ───────────────────────────────────────────────────────────────
  const [sId,     setSId]     = useState('')
  const [sMob,    setSMob]    = useState('')
  const [sNom,    setSNom]    = useState('')
  const [session, setSession] = useState('')
  const [fStatut, setFStatut] = useState('attente')
  const [footerTab, setFooterTab] = useState('salle-attente')

  // ── Chargement liste patients ─────────────────────────────────────────────
  const loadPatients = async () => {
    setLoading(true)
    setSelected(null)
    try {
      if (footerTab === 'salle-attente') {
        const res = await salleAttenteApi.liste()
        const raw = res.data?.data || res.data || []
        const arr = Array.isArray(raw) ? raw : (raw.data || [])
        setPatients(arr.map(item => {
          const p = item.patient || {}
          return {
            id:         item.id,
            patient_id: p.patient_id || p.id || item.patient_id,
            nom:        p.patient_name
              || `${p.first_name || ''} ${p.last_name || ''}`.trim()
              || item.nom || '—',
            telephone:  p.mobile_number || p.contact_number || item.telephone || '—',
            service:    item.motif || item.service || item.type_consultation || 'Consultation',
            paiement:   item.paiement || 'Non payé',
            statut:     (item.statut === 1 || item.statut === 'vu') ? 'Terminé' : 'En attente',
            heure:      item.created_at ? fmtTime(item.created_at) : '—',
          }
        }))
      } else {
        const res = await patientApi.liste({ per_page: 80 })
        const raw = res.data?.data?.data || res.data?.data || []
        setPatients(raw.map(p => ({
          id:         p.id,
          patient_id: p.patient_id || p.id,
          nom:        p.patient_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || '—',
          telephone:  p.mobile_number || p.contact_number || '—',
          service:    'Consultation',
          paiement:   (p.pending_amount > 0) ? 'Non payé' : 'Payé',
          statut:     'En attente',
          heure:      '—',
        })))
      }
    } catch {
      showToast('Erreur chargement patients', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Chargement détails du patient sélectionné ─────────────────────────────
  const loadDetails = async (pid) => {
    if (!pid) return
    setLoadingR(true)
    try {
      const [vRes, rRes] = await Promise.all([
        visiteApi.liste({ patient_id: pid, per_page: 20 }),
        rendezVousApi.liste({ patient_id: pid, date_debut: todayISO(), date_fin: todayISO() }),
      ])
      const visites = vRes.data?.data?.data || vRes.data?.data || []
      const rdvs    = rRes.data?.data?.data || rRes.data?.data || []
      setHistorique(visites.map(v => ({
        id:           v.id,
        date:         fmtDate(v.date_visite || v.created_at),
        consultation: v.motif || v.type_visite || v.consultation || '—',
        prix:         v.prix  != null ? `${Number(v.prix).toLocaleString('fr-FR')} F` : '—',
        solde:        v.solde != null ? `${Number(v.solde).toLocaleString('fr-FR')} F` : '0 F',
      })))
      setRdvDuJour(rdvs.map(r => {
        const rp = r.patient || {}
        return {
          _raw:        r,
          id:          r.appointment_id || r.id,
          heure_debut: r.heure_debut || r.start_time || '—',
          heure_fin:   r.heure_fin   || r.end_time   || '—',
          nom:         rp.patient_name
            || `${rp.first_name || ''} ${rp.last_name || ''}`.trim()
            || '—',
          raison:      r.motif || r.raison || '—',
          statut:      r.statut_app === 1 ? 'Confirmé' : r.statut_app === 2 ? 'Annulé' : 'En attente',
        }
      }))
    } catch { /* silencieux */ } finally {
      setLoadingR(false)
    }
  }

  useEffect(() => { loadPatients() }, [footerTab])
  useEffect(() => {
    if (selected) loadDetails(selected.patient_id || selected.id)
    else { setHistorique([]); setRdvDuJour([]) }
  }, [selected])

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...patients]
    if (fStatut === 'attente') list = list.filter(p => p.statut === 'En attente')
    if (fStatut === 'vue')     list = list.filter(p => p.statut === 'Terminé')
    if (sNom.trim()) list = list.filter(p => p.nom.toLowerCase().includes(sNom.toLowerCase()))
    if (sMob.trim()) list = list.filter(p => p.telephone.includes(sMob))
    if (sId.trim())  list = list.filter(p => String(p.patient_id || p.id).includes(sId))
    return list
  }, [patients, fStatut, sNom, sMob, sId])

  // ── Groupement par patient (rupture) ──────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map()
    filtered.forEach(item => {
      const key = item.patient_id || item.id
      if (!map.has(key)) {
        map.set(key, { patient_id: key, nom: item.nom, telephone: item.telephone, services: [] })
      }
      map.get(key).services.push(item)
    })
    return Array.from(map.values())
  }, [filtered])

  const clearFilters = () => { setSId(''); setSMob(''); setSNom(''); setSession(''); setFStatut('attente') }

  // ── Données header ────────────────────────────────────────────────────────
  const dayName   = now.toLocaleDateString('fr-FR', { weekday: 'long' })
  const dateStr   = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr   = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const nbAttente = patients.filter(p => p.statut === 'En attente').length
  const nbVus     = patients.filter(p => p.statut === 'Terminé').length

  const medecinNom  = medecin
    ? `Dr. ${medecin.first_name || ''} ${medecin.last_name || ''}`.replace(/\s+/g, ' ').trim()
    : 'Dr. Médecin'
  const medecinSpec = medecin?.specialite || medecin?.specialité || medecin?.fonction || 'Médecin Généraliste'

  const FOOTER_TABS = [
    { key: 'hospitalise',   label: 'Patient Hospitalisé', icon: '🛏️', route: '/hospitalisation' },
    { key: 'salle-attente', label: "Salle d'Attente",     icon: '⏳', route: null },
    { key: 'patients',      label: 'Patients',            icon: '👥', route: '/patients' },
    { key: 'planification', label: 'Planification',       icon: '📅', route: '/planning' },
    { key: 'rdv',           label: 'Rendez-vous',         icon: '📌', route: '/rendezvous' },
    ...(isPrivate ? [{ key: 'revenus', label: 'Mes Revenus', icon: '💰', route: null }] : []),
  ]

  // ── Input recherche ───────────────────────────────────────────────────────
  function SearchInput({ label, value, onChange, placeholder }) {
    return (
      <div style={{ flex: '1 1 120px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#adb5bd', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {label}
        </div>
        <input
          value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            border: '1.5px solid #dee2e6', borderRadius: radius.sm,
            padding: '7px 10px', fontSize: 12, color: '#343a40', outline: 'none',
            transition: 'border-color 0.15s', background: '#fff',
          }}
          onFocus={e => e.target.style.borderColor = colors.bleu}
          onBlur={e  => e.target.style.borderColor = '#dee2e6'}
        />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ══════════════════════════ HEADER ══════════════════════════════════ */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
        borderRadius: radius.lg, padding: '16px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: shadows.md, flexWrap: 'wrap', gap: 14,
      }}>

        {/* Médecin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <AvatarMedecin medecin={medecin} size={52} />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, lineHeight: 1.25 }}>
              {medecinNom}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>
              {medecinSpec}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1 }}>
              Espace Médecin · Tableau de bord clinique
            </div>
          </div>
        </div>

        {/* Compteurs */}
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'En attente', val: nbAttente,       color: '#f57c00', bg: 'rgba(245,124,0,0.15)',     border: 'rgba(245,124,0,0.3)' },
            { label: 'Consultés',  val: nbVus,           color: '#4caf50', bg: 'rgba(76,175,80,0.15)',     border: 'rgba(76,175,80,0.3)' },
            { label: 'Total',      val: patients.length, color: 'rgba(255,255,255,0.8)', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)' },
          ].map(s => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '7px 16px',
              background: s.bg, borderRadius: radius.md, border: `1px solid ${s.border}`,
            }}>
              <div style={{ color: s.color, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Horloge + cloche */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: radius.md,
            padding: '9px 17px', textAlign: 'right',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 21, letterSpacing: 1.2, fontVariantNumeric: 'tabular-nums' }}>
              {timeStr}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              {dayName.charAt(0).toUpperCase() + dayName.slice(1)} · {dateStr}
            </div>
          </div>
          <div
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => showToast(`${nbAttente} patient(s) en attente de consultation`)}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🔔</div>
            {nbAttente > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: colors.orange, color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 6px rgba(0,0,0,0.35)',
              }}>{Math.min(nbAttente, 9)}</span>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════ CORPS ════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

        {/* ── PANNEAU GAUCHE (liste patients) ─────────────────────────────── */}
        <div style={{ flex: '0 0 58%', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Barre de recherche */}
          <div style={{
            background: '#fff', borderRadius: radius.lg,
            padding: '14px 16px', boxShadow: shadows.sm,
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <SearchInput label="Patient ID"  value={sId}  onChange={setSId}  placeholder="ex: PAT-1042" />
              <SearchInput label="Téléphone"   value={sMob} onChange={setSMob} placeholder="+221 7x..." />
              <SearchInput label="Nom Patient" value={sNom} onChange={setSNom} placeholder="Nom ou prénom..." />
              <div style={{ flex: '1 1 120px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#adb5bd', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Session
                </div>
                <select
                  value={session} onChange={e => setSession(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1.5px solid #dee2e6', borderRadius: radius.sm,
                    padding: '7px 10px', fontSize: 12, color: '#343a40',
                    background: '#fff', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {SESSIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[
                  { key: 'attente', label: '⏳ En Attente', c: '#f57c00' },
                  { key: 'vue',     label: '✓ Vus',         c: '#2e7d32' },
                  { key: 'tous',    label: '≡ Tous',         c: colors.bleu },
                ].map(f => (
                  <button key={f.key} onClick={() => setFStatut(f.key)} style={{
                    padding: '5px 13px', borderRadius: radius.full, cursor: 'pointer',
                    border: `1.5px solid ${fStatut === f.key ? f.c : '#dee2e6'}`,
                    background: fStatut === f.key ? f.c : '#fff',
                    color: fStatut === f.key ? '#fff' : '#6c757d',
                    fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                  }}>{f.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#6c757d' }}>
                  <strong style={{ color: colors.bleu }}>{grouped.length}</strong> patient(s) ·{' '}
                  <strong style={{ color: colors.bleu }}>{filtered.length}</strong> service(s)
                </span>
                <button onClick={clearFilters} style={{
                  padding: '5px 12px', borderRadius: radius.sm, cursor: 'pointer',
                  border: '1.5px solid #dee2e6', background: '#f8f9fa',
                  color: '#6c757d', fontSize: 11, fontWeight: 700,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e9ecef'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8f9fa'}
                >↺ Effacer</button>
                <button onClick={loadPatients} style={{
                  padding: '5px 14px', borderRadius: radius.sm, cursor: 'pointer',
                  border: `1.5px solid ${colors.bleu}`, background: colors.bleu,
                  color: '#fff', fontSize: 11, fontWeight: 700,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#003f7a'}
                  onMouseLeave={e => e.currentTarget.style.background = colors.bleu}
                >🔍 Rechercher</button>
              </div>
            </div>
          </div>

          {/* Tableau avec rupture par patient */}
          <div style={{
            background: '#fff', borderRadius: radius.lg,
            boxShadow: shadows.sm, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* En-tête */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
              padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>📋 Liste des Patients</span>
                <span style={{
                  background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)',
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: radius.full,
                }}>
                  {grouped.length} patient{grouped.length > 1 ? 's' : ''} · {filtered.length} service{filtered.length > 1 ? 's' : ''}
                </span>
              </div>
              <button onClick={loadPatients} style={{
                padding: '4px 10px', borderRadius: radius.sm, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 10, fontWeight: 600,
              }}>↺ Actualiser</button>
            </div>

            {/* Corps tableau */}
            <div style={{ overflowY: 'auto', maxHeight: 380 }}>
              {loading ? (
                <div style={{ padding: 50, textAlign: 'center', color: '#adb5bd', fontSize: 13 }}>
                  Chargement en cours...
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['', 'N°', 'Patient', 'Téléphone', 'Service', 'Paiement', 'Statut', 'Heure'].map((h, i) => (
                        <th key={i} style={{
                          padding: '9px 12px', textAlign: 'left',
                          background: '#f1f3f5', color: '#6c757d',
                          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                          borderBottom: '2px solid #dee2e6',
                          position: 'sticky', top: 0, zIndex: 1, whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#adb5bd', fontSize: 13 }}>
                          Aucun patient trouvé
                        </td>
                      </tr>
                    ) : grouped.map((group, gi) => (
                      <Fragment key={`grp-${group.patient_id}-${gi}`}>

                        {/* ── Ligne rupture patient ── */}
                        <tr style={{
                          background: `${colors.bleu}09`,
                          borderTop: gi > 0 ? `2px solid ${colors.bleu}1a` : 'none',
                        }}>
                          {/* N° */}
                          <td style={{ padding: '9px 12px', color: '#6c757d', fontSize: 11, fontWeight: 700, width: 40 }}>
                            {gi + 1}
                          </td>
                          {/* Patient + Téléphone (colSpan 2) */}
                          <td colSpan={2} style={{ padding: '9px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                background: colors.bleu,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 13, fontWeight: 800,
                              }}>
                                {initiales(group.nom)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#212529', fontSize: 13 }}>{group.nom}</div>
                                <div style={{ fontSize: 10, color: '#6c757d', marginTop: 1 }}>{group.telephone}</div>
                              </div>
                            </div>
                          </td>
                          {/* Nb services */}
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: radius.full, fontSize: 10, fontWeight: 700,
                              background: `${colors.bleu}18`, color: colors.bleu,
                            }}>
                              {group.services.length} service{group.services.length > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td colSpan={4}></td>
                        </tr>

                        {/* ── Sous-lignes services ── */}
                        {group.services.map((svc, si) => {
                          const sel = selected?.id === svc.id
                          const selectRow = () => setSelected({ ...svc, nom: group.nom, telephone: group.telephone })
                          return (
                            <tr
                              key={`svc-${svc.id}`}
                              onClick={selectRow}
                              style={{
                                background: sel ? `${colors.orange}14` : si % 2 === 0 ? '#fff' : '#fafbfc',
                                cursor: 'pointer',
                                borderBottom: `1px solid ${sel ? colors.orange + '30' : '#f1f3f5'}`,
                                borderLeft: sel ? `4px solid ${colors.orange}` : '4px solid transparent',
                                transition: 'background 0.12s, border-left 0.12s',
                              }}
                              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = `${colors.bleu}07` }}
                              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = si % 2 === 0 ? '#fff' : '#fafbfc' }}
                            >
                              {/* Radio sélection */}
                              <td style={{ padding: '8px 10px', paddingLeft: 18, width: 32 }} onClick={e => { e.stopPropagation(); selectRow() }}>
                                <div style={{
                                  width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel ? colors.orange : '#ced4da'}`,
                                  background: sel ? colors.orange : '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.15s', flexShrink: 0,
                                }}>
                                  {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                                </div>
                              </td>
                              {/* └ index */}
                              <td style={{ padding: '8px 12px', paddingLeft: 10, color: '#adb5bd', fontSize: 10 }}>
                                └ {si + 1}
                              </td>
                              {/* Icône service (col Patient) */}
                              <td style={{ padding: '8px 12px', paddingLeft: 10 }}>
                                <div style={{
                                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                                  background: sel ? colors.orange : '#e9ecef',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, transition: 'background 0.1s',
                                }}>🩺</div>
                              </td>
                              {/* Téléphone col (vide) */}
                              <td></td>
                              {/* Service */}
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ fontSize: 12, color: sel ? colors.orange : '#495057', fontWeight: sel ? 700 : 500 }}>
                                  {svc.service}
                                </span>
                              </td>
                              {/* Paiement */}
                              <td style={{ padding: '8px 12px' }}>
                                <PayBadge statut={svc.paiement} />
                              </td>
                              {/* Statut */}
                              <td style={{ padding: '8px 12px' }}>
                                <SBadge status={svc.statut} />
                              </td>
                              {/* Heure */}
                              <td style={{ padding: '8px 12px', fontSize: 11, color: '#6c757d', whiteSpace: 'nowrap' }}>
                                {svc.heure}
                              </td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Boutons d'action */}
            <div style={{
              padding: '10px 14px', borderTop: '1px solid #f1f3f5',
              background: '#f8f9fa', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
            }}>
              <ABtn label="📄 Fiche Att."   c={colors.bleu}  disabled={!selected} />
              <ABtn label="↔ Trans. Int."   c="#1976d2"      disabled={!selected} />
              <ABtn label="💳 Paiement"     c="#f57c00"      disabled={!selected} />
              <ABtn
                label="▶ Consultation"
                c="#2e7d32"
                disabled={!selected}
                onClick={() => selected && showToast(`Démarrage consultation : ${selected.nom} — ${selected.service}`)}
              />
              <div style={{ flex: 1 }} />
              {selected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 14px',
                    background: `${colors.bleu}0d`, borderRadius: radius.full,
                    border: `1px solid ${colors.bleu}20`,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.orange, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: colors.bleu, fontWeight: 700 }}>{selected.nom}</span>
                    <span style={{ fontSize: 10, color: '#6c757d' }}>—</span>
                    <span style={{ fontSize: 11, color: '#495057', fontWeight: 500 }}>{selected.service}</span>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    title="Désélectionner"
                    style={{
                      width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #dee2e6',
                      background: '#f8f9fa', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: '#6c757d', fontWeight: 700,
                      transition: 'all 0.15s', flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fdecea'; e.currentTarget.style.borderColor = '#c62828'; e.currentTarget.style.color = '#c62828' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = '#dee2e6'; e.currentTarget.style.color = '#6c757d' }}
                  >✕</button>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: '#adb5bd', fontStyle: 'italic' }}>
                  Sélectionnez un service pour activer les actions
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── PANNEAU DROIT (détails) ──────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

          {/* Historique consultations */}
          <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, overflow: 'hidden' }}>
            <PanelHead icon="📜" title="Historique des Consultations" count={historique.length} />
            <MiniTbl
              maxH={175}
              empty={selected ? (loadingR ? 'Chargement...' : 'Aucun historique') : 'Sélectionnez un service'}
              cols={[
                { key: 'date',         label: 'Date' },
                { key: 'consultation', label: 'Type / Motif' },
                { key: 'prix',         label: 'Montant' },
                { key: 'solde',        label: 'Solde' },
                {
                  key: 'fiche', label: 'Fiche',
                  render: () => (
                    <button style={{
                      padding: '2px 8px', borderRadius: radius.sm, cursor: 'pointer',
                      border: `1px solid ${colors.bleu}`, background: `${colors.bleu}0d`,
                      color: colors.bleu, fontSize: 9, fontWeight: 700,
                    }}>Voir</button>
                  ),
                },
              ]}
              rows={historique}
            />
          </div>

          {/* Arrêt de travail */}
          <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, overflow: 'hidden' }}>
            <PanelHead
              icon="🧾"
              title="Arrêt de Travail"
              extra={
                <button style={{
                  padding: '3px 10px', borderRadius: radius.sm, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                }}>+ Ajouter</button>
              }
            />
            <MiniTbl
              maxH={145}
              empty={selected ? 'Aucun arrêt de travail' : 'Sélectionnez un service'}
              cols={[
                { key: 'ref',        label: 'Réf.' },
                { key: 'motif',      label: 'Motif' },
                { key: 'date_debut', label: 'Début' },
                { key: 'date_fin',   label: 'Fin' },
                {
                  key: 'status', label: 'Statut',
                  render: row => (
                    <span style={{
                      padding: '2px 8px', borderRadius: radius.full, fontSize: 9, fontWeight: 700,
                      background: row.status === 'Actif' ? '#e8f5e9' : '#fdecea',
                      color:      row.status === 'Actif' ? '#2e7d32' : '#c62828',
                    }}>{row.status}</span>
                  ),
                },
              ]}
              rows={selected ? MOCK_ARRETS : []}
            />
          </div>

          {/* Rendez-vous du jour */}
          <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, overflow: 'hidden' }}>
            <PanelHead
              icon="📅"
              title="Rendez-vous Aujourd'hui"
              count={rdvDuJour.length}
              extra={
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{
                    padding: '3px 8px', borderRadius: radius.sm, cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 700,
                  }}>Liste</button>
                  <button
                    onClick={() => {
                      if (!selected) { showToast('Sélectionnez d\'abord un patient', 'error'); return }
                      setRdvRapideOpen(true)
                    }}
                    style={{
                      padding: '3px 8px', borderRadius: radius.sm, cursor: 'pointer',
                      border: `1px solid ${colors.orange}80`, background: `${colors.orange}30`,
                      color: colors.orange, fontSize: 10, fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = colors.orange; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${colors.orange}30`; e.currentTarget.style.color = colors.orange }}
                  >+ Nouveau</button>
                </div>
              }
            />
            <MiniTbl
              maxH={190}
              empty={selected ? (loadingR ? 'Chargement...' : "Aucun RDV aujourd'hui") : 'Sélectionnez un service'}
              cols={[
                { key: 'heure_debut', label: 'Début' },
                { key: 'heure_fin',   label: 'Fin' },
                { key: 'nom',         label: 'Patient' },
                { key: 'raison',      label: 'Raison' },
                { key: 'statut',      label: 'Statut', render: row => <SBadge status={row.statut} /> },
                {
                  key: 'actions', label: 'Actions',
                  render: (row) => (
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button
                        onClick={() => { setRdvEdit(row._raw); setRdvRapideOpen(true) }}
                        style={{
                          padding: '2px 6px', borderRadius: radius.sm, cursor: 'pointer',
                          border: `1px solid ${colors.bleu}`, background: `${colors.bleu}0d`,
                          color: colors.bleu, fontSize: 9, fontWeight: 700,
                        }}>Modifier</button>
                      <button style={{
                        padding: '2px 6px', borderRadius: radius.sm, cursor: 'pointer',
                        border: '1px solid #2e7d32', background: '#2e7d320d',
                        color: '#2e7d32', fontSize: 9, fontWeight: 700,
                      }}>Visite</button>
                    </div>
                  ),
                },
              ]}
              rows={rdvDuJour}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════ PANEL REVENUS (privé) ═══════════════════ */}
      {footerTab === 'revenus' && isPrivate && (
        <RevenusPanel
          revenus={revenus}
          loading={loadingRev}
          filter={revFilter}
          setFilter={setRevFilter}
          onRefresh={loadRevenus}
        />
      )}

      {/* ══════════════════════════ FOOTER NAVIGATION ════════════════════════ */}
      <div style={{
        background: '#fff', borderRadius: radius.lg,
        boxShadow: shadows.sm, padding: '8px 10px', display: 'flex', gap: 6,
      }}>
        {FOOTER_TABS.map(tab => {
          const active = footerTab === tab.key && !tab.route
          return (
            <button
              key={tab.key}
              onClick={() => tab.route ? navigate(tab.route) : setFooterTab(tab.key)}
              style={{
                flex: '1 1 0', padding: '9px 10px', border: 'none',
                borderRadius: radius.sm, cursor: 'pointer',
                background: active ? colors.bleu : '#f1f3f5',
                color: active ? '#fff' : '#6c757d',
                fontWeight: active ? 700 : 600, fontSize: 11,
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                whiteSpace: 'nowrap',
                borderTop: active ? `2px solid ${colors.orange}` : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#dee2e6' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#f1f3f5' }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── RDV Rapide ── */}
      <RdvRapideModal
        open={rdvRapideOpen}
        onClose={() => { setRdvRapideOpen(false); setRdvEdit(null) }}
        patient={selected}
        medecin={medecin}
        rdv={rdvEdit}
        onSaved={() => {
          setRdvEdit(null)
          if (selected) loadDetails(selected.patient_id || selected.id)
        }}
      />

    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PANEL REVENUS MÉDECIN (structure privée uniquement)
// ════════════════════════════════════════════════════════════════════════════
function RevenusPanel({ revenus, loading, filter, setFilter, onRefresh }) {
  const items = revenus?.items || []
  const fmtM  = (n) => n != null ? Number(n).toLocaleString('fr-FR') + ' F' : '0 F'

  const STATS = revenus ? [
    { label: 'Total facturé', val: fmtM(revenus.total_facture), color: colors.bleu,   icon: '🧾' },
    { label: 'Total payé',    val: fmtM(revenus.total_paye),    color: colors.success, icon: '✅' },
    { label: 'Impayé',        val: fmtM(revenus.total_impaye),  color: colors.danger,  icon: '⚠️' },
    { label: 'Nb actes',      val: revenus.nb_actes || 0,       color: colors.orange,  icon: '📋' },
  ] : []

  return (
    <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, overflow: 'hidden', border: `1px solid ${colors.gray200}` }}>
      <div style={{ background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>💰</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Mes Revenus — Structure Privée</span>
        </div>
        <button onClick={onRefresh} style={{ padding: '4px 12px', borderRadius: radius.sm, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>🔄 Actualiser</button>
      </div>

      <div style={{ padding: '10px 18px', background: colors.gray50, borderBottom: `1px solid ${colors.gray200}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {[{ key: 'dateDebut', label: 'Du' }, { key: 'dateFin', label: 'Au' }].map(f => (
          <div key={f.key}>
            <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</div>
            <input type="date" value={filter[f.key]} onChange={e => setFilter(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '6px 10px', fontSize: 11, outline: 'none', background: '#fff' }} />
          </div>
        ))}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase', marginBottom: 3 }}>Statut</div>
          <select value={filter.statut} onChange={e => setFilter(p => ({ ...p, statut: e.target.value }))}
            style={{ border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm, padding: '6px 10px', fontSize: 11, background: '#fff', cursor: 'pointer' }}>
            <option value="">Tous</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
          </select>
        </div>
        <button onClick={onRefresh} style={{ padding: '7px 16px', borderRadius: radius.sm, border: 'none', background: colors.bleu, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>🔍 Filtrer</button>
      </div>

      {!loading && revenus && (
        <div style={{ display: 'flex', gap: 10, padding: '10px 18px', background: '#fff', borderBottom: `1px solid ${colors.gray100}` }}>
          {STATS.map(s => (
            <div key={s.label} style={{ flex: 1, padding: '10px 14px', borderRadius: radius.md, background: `${s.color}0a`, border: `1px solid ${s.color}20`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 9, color: colors.gray500, textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: colors.gray500 }}>Chargement...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: colors.gray500 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>💰</div>
            Aucun acte facturé sur cette période
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Patient', 'Service', 'Montant', 'Payé', 'Solde', 'Statut'].map((h, i) => (
                  <th key={i} style={{
                    padding: '8px 12px', background: colors.gray50, color: colors.gray600,
                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    borderBottom: `2px solid ${colors.gray200}`, whiteSpace: 'nowrap',
                    textAlign: i >= 3 ? 'right' : 'left', position: 'sticky', top: 0, zIndex: 1,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const total   = Number(item.total_price    || 0)
                const paye    = Number(item.paid_amount    || 0)
                const solde   = Number(item.pending_amount || 0)
                const estPaye = solde <= 0
                return (
                  <tr key={item.detail_id || i} style={{ background: i % 2 === 0 ? '#fff' : colors.gray50, borderBottom: `1px solid ${colors.gray100}` }}>
                    <td style={{ padding: '9px 12px', fontSize: 11, color: colors.gray600, whiteSpace: 'nowrap' }}>
                      {item.bill_date ? new Date(item.bill_date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, color: colors.bleu }}>{item.patient_name || item.patient_complet || '—'}</td>
                    <td style={{ padding: '9px 12px', fontSize: 11, color: colors.gray700 }}>{item.service_nom || '—'}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 700, color: colors.orange, textAlign: 'right' }}>{fmtM(total)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 11, fontWeight: 600, color: colors.success, textAlign: 'right' }}>{fmtM(paye)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 11, fontWeight: 600, color: solde > 0 ? colors.danger : colors.gray400, textAlign: 'right' }}>{fmtM(solde)}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '2px 8px', borderRadius: radius.full, fontSize: 9, fontWeight: 700,
                        background: estPaye ? colors.successBg : colors.dangerBg,
                        color: estPaye ? colors.success : colors.danger,
                      }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: estPaye ? colors.success : colors.danger }} />
                        {estPaye ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
