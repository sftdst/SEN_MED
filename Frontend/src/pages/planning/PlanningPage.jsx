import { useEffect, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import {
  format, parse, startOfWeek, getDay,
  addDays, addWeeks, subWeeks,
  startOfWeek as dateFnsStartOfWeek,
  isSameDay, isWithinInterval, parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import {
  horaireApi, exceptionApi, jourFerieApi,
  ferieDispoApi, personnelApi,
} from '../../api'
import { colors, radius, shadows } from '../../theme'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Table from '../../components/ui/Table'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/ui/PageHeader'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'

import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CalendarStyles.css'

// ── Config localizer ─────────────────────────────────────
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { fr } })

// ── Constantes ───────────────────────────────────────────
const JOURS = [
  { value: '1', label: 'Lundi',    short: 'Lun' },
  { value: '2', label: 'Mardi',    short: 'Mar' },
  { value: '3', label: 'Mercredi', short: 'Mer' },
  { value: '4', label: 'Jeudi',    short: 'Jeu' },
  { value: '5', label: 'Vendredi', short: 'Ven' },
  { value: '6', label: 'Samedi',   short: 'Sam' },
  { value: '7', label: 'Dimanche', short: 'Dim' },
]

const TYPES_EXCEPTION = [
  { value: 'conge',     label: 'Congé' },
  { value: 'maladie',   label: 'Maladie' },
  { value: 'mission',   label: 'Mission' },
  { value: 'formation', label: 'Formation' },
  { value: 'autre',     label: 'Autre' },
]

// Palette couleurs médecins
const PALETTE = [
  '#1565c0','#2e7d32','#ad1457','#f57c00','#6a1b9a',
  '#00838f','#4e342e','#558b2f','#0277bd','#c62828',
  '#37474f','#00695c','#e65100','#283593',
]

const EXC_COLORS = {
  conge: '#4caf50', maladie: '#f44336', mission: '#ff9800',
  formation: '#2196f3', autre: '#9c27b0',
}

const TABS = [
  { key: 'semaine',     label: '📅 Planning Semaine' },
  { key: 'mois',        label: '🗓️ Calendrier Mois' },
  { key: 'stats',       label: '📊 Tableau de bord' },
  { key: 'horaires',    label: '🕐 Horaires CRUD' },
  { key: 'exceptions',  label: '🚫 Absences' },
  { key: 'feries',      label: '🏖️ Jours fériés' },
  { key: 'dispos',      label: '⭐ Dispos fériés' },
]

// ── Helpers ──────────────────────────────────────────────
const timeToMin = (t) => {
  if (!t) return 0
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}
const minToLabel = (m) => {
  const h = Math.floor(m / 60).toString().padStart(2, '0')
  const mn = (m % 60).toString().padStart(2, '0')
  return `${h}:${mn}`
}

// ──────────────────────────────────────────────────────────
// TAB BAR
// ──────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 3, marginBottom: 24,
      background: colors.white, padding: 5,
      borderRadius: radius.md, boxShadow: shadows.sm, flexWrap: 'wrap',
    }}>
      {TABS.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          flex: 1, minWidth: 120, padding: '9px 14px', border: 'none', borderRadius: radius.sm,
          background: active === t.key
            ? `linear-gradient(135deg, ${colors.bleu}, #1976d2)`
            : 'transparent',
          color:      active === t.key ? colors.white : colors.gray600,
          fontWeight: active === t.key ? 700 : 500,
          fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
          boxShadow: active === t.key ? '0 2px 8px rgba(21,101,192,0.3)' : 'none',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// VUE GRILLE SEMAINE (vue principale)
// ──────────────────────────────────────────────────────────
const HOUR_H   = 64   // px par heure
const DAY_START = 7   // 07:00
const DAY_END   = 20  // 20:00
const TOTAL_H   = (DAY_END - DAY_START) * HOUR_H
const HOURS     = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i)

