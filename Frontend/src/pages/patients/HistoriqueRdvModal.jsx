import { useEffect, useState } from 'react'
import { rendezVousApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import { showToast } from '../../components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const fmtHeure = (t) => {
  if (!t) return '—'
  const d = new Date(t)
  return isNaN(d) ? String(t).slice(11, 16) : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const today = () => new Date().toISOString().slice(0, 10)
const sixMonthsAgo = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  return d.toISOString().slice(0, 10)
}

// ── Statuts ───────────────────────────────────────────────────────────────────

const STATUTS = {
  0: { label: 'En attente',  color: '#f57c00', bg: '#fff3e0' },
  1: { label: 'Confirmé',    color: '#1565c0', bg: '#e3f2fd' },
  2: { label: 'Annulé',      color: '#c62828', bg: '#fdecea' },
  3: { label: 'Terminé',     color: '#2e7d32', bg: '#e8f5e9' },
  4: { label: 'Absent',      color: '#6a1b9a', bg: '#f3e5f5' },
}

const TYPES_LABEL = {
  consultation: 'Consultation',
  bilan:        'Bilan',
  suivi:        'Suivi',
  urgence:      'Urgence',
  visite:       'Visite',
  autre:        'Autre',
}

// ── Panneau patient ───────────────────────────────────────────────────────────

