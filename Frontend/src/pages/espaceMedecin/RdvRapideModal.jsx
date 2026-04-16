import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { rendezVousApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import { showToast } from '../../components/ui/Toast'

// ── Constantes ────────────────────────────────────────────────────────────────
const TYPES_RDV = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'bilan',        label: 'Bilan'        },
  { value: 'suivi',        label: 'Suivi'        },
  { value: 'urgence',      label: 'Urgence'      },
  { value: 'visite',       label: 'Visite'       },
  { value: 'controle',     label: 'Contrôle'     },
  { value: 'autre',        label: 'Autre'        },
]

const DUREES = [
  { value: 15,  label: '15 min' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 h'    },
]

// Génère les créneaux statiques de 07:00 à 20:30 par pas de 30 min
const genCreneaux = () => {
  const slots = []
  for (let h = 7; h < 21; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      slots.push(`${hh}:${mm}`)
    }
  }
  return slots
}
const ALL_SLOTS = genCreneaux()

const todayISO = () => format(new Date(), 'yyyy-MM-dd')

const initiales = (nom = '') => {
  const p = nom.trim().split(/\s+/).filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase()
  return (p[0]?.[0] || '?').toUpperCase()
}

// ── Composants helpers ────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#6c757d',
      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
    }}>
      {children}
      {required && <span style={{ color: '#c62828', marginLeft: 3 }}>*</span>}
    </div>
  )
}