function VueGrilleSemaine({ medecins }) {
  const [weekStart, setWeekStart] = useState(() => dateFnsStartOfWeek(new Date(), { weekStartsOn: 1 }))
  const [horaires,   setHoraires]   = useState([])
  const [exceptions, setExceptions] = useState([])
  const [feries,     setFeries]     = useState([])
  const [dispos,     setDispos]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filterMed,  setFilterMed]  = useState('')
  const [tooltip,    setTooltip]    = useState(null)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const load = async () => {
    setLoading(true)
    try {
      const params = filterMed ? { IDMedecin: filterMed } : {}
      const [h, e, f, d] = await Promise.all([
        horaireApi.liste(params),
        exceptionApi.liste(params),
        jourFerieApi.liste({ annee: weekStart.getFullYear() }),
        ferieDispoApi.liste(params),
      ])
      setHoraires(h.data.data   || [])
      setExceptions(e.data.data || [])
      setFeries(f.data.data     || [])
      setDispos(d.data.data     || [])
    } catch { showToast('Erreur chargement planning.', 'error') }
    finally  { setLoading(false) }
  }

  useEffect(() => { load() }, [filterMed, weekStart])

  // Map médecin → couleur
  const doctorColor = useMemo(() => {
    const map = {}
    medecins.forEach((m, i) => { map[m.id] = PALETTE[i % PALETTE.length] })
    return map
  }, [medecins])

  const medOptions = medecins.map(m => ({ value: String(m.id), label: m.staff_name }))

  // Calcul position verticale
  const yPos  = (t) => Math.max(0, (timeToMin(t) - DAY_START * 60) / 60 * HOUR_H)
  const ySize = (s, e) => Math.max(24, (timeToMin(e) - timeToMin(s)) / 60 * HOUR_H)

  // Vérifier si une date est fériée
  const isFerie = (date) => feries.some(f => isSameDay(parseISO(f.DateFerie), date))
  const getFerie = (date) => feries.find(f => isSameDay(parseISO(f.DateFerie), date))

  // Horaires pour un jour de semaine (1=lun, 7=dim)
  const horairesDuJour = (jourIndex) => {
    // jourIndex: 0=lun, 1=mar, ...6=dim → JourSemaine: 1=lun, ...7=dim
    const js = String(jourIndex + 1)
    return horaires.filter(h => String(h.JourSemaine) === js && h.Statut == 1)
  }

  // Exceptions pour une date
  const excepDuJour = (date) =>
    exceptions.filter(e => {
      try {
        const debut = parseISO(e.DateDebut)
        const fin   = parseISO(e.DateFin)
        return isWithinInterval(date, { start: debut, end: fin })
      } catch { return false }
    })

  // Disponibilités fériés pour une date
  const disposDuJour = (date) =>
    dispos.filter(d => {
      try { return isSameDay(parseISO(d.DateFerie), date) }
      catch { return false }
    })

  const today = new Date()
  const weekLabel = `${format(weekStart, 'd MMM', { locale: fr })} – ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}`

  return (
    <div>
      {/* ── Barre de navigation ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
        background: colors.white, padding: '12px 16px', borderRadius: radius.md, boxShadow: shadows.sm, flexWrap: 'wrap',
      }}>
        {/* Navigation semaine */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
            style={{ width: 32, height: 32, border: `1px solid ${colors.gray200}`, borderRadius: radius.sm, background: colors.white, cursor: 'pointer', fontSize: 16 }}>
            ‹
          </button>
          <button onClick={() => setWeekStart(dateFnsStartOfWeek(new Date(), { weekStartsOn: 1 }))}
            style={{ padding: '5px 14px', border: `1px solid ${colors.bleu}`, borderRadius: radius.sm, background: colors.bleu, color: colors.white, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            Aujourd'hui
          </button>
          <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
            style={{ width: 32, height: 32, border: `1px solid ${colors.gray200}`, borderRadius: radius.sm, background: colors.white, cursor: 'pointer', fontSize: 16 }}>
            ›
          </button>
          <span style={{ fontWeight: 700, color: colors.bleu, fontSize: 15, marginLeft: 4 }}>
            {weekLabel}
          </span>
        </div>

        {/* Filtre médecin */}
        <Select name="filterMed" value={filterMed} onChange={e => setFilterMed(e.target.value)}
          options={medOptions} placeholder="Tous les médecins" style={{ minWidth: 220, marginBottom: 0, marginLeft: 'auto' }} />
        <button onClick={load}
          style={{ padding: '6px 12px', border: `1px solid ${colors.gray200}`, borderRadius: radius.sm, background: colors.white, cursor: 'pointer', fontSize: 13 }}>
          🔄
        </button>
      </div>

      {/* ── Légende médecins ── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap',
        background: colors.white, padding: '10px 14px', borderRadius: radius.md, boxShadow: shadows.sm,
      }}>
        <span style={{ fontSize: 12, color: colors.gray500, alignSelf: 'center', marginRight: 4 }}>Médecins :</span>
        {(filterMed
          ? medecins.filter(m => String(m.id) === filterMed)
          : medecins
        ).map(m => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: `${doctorColor[m.id]}15`, border: `1px solid ${doctorColor[m.id]}40`,
            borderRadius: 20, padding: '3px 10px', fontSize: 12, color: doctorColor[m.id], fontWeight: 600,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: doctorColor[m.id] }} />
            {m.staff_name}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
          {[
            { color: EXC_COLORS.conge,     label: 'Congé' },
            { color: EXC_COLORS.maladie,   label: 'Maladie' },
            { color: EXC_COLORS.mission,   label: 'Mission' },
            { color: EXC_COLORS.formation, label: 'Formation' },
            { color: '#2196f3',            label: 'Férié' },
          ].map((l, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: `${l.color}15`, borderRadius: 20, padding: '3px 8px',
              fontSize: 11, color: l.color, fontWeight: 600,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Grille principale ── */}
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 80, textAlign: 'center', color: colors.gray400 }}>Chargement…</div> : (
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {/* Colonne heures */}
            <div style={{ flexShrink: 0, width: 56, borderRight: `1px solid ${colors.gray100}` }}>
              {/* En-tête vide */}
              <div style={{ height: 52, borderBottom: `2px solid ${colors.gray200}` }} />
              {/* Heures */}
              <div style={{ position: 'relative', height: TOTAL_H }}>
                {HOURS.map(h => (
                  <div key={h} style={{
                    position: 'absolute', top: (h - DAY_START) * HOUR_H - 9,
                    width: '100%', textAlign: 'right', paddingRight: 8,
                    fontSize: 11, color: colors.gray400, fontWeight: 600,
                  }}>
                    {h}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Colonnes jours */}
            {weekDays.map((date, dayIdx) => {
              const isToday    = isSameDay(date, today)
              const ferieInfo  = getFerie(date)
              const hDuJour    = horairesDuJour(dayIdx)
              const excDuJour  = excepDuJour(date)
              const dispDuJour = disposDuJour(date)
              const dayLabel   = JOURS[dayIdx]
              const dateNum    = format(date, 'd', { locale: fr })
              const moisLabel  = format(date, 'MMM', { locale: fr })

              return (
                <div key={dayIdx} style={{ flex: 1, minWidth: 110, borderRight: `1px solid ${colors.gray100}` }}>
                  {/* En-tête colonne */}
                  <div style={{
                    height: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: isToday
                      ? `linear-gradient(135deg, ${colors.bleu}, #1976d2)`
                      : ferieInfo ? '#e3f2fd' : colors.gray50,
                    borderBottom: `2px solid ${isToday ? colors.bleu : colors.gray200}`,
                    color: isToday ? colors.white : ferieInfo ? '#1976d2' : colors.gray700,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, opacity: isToday ? 0.85 : 0.6 }}>
                      {dayLabel.short}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{dateNum}</div>
                    {ferieInfo && (
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#1976d2', background: '#fff', borderRadius: 8, padding: '1px 5px', marginTop: 1 }}>
                        🏖️ Férié
                      </div>
                    )}
                  </div>

                  {/* Zone heures */}
                  <div style={{ position: 'relative', height: TOTAL_H, background: isToday ? '#f8fbff' : ferieInfo ? '#f0f8ff' : 'transparent' }}>
                    {/* Lignes horizontales heures */}
                    {HOURS.map(h => (
                      <div key={h} style={{
                        position: 'absolute', top: (h - DAY_START) * HOUR_H,
                        left: 0, right: 0, borderTop: `1px solid ${h % 2 === 0 ? colors.gray100 : '#f8f8f8'}`,
                      }} />
                    ))}

                    {/* Indicateur heure actuelle */}
                    {isToday && (() => {
                      const now = new Date()
                      const nowMin = now.getHours() * 60 + now.getMinutes()
                      if (nowMin >= DAY_START * 60 && nowMin <= DAY_END * 60) {
                        return (
                          <div style={{
                            position: 'absolute', left: 0, right: 0,
                            top: (nowMin - DAY_START * 60) / 60 * HOUR_H,
                            zIndex: 10,
                          }}>
                            <div style={{ height: 2, background: '#f44336' }} />
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f44336', marginTop: -5, marginLeft: -4 }} />
                          </div>
                        )
                      }
                    })()}

                    {/* Overlay exception (toute la journée) */}
                    {excDuJour.map(exc => (
                      <div key={exc.IDmedecin_exception} style={{
                        position: 'absolute', top: 0, bottom: 0, left: 2, right: 2,
                        background: `${EXC_COLORS[exc.Type] || '#9c27b0'}12`,
                        borderLeft: `3px solid ${EXC_COLORS[exc.Type] || '#9c27b0'}`,
                        borderRadius: 4, zIndex: 1, pointerEvents: 'none',
                      }}>
                        <div style={{
                          position: 'sticky', top: 4, padding: '3px 6px',
                          fontSize: 10, fontWeight: 700, color: EXC_COLORS[exc.Type] || '#9c27b0',
                        }}>
                          {TYPES_EXCEPTION.find(t => t.value === exc.Type)?.label || exc.Type}
                          {exc.medecin && <div style={{ fontWeight: 400 }}>{exc.medecin.staff_name}</div>}
                        </div>
                      </div>
                    ))}

                    {/* Blocs horaires normaux */}
                    {hDuJour.map((h, hi) => {
                      const med   = medecins.find(m => m.id === h.IDMedecin || String(m.id) === String(h.IDMedecin))
                      const color = med ? doctorColor[med.id] : colors.bleu
                      const top   = yPos(h.HeureDebut)
                      const ht    = ySize(h.HeureDebut, h.HeureFin)
                      const isShort = ht < 48

                      return (
                        <div
                          key={h.IDmedecin_horaire}
                          onMouseEnter={e => setTooltip({ ...h, med, color, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setTooltip(null)}
                          style={{
                            position: 'absolute',
                            top: top + 1, height: ht - 2,
                            left: `${5 + hi * 2}%`, right: `${5 + (hDuJour.length - 1 - hi) * 2}%`,
                            background: `linear-gradient(135deg, ${color}ee, ${color}bb)`,
                            borderRadius: 6, zIndex: 2, cursor: 'default',
                            boxShadow: `0 2px 8px ${color}40`,
                            overflow: 'hidden', padding: isShort ? '2px 6px' : '5px 8px',
                            border: `1px solid ${color}80`,
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {med?.staff_name?.split(' ')[0] || 'Dr.'}
                          </div>
                          {!isShort && (
                            <>
                              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', marginTop: 1 }}>
                                {h.HeureDebut?.slice(0, 5)} – {h.HeureFin?.slice(0, 5)}
                              </div>
                              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>
                                {h.nb_creneaux} créneaux · {h.DureeConsultation}min
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}

                    {/* Blocs disponibilités fériés */}
                    {dispDuJour.map((d, di) => {
                      const med   = medecins.find(m => String(m.id) === String(d.IDMedecin))
                      const color = med ? doctorColor[med.id] : '#9c27b0'
                      const top   = yPos(d.HeureDebut)
                      const ht    = ySize(d.HeureDebut, d.HeureFin)

                      return (
                        <div key={d.IDmedecin_ferie} style={{
                          position: 'absolute', top: top + 1, height: ht - 2,
                          left: `${5 + di * 2}%`, right: `${5 + (dispDuJour.length - 1 - di) * 2}%`,
                          background: `linear-gradient(135deg, ${color}cc, ${color}99)`,
                          borderRadius: 6, zIndex: 3, cursor: 'default',
                          boxShadow: `0 2px 8px ${color}40`,
                          overflow: 'hidden', padding: '5px 8px',
                          border: `2px dashed ${color}`,
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>⭐ {med?.staff_name?.split(' ')[0] || 'Dr.'}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)' }}>{d.HeureDebut?.slice(0, 5)} – {d.HeureFin?.slice(0, 5)}</div>
                        </div>
                      )
                    })}

                    {/* Jour vide */}
                    {hDuJour.length === 0 && excDuJour.length === 0 && !ferieInfo && (
                      <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '100%', textAlign: 'center', fontSize: 10, color: colors.gray300 }}>
                        —
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tooltip flottant */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 10,
          background: '#1a1a2e', color: '#fff', borderRadius: 8, padding: '10px 14px',
          fontSize: 12, zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          minWidth: 180, pointerEvents: 'none',
          borderLeft: `4px solid ${tooltip.color}`,
        }}>
          <div style={{ fontWeight: 700, color: tooltip.color, marginBottom: 4 }}>
            {tooltip.med?.staff_name || 'Médecin inconnu'}
          </div>
          <div>🕐 {tooltip.HeureDebut?.slice(0, 5)} – {tooltip.HeureFin?.slice(0, 5)}</div>
          <div>⏱️ Durée : {tooltip.DureeConsultation} min</div>
          <div>🗓️ Créneaux : {tooltip.nb_creneaux}</div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// VUE CALENDRIER MOIS (react-big-calendar)
// ──────────────────────────────────────────────────────────
function VueCalendrierMois({ medecins }) {
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filterMed, setFilterMed] = useState('')
  const [viewMode,  setViewMode]  = useState('month')
  const [selected,  setSelected]  = useState(null)

  const doctorColor = useMemo(() => {
    const map = {}
    medecins.forEach((m, i) => { map[m.id] = PALETTE[i % PALETTE.length] })
    return map
  }, [medecins])

  const load = async () => {
    setLoading(true)
    try {
      const params = filterMed ? { IDMedecin: filterMed } : {}
      const [h, e, f, d] = await Promise.all([
        horaireApi.liste(params),
        exceptionApi.liste(params),
        jourFerieApi.liste({ annee: new Date().getFullYear() }),
        ferieDispoApi.liste(params),
      ])
      const horaires   = h.data.data || []
      const exceptions = e.data.data || []
      const feries     = f.data.data || []
      const dispos     = d.data.data || []
      const evts       = []

      // Horaires → projection 12 semaines
      horaires.forEach(hr => {
        const med   = medecins.find(m => String(m.id) === String(hr.IDMedecin))
        const color = med ? doctorColor[med.id] : colors.bleu
        for (let w = 0; w < 16; w++) {
          const base   = addDays(dateFnsStartOfWeek(new Date(), { weekStartsOn: 1 }), w * 7 + (parseInt(hr.JourSemaine) - 1))
          const [sh, sm] = (hr.HeureDebut || '08:00').slice(0,5).split(':').map(Number)
          const [eh, em] = (hr.HeureFin || '17:00').slice(0,5).split(':').map(Number)
          const start = new Date(base); start.setHours(sh, sm, 0)
          const end   = new Date(base); end.setHours(eh, em, 0)
          evts.push({ id: `h-${hr.IDmedecin_horaire}-${w}`, title: `${med?.staff_name || 'Dr.'} · ${hr.DureeConsultation}min`, start, end, color, type: 'horaire', data: hr, med })
        }
      })

      // Exceptions
      exceptions.forEach(ex => {
        const med = medecins.find(m => String(m.id) === String(ex.IDMedecin))
        evts.push({
          id: `e-${ex.IDmedecin_exception}`, type: 'exception',
          title: `🚫 ${med?.staff_name || '—'} · ${TYPES_EXCEPTION.find(t => t.value === ex.Type)?.label || ex.Type}`,
          start: parseISO(ex.DateDebut), end: parseISO(ex.DateFin),
          color: EXC_COLORS[ex.Type] || '#9c27b0', data: ex, med,
        })
      })

      // Jours fériés
      feries.forEach(f => {
        const d = parseISO(f.DateFerie)
        const e = new Date(d); e.setHours(23, 59)
        evts.push({ id: `f-${f.IDjour_ferie}`, type: 'ferie', title: `🏖️ ${f.Libelle}`, start: d, end: e, color: '#1976d2', data: f })
      })

      // Dispos fériés
      dispos.forEach(dsp => {
        const med = medecins.find(m => String(m.id) === String(dsp.IDMedecin))
        const base = parseISO(dsp.DateFerie)
        const [sh, sm] = (dsp.HeureDebut || '08:00').slice(0,5).split(':').map(Number)
        const [eh, em] = (dsp.HeureFin || '12:00').slice(0,5).split(':').map(Number)
        const start = new Date(base); start.setHours(sh, sm)
        const end   = new Date(base); end.setHours(eh, em)
        evts.push({ id: `d-${dsp.IDmedecin_ferie}`, type: 'dispo', title: `⭐ ${med?.staff_name || '—'}`, start, end, color: '#7b1fa2', data: dsp, med })
      })

      setEvents(evts)
    } catch { showToast('Erreur calendrier.', 'error') }
    finally  { setLoading(false) }
  }

  useEffect(() => { load() }, [filterMed, medecins])

  const eventStyle = (evt) => ({
    style: {
      background: `linear-gradient(135deg, ${evt.color}ee, ${evt.color}bb)`,
      border: `1px solid ${evt.color}80`,
      borderLeft: `3px solid ${evt.color}`,
      color: '#fff', borderRadius: 5, fontSize: 11, fontWeight: 600,
    }
  })

  const MSG = {
    allDay:'Journée',previous:'‹',next:'›',today:'Aujourd\'hui',
    month:'Mois',week:'Semaine',day:'Jour',agenda:'Agenda',
    date:'Date',time:'Heure',event:'Événement',
    noEventsInRange:'Aucun événement.',showMore: n => `+${n}`,
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select name="fm" value={filterMed} onChange={e => setFilterMed(e.target.value)}
          options={medecins.map(m => ({ value: String(m.id), label: m.staff_name }))}
          placeholder="Tous les médecins" style={{ minWidth: 240, marginBottom: 0 }} />
        <button onClick={load} style={{ padding: '7px 12px', border: `1px solid ${colors.gray200}`, borderRadius: radius.sm, background: colors.white, cursor: 'pointer' }}>🔄</button>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: colors.gray400 }}>{events.length} événements</div>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', background: colors.white, padding: '10px 14px', borderRadius: radius.md, boxShadow: shadows.sm }}>
        {[
          { color: colors.bleu, label: 'Planning normal' },
          { color: EXC_COLORS.maladie, label: 'Absence' },
          { color: '#1976d2', label: 'Jour férié' },
          { color: '#7b1fa2', label: 'Dispo spéciale' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: l.color, fontWeight: 600, background: `${l.color}12`, borderRadius: 20, padding: '3px 10px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 20, height: 620 }}>
        {loading ? <FullPageSpinner /> : (
          <Calendar
            localizer={localizer} events={events}
            startAccessor="start" endAccessor="end"
            style={{ height: '100%' }} culture="fr" messages={MSG}
            eventPropGetter={eventStyle}
            defaultView={viewMode} view={viewMode} onView={setViewMode}
            views={['month', 'week', 'day', 'agenda']}
            onSelectEvent={evt => setSelected(evt)}
            popup
          />
        )}
      </div>

      {/* Détail événement sélectionné */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.title} width={400}
          footer={<Button onClick={() => setSelected(null)}>Fermer</Button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <div>🗓️ <strong>{format(selected.start, 'EEEE d MMMM yyyy', { locale: fr })}</strong></div>
            {selected.type !== 'ferie' && (
              <div>🕐 {format(selected.start, 'HH:mm')} – {format(selected.end, 'HH:mm')}</div>
            )}
            {selected.med && <div>👨‍⚕️ {selected.med.staff_name}</div>}
            {selected.data?.DureeConsultation && <div>⏱️ {selected.data.DureeConsultation} min / {selected.data.nb_creneaux} créneaux</div>}
            {selected.data?.Description && <div>📝 {selected.data.Description}</div>}
          </div>
        </Modal>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// TABLEAU DE BORD STATS
// ──────────────────────────────────────────────────────────
const CHART_COLORS = ['#1565c0','#2e7d32','#f57c00','#ad1457','#6a1b9a','#00838f','#4e342e','#558b2f']

function VueDashboard({ medecins }) {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [medecins])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [h, e, f, d] = await Promise.all([
        horaireApi.liste({}), exceptionApi.liste({}),
        jourFerieApi.liste({ annee: new Date().getFullYear() }), ferieDispoApi.liste({}),
      ])
      const horaires = h.data.data || [], exceptions = e.data.data || []
      const feries   = f.data.data || [], dispos     = d.data.data || []

      // Activité par jour de semaine
      const parJour = JOURS.map(j => ({
        jour: j.short,
        plages: horaires.filter(h => String(h.JourSemaine) === j.value).length,
        creneaux: horaires.filter(h => String(h.JourSemaine) === j.value)
                          .reduce((s, h) => s + (h.nb_creneaux || 0), 0),
      }))

      // Par médecin
      const parMed = medecins.map((m, i) => {
        const mh = horaires.filter(h => String(h.IDMedecin) === String(m.id))
        const me = exceptions.filter(e => String(e.IDMedecin) === String(m.id))
        return {
          nom: m.staff_name.split(' ')[0],
          nomFull: m.staff_name,
          plages: mh.length,
          creneaux: mh.reduce((s, h) => s + (h.nb_creneaux || 0), 0),
          absences: me.length,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }
      }).filter(m => m.plages > 0 || m.absences > 0)

      // Types d'absences
      const excMap = {}
      exceptions.forEach(e => { excMap[e.Type] = (excMap[e.Type] || 0) + 1 })
      const pieExc = Object.entries(excMap).map(([type, count]) => ({
        name: TYPES_EXCEPTION.find(t => t.value === type)?.label || type,
        value: count, color: EXC_COLORS[type] || '#9c27b0',
      }))

      // Radar par médecin (créneaux par jour)
      const radarData = JOURS.map(j => {
        const entry = { jour: j.short }
        medecins.slice(0, 5).forEach(m => {
          entry[m.staff_name.split(' ')[0]] = horaires
            .filter(h => String(h.IDMedecin) === String(m.id) && String(h.JourSemaine) === j.value)
            .reduce((s, h) => s + (h.nb_creneaux || 0), 0)
        })
        return entry
      })

      setStats({
        totaux: {
          medecins: medecins.length,
          plages: horaires.length,
          creneaux: horaires.reduce((s, h) => s + (h.nb_creneaux || 0), 0),
          absences: exceptions.length,
          feries: feries.length,
        },
        parJour, parMed, pieExc, radarData,
        top5: [...parMed].sort((a, b) => b.creneaux - a.creneaux).slice(0, 5),
      })
    } catch { showToast('Erreur stats.', 'error') }
    finally { setLoading(false) }
  }

  if (loading) return <FullPageSpinner />
  if (!stats)  return null
  const { totaux, parJour, parMed, pieExc, radarData, top5 } = stats

  const KPI = ({ value, label, color, icon }) => (
    <div style={{
      background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
      padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
      borderLeft: `5px solid ${color}`, overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ fontSize: 36, filter: 'saturate(1.2)' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: colors.gray500, marginTop: 3 }}>{label}</div>
      </div>
      <div style={{
        position: 'absolute', right: -10, top: -10, width: 80, height: 80,
        borderRadius: '50%', background: `${color}08`,
      }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <KPI value={totaux.medecins}  label="Médecins"       color="#1565c0" icon="👨‍⚕️" />
        <KPI value={totaux.plages}    label="Plages horaires" color="#2e7d32" icon="📋" />
        <KPI value={totaux.creneaux}  label="Créneaux / sem." color="#f57c00" icon="🕐" />
        <KPI value={totaux.absences}  label="Absences"        color="#c62828" icon="🚫" />
        <KPI value={totaux.feries}    label="Jours fériés"    color="#1976d2" icon="🏖️" />
      </div>

      {/* Graphiques ligne 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Activité par jour */}
        <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray700, marginBottom: 16 }}>
            📅 Activité par jour de la semaine
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={parJour} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gray100} />
              <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="plages"   name="Plages"   fill="#1565c0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="creneaux" name="Créneaux" fill="#42a5f5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition absences */}
        <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray700, marginBottom: 16 }}>
            🚫 Répartition des absences
          </div>
          {pieExc.length === 0 ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.gray400 }}>
              Aucune absence enregistrée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieExc} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                  dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: colors.gray300 }}>
                  {pieExc.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Graphiques ligne 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Créneaux par médecin */}
        <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray700, marginBottom: 16 }}>
            📊 Charge par médecin
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={parMed} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gray100} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="nom" type="category" tick={{ fontSize: 12 }} width={70} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
              <Legend />
              <Bar dataKey="creneaux" name="Créneaux"  radius={[0, 4, 4, 0]}>
                {parMed.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 */}
        <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray700, marginBottom: 16 }}>
            🏆 Top créneaux / sem.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {top5.map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, color: m.color }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {m.nom}
                  </span>
                  <span style={{ fontWeight: 700, color: colors.gray700 }}>{m.creneaux}</span>
                </div>
                <div style={{ height: 6, background: colors.gray100, borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${top5[0].creneaux > 0 ? (m.creneaux / top5[0].creneaux) * 100 : 0}%`,
                    background: `linear-gradient(90deg, ${m.color}, ${m.color}80)`,
                  }} />
                </div>
              </div>
            ))}
            {top5.length === 0 && <div style={{ color: colors.gray400, fontSize: 13 }}>Aucune donnée</div>}
          </div>
        </div>
      </div>

      {/* Radar disponibilité hebdomadaire */}
      {medecins.length > 0 && (
        <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray700, marginBottom: 16 }}>
            📡 Disponibilité par jour (créneaux hebdomadaires)
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={colors.gray200} />
              <PolarAngleAxis dataKey="jour" tick={{ fontSize: 13, fontWeight: 600 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              {medecins.slice(0, 5).map((m, i) => (
                <Radar key={m.id} name={m.staff_name} dataKey={m.staff_name.split(' ')[0]}
                  stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
              ))}
              <Legend />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// PLANNING HEBDOMADAIRE CRUD
// ──────────────────────────────────────────────────────────
function PlanningHebdomadaire({ medecins }) {
  const [data,      setData]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filterMed, setFilterMed] = useState('')
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [confirm,   setConfirm]   = useState(null)
  const [form,      setForm]      = useState({ IDMedecin: '', JourSemaine: '', HeureDebut: '08:00', HeureFin: '17:00', DureeConsultation: 20, Statut: 1 })

  const load = () => {
    setLoading(true)
    horaireApi.liste(filterMed ? { IDMedecin: filterMed } : {})
      .then(r => setData(r.data.data || []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filterMed])

  const medOptions = medecins.map(m => ({ value: String(m.id), label: m.staff_name }))
  const openCreate = () => { setEditing(null); setForm({ IDMedecin: filterMed || '', JourSemaine: '', HeureDebut: '08:00', HeureFin: '17:00', DureeConsultation: 20, Statut: 1 }); setModal(true) }
  const openEdit   = r => { setEditing(r); setForm({ ...r, HeureDebut: r.HeureDebut?.slice(0, 5), HeureFin: r.HeureFin?.slice(0, 5) }); setModal(true) }
  const ch         = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    try {
      if (editing) { await horaireApi.modifier(editing.IDmedecin_horaire, form); showToast('Horaire mis à jour.') }
      else         { await horaireApi.creer(form); showToast('Horaire créé.') }
      setModal(false); load()
    } catch (err) {
      showToast(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Erreur.', 'error')
    }
  }

  const COULEURS = { 1:'#1565c0', 2:'#6a1b9a', 3:'#2e7d32', 4:'#f57c00', 5:'#c62828', 6:'#4a148c', 7:'#00838f' }

  const grouped = {}
  JOURS.forEach(j => { grouped[j.value] = data.filter(h => String(h.JourSemaine) === j.value) })

  const columns = [
    { key: 'libelle_jour', title: 'Jour', render: (v, r) => <span style={{ fontWeight: 700, color: COULEURS[r.JourSemaine] }}>{v}</span> },
    { key: 'medecin', title: 'Médecin', render: (_, r) => r.medecin?.staff_name || '—' },
    { key: 'HeureDebut', title: 'Début',  render: v => v?.slice(0, 5) },
    { key: 'HeureFin',   title: 'Fin',    render: v => v?.slice(0, 5) },
    { key: 'DureeConsultation', title: 'Durée', render: v => `${v} min` },
    { key: 'nb_creneaux', title: 'Créneaux', align: 'center', render: (_, r) => <Badge variant="info">{r.nb_creneaux ?? '—'}</Badge> },
    { key: 'Statut', title: 'Statut', align: 'center', render: v => <StatusBadge status={v} /> },
    { key: 'IDmedecin_horaire', title: 'Actions', align: 'center', width: 100,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>✏️</Button>
          <Button size="sm" variant="danger"    onClick={() => setConfirm(r)}>🗑️</Button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select name="filterMed" value={filterMed} onChange={e => setFilterMed(e.target.value)}
          options={medOptions} placeholder="Filtrer par médecin" style={{ minWidth: 260, marginBottom: 0 }} />
        <Button onClick={openCreate} icon="➕">Ajouter une plage</Button>
        <div style={{ color: colors.gray500, fontSize: 13, marginLeft: 'auto' }}>{data.length} plage(s)</div>
      </div>

      {/* Grille semaine si filtre médecin */}
      {filterMed && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 24 }}>
          {JOURS.map(j => {
            const plages = grouped[j.value]
            const col = COULEURS[j.value]
            return (
              <div key={j.value} style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden', minHeight: 110 }}>
                <div style={{ background: col, color: '#fff', padding: '7px 10px', fontSize: 12, fontWeight: 700 }}>{j.label}</div>
                <div style={{ padding: 10 }}>
                  {plages.length === 0
                    ? <div style={{ color: colors.gray300, fontSize: 11, textAlign: 'center', marginTop: 8 }}>Repos</div>
                    : plages.map(p => (
                        <div key={p.IDmedecin_horaire} style={{ background: `${col}12`, borderLeft: `3px solid ${col}`, borderRadius: 4, padding: '5px 8px', marginBottom: 5, fontSize: 11 }}>
                          <div style={{ fontWeight: 700, color: col }}>{p.HeureDebut?.slice(0, 5)} – {p.HeureFin?.slice(0, 5)}</div>
                          <div style={{ color: colors.gray500 }}>{p.DureeConsultation}min · {p.nb_creneaux} créneaux</div>
                        </div>
                      ))
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : <Table columns={columns} data={data} emptyText="Aucun horaire défini." />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? '✏️ Modifier l\'horaire' : '➕ Nouvelle plage horaire'}
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button><Button onClick={submit}>Enregistrer</Button></>}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Select label="Médecin"      name="IDMedecin"   value={String(form.IDMedecin)}   onChange={ch} required options={medOptions}       style={{ gridColumn: '1/-1' }} />
            <Select label="Jour"         name="JourSemaine" value={String(form.JourSemaine)} onChange={ch} required options={JOURS.map(j => ({ value: j.value, label: j.label }))} />
            <Input  label="Heure début"  name="HeureDebut"  value={form.HeureDebut}          onChange={ch} required type="time" />
            <Input  label="Heure fin"    name="HeureFin"    value={form.HeureFin}            onChange={ch} required type="time" />
            <Input  label="Durée consultation (min)" name="DureeConsultation" value={form.DureeConsultation} onChange={ch} required type="number" min="5" max="120" />
            <Select label="Statut"       name="Statut"      value={String(form.Statut)}      onChange={ch}
              options={[{ value: '1', label: 'Actif' }, { value: '0', label: 'Inactif' }]} />
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={async () => { await horaireApi.supprimer(confirm.IDmedecin_horaire); showToast('Horaire supprimé.'); setConfirm(null); load() }}
        message={`Supprimer la plage du ${confirm?.libelle_jour} (${confirm?.HeureDebut?.slice(0,5)}–${confirm?.HeureFin?.slice(0,5)}) ?`} />
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// ABSENCES & EXCEPTIONS
// ──────────────────────────────────────────────────────────
function Exceptions({ medecins }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMed, setFilterMed] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState({ IDMedecin: '', DateDebut: '', DateFin: '', Type: 'conge', Description: '' })

  const load = () => {
    setLoading(true)
    exceptionApi.liste(filterMed ? { IDMedecin: filterMed } : {}).then(r => setData(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filterMed])

  const medOptions = medecins.map(m => ({ value: String(m.id), label: m.staff_name }))
  const openCreate = () => { setEditing(null); setForm({ IDMedecin: filterMed || '', DateDebut: '', DateFin: '', Type: 'conge', Description: '' }); setModal(true) }
  const openEdit   = r => { setEditing(r); setForm({ ...r, DateDebut: r.DateDebut?.slice(0,10), DateFin: r.DateFin?.slice(0,10) }); setModal(true) }
  const ch         = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    try {
      if (editing) { await exceptionApi.modifier(editing.IDmedecin_exception, form); showToast('Absence mise à jour.') }
      else         { await exceptionApi.creer(form); showToast('Absence enregistrée.') }
      setModal(false); load()
    } catch (err) { showToast(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Erreur.', 'error') }
  }

  const typeBadge = { conge: 'info', maladie: 'danger', mission: 'warning', formation: 'success', autre: 'default' }
  const columns = [
    { key: 'medecin', title: 'Médecin', render: (_, r) => <span style={{ fontWeight: 600, color: colors.bleu }}>{r.medecin?.staff_name || '—'}</span> },
    { key: 'Type', title: 'Type', render: v => <Badge variant={typeBadge[v] || 'default'}>{TYPES_EXCEPTION.find(t => t.value === v)?.label || v}</Badge> },
    { key: 'DateDebut', title: 'Début', render: v => v?.slice(0,10) },
    { key: 'DateFin',   title: 'Fin',   render: v => v?.slice(0,10) },
    { key: 'Description', title: 'Description', render: v => v || '—' },
    { key: 'IDmedecin_exception', title: 'Actions', align: 'center', width: 100,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>✏️</Button>
          <Button size="sm" variant="danger"    onClick={() => setConfirm(r)}>🗑️</Button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select name="filterMed" value={filterMed} onChange={e => setFilterMed(e.target.value)}
          options={medOptions} placeholder="Tous les médecins" style={{ minWidth: 260, marginBottom: 0 }} />
        <Button onClick={openCreate} icon="➕">Ajouter une absence</Button>
      </div>
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : <Table columns={columns} data={data} emptyText="Aucune absence enregistrée." />}
      </div>
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? '✏️ Modifier l\'absence' : '🚫 Nouvelle absence'}
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button><Button onClick={submit}>Enregistrer</Button></>}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Select label="Médecin" name="IDMedecin" value={String(form.IDMedecin)} onChange={ch} required options={medOptions} style={{ gridColumn: '1/-1' }} />
            <Select label="Type"    name="Type"       value={form.Type}              onChange={ch} required options={TYPES_EXCEPTION} />
            <div />
            <Input  label="Date début" name="DateDebut"    value={form.DateDebut} onChange={ch} required type="date" />
            <Input  label="Date fin"   name="DateFin"      value={form.DateFin}   onChange={ch} required type="date" />
            <Input  label="Description" name="Description" value={form.Description} onChange={ch} style={{ gridColumn: '1/-1' }} />
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={async () => { await exceptionApi.supprimer(confirm.IDmedecin_exception); showToast('Absence supprimée.'); setConfirm(null); load() }}
        message="Supprimer cette absence ?" />
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// JOURS FÉRIÉS
// ──────────────────────────────────────────────────────────
function JoursFeries() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [annee,   setAnnee]   = useState(String(new Date().getFullYear()))
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form,    setForm]    = useState({ DateFerie: '', Libelle: '', Description: '' })
  const [init,    setInit]    = useState(false)

  const load = () => {
    setLoading(true)
    jourFerieApi.liste({ annee }).then(r => setData(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [annee])

  const openCreate = () => { setEditing(null); setForm({ DateFerie: '', Libelle: '', Description: '' }); setModal(true) }
  const openEdit   = r => { setEditing(r); setForm({ DateFerie: r.DateFerie, Libelle: r.Libelle, Description: r.Description || '' }); setModal(true) }
  const ch         = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    try {
      if (editing) { await jourFerieApi.modifier(editing.IDjour_ferie, form); showToast('Jour férié mis à jour.') }
      else         { await jourFerieApi.creer(form); showToast('Jour férié ajouté.') }
      setModal(false); load()
    } catch (err) { showToast(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Erreur.', 'error') }
  }

  const handleInit = async () => {
    setInit(true)
    try { await jourFerieApi.initialiserSn(parseInt(annee)); showToast('Jours fériés initialisés.'); load() }
    catch { showToast('Erreur initialisation.', 'error') }
    finally { setInit(false) }
  }

  const columns = [
    { key: 'DateFerie', title: 'Date', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'Libelle', title: 'Libellé', render: v => v },
    { key: 'Description', title: 'Description', render: v => v || '—' },
    { key: 'IDjour_ferie', title: 'Actions', align: 'center', width: 100,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>✏️</Button>
          <Button size="sm" variant="danger"    onClick={() => setConfirm(r)}>🗑️</Button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select name="annee" value={annee} onChange={e => setAnnee(e.target.value)} style={{ minWidth: 120, marginBottom: 0 }}
          options={[2024,2025,2026,2027].map(y => ({ value: String(y), label: String(y) }))} />
        <Button onClick={openCreate} icon="➕">Ajouter</Button>
        <Button variant="secondary" onClick={handleInit} disabled={init}>{init ? 'Initialisation...' : '🇸🇳 Init. Sénégal'}</Button>
      </div>
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : <Table columns={columns} data={data} emptyText="Aucun jour férié." />}
      </div>
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? '✏️ Modifier le jour férié' : '➕ Nouveau jour férié'}
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button><Button onClick={submit}>Enregistrer</Button></>}>
        <form onSubmit={submit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Date" name="DateFerie" value={form.DateFerie} onChange={ch} required type="date" />
            <Input label="Libellé" name="Libelle" value={form.Libelle} onChange={ch} required />
            <Input label="Description" name="Description" value={form.Description} onChange={ch} />
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={async () => { await jourFerieApi.supprimer(confirm.IDjour_ferie); showToast('Jour férié supprimé.'); setConfirm(null); load() }}
        message={`Supprimer "${confirm?.Libelle}" ?`} />
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// DISPONIBILITÉS JOURS FÉRIÉS
// ──────────────────────────────────────────────────────────
function FerieDisponibilites({ medecins }) {
  const [data,    setData]    = useState([])
  const [feries,  setFeries]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filterMed, setFilterMed] = useState('')
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form,    setForm]    = useState({ IDMedecin: '', DateFerie: '', HeureDebut: '08:00', HeureFin: '12:00', DureeConsultation: 20, Statut: 1 })

  const load = () => {
    setLoading(true)
    Promise.all([
      ferieDispoApi.liste(filterMed ? { IDMedecin: filterMed } : {}),
      jourFerieApi.liste({ annee: new Date().getFullYear() }),
    ]).then(([d, f]) => { setData(d.data.data || []); setFeries(f.data.data || []) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filterMed])

  const medOptions   = medecins.map(m => ({ value: String(m.id), label: m.staff_name }))
  const ferieOptions = feries.map(f => ({ value: f.DateFerie, label: `${f.DateFerie} — ${f.Libelle}` }))
  const openCreate = () => { setEditing(null); setForm({ IDMedecin: filterMed || '', DateFerie: '', HeureDebut: '08:00', HeureFin: '12:00', DureeConsultation: 20, Statut: 1 }); setModal(true) }
  const openEdit   = r => { setEditing(r); setForm({ ...r, HeureDebut: r.HeureDebut?.slice(0,5), HeureFin: r.HeureFin?.slice(0,5) }); setModal(true) }
  const ch         = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    try {
      if (editing) { await ferieDispoApi.modifier(editing.IDmedecin_ferie, form); showToast('Disponibilité mise à jour.') }
      else         { await ferieDispoApi.creer(form); showToast('Disponibilité ajoutée.') }
      setModal(false); load()
    } catch (err) { showToast(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : err.response?.data?.message || 'Erreur.', 'error') }
  }

  const columns = [
    { key: 'medecin',   title: 'Médecin',   render: (_, r) => <span style={{ fontWeight: 600, color: colors.bleu }}>{r.medecin?.staff_name || '—'}</span> },
    { key: 'DateFerie', title: 'Jour férié', render: (v, r) => <div><div style={{ fontWeight: 600 }}>{v}</div><div style={{ fontSize: 12, color: colors.gray500 }}>{r.jour_ferie?.Libelle}</div></div> },
    { key: 'HeureDebut', title: 'Début', render: v => v?.slice(0,5) },
    { key: 'HeureFin',   title: 'Fin',   render: v => v?.slice(0,5) },
    { key: 'DureeConsultation', title: 'Durée', render: v => `${v} min` },
    { key: 'nb_creneaux', title: 'Créneaux', align: 'center', render: (_, r) => <Badge variant="orange">{r.nb_creneaux ?? '—'}</Badge> },
    { key: 'Statut', title: 'Statut', align: 'center', render: v => <StatusBadge status={v} /> },
    { key: 'IDmedecin_ferie', title: 'Actions', align: 'center', width: 100,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>✏️</Button>
          <Button size="sm" variant="danger"    onClick={() => setConfirm(r)}>🗑️</Button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div style={{ background: '#fff8e1', borderRadius: radius.sm, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#f57c00', fontWeight: 500 }}>
        ⭐ Ces disponibilités ont la priorité maximale sur le planning normal et les absences.
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select name="filterMed" value={filterMed} onChange={e => setFilterMed(e.target.value)}
          options={medOptions} placeholder="Tous les médecins" style={{ minWidth: 260, marginBottom: 0 }} />
        <Button onClick={openCreate} icon="⭐">Ajouter une disponibilité</Button>
      </div>
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        {loading ? <FullPageSpinner /> : <Table columns={columns} data={data} emptyText="Aucune disponibilité sur jour férié." />}
      </div>
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? '✏️ Modifier' : '⭐ Disponibilité sur jour férié'}
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button><Button onClick={submit}>Enregistrer</Button></>}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Select label="Médecin"    name="IDMedecin"  value={String(form.IDMedecin)}  onChange={ch} required options={medOptions}   style={{ gridColumn: '1/-1' }} />
            <Select label="Jour férié" name="DateFerie"  value={form.DateFerie}           onChange={ch} required options={ferieOptions} style={{ gridColumn: '1/-1' }} placeholder="Sélectionner" />
            <Input  label="Heure début" name="HeureDebut" value={form.HeureDebut}         onChange={ch} required type="time" />
            <Input  label="Heure fin"   name="HeureFin"   value={form.HeureFin}           onChange={ch} required type="time" />
            <Input  label="Durée consultation (min)" name="DureeConsultation" value={form.DureeConsultation} onChange={ch} required type="number" min="5" max="120" />
            <Select label="Statut"      name="Statut"     value={String(form.Statut)}     onChange={ch}
              options={[{ value: '1', label: 'Actif' }, { value: '0', label: 'Inactif' }]} />
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirm} onCancel={() => setConfirm(null)} onConfirm={async () => { await ferieDispoApi.supprimer(confirm.IDmedecin_ferie); showToast('Disponibilité supprimée.'); setConfirm(null); load() }}
        message="Supprimer cette disponibilité sur jour férié ?" />
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ──────────────────────────────────────────────────────────
export default function PlanningPage() {
  const [tab,      setTab]      = useState('semaine')
  const [medecins, setMedecins] = useState([])

  useEffect(() => {
    personnelApi.liste({ per_page: 200 })
      .then(r => setMedecins(r.data?.data?.data || r.data?.data || []))
      .catch(() => {})
  }, [])

  return (
    <div>
      <PageHeader
        title="Planning médical"
        subtitle="Grille semaine · Calendrier · Tableau de bord · Absences · Jours fériés"
      />

      {/* Règles de priorité */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
        background: colors.white, padding: '10px 16px',
        borderRadius: radius.md, boxShadow: shadows.sm,
      }}>
        <span style={{ fontSize: 12, color: colors.gray500, alignSelf: 'center' }}>Priorités :</span>
        {[
          { col: '#c62828', label: '🔴 Dispo. spéciale jour férié' },
          { col: '#f57c00', label: '🟠 Absence / Exception' },
          { col: '#2e7d32', label: '🟢 Planning hebdomadaire normal' },
        ].map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: `${p.col}10`, borderRadius: 20, padding: '3px 10px',
            fontSize: 12, color: p.col, fontWeight: 600,
          }}>{p.label}</div>
        ))}
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'semaine'    && <VueGrilleSemaine   medecins={medecins} />}
      {tab === 'mois'       && <VueCalendrierMois  medecins={medecins} />}
      {tab === 'stats'      && <VueDashboard       medecins={medecins} />}
      {tab === 'horaires'   && <PlanningHebdomadaire medecins={medecins} />}
      {tab === 'exceptions' && <Exceptions         medecins={medecins} />}
      {tab === 'feries'     && <JoursFeries />}
      {tab === 'dispos'     && <FerieDisponibilites medecins={medecins} />}
    </div>
  )
}