function PatientPanel({ patient }) {
  const initiales = ((patient?.first_name?.[0] ?? '') + (patient?.last_name?.[0] ?? '')).toUpperCase()
  const nom       = patient?.patient_name ?? `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim()
  const sexe      = patient?.gender_id === 'M' || patient?.gender_id === 'masculin' ? 'Masculin'
                  : patient?.gender_id === 'F' || patient?.gender_id === 'feminin'  ? 'Féminin'
                  : patient?.gender_id ?? '—'
  const dob       = patient?.dob ? new Date(patient.dob).toLocaleDateString('fr-FR') : null
  const tel       = patient?.mobile_number ?? patient?.contact_number ?? null

  const infoRow = (icon, label, value) =>
    value ? (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, width: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 1 }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.white, wordBreak: 'break-word' }}>{value}</div>
        </div>
      </div>
    ) : null

  return (
    <div style={{
      width: 220, minWidth: 220, flexShrink: 0,
      background: colors.bleu,
      borderRadius: `${radius.lg} 0 0 ${radius.lg}`,
      padding: '32px 20px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        width: 84, height: 84, borderRadius: '50%',
        background: colors.orange,
        border: '3px solid rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 800, color: colors.white,
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        marginBottom: 14, flexShrink: 0,
      }}>
        {initiales || '?'}
      </div>

      <div style={{ color: colors.white, fontWeight: 800, fontSize: 16, textAlign: 'center', marginBottom: 4, lineHeight: 1.3 }}>
        {nom}
      </div>

      {patient?.patient_id && (
        <div style={{
          color: colors.orange, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.5px', marginBottom: 16,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: radius.full, padding: '3px 10px',
        }}>
          {patient.patient_id}
        </div>
      )}

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: 16 }} />

      <div style={{ width: '100%' }}>
        {infoRow('⚥', 'Genre', sexe)}
        {infoRow('🎂', 'Date de naissance', dob)}
        {infoRow('📞', 'Téléphone', tel)}
      </div>
    </div>
  )
}

// ── Badge statut ──────────────────────────────────────────────────────────────

function StatutBadge({ statut }) {
  const s = STATUTS[statut] ?? STATUTS[0]
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: radius.full, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────

export default function HistoriqueRdvModal({ patient, onClose }) {
  const [rdvs,      setRdvs]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [dateFrom,  setDateFrom]  = useState(sixMonthsAgo())
  const [dateTo,    setDateTo]    = useState(today())
  const [selected,  setSelected]  = useState(null)

  useEffect(() => {
    if (patient) rechercher()
  }, [patient])

  const rechercher = async () => {
    if (!patient) return
    setLoading(true)
    setSelected(null)
    try {
      const params = {
        patient_id: patient.patient_id,
        per_page: 200,
      }
      if (dateFrom) params.date_debut = dateFrom
      if (dateTo)   params.date_fin   = dateTo
      const r = await rendezVousApi.liste(params)
      setRdvs(r.data?.data ?? [])
    } catch {
      showToast('Erreur lors du chargement des rendez-vous', 'error')
    } finally {
      setLoading(false)
    }
  }

  const thStyle = {
    padding: '10px 14px',
    fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.4px',
    color: colors.white, background: colors.bleu,
    textAlign: 'left', whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  }

  const tdStyle = (isSel, isEven) => ({
    padding: '10px 14px',
    fontSize: 13,
    borderBottom: `1px solid ${colors.gray200}`,
    color: isSel ? colors.white : colors.gray800,
    background: isSel ? colors.bleuLight : isEven ? colors.gray50 : colors.white,
    transition: 'background 0.1s',
    cursor: 'pointer',
    verticalAlign: 'middle',
  })

  const totalRdvs    = rdvs.length
  const confirmes    = rdvs.filter(r => r.statut_app == 1).length
  const annules      = rdvs.filter(r => r.statut_app == 2).length

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        width: '100%', maxWidth: 980,
        maxHeight: '90vh',
        boxShadow: shadows.xl,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* ── Barre titre ───────────────────────────────────── */}
        <div style={{
          background: colors.bleu, color: colors.white,
          padding: '14px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Historique des Rendez-vous</div>
              {patient && (
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>
                  {patient.patient_name ?? `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim()}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: radius.sm, width: 32, height: 32,
            cursor: 'pointer', color: colors.white, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* ── Corps ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Panneau gauche */}
          <PatientPanel patient={patient} />

          {/* Panneau droit */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* Filtres */}
            <div style={{
              padding: '18px 20px 14px',
              borderBottom: `1px solid ${colors.gray200}`,
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: colors.bleu,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>🔍</span> Recherche
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Début
                  </label>
                  <input
                    type="date" value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    style={{
                      border: `1.5px solid ${colors.gray300}`,
                      borderRadius: radius.sm, padding: '7px 10px',
                      fontSize: 13, color: colors.gray900,
                      outline: 'none', background: colors.white,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: colors.gray600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Fin
                  </label>
                  <input
                    type="date" value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    style={{
                      border: `1.5px solid ${colors.gray300}`,
                      borderRadius: radius.sm, padding: '7px 10px',
                      fontSize: 13, color: colors.gray900,
                      outline: 'none', background: colors.white,
                    }}
                  />
                </div>
                <button onClick={rechercher} disabled={loading} style={{
                  background: colors.bleu, color: colors.white,
                  border: 'none', borderRadius: radius.sm,
                  padding: '8px 20px', fontSize: 13, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: shadows.sm,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {loading ? '...' : '🔎 Rechercher'}
                </button>

                {!loading && totalRdvs > 0 && (
                  <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
                    <StatPill label="Total" value={totalRdvs} color={colors.bleu} />
                    <StatPill label="Confirmés" value={confirmes} color="#1565c0" />
                    <StatPill label="Annulés" value={annules} color="#c62828" />
                  </div>
                )}
              </div>
            </div>

            {/* Tableau */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{
                padding: '12px 20px 6px',
                fontSize: 11, fontWeight: 700, color: colors.bleu,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>📅</span> Liste des rendez-vous
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: colors.gray500 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  Chargement…
                </div>
              ) : rdvs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: colors.gray500 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Aucun rendez-vous trouvé</div>
                  <div style={{ fontSize: 12 }}>Modifiez la période de recherche</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>#</th>
                      <th style={thStyle}>Date RDV</th>
                      <th style={thStyle}>Horaire</th>
                      <th style={thStyle}>Médecin</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Lieu</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rdvs.map((rdv, i) => {
                      const isSel  = selected?.appointment_id === rdv.appointment_id
                      const isEven = i % 2 === 0
                      const td     = (children, extra = {}) => (
                        <td style={{ ...tdStyle(isSel, isEven), ...extra }}>{children}</td>
                      )
                      const type = TYPES_LABEL[rdv.appointment_type] ?? rdv.appointment_type ?? '—'

                      return (
                        <tr key={rdv.appointment_id ?? i}
                          onClick={() => setSelected(isSel ? null : rdv)}
                          style={{ cursor: 'pointer' }}
                        >
                          {td(
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 22, height: 22, borderRadius: '50%',
                              background: isSel ? 'rgba(255,255,255,0.2)' : colors.gray100,
                              fontSize: 11, fontWeight: 700,
                              color: isSel ? colors.white : colors.gray600,
                            }}>{i + 1}</span>,
                            { textAlign: 'center' }
                          )}
                          {td(
                            <span style={{ fontWeight: 600, color: isSel ? colors.white : colors.bleu }}>
                              {fmtDate(rdv.appointment_date)}
                            </span>
                          )}
                          {td(
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: isSel ? 'rgba(255,255,255,0.85)' : colors.gray600 }}>
                              {fmtHeure(rdv.start_time)} – {fmtHeure(rdv.end_time)}
                            </span>
                          )}
                          {td(rdv.consulting_doctor_id ?? '—')}
                          {td(
                            <span style={{
                              background: isSel ? 'rgba(255,255,255,0.15)' : colors.infoBg,
                              color: isSel ? colors.white : colors.info,
                              borderRadius: radius.full, padding: '2px 9px',
                              fontSize: 11, fontWeight: 600,
                            }}>{type}</span>
                          )}
                          {td(rdv.visit_place ?? '—')}
                          {td(<StatutBadge statut={rdv.statut_app} />, { textAlign: 'center' })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Détail RDV sélectionné */}
            {selected && (
              <div style={{
                padding: '14px 20px',
                borderTop: `2px solid ${colors.bleu}20`,
                background: colors.gray50,
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.bleu, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
                  Détails — {fmtDate(selected.appointment_date)}
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <DetailItem label="Médecin" value={selected.consulting_doctor_id ?? '—'} />
                  <DetailItem label="Horaire" value={`${fmtHeure(selected.start_time)} – ${fmtHeure(selected.end_time)}`} />
                  <DetailItem label="Lieu" value={selected.visit_place ?? '—'} />
                  <DetailItem label="Type patient" value={selected.patient_type === 'nouveau' ? 'Nouveau patient' : 'Patient habituel'} />
                  {selected.remarks && <DetailItem label="Motif" value={selected.remarks} />}
                  {selected.nom_personne && (
                    <DetailItem label="Pris par" value={`${selected.nom_personne}${selected.lien_parente ? ` (${selected.lien_parente})` : ''}`} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      border: `1.5px solid ${color}30`,
      borderRadius: radius.sm,
      padding: '4px 12px',
      background: `${color}08`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <span style={{ fontSize: 10, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.gray800 }}>{value}</div>
    </div>
  )
}
