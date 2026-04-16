import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  format, addWeeks, subWeeks, startOfWeek, addDays,
  isSameDay, isToday, isPast, isBefore, parseISO,
  addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfDay, isWithinInterval,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { rendezVousApi, personnelApi, horaireApi } from '../../api'
import { colors, radius, shadows, spacing } from '../../theme'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'
import NouveauRendezVousModal from './NouveauRendezVousModal'
import ListeRendezVousModal from './ListeRendezVousModal'

// ── Constantes ──────────────────────────────────────────────────────────────
const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const JOURS_COMPLETS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOURS_START = 7
const HOURS_END   = 21
const SLOT_H = 56     // px par heure
const PALETTE_RDV = [
  '#1565c0','#2e7d32','#ad1457','#f57c00','#6a1b9a',
  '#00838f','#4e342e','#0277bd','#c62828','#37474f',
]

const STATUTS = {
  0: { label: 'En attente',  color: '#f57c00', bg: '#fff3e0' },
  1: { label: 'Confirmé',    color: '#1565c0', bg: '#e3f2fd' },
  2: { label: 'Annulé',      color: '#c62828', bg: '#fdecea' },
  3: { label: 'Terminé',     color: '#2e7d32', bg: '#e8f5e9' },
  4: { label: 'Absent',      color: '#6a1b9a', bg: '#f3e5f5' },
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const timeStr = (t) => {
  if (!t) return ''
  const d = new Date(t)
  return isNaN(d) ? t.slice(11, 16) : format(d, 'HH:mm')
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const pxFromTime = (hhmm) => {
  const mins = toMinutes(hhmm) - HOURS_START * 60
  return (mins / 60) * SLOT_H
}

const heightFromRange = (start, end) => {
  const mins = toMinutes(end) - toMinutes(start)
  return Math.max((mins / 60) * SLOT_H, 22)
}

// ── Composant Légende ────────────────────────────────────────────────────────
function Legende() {
  const items = [
    { color: '#b0bec5', label: 'Jours passés' },
    { color: '#80cbc4', label: 'Hors horaires' },
    { color: colors.orange, label: 'Sélection' },
    { color: '#1565c0', label: 'RDV confirmé' },
    { color: '#f57c00', label: 'En attente' },
    { color: '#c62828', label: 'Annulé' },
    { color: '#2e7d32', label: 'Terminé' },
  ]
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '10px 20px',
      padding: '10px 16px', background: colors.white,
      borderRadius: radius.md, boxShadow: shadows.sm,
      border: `1px solid ${colors.gray200}`,
    }}>
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: item.color, flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, color: colors.gray700, fontWeight: 500 }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Popup détail d'un RDV ────────────────────────────────────────────────────
function RdvDetailPopup({ rdv, onClose, onAnnuler, onModifier }) {
  if (!rdv) return null
  const statut = STATUTS[rdv.statut_app] ?? STATUTS[0]
  const start  = timeStr(rdv.start_time)
  const end    = timeStr(rdv.end_time)
  const nom    = rdv.patient_nom_complet?.trim() || rdv.nom_patient || 'Patient'
  const motif  = rdv.motif || rdv.raison || '—'
  const type   = rdv.type_consultation || '—'
  const date   = rdv.appointment_date
    ? new Date(rdv.appointment_date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const [annulLoading, setAnnulLoading] = useState(false)
  const [confirmAnnul, setConfirmAnnul] = useState(false)

  const doAnnuler = async () => {
    setAnnulLoading(true)
    try {
      await rendezVousApi.modifier(rdv.appointment_id || rdv.id, { statut_app: 2 })
      showToast('Rendez-vous annulé', 'success')
      onAnnuler?.()
      onClose()
    } catch {
      showToast('Erreur lors de l\'annulation', 'error')
    } finally {
      setAnnulLoading(false)
    }
  }

  const rows = [
    { icon: '👤', label: 'Patient',    val: nom },
    { icon: '📅', label: 'Date',       val: date.charAt(0).toUpperCase() + date.slice(1) },
    { icon: '🕐', label: 'Horaire',    val: `${start} → ${end}` },
    { icon: '📋', label: 'Motif',      val: motif },
    { icon: '🩺', label: 'Type',       val: type },
    { icon: '📞', label: 'Téléphone',  val: rdv.patient_mobile || rdv.mobile || '—' },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,20,50,0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 1200,
          animation: 'rdvFadeIn 0.15s ease',
        }}
      />

      {/* Panneau */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 420, maxWidth: '95vw',
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 24px 72px rgba(0,0,0,0.28)',
        zIndex: 1201,
        overflow: 'hidden',
        animation: 'rdvSlideUp 0.22s cubic-bezier(0.34,1.4,0.64,1)',
      }}>

        {/* En-tête coloré selon statut */}
        <div style={{
          background: `linear-gradient(135deg, ${statut.color}dd, ${statut.color}aa)`,
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>📅</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>
                Détails du Rendez-vous
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                marginTop: 3,
                padding: '2px 9px', borderRadius: 20,
                background: 'rgba(255,255,255,0.22)',
                color: '#fff', fontSize: 10, fontWeight: 700,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
                {statut.label}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,40,40,0.55)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >✕</button>
        </div>

        {/* Corps */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(({ icon, label, val }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 10px',
              borderRadius: 8,
              background: '#f8f9fa',
              border: '1px solid #eee',
            }}>
              <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 1 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#212529' }}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pied */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          background: '#fafafa',
        }}>
          {rdv.statut_app !== 2 && rdv.statut_app !== 3 && (
            <>
              {!confirmAnnul ? (
                <button
                  onClick={() => setConfirmAnnul(true)}
                  style={{
                    padding: '7px 16px', borderRadius: 7, cursor: 'pointer',
                    border: '1.5px solid #c62828', background: '#fdecea',
                    color: '#c62828', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#c62828'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fdecea'; e.currentTarget.style.color = '#c62828' }}
                >✕ Annuler le RDV</button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#c62828', fontWeight: 600 }}>Confirmer l'annulation ?</span>
                  <button
                    onClick={() => setConfirmAnnul(false)}
                    style={{ padding: '5px 12px', borderRadius: 6, cursor: 'pointer', border: '1px solid #dee2e6', background: '#f8f9fa', color: '#495057', fontSize: 11, fontWeight: 700 }}
                  >Non</button>
                  <button
                    onClick={doAnnuler}
                    disabled={annulLoading}
                    style={{ padding: '5px 12px', borderRadius: 6, cursor: 'pointer', border: 'none', background: '#c62828', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    {annulLoading
                      ? <span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'rdvSpin 0.6s linear infinite' }} />
                      : null}
                    Oui, annuler
                  </button>
                </div>
              )}
              <button
                onClick={() => { onClose(); onModifier?.(rdv) }}
                style={{
                  padding: '7px 18px', borderRadius: 7, cursor: 'pointer',
                  border: 'none', background: colors.bleu,
                  color: '#fff', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                  boxShadow: '0 3px 10px rgba(0,63,122,0.3)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#003f7a'}
                onMouseLeave={e => e.currentTarget.style.background = colors.bleu}
              >✏️ Modifier</button>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px', borderRadius: 7, cursor: 'pointer',
              border: '1.5px solid #dee2e6', background: '#f8f9fa',
              color: '#495057', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e9ecef'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8f9fa'}
          >Fermer</button>
        </div>
      </div>

      <style>{`
        @keyframes rdvFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rdvSlideUp { from { opacity: 0; transform: translate(-50%,-50%) scale(0.88) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
        @keyframes rdvSpin    { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}

// ── Bloc RDV dans le calendrier ──────────────────────────────────────────────
function RdvBlock({ rdv, onClick }) {
  const start  = timeStr(rdv.start_time)
  const end    = timeStr(rdv.end_time)
  const top    = pxFromTime(start)
  const h      = heightFromRange(start, end)
  const statut = STATUTS[rdv.statut_app] ?? STATUTS[0]
  const nom    = rdv.patient_nom_complet?.trim() || rdv.nom_patient || 'Patient'
  const motif  = rdv.motif || rdv.raison || ''

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(rdv) }}
      title={`${nom}${motif ? ' · ' + motif : ''} — ${start} à ${end}`}
      style={{
        position: 'absolute', left: 3, right: 3,
        top, height: h,
        background: statut.bg,
        border: `2px solid ${statut.color}`,
        borderLeft: `4px solid ${statut.color}`,
        borderRadius: 6,
        padding: '3px 6px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.12s, box-shadow 0.12s',
        zIndex: 2,
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.02)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)'
      }}
    >
      {/* Heure */}
      <div style={{ fontSize: 9, fontWeight: 700, color: statut.color, lineHeight: 1.3 }}>
        {start}–{end}
      </div>
      {/* Nom patient */}
      {h > 22 && (
        <div style={{
          fontSize: 10, color: colors.gray800, fontWeight: 700,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}>
          👤 {nom}
        </div>
      )}
      {/* Motif */}
      {h > 44 && motif && (
        <div style={{
          fontSize: 9, color: colors.gray600, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.3, fontStyle: 'italic',
        }}>
          📋 {motif}
        </div>
      )}
    </div>
  )
}

// ── Colonne d'un jour dans le calendrier semaine ─────────────────────────────
function JourColonne({ date, horaires, rdvs, onSlotClick, selectedSlot, jourIdx, onRdvClick }) {
  const past     = isBefore(startOfDay(date), startOfDay(new Date()))
  const today    = isToday(date)
  const totalH   = (HOURS_END - HOURS_START) * SLOT_H

  // Calculer les plages travaillées pour ce jour (JourSemaine ISO 1=lundi…7=dimanche)
  const dowIso   = date.getDay() === 0 ? 7 : date.getDay()
  // horaires = tableau de MedecinHoraire avec JourSemaine, HeureDebut, HeureFin, Statut
  const hJour    = horaires.filter(h => Number(h.JourSemaine) === dowIso && Number(h.Statut) === 1)

  const isWorking = (hour) => {
    // Si aucun horaire configuré pour ce jour, tout est cliquable
    if (hJour.length === 0) return true
    const hhmm = `${String(hour).padStart(2,'0')}:00`
    return hJour.some(h => {
      const s = (h.HeureDebut ?? '00:00').slice(0, 5)
      const e = (h.HeureFin   ?? '00:00').slice(0, 5)
      return hhmm >= s && hhmm < e
    })
  }

  return (
    <div style={{
      flex: 1, minWidth: 0, position: 'relative',
      borderLeft: `1px solid ${colors.gray200}`,
    }}>
      {/* Fond par heure */}
      {Array.from({ length: HOURS_END - HOURS_START }, (_, i) => {
        const hour    = HOURS_START + i
        const working = isWorking(hour)
        const isSelected = selectedSlot?.date === format(date, 'yyyy-MM-dd') &&
                           selectedSlot?.hour === hour

        return (
          <div
            key={hour}
            onClick={() => !past && working && onSlotClick(date, hour)}
            style={{
              height: SLOT_H,
              background: isSelected
                ? `${colors.orange}22`
                : past
                  ? '#eceff1'
                  : working
                    ? colors.white
                    : '#e0f7fa44',
              borderBottom: `1px solid ${colors.gray100}`,
              cursor: (!past && working) ? 'pointer' : 'default',
              transition: 'background 0.1s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!past && working && !isSelected)
                e.currentTarget.style.background = `${colors.orange}18`
            }}
            onMouseLeave={e => {
              if (!isSelected)
                e.currentTarget.style.background = past
                  ? '#eceff1'
                  : working ? colors.white : '#e0f7fa44'
            }}
          >
            {/* Ligne demi-heure */}
            <div style={{
              position: 'absolute', bottom: SLOT_H / 2, left: 0, right: 0,
              borderBottom: `1px dashed ${colors.gray200}`,
            }} />
          </div>
        )
      })}

      {/* RDV du jour */}
      {rdvs.map((rdv, i) => (
        <RdvBlock key={rdv.appointment_id ?? i} rdv={rdv} onClick={onRdvClick ?? (() => {})} />
      ))}

      {/* Indicateur maintenant */}
      {today && (() => {
        const now  = new Date()
        const hhmm = format(now, 'HH:mm')
        if (hhmm >= `${HOURS_START}:00` && hhmm < `${HOURS_END}:00`) {
          return (
            <div style={{
              position: 'absolute', left: 0, right: 0,
              top: pxFromTime(hhmm),
              height: 2, background: colors.danger, zIndex: 5,
              boxShadow: '0 0 6px rgba(198,40,40,0.6)',
            }}>
              <div style={{
                position: 'absolute', left: -4, top: -4,
                width: 10, height: 10, borderRadius: '50%',
                background: colors.danger,
              }} />
            </div>
          )
        }
      })()}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function RendezVousPage() {
  const [vue, setVue]             = useState('semaine')   // 'jour' | 'semaine' | 'mois'
  const [dateCourante, setDate]   = useState(new Date())
  const [medecins, setMedecins]   = useState([])
  const [medecinId, setMedecinId] = useState('')
  const [horaires, setHoraires]   = useState([])
  const [rdvs, setRdvs]           = useState([])
  const [loading, setLoading]     = useState(false)
  const [modalOpen, setModalOpen]       = useState(false)
  const [listeOpen, setListeOpen]       = useState(false)
  const [slotChoisi, setSlotChoisi] = useState(null)   // { date, heure }
  const [rdvDetail, setRdvDetail] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  // medecinId est une string (valeur du <select>), on le passe en Number aux API
  const medecinIdNum = medecinId ? Number(medecinId) : null

  // Semaine courante
  const lundi = useMemo(
    () => startOfWeek(dateCourante, { weekStartsOn: 1 }),
    [dateCourante]
  )
  const joursSemaine = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(lundi, i)),
    [lundi]
  )

  // ── Chargement médecins (staff_type = medecin) ───────────────────────────
  useEffect(() => {
    personnelApi.liste({ staff_type: 'medecin', per_page: 200 })
      .then(r => {
        const list = r.data?.data?.data ?? r.data?.data ?? []
        setMedecins(list)
        if (list.length > 0 && !medecinId) setMedecinId(String(list[0].id))
      })
      .catch(() => {})
  }, [])

  // ── Chargement horaires médecin ──────────────────────────────────────────
  // planningMedecin retourne { success, medecin, planning: [{jour, libelle, plages, actif}] }
  // On aplatit toutes les plages en un tableau unique pour JourColonne
  useEffect(() => {
    if (!medecinId) return
    horaireApi.planningMedecin(medecinId)
      .then(r => {
        const planning = r.data?.planning ?? []
        const plages = planning.flatMap(p => p.plages ?? [])
        setHoraires(plages)
      })
      .catch(() => setHoraires([]))
  }, [medecinId])

  // ── Chargement RDV semaine ───────────────────────────────────────────────
  const chargerRdvs = useCallback(() => {
    if (!medecinId) return
    setLoading(true)
    const dateDebut = format(lundi, 'yyyy-MM-dd')
    const dateFin   = format(addDays(lundi, 6), 'yyyy-MM-dd')
    rendezVousApi.liste({ medecin_id: medecinId, date_debut: dateDebut, date_fin: dateFin })
      .then(r => setRdvs(r.data?.data ?? []))
      .catch(() => setRdvs([]))
      .finally(() => setLoading(false))
  }, [medecinId, lundi])

  useEffect(() => { chargerRdvs() }, [chargerRdvs])

  // ── Clic sur un créneau ──────────────────────────────────────────────────
  const handleSlotClick = (date, hour) => {
    setSelectedSlot({ date: format(date, 'yyyy-MM-dd'), hour })
    const hhmm = `${String(hour).padStart(2,'0')}:00`
    setSlotChoisi({ date: format(date, 'yyyy-MM-dd'), heure: hhmm })
    setRdvDetail(null)
    setModalOpen(true)
  }

  // ── Clic sur un bloc RDV ─────────────────────────────────────────────────
  const handleRdvClick = (rdv) => {
    setRdvDetail(rdv)
  }

  // ── RDV filtrés par jour ─────────────────────────────────────────────────
  const rdvsDuJour = useCallback((date) => {
    return rdvs.filter(rdv => {
      const d = rdv.appointment_date
      if (!d) return false
      try {
        return isSameDay(parseISO(d.slice(0, 10)), date)
      } catch { return false }
    })
  }, [rdvs])

  // ── Navigation ──────────────────────────────────────────────────────────
  const naviguer = (dir) => {
    if (vue === 'semaine') setDate(dir > 0 ? addWeeks(dateCourante, 1) : subWeeks(dateCourante, 1))
    else if (vue === 'mois') setDate(dir > 0 ? addMonths(dateCourante, 1) : subMonths(dateCourante, 1))
    else setDate(addDays(dateCourante, dir))
  }

  const medecinSelectionne = medecins.find(m => String(m.id) === medecinId)

  // ── Titre de la période ──────────────────────────────────────────────────
  const titrePeriode = useMemo(() => {
    if (vue === 'semaine') {
      const fin = addDays(lundi, 6)
      return `Semaine du ${format(lundi, 'd MMM', { locale: fr })} au ${format(fin, 'd MMM yyyy', { locale: fr })}`
    }
    if (vue === 'mois') return format(dateCourante, 'MMMM yyyy', { locale: fr })
    return format(dateCourante, 'EEEE d MMMM yyyy', { locale: fr })
  }, [vue, dateCourante, lundi])

  // ── Stats rapides ────────────────────────────────────────────────────────
  const statsRdvs = useMemo(() => ({
    total:    rdvs.length,
    confirme: rdvs.filter(r => r.statut_app == 1).length,
    attente:  rdvs.filter(r => r.statut_app == 0).length,
    annule:   rdvs.filter(r => r.statut_app == 2).length,
  }), [rdvs])

  // ════════════════════════════════════════════════════════════════════════
  // RENDU
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>

      {/* ── Barre du haut ── */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
        borderRadius: radius.lg,
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        boxShadow: shadows.md,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: colors.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>📅</div>
          <div>
            <h1 style={{ margin: 0, color: colors.white, fontSize: 20, fontWeight: 800 }}>
              Réservation de Rendez-Vous
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              Gestion des plannings et créneaux médicaux
            </p>
          </div>
        </div>

        {/* Stats rapides */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Total', val: statsRdvs.total,    color: colors.white },
            { label: 'Confirmés', val: statsRdvs.confirme, color: '#81d4fa' },
            { label: 'En attente', val: statsRdvs.attente,  color: '#ffcc80' },
            { label: 'Annulés',   val: statsRdvs.annule,   color: '#ef9a9a' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: radius.md, padding: '8px 14px',
              textAlign: 'center', minWidth: 70,
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Boutons actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setListeOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.3)',
              color: colors.white, padding: '10px 18px',
              borderRadius: radius.md, cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            <span style={{ fontSize: 15 }}>📋</span> Liste des RDV
          </button>
          <button
            onClick={() => { setSlotChoisi(null); setRdvDetail(null); setModalOpen(true) }}
            style={{
              background: colors.orange, border: 'none',
              color: colors.white, padding: '10px 20px',
              borderRadius: radius.md, cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(255,118,49,0.4)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
            onMouseLeave={e => e.currentTarget.style.background = colors.orange}
          >
            <span style={{ fontSize: 16 }}>+</span> Nouveau RDV
          </button>
        </div>
      </div>

      {/* ── Barre de contrôles ── */}
      <div style={{
        background: colors.white, borderRadius: radius.md,
        padding: '12px 20px', boxShadow: shadows.sm,
        border: `1px solid ${colors.gray200}`,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        {/* Sélecteur médecin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.gray700, whiteSpace: 'nowrap' }}>
            Médecin :
          </label>
          <select
            value={medecinId}
            onChange={e => setMedecinId(e.target.value)}
            style={{
              border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
              padding: '7px 12px', fontSize: 13, color: colors.gray800,
              background: colors.white, cursor: 'pointer', minWidth: 200,
              outline: 'none', fontWeight: 500,
            }}
          >
            <option value="">-- Sélectionner un médecin --</option>
            {medecins.map(m => (
              <option key={m.id} value={String(m.id)}>
                Dr. {m.first_name} {m.last_name}
                {m.specialization ? ` — ${m.specialization}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Sélecteur vue */}
        <div style={{ display: 'flex', borderRadius: radius.md, overflow: 'hidden', border: `1.5px solid ${colors.gray300}` }}>
          {[
            { key: 'jour',    label: 'Jour' },
            { key: 'semaine', label: 'Semaine' },
            { key: 'mois',    label: 'Mois' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setVue(v.key)}
              style={{
                padding: '7px 16px', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: vue === v.key ? colors.bleu : colors.white,
                color: vue === v.key ? colors.white : colors.gray700,
                transition: 'all 0.15s',
              }}
            >{v.label}</button>
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn onClick={() => naviguer(-1)}>‹</NavBtn>
          <button
            onClick={() => setDate(new Date())}
            style={{
              padding: '7px 14px', border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.sm, cursor: 'pointer',
              fontSize: 12, fontWeight: 600, background: colors.white,
              color: colors.bleu, transition: 'all 0.15s',
            }}
          >Aujourd'hui</button>
          <NavBtn onClick={() => naviguer(1)}>›</NavBtn>
        </div>

        {/* Titre période */}
        <span style={{
          flex: 1, textAlign: 'center',
          fontSize: 14, fontWeight: 700,
          color: colors.orange, textTransform: 'capitalize',
        }}>
          {titrePeriode}
        </span>

        {/* Date picker */}
        <input
          type="date"
          value={format(dateCourante, 'yyyy-MM-dd')}
          onChange={e => e.target.value && setDate(new Date(e.target.value))}
          style={{
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            padding: '6px 10px', fontSize: 12, color: colors.gray700,
            cursor: 'pointer', outline: 'none',
          }}
        />
      </div>

      {/* ── Légende ── */}
      <Legende />

      {/* ── Corps du calendrier ── */}
      {loading ? <FullPageSpinner /> : (
        <div style={{
          flex: 1, background: colors.white,
          borderRadius: radius.lg, boxShadow: shadows.md,
          border: `1px solid ${colors.gray200}`,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {vue === 'semaine' && (
            <VueSemaine
              joursSemaine={joursSemaine}
              horaires={horaires}
              rdvsDuJour={rdvsDuJour}
              onSlotClick={handleSlotClick}
              selectedSlot={selectedSlot}
              onRdvClick={handleRdvClick}
            />
          )}
          {vue === 'jour' && (
            <VueJour
              date={dateCourante}
              horaires={horaires}
              rdvs={rdvsDuJour(dateCourante)}
              onSlotClick={handleSlotClick}
              selectedSlot={selectedSlot}
              onRdvClick={handleRdvClick}
            />
          )}
          {vue === 'mois' && (
            <VueMois
              dateCourante={dateCourante}
              rdvsDuJour={rdvsDuJour}
              onJourClick={(d) => { setDate(d); setVue('jour') }}
            />
          )}
        </div>
      )}

      {/* ── Popup détail RDV ── */}
      <RdvDetailPopup
        rdv={rdvDetail}
        onClose={() => setRdvDetail(null)}
        onAnnuler={chargerRdvs}
        onModifier={(rdv) => {
          setRdvDetail(null)
          setSlotChoisi({ date: rdv.appointment_date?.slice(0,10), heure: timeStr(rdv.start_time) })
          setModalOpen(true)
        }}
      />

      {/* ── Modal liste RDV ── */}
      <ListeRendezVousModal
        open={listeOpen}
        onClose={() => setListeOpen(false)}
      />

      {/* ── Modal nouveau/détail RDV ── */}
      <NouveauRendezVousModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedSlot(null) }}
        medecinId={medecinIdNum}
        medecinNom={medecinSelectionne
          ? `Dr. ${medecinSelectionne.first_name} ${medecinSelectionne.last_name}${medecinSelectionne.specialization ? ` (${medecinSelectionne.specialization})` : ''}`
          : ''}
        slotChoisi={slotChoisi}
        onSaved={() => { chargerRdvs(); setModalOpen(false); setSelectedSlot(null) }}
      />
    </div>
  )
}

// ── Bouton navigation ────────────────────────────────────────────────────────
function NavBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32, height: 32, border: `1.5px solid ${colors.gray300}`,
        borderRadius: radius.sm, cursor: 'pointer',
        fontSize: 20, lineHeight: 1, fontWeight: 300,
        background: colors.white, color: colors.bleu,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = colors.bleu; e.currentTarget.style.color = colors.white }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.white; e.currentTarget.style.color = colors.bleu }}
    >{children}</button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// VUE SEMAINE
// ════════════════════════════════════════════════════════════════════════════
function VueSemaine({ joursSemaine, horaires, rdvsDuJour, onSlotClick, selectedSlot, onRdvClick }) {
  const totalH = (HOURS_END - HOURS_START) * SLOT_H

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* En-tête jours */}
      <div style={{
        display: 'flex', position: 'sticky', top: 0, zIndex: 10,
        background: colors.white, borderBottom: `2px solid ${colors.gray200}`,
      }}>
        <div style={{ width: 56, flexShrink: 0, borderRight: `1px solid ${colors.gray200}` }} />
        {joursSemaine.map((jour, idx) => {
          const today = isToday(jour)
          const past  = isBefore(startOfDay(jour), startOfDay(new Date()))
          return (
            <div key={idx} style={{
              flex: 1, textAlign: 'center', padding: '10px 4px',
              borderLeft: idx > 0 ? `1px solid ${colors.gray200}` : 'none',
              background: today
                ? `linear-gradient(135deg, ${colors.orange}22, ${colors.orange}11)`
                : 'transparent',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                color: past ? colors.gray400 : today ? colors.orange : colors.gray600,
                letterSpacing: '0.5px',
              }}>{JOURS_SEMAINE[idx]}</div>
              <div style={{
                fontSize: 20, fontWeight: 800,
                color: past ? colors.gray400 : today ? colors.orange : colors.gray800,
                lineHeight: 1.2, marginTop: 2,
              }}>{format(jour, 'd')}</div>
              <div style={{ fontSize: 10, color: colors.gray500 }}>
                {format(jour, 'MMM', { locale: fr })}
              </div>
              {/* Nbr RDV */}
              {rdvsDuJour(jour).length > 0 && (
                <div style={{
                  display: 'inline-block', marginTop: 3,
                  background: colors.orange, color: colors.white,
                  borderRadius: radius.full, padding: '1px 7px',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {rdvsDuJour(jour).length} RDV
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Grille */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Axe heures */}
        <div style={{
          width: 56, flexShrink: 0,
          borderRight: `1px solid ${colors.gray200}`,
        }}>
          {Array.from({ length: HOURS_END - HOURS_START }, (_, i) => (
            <div key={i} style={{
              height: SLOT_H,
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'flex-end',
              paddingRight: 8, paddingTop: 4,
              color: colors.gray500, fontSize: 11, fontWeight: 500,
              borderBottom: `1px solid ${colors.gray100}`,
            }}>
              {String(HOURS_START + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Colonnes jours */}
        {joursSemaine.map((jour, idx) => (
          <JourColonne
            key={idx}
            date={jour}
            jourIdx={idx}
            horaires={horaires}
            rdvs={rdvsDuJour(jour)}
            onSlotClick={onSlotClick}
            selectedSlot={selectedSlot}
            onRdvClick={onRdvClick}
          />
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// VUE JOUR
// ════════════════════════════════════════════════════════════════════════════
function VueJour({ date, horaires, rdvs, onSlotClick, selectedSlot, onRdvClick }) {
  const dowIso = date.getDay() === 0 ? 7 : date.getDay()
  const hJour  = horaires.filter(h => Number(h.JourSemaine) === dowIso && Number(h.Statut) === 1)
  const past   = isBefore(startOfDay(date), startOfDay(new Date()))

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Titre jour */}
      <div style={{
        padding: '12px 24px', borderBottom: `2px solid ${colors.gray200}`,
        background: isToday(date) ? `${colors.orange}11` : colors.gray50,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: isToday(date) ? colors.orange : colors.bleu }}>
          {format(date, 'd')}
        </span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.gray800, textTransform: 'capitalize' }}>
            {format(date, 'EEEE', { locale: fr })}
          </div>
          <div style={{ fontSize: 12, color: colors.gray500 }}>
            {format(date, 'MMMM yyyy', { locale: fr })}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {hJour.map((h, i) => (
            <span key={i} style={{
              padding: '4px 10px', background: colors.infoBg,
              color: colors.info, borderRadius: radius.sm,
              fontSize: 11, fontWeight: 600,
            }}>
              {(h.HeureDebut ?? '').slice(0,5)} – {(h.HeureFin ?? '').slice(0,5)}
            </span>
          ))}
          {hJour.length === 0 && (
            <span style={{ color: colors.gray400, fontSize: 12 }}>Pas de consultation</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Axe heures */}
        <div style={{ width: 72, flexShrink: 0, borderRight: `1px solid ${colors.gray200}` }}>
          {Array.from({ length: HOURS_END - HOURS_START }, (_, i) => (
            <div key={i} style={{
              height: SLOT_H,
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'flex-end',
              paddingRight: 10, paddingTop: 4,
              color: colors.gray500, fontSize: 12, fontWeight: 500,
              borderBottom: `1px solid ${colors.gray100}`,
            }}>
              {String(HOURS_START + i).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Zone jour élargie */}
        <div style={{ flex: 1, maxWidth: 600 }}>
          <JourColonne
            date={date}
            jourIdx={0}
            horaires={horaires}
            rdvs={rdvs}
            onSlotClick={onSlotClick}
            selectedSlot={selectedSlot}
            onRdvClick={onRdvClick}
          />
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// VUE MOIS
// ════════════════════════════════════════════════════════════════════════════
function VueMois({ dateCourante, rdvsDuJour, onJourClick }) {
  const debut  = startOfWeek(startOfMonth(dateCourante), { weekStartsOn: 1 })
  const fin    = addDays(startOfWeek(endOfMonth(dateCourante), { weekStartsOn: 1 }), 6)
  const jours  = eachDayOfInterval({ start: debut, end: fin })
  const today  = new Date()

  return (
    <div style={{ flex: 1, padding: 16 }}>
      {/* En-tête jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {JOURS_SEMAINE.map(j => (
          <div key={j} style={{
            textAlign: 'center', padding: '8px 4px',
            fontSize: 11, fontWeight: 700, color: colors.gray600,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>{j}</div>
        ))}
      </div>

      {/* Grille des jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {jours.map((jour, idx) => {
          const duMois    = jour.getMonth() === dateCourante.getMonth()
          const auj       = isToday(jour)
          const passe     = isBefore(startOfDay(jour), startOfDay(today))
          const rdvsJour  = rdvsDuJour(jour)
          const nbRdv     = rdvsJour.length

          return (
            <div
              key={idx}
              onClick={() => duMois && onJourClick(jour)}
              style={{
                minHeight: 80, padding: '6px 8px',
                borderRadius: radius.sm,
                background: auj
                  ? `linear-gradient(135deg, ${colors.orange}22, ${colors.orange}11)`
                  : passe
                    ? colors.gray50
                    : duMois ? colors.white : '#f9f9f9',
                border: auj
                  ? `2px solid ${colors.orange}`
                  : `1px solid ${colors.gray200}`,
                cursor: duMois ? 'pointer' : 'default',
                opacity: duMois ? 1 : 0.4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => duMois && !auj && (e.currentTarget.style.background = colors.gray50)}
              onMouseLeave={e => duMois && !auj && (e.currentTarget.style.background = passe ? colors.gray50 : colors.white)}
            >
              <div style={{
                fontSize: 14, fontWeight: auj ? 800 : 600,
                color: auj ? colors.orange : passe ? colors.gray400 : colors.gray800,
                marginBottom: 4,
              }}>
                {format(jour, 'd')}
              </div>

              {/* Petits points RDV */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rdvsJour.slice(0, 3).map((rdv, i) => {
                  const st = STATUTS[rdv.statut_app] ?? STATUTS[0]
                  return (
                    <div key={i} style={{
                      background: st.bg, border: `1px solid ${st.color}`,
                      borderRadius: 3, padding: '1px 5px',
                      fontSize: 9, fontWeight: 600, color: st.color,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {timeStr(rdv.start_time)} {rdv.patient_nom_complet?.split(' ')[0] || 'RDV'}
                    </div>
                  )
                })}
                {nbRdv > 3 && (
                  <div style={{ fontSize: 9, color: colors.gray500, fontWeight: 500 }}>
                    +{nbRdv - 3} autres
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