function InfoCard({ icon, title, subtitle, color = colors.bleu }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      background: `${color}08`,
      border: `1px solid ${color}20`,
      borderRadius: radius.md,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 13, fontWeight: 800,
        boxShadow: `0 3px 8px ${color}40`,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: '#212529', fontSize: 13 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#6c757d', marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{
        marginLeft: 'auto',
        padding: '2px 8px', borderRadius: radius.full,
        background: `${color}15`, color: color,
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
      }}>
        Pré-rempli
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL RDV RAPIDE
// ════════════════════════════════════════════════════════════════════════════
export default function RdvRapideModal({ open, onClose, patient, medecin, rdv, onSaved }) {
  const isEdit = Boolean(rdv)

  // ── Formulaire ─────────────────────────────────────────────────────────────
  const [date,       setDate]       = useState(todayISO())
  const [typeRdv,    setTypeRdv]    = useState('consultation')
  const [motif,      setMotif]      = useState('')
  const [duree,      setDuree]      = useState(30)
  const [creneau,    setCreneau]    = useState('')

  // ── Créneaux disponibles ───────────────────────────────────────────────────
  const [creneaux,        setCreneaux]        = useState([])
  const [loadingCreneaux, setLoadingCreneaux] = useState(false)

  // ── Sauvegarde ─────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)

  // Charger les créneaux dès que date ou médecin change
  useEffect(() => {
    if (!open || !date) return
    setCreneau('')
    setLoadingCreneaux(true)
    const medecinId = medecin?.user_id || medecin?.id || medecin?.id_Rep
    rendezVousApi.creneauxDisponibles({ medecin_id: medecinId, date })
      .then(res => {
        const data = res.data?.data || res.data || []
        const slots = Array.isArray(data) ? data : []
        // L'API peut retourner des strings "HH:mm" ou des objets { heure_debut }
        const normalized = slots.map(s =>
          typeof s === 'string' ? s : (s.heure_debut || s.start || '').slice(0, 5)
        ).filter(Boolean)
        setCreneaux(normalized.length > 0 ? normalized : ALL_SLOTS)
      })
      .catch(() => setCreneaux(ALL_SLOTS))
      .finally(() => setLoadingCreneaux(false))
  }, [open, date, medecin])

  // Reset / pré-remplissage à l'ouverture
  useEffect(() => {
    if (open) {
      if (rdv) {
        // Mode édition : pré-remplir avec les données existantes
        const dateStr = rdv.appointment_date
          ? rdv.appointment_date.slice(0, 10)
          : todayISO()
        const startStr = (rdv.start_time || rdv.heure_debut || '').slice(0, 5)
        const endStr   = (rdv.end_time   || rdv.heure_fin   || '').slice(0, 5)
        // Calcul de la durée depuis start→end
        let durCalc = 30
        if (startStr && endStr) {
          const [sh, sm] = startStr.split(':').map(Number)
          const [eh, em] = endStr.split(':').map(Number)
          const diff = (eh * 60 + em) - (sh * 60 + sm)
          if ([15, 30, 45, 60].includes(diff)) durCalc = diff
        }
        setDate(dateStr)
        setTypeRdv(rdv.type_consultation || 'consultation')
        setMotif(rdv.motif || '')
        setDuree(durCalc)
        setCreneau(startStr)
      } else {
        setDate(todayISO())
        setTypeRdv('consultation')
        setMotif('')
        setDuree(30)
        setCreneau('')
      }
    }
  }, [open, rdv])

  if (!open) return null

  // Infos pré-remplies
  const nomPatient  = patient?.nom || '—'
  const telPatient  = patient?.telephone || '—'
  const nomMedecin  = medecin
    ? `Dr. ${medecin.first_name || ''} ${medecin.last_name || ''}`.trim()
    : 'Médecin'
  const specMedecin = medecin?.specialite || medecin?.fonction || 'Médecin Généraliste'
  const medecinId   = medecin?.user_id || medecin?.id || medecin?.id_Rep
  const patientId   = patient?.patient_id || patient?.id

  // Calcul heure fin
  const calcHeureFin = (debut, dur) => {
    if (!debut) return ''
    const [h, m] = debut.split(':').map(Number)
    const totalMin = h * 60 + m + dur
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
  }

  const handleSave = async () => {
    if (!creneau) { showToast('Veuillez sélectionner un créneau', 'error'); return }
    if (!motif.trim()) { showToast('Veuillez saisir un motif', 'error'); return }

    setSaving(true)
    try {
      if (isEdit) {
        const rdvId = rdv.appointment_id || rdv.id
        await rendezVousApi.modifier(rdvId, {
          appointment_date:  date,
          start_time:        creneau,
          end_time:          calcHeureFin(creneau, duree),
          motif:             motif.trim(),
          type_consultation: typeRdv,
        })
        showToast('Rendez-vous modifié avec succès', 'success')
      } else {
        await rendezVousApi.creer({
          patient_id:            patientId,
          consulting_doctor_id:  medecinId,
          patient_type:          'habituel',
          appointment_date:      date,
          start_time:            creneau,
          end_time:              calcHeureFin(creneau, duree),
          motif:                 motif.trim(),
          type_consultation:     typeRdv,
          statut_app:            0,
        })
        showToast('Rendez-vous créé avec succès', 'success')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'enregistrement'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid #dee2e6', borderRadius: radius.sm,
    padding: '9px 12px', fontSize: 13, color: '#212529',
    background: '#fff', outline: 'none', transition: 'border-color 0.15s',
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,20,50,0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 1200,
          animation: 'rdvFadeIn 0.18s ease',
        }}
      />

      {/* Panneau */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 520, maxWidth: '95vw',
        maxHeight: '92vh',
        background: '#f8f9fa',
        borderRadius: radius.xl,
        boxShadow: '0 24px 80px rgba(0,0,0,0.32)',
        zIndex: 1201,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'rdvSlideIn 0.22s cubic-bezier(0.34,1.4,0.64,1)',
      }}>

        {/* ── En-tête ── */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: colors.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 4px 10px rgba(255,118,49,0.45)',
            }}>📅</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>
                {isEdit ? 'Modifier le Rendez-vous' : 'Nouveau Rendez-vous Rapide'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 1 }}>
                {isEdit ? 'Modifiez les informations du rendez-vous' : 'Patient et médecin pré-sélectionnés'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 700, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(198,40,40,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >✕</button>
        </div>

        {/* ── Corps scrollable ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Info pré-remplies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InfoCard
              icon={initiales(nomPatient)}
              title={nomPatient}
              subtitle={`📞 ${telPatient}`}
              color={colors.bleu}
            />
            <InfoCard
              icon="👨‍⚕️"
              title={nomMedecin}
              subtitle={specMedecin}
              color={colors.orange}
            />
          </div>

          {/* Séparateur */}
          <div style={{ height: 1, background: '#e9ecef' }} />

          {/* Date + Type + Durée */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Date */}
            <div style={{ flex: '1 1 150px' }}>
              <Label required>Date du RDV</Label>
              <input
                type="date"
                value={date}
                min={todayISO()}
                onChange={e => setDate(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e  => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            {/* Type */}
            <div style={{ flex: '1 1 150px' }}>
              <Label required>Type de RDV</Label>
              <select
                value={typeRdv}
                onChange={e => setTypeRdv(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e  => e.target.style.borderColor = '#dee2e6'}
              >
                {TYPES_RDV.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Durée */}
            <div style={{ flex: '0 1 110px' }}>
              <Label>Durée</Label>
              <select
                value={duree}
                onChange={e => setDuree(Number(e.target.value))}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e  => e.target.style.borderColor = '#dee2e6'}
              >
                {DUREES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Motif */}
          <div>
            <Label required>Motif / Raison</Label>
            <input
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Ex : Consultation de suivi, Douleurs abdominales..."
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = colors.bleu}
              onBlur={e  => e.target.style.borderColor = '#dee2e6'}
            />
          </div>

          {/* Créneaux disponibles */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Label required>Créneau disponible</Label>
              {creneau && (
                <span style={{
                  fontSize: 11, color: colors.orange, fontWeight: 700,
                  padding: '2px 8px', background: '#fff3e0',
                  borderRadius: radius.full, border: '1px solid #ffe08250',
                }}>
                  {creneau} → {calcHeureFin(creneau, duree)}
                </span>
              )}
            </div>

            {loadingCreneaux ? (
              <div style={{
                padding: '20px', textAlign: 'center', color: '#adb5bd',
                background: '#fff', borderRadius: radius.md, border: '1px solid #e9ecef',
              }}>
                <div style={{
                  width: 20, height: 20, border: `2px solid #dee2e6`,
                  borderTopColor: colors.bleu, borderRadius: '50%',
                  animation: 'rdvSpin 0.7s linear infinite',
                  display: 'inline-block', marginBottom: 6,
                }} />
                <div style={{ fontSize: 12 }}>Chargement des créneaux...</div>
              </div>
            ) : (
              <div style={{
                background: '#fff', borderRadius: radius.md,
                border: '1px solid #e9ecef', padding: '12px',
                maxHeight: 180, overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {creneaux.map(slot => {
                    const sel = creneau === slot
                    return (
                      <button
                        key={slot}
                        onClick={() => setCreneau(slot)}
                        style={{
                          padding: '6px 13px', borderRadius: radius.sm, cursor: 'pointer',
                          border: `1.5px solid ${sel ? colors.orange : '#dee2e6'}`,
                          background: sel ? colors.orange : '#fff',
                          color: sel ? '#fff' : '#495057',
                          fontSize: 12, fontWeight: sel ? 700 : 500,
                          transition: 'all 0.12s',
                          boxShadow: sel ? `0 3px 8px ${colors.orange}40` : 'none',
                        }}
                        onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = colors.orange; e.currentTarget.style.background = '#fff3e0' } }}
                        onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = '#dee2e6'; e.currentTarget.style.background = '#fff' } }}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Pied ── */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #e9ecef',
          background: '#fff',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '9px 22px', borderRadius: radius.sm, cursor: 'pointer',
              border: '1.5px solid #dee2e6', background: '#f8f9fa',
              color: '#495057', fontSize: 13, fontWeight: 700,
              transition: 'all 0.15s', opacity: saving ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#e9ecef' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#f8f9fa' }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !creneau || !motif.trim()}
            style={{
              padding: '9px 24px', borderRadius: radius.sm,
              cursor: (saving || !creneau || !motif.trim()) ? 'not-allowed' : 'pointer',
              border: 'none', background: colors.orange,
              color: '#fff', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.15s',
              opacity: (saving || !creneau || !motif.trim()) ? 0.65 : 1,
              boxShadow: (saving || !creneau || !motif.trim()) ? 'none' : '0 4px 12px rgba(255,118,49,0.4)',
            }}
            onMouseEnter={e => { if (!saving && creneau && motif.trim()) e.currentTarget.style.background = '#e06020' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = colors.orange }}
          >
            {saving ? (
              <>
                <span style={{
                  width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  display: 'inline-block', animation: 'rdvSpin 0.6s linear infinite',
                }} />
                Enregistrement...
              </>
            ) : (
              <>{isEdit ? '✓ Enregistrer les modifications' : '✓ Créer le rendez-vous'}</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rdvFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rdvSlideIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.88) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
        @keyframes rdvSpin    { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}
