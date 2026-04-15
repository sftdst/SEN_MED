import { useState, useEffect, useCallback, useRef } from 'react'
import { format, differenceInYears, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { rendezVousApi, patientApi } from '../../api'
import { colors, radius, shadows, spacing } from '../../theme'
import { showToast } from '../../components/ui/Toast'

// ── Constantes ───────────────────────────────────────────────────────────────
const TYPES_PATIENT = [
  { value: 'habituel',  label: 'Patient habituel' },
  { value: 'nouveau',   label: 'Nouveau patient'  },
]

const TYPES_RDV = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'bilan',        label: 'Bilan'        },
  { value: 'suivi',        label: 'Suivi'        },
  { value: 'urgence',      label: 'Urgence'      },
  { value: 'visite',       label: 'Visite'       },
  { value: 'autre',        label: 'Autre'        },
]

const SEXES = [
  { value: '',       label: '-- Sexe --'  },
  { value: 'M',      label: 'Masculin'    },
  { value: 'F',      label: 'Féminin'     },
]

const LIEUX = [
  { value: 'cabinet',   label: 'Cabinet'     },
  { value: 'domicile',  label: 'Domicile'    },
  { value: 'teleconsult', label: 'Téléconsultation' },
  { value: 'hopital',   label: 'Hôpital'     },
]

const PRIS_PAR = [
  { value: 'patient',   label: 'Le patient lui-même' },
  { value: 'parent',    label: 'Un parent'           },
  { value: 'tuteur',    label: 'Un tuteur'           },
  { value: 'autre',     label: 'Autre personne'      },
]

const LIENS = [
  { value: '',       label: '-- Lien --'   },
  { value: 'pere',   label: 'Père'         },
  { value: 'mere',   label: 'Mère'         },
  { value: 'epoux',  label: 'Époux/Épouse' },
  { value: 'enfant', label: 'Enfant'       },
  { value: 'frere',  label: 'Frère/Sœur'  },
  { value: 'ami',    label: 'Ami(e)'       },
  { value: 'autre',  label: 'Autre'        },
]

// ── Helpers UI ───────────────────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <label style={{
      display: 'block', fontSize: 11, fontWeight: 700,
      color: colors.gray600, marginBottom: 5,
      textTransform: 'uppercase', letterSpacing: '0.4px',
    }}>
      {children}
      {required && <span style={{ color: colors.danger, marginLeft: 3 }}>*</span>}
    </label>
  )
}

function FieldInput({ style, ...props }) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e) }}
      onBlur={e => { setFocus(false); props.onBlur?.(e) }}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `1.5px solid ${focus ? colors.bleu : colors.gray300}`,
        borderRadius: radius.sm, padding: '8px 12px',
        fontSize: 13, color: colors.gray800,
        background: props.readOnly ? colors.gray50 : colors.white,
        outline: 'none', transition: 'border-color 0.15s',
        ...style,
      }}
    />
  )
}

function FieldSelect({ children, style, ...props }) {
  const [focus, setFocus] = useState(false)
  return (
    <select
      {...props}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `1.5px solid ${focus ? colors.bleu : colors.gray300}`,
        borderRadius: radius.sm, padding: '8px 12px',
        fontSize: 13, color: colors.gray800,
        background: colors.white, outline: 'none',
        cursor: 'pointer', transition: 'border-color 0.15s',
        ...style,
      }}
    >
      {children}
    </select>
  )
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px',
      background: `linear-gradient(90deg, ${colors.bleu}0a, transparent)`,
      borderLeft: `3px solid ${colors.bleu}`,
      borderRadius: `0 ${radius.sm} ${radius.sm} 0`,
      marginBottom: 14,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.bleu }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: colors.gray500 }}>{subtitle}</div>}
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: colors.gray100, margin: '20px 0' }} />
}

// ── Autocomplete patient ──────────────────────────────────────────────────────
function PatientAutocomplete({ value, onSelect, onClear }) {
  const [query, setQuery]         = useState(value || '')
  const [results, setResults]     = useState([])
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [focused, setFocused]     = useState(false)
  const debounceRef               = useRef(null)
  const wrapRef                   = useRef(null)

  useEffect(() => {
    if (!value) setQuery('')
  }, [value])

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e) => {
    const v = e.target.value
    setQuery(v)
    if (!v) { onClear(); setResults([]); setOpen(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (v.length < 2) return
      setLoading(true)
      // starts_with filtre les patients dont le nom/prénom commence par la saisie (insensible à la casse via ILIKE)
      patientApi.liste({ starts_with: v, per_page: 10 })
        .then(r => {
          const data = r.data?.data?.data ?? r.data?.data ?? []
          setResults(data)
          setOpen(data.length > 0)
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
  }

  const handleSelect = (patient) => {
    setQuery(`${patient.first_name} ${patient.last_name}`)
    setOpen(false)
    onSelect(patient)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Rechercher un patient par nom ou prénom…"
          style={{
            width: '100%', boxSizing: 'border-box',
            border: `1.5px solid ${focused ? colors.bleu : colors.gray300}`,
            borderRadius: radius.sm, padding: '8px 36px 8px 12px',
            fontSize: 13, color: colors.gray800,
            outline: 'none', transition: 'border-color 0.15s',
            background: colors.white,
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, border: `2px solid ${colors.gray300}`,
            borderTopColor: colors.bleu, borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); onClear(); setResults([]); setOpen(false) }}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              border: 'none', background: 'none', cursor: 'pointer',
              color: colors.gray400, fontSize: 16, lineHeight: 1,
              padding: 2,
            }}
          >×</button>
        )}
      </div>

      {/* Dropdown résultats */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: colors.white, borderRadius: radius.md,
          boxShadow: shadows.lg, border: `1px solid ${colors.gray200}`,
          maxHeight: 240, overflowY: 'auto', marginTop: 2,
        }}>
          {results.map((p, i) => {
            const nomAffiche = p.patient_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
            const initiales  = `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase()
            // Surligner la partie correspondant à la saisie
            const idx = nomAffiche.toLowerCase().indexOf(query.toLowerCase())
            const nomHighlight = idx >= 0
              ? <>
                  {nomAffiche.slice(0, idx)}
                  <strong style={{ color: colors.orange }}>{nomAffiche.slice(idx, idx + query.length)}</strong>
                  {nomAffiche.slice(idx + query.length)}
                </>
              : nomAffiche

            return (
              <div
                key={p.patient_id ?? p.id_Rep ?? i}
                onClick={() => handleSelect(p)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? `1px solid ${colors.gray100}` : 'none',
                  transition: 'background 0.1s',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={e => e.currentTarget.style.background = colors.gray50}
                onMouseLeave={e => e.currentTarget.style.background = colors.white}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${colors.bleu}, ${colors.bleuMuted})`,
                  color: colors.white, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: 13,
                }}>
                  {initiales || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray800 }}>
                    {nomHighlight}
                  </div>
                  <div style={{ fontSize: 11, color: colors.gray500, display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    <span>#{p.patient_id}</span>
                    {p.mobile_number && <span>📞 {p.mobile_number}</span>}
                    {p.dob && <span>🎂 {differenceInYears(new Date(), parseISO(p.dob))} ans</span>}
                    {p.gender_id && <span>{p.gender_id === 'M' || p.gender_id === 'masculin' ? '♂' : '♀'}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 2 && query.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: colors.white, borderRadius: radius.md,
          boxShadow: shadows.md, border: `1px solid ${colors.gray200}`,
          padding: '12px 16px', marginTop: 2,
          fontSize: 12, color: colors.gray500, textAlign: 'center',
        }}>
          Aucun patient trouvé pour "{query}"
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function NouveauRendezVousModal({
  open, onClose, medecinId, medecinNom, slotChoisi, onSaved,
}) {
  const initForm = () => ({
    // Entête
    type_patient:          'habituel',
    appointment_type:      'consultation',
    creneau_souhaite:      '',
    creneau_disponible:    '',
    visit_place:           'cabinet',
    // Patient
    patient_id:            '',
    nom_patient_affiche:   '',
    telephone:             '',
    email:                 '',
    date_naissance:        '',
    sexe:                  '',
    age_patient:           '',
    // Motif
    remarks:               '',
    raison_motif:          '',
    // Tiers
    personne_pris:         'patient',
    nom_personne:          '',
    tel_personnepris:      '',
    lien_parente:          '',
    email_patient:         '',
  })

  const [form, setForm]               = useState(initForm())
  const [dateChoisi, setDateChoisi]   = useState('')
  const [creneaux, setCreneaux]       = useState([])
  const [loadingCrx, setLoadingCrx]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [activeTab, setActiveTab]     = useState('details')

  // ── Pré-remplir date/heure depuis slot cliqué ────────────────────────────
  useEffect(() => {
    if (open) {
      const f = initForm()
      // Pré-remplir la date : depuis le slot cliqué ou aujourd'hui
      const initDate = slotChoisi?.date || format(new Date(), 'yyyy-MM-dd')
      setDateChoisi(initDate)
      if (slotChoisi?.heure) {
        f.creneau_souhaite = slotChoisi.heure
      }
      setForm(f)
      setActiveTab('details')
      setCreneaux([])
    }
  }, [open, slotChoisi])

  // ── Charger créneaux disponibles ─────────────────────────────────────────
  const chargerCreneaux = useCallback(() => {
    if (!medecinId || !dateChoisi) return
    setLoadingCrx(true)
    rendezVousApi.creneauxDisponibles({ medecin_id: medecinId, date: dateChoisi })
      .then(r => {
        const data = r.data?.data ?? []
        setCreneaux(data)
        // Pré-sélectionner le créneau si un slot a été cliqué
        if (slotChoisi?.heure) {
          const match = data.find(c => c.debut === slotChoisi.heure)
          if (match && !match.occupe) {
            setForm(f => ({ ...f, creneau_souhaite: match.label, creneau_disponible: match.label }))
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCrx(false))
  }, [medecinId, dateChoisi, slotChoisi?.heure])

  // Recharger les créneaux dès que la date ou le médecin change (y compris ouverture initiale)
  useEffect(() => {
    if (open && medecinId && dateChoisi) chargerCreneaux()
  }, [open, medecinId, dateChoisi, chargerCreneaux])

  // ── Auto-remplissage patient habituel ────────────────────────────────────
  const handlePatientSelect = (patient) => {
    const dobStr = patient.dob?.slice(0, 10) ?? ''
    const age    = dobStr
      ? String(differenceInYears(new Date(), parseISO(dobStr)))
      : patient.age_patient ?? ''

    const nomAffiche = patient.patient_name
      || `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim()

    // gender_id peut être 'M'/'F' ou 'masculin'/'feminin' selon les données
    const sexe = patient.gender_id === 'masculin' ? 'M'
               : patient.gender_id === 'feminin'  ? 'F'
               : patient.gender_id ?? ''

    setForm(f => ({
      ...f,
      patient_id:          patient.patient_id ?? '',
      nom_patient_affiche: nomAffiche,
      telephone:           patient.mobile_number ?? patient.contact_number ?? '',
      email:               patient.email_adress ?? '',
      date_naissance:      dobStr,
      sexe,
      age_patient:         age,
    }))
  }

  const handlePatientClear = () => {
    setForm(f => ({
      ...f,
      patient_id: '', nom_patient_affiche: '',
      telephone: '', email: '', date_naissance: '',
      sexe: '', age_patient: '',
    }))
  }

  // ── Calcul auto de l'âge ─────────────────────────────────────────────────
  const handleDateNaissChange = (val) => {
    let age = ''
    try {
      if (val) age = String(differenceInYears(new Date(), parseISO(val)))
    } catch {}
    setForm(f => ({ ...f, date_naissance: val, age_patient: age }))
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!dateChoisi)  { showToast('Veuillez sélectionner une date', 'error'); return }
    if (!medecinId)   { showToast('Aucun médecin sélectionné', 'error'); return }
    if (!form.creneau_disponible && !form.creneau_souhaite) {
      showToast('Veuillez choisir un créneau', 'error'); return
    }
    if (form.type_patient === 'habituel' && !form.patient_id) {
      showToast('Veuillez sélectionner un patient', 'error'); return
    }

    // Extraire start/end du créneau choisi (format "HH:mm - HH:mm")
    const crenStr = form.creneau_disponible || form.creneau_souhaite
    const parts   = (crenStr || '').split(' - ')
    let startTime = (parts[0] || '').trim()
    let endTime   = (parts[1] || '').trim()

    // Si le créneau disponible sélectionné contient une date parasite (ex: "09:00 - 2026-04-20"), on recalcule
    if (!endTime || endTime.length > 5) {
      const [h, m] = (startTime || '08:00').split(':').map(Number)
      const endMin = (isNaN(h) ? 8 : h) * 60 + (isNaN(m) ? 0 : m) + 30
      endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
    }
    if (!startTime || startTime.length > 5) startTime = '08:00'

    const payload = {
      consulting_doctor_id: String(medecinId),   // doit être string pour la validation Laravel
      appointment_date:     dateChoisi,
      start_time:           startTime,
      end_time:             endTime,
      patient_type:         form.type_patient,
      appointment_type:     form.appointment_type,
      patient_id:           form.patient_id || undefined,
      telephone:            form.telephone,
      email:                form.email,
      date_naissance:       form.date_naissance || undefined,
      sexe:                 form.sexe,
      age_patient:          form.age_patient,
      remarks:              form.remarks,
      raison_motif:         form.raison_motif,
      visit_place:          form.visit_place,
      personne_pris:        form.personne_pris,
      nom_personne:         form.nom_personne,
      tel_personnepris:     form.tel_personnepris,
      lien_parente:         form.lien_parente,
      email_patient:        form.email_patient,
    }

    setSaving(true)
    try {
      await rendezVousApi.creer(payload)
      showToast('Rendez-vous créé avec succès !', 'success')
      onSaved()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Erreur lors de la création'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const creneauxDispo = creneaux.filter(c => !c.occupe)

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes rdvSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .rdv-tab-btn:hover { background: ${colors.gray100} !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,47,89,0.45)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Panel latéral */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1000,
        width: '100%', maxWidth: 620,
        background: colors.white,
        boxShadow: '-8px 0 40px rgba(0,47,89,0.2)',
        display: 'flex', flexDirection: 'column',
        animation: 'rdvSlideIn 0.25s ease',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu}, #003f7a)`,
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: colors.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>📋</div>
            <div>
              <h2 style={{ margin: 0, color: colors.white, fontSize: 17, fontWeight: 800 }}>
                Nouveau Rendez-Vous
              </h2>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 }}>
                {medecinNom || 'Médecin non sélectionné'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: colors.white, width: 34, height: 34,
              borderRadius: radius.full, cursor: 'pointer',
              fontSize: 20, fontWeight: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >×</button>
        </div>

        {/* ── Bandeau date/heure sélectionnée ── */}
        {dateChoisi && (
          <div style={{
            background: `${colors.orange}15`,
            borderBottom: `2px solid ${colors.orange}33`,
            padding: '10px 24px',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📅</span>
              <div>
                <div style={{ fontSize: 10, color: colors.gray500, fontWeight: 600, textTransform: 'uppercase' }}>Date sélectionnée</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.bleu, textTransform: 'capitalize' }}>
                  {format(new Date(dateChoisi + 'T00:00:00'), "EEEE d MMMM yyyy", { locale: fr })}
                </div>
              </div>
            </div>
            {slotChoisi?.heure && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🕐</span>
                <div>
                  <div style={{ fontSize: 10, color: colors.gray500, fontWeight: 600, textTransform: 'uppercase' }}>Créneau pré-sélectionné</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.orange }}>{slotChoisi.heure}</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <span style={{ fontSize: 14 }}>👨‍⚕️</span>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.gray700 }}>{medecinNom || '—'}</div>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${colors.gray200}`,
          background: colors.gray50, flexShrink: 0,
        }}>
          {[
            { key: 'details',  label: '👤 Détails patient' },
            { key: 'autres',   label: '📎 Autres détails'  },
          ].map(tab => (
            <button
              key={tab.key}
              className="rdv-tab-btn"
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '12px 16px',
                border: 'none', borderBottom: activeTab === tab.key
                  ? `3px solid ${colors.orange}`
                  : '3px solid transparent',
                background: activeTab === tab.key ? colors.white : 'transparent',
                cursor: 'pointer', fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: 13, color: activeTab === tab.key ? colors.bleu : colors.gray600,
                transition: 'all 0.15s',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* ── Corps formulaire ── */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ══ TAB : DÉTAILS ══ */}
          {activeTab === 'details' && (
            <>
              <SectionTitle icon="🗓️" title="Informations du rendez-vous" />

              {/* Ligne 0 : Date du rendez-vous */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel required>Date du rendez-vous</FieldLabel>
                <FieldInput
                  type="date"
                  value={dateChoisi}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={e => {
                    setDateChoisi(e.target.value)
                    setCreneaux([])
                    set('creneau_souhaite', '')
                    set('creneau_disponible', '')
                  }}
                />
              </div>

              {/* Ligne 1 : Type patient + Type RDV */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <FieldLabel required>Type de patient</FieldLabel>
                  <FieldSelect value={form.type_patient} onChange={e => set('type_patient', e.target.value)}>
                    {TYPES_PATIENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </FieldSelect>
                </div>
                <div>
                  <FieldLabel>Type de rendez-vous</FieldLabel>
                  <FieldSelect value={form.appointment_type} onChange={e => set('appointment_type', e.target.value)}>
                    {TYPES_RDV.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </FieldSelect>
                </div>
              </div>

              {/* Ligne 2 : Créneau souhaité + disponible */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <FieldLabel required>Créneau souhaité</FieldLabel>
                  {loadingCrx ? (
                    <div style={{ padding: '8px 12px', background: colors.gray50, borderRadius: radius.sm, fontSize: 12, color: colors.gray500 }}>
                      Chargement…
                    </div>
                  ) : creneaux.length > 0 ? (
                    <FieldSelect
                      value={form.creneau_souhaite}
                      onChange={e => set('creneau_souhaite', e.target.value)}
                    >
                      <option value="">-- Choisir un créneau --</option>
                      {creneaux.map((c, i) => (
                        <option key={i} value={c.label} disabled={c.occupe}>
                          {c.label}{c.occupe ? ' (occupé)' : ''}{c.lieu ? ` · ${c.lieu}` : ''}
                        </option>
                      ))}
                    </FieldSelect>
                  ) : (
                    <FieldInput
                      value={form.creneau_souhaite}
                      onChange={e => set('creneau_souhaite', e.target.value)}
                      placeholder="ex: 09:00 - 09:30"
                    />
                  )}
                </div>
                <div>
                  <FieldLabel>Créneau disponible</FieldLabel>
                  <FieldSelect
                    value={form.creneau_disponible}
                    onChange={e => set('creneau_disponible', e.target.value)}
                    style={{ borderColor: form.creneau_disponible ? colors.success : colors.gray300 }}
                  >
                    <option value="">-- Sélectionner --</option>
                    {creneauxDispo.map((c, i) => (
                      <option key={i} value={c.label}>{c.label}</option>
                    ))}
                  </FieldSelect>
                </div>
              </div>

              {/* Lieu */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel>Lieu de consultation</FieldLabel>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {LIEUX.map(l => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => set('visit_place', l.value)}
                      style={{
                        padding: '6px 14px', borderRadius: radius.full,
                        border: `1.5px solid ${form.visit_place === l.value ? colors.bleu : colors.gray300}`,
                        background: form.visit_place === l.value ? colors.bleu : colors.white,
                        color: form.visit_place === l.value ? colors.white : colors.gray700,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >{l.label}</button>
                  ))}
                </div>
              </div>

              <Divider />
              <SectionTitle icon="👤" title="Informations du patient"
                subtitle={form.type_patient === 'habituel' ? 'Recherchez le patient dans la base de données' : 'Saisissez les informations du nouveau patient'} />

              {/* Patient habituel : autocomplete */}
              {form.type_patient === 'habituel' ? (
                <div style={{ marginBottom: 14 }}>
                  <FieldLabel required>Patient</FieldLabel>
                  <PatientAutocomplete
                    value={form.nom_patient_affiche}
                    onSelect={handlePatientSelect}
                    onClear={handlePatientClear}
                  />
                  {form.patient_id && (
                    <div style={{
                      marginTop: 6, padding: '6px 12px',
                      background: colors.successBg, borderRadius: radius.sm,
                      fontSize: 11, color: colors.success, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span>✓</span> Patient sélectionné : {form.nom_patient_affiche} ({form.patient_id})
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  <FieldLabel required>Nom complet du patient</FieldLabel>
                  <FieldInput
                    value={form.nom_patient_affiche}
                    onChange={e => set('nom_patient_affiche', e.target.value)}
                    placeholder="Prénom et nom du patient"
                  />
                </div>
              )}

              {/* Date naissance + Age + Sexe */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <FieldLabel required={form.type_patient === 'nouveau'}>Date de naissance</FieldLabel>
                  <FieldInput
                    type="date"
                    value={form.date_naissance}
                    onChange={e => handleDateNaissChange(e.target.value)}
                    readOnly={form.type_patient === 'habituel' && !!form.patient_id}
                  />
                </div>
                <div>
                  <FieldLabel>Âge</FieldLabel>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <FieldInput
                      value={form.age_patient}
                      onChange={e => set('age_patient', e.target.value)}
                      placeholder="0"
                      style={{ flex: 1 }}
                      readOnly={form.type_patient === 'habituel' && !!form.patient_id}
                    />
                    <span style={{
                      display: 'flex', alignItems: 'center',
                      fontSize: 11, color: colors.gray500, fontWeight: 500,
                      paddingLeft: 4,
                    }}>ans</span>
                  </div>
                </div>
                <div>
                  <FieldLabel>Sexe</FieldLabel>
                  <FieldSelect
                    value={form.sexe}
                    onChange={e => set('sexe', e.target.value)}
                    disabled={form.type_patient === 'habituel' && !!form.patient_id}
                  >
                    {SEXES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </FieldSelect>
                </div>
              </div>

              {/* Téléphone + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <FieldLabel>Téléphone</FieldLabel>
                  <FieldInput
                    value={form.telephone}
                    onChange={e => set('telephone', e.target.value)}
                    placeholder="+221 77 000 00 00"
                    readOnly={form.type_patient === 'habituel' && !!form.patient_id}
                  />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <FieldInput
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="email@exemple.com"
                    readOnly={form.type_patient === 'habituel' && !!form.patient_id}
                  />
                </div>
              </div>

              {/* Motif */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>Motif du rendez-vous</FieldLabel>
                <textarea
                  value={form.remarks}
                  onChange={e => set('remarks', e.target.value)}
                  placeholder="Décrivez le motif ou la raison de la consultation…"
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: `1.5px solid ${colors.gray300}`,
                    borderRadius: radius.sm, padding: '8px 12px',
                    fontSize: 13, color: colors.gray800,
                    outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit', lineHeight: 1.5,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = colors.bleu}
                  onBlur={e => e.target.style.borderColor = colors.gray300}
                />
              </div>
            </>
          )}

          {/* ══ TAB : AUTRES DÉTAILS ══ */}
          {activeTab === 'autres' && (
            <>
              <SectionTitle icon="📎" title="Autres détails"
                subtitle="Informations sur la personne ayant pris le rendez-vous" />

              {/* RDV pris par */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>Rendez-vous pris par</FieldLabel>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PRIS_PAR.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set('personne_pris', p.value)}
                      style={{
                        padding: '6px 14px', borderRadius: radius.full,
                        border: `1.5px solid ${form.personne_pris === p.value ? colors.orange : colors.gray300}`,
                        background: form.personne_pris === p.value ? `${colors.orange}15` : colors.white,
                        color: form.personne_pris === p.value ? colors.orange : colors.gray700,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >{p.label}</button>
                  ))}
                </div>
              </div>

              {/* Si autre que patient lui-même */}
              {form.personne_pris !== 'patient' && (
                <div style={{
                  padding: 16, background: colors.gray50,
                  borderRadius: radius.md, border: `1px solid ${colors.gray200}`,
                  marginBottom: 14,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <FieldLabel>Lien de parenté</FieldLabel>
                      <FieldSelect value={form.lien_parente} onChange={e => set('lien_parente', e.target.value)}>
                        {LIENS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </FieldSelect>
                    </div>
                    <div>
                      <FieldLabel>Nom de la personne</FieldLabel>
                      <FieldInput
                        value={form.nom_personne}
                        onChange={e => set('nom_personne', e.target.value)}
                        placeholder="Nom complet"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <FieldLabel>Téléphone</FieldLabel>
                      <FieldInput
                        value={form.tel_personnepris}
                        onChange={e => set('tel_personnepris', e.target.value)}
                        placeholder="+221 77 000 00 00"
                      />
                    </div>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <FieldInput
                        type="email"
                        value={form.email_patient}
                        onChange={e => set('email_patient', e.target.value)}
                        placeholder="email@exemple.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Résumé récapitulatif */}
              <Divider />
              <SectionTitle icon="📋" title="Récapitulatif" subtitle="Vérifiez les informations avant de confirmer" />

              <div style={{
                background: `linear-gradient(135deg, ${colors.bleu}08, ${colors.orange}08)`,
                border: `1px solid ${colors.gray200}`,
                borderRadius: radius.md, padding: 16,
              }}>
                {[
                  { label: 'Médecin',         val: medecinNom },
                  { label: 'Date',            val: slotChoisi?.date
                    ? format(new Date(slotChoisi.date + 'T00:00:00'), 'dd/MM/yyyy')
                    : '–' },
                  { label: 'Créneau',         val: form.creneau_disponible || form.creneau_souhaite || '–' },
                  { label: 'Type patient',    val: TYPES_PATIENT.find(t => t.value === form.type_patient)?.label },
                  { label: 'Type RDV',        val: TYPES_RDV.find(t => t.value === form.appointment_type)?.label },
                  { label: 'Patient',         val: form.nom_patient_affiche || '–' },
                  { label: 'Lieu',            val: LIEUX.find(l => l.value === form.visit_place)?.label },
                  { label: 'Motif',           val: form.remarks || '–' },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 0', borderBottom: `1px solid ${colors.gray100}`,
                  }}>
                    <span style={{ fontSize: 12, color: colors.gray500, fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: colors.gray800, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </form>

        {/* ── Footer actions ── */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${colors.gray200}`,
          background: colors.gray50,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.md,
              background: colors.white, color: colors.gray700,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = colors.gray500}
            onMouseLeave={e => e.currentTarget.style.borderColor = colors.gray300}
          >Annuler</button>

          <div style={{ display: 'flex', gap: 10 }}>
            {activeTab === 'details' && (
              <button
                type="button"
                onClick={() => setActiveTab('autres')}
                style={{
                  padding: '10px 20px',
                  border: `1.5px solid ${colors.bleu}`,
                  borderRadius: radius.md,
                  background: colors.white, color: colors.bleu,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >Autres détails →</button>
            )}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: '10px 24px',
                border: 'none', borderRadius: radius.md,
                background: saving
                  ? colors.gray300
                  : `linear-gradient(135deg, ${colors.orange}, ${colors.orangeDark})`,
                color: colors.white,
                fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 4px 12px rgba(255,118,49,0.4)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: colors.white,
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Enregistrement…
                </>
              ) : (
                <><span>✓</span> Confirmer le RDV</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
