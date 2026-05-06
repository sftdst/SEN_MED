import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { visiteApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import { showToast } from '../../components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const fmtMontant = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'

const today    = () => new Date().toISOString().slice(0, 10)
const monthAgo = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10) }

// ── Panneau patient (gauche) ──────────────────────────────────────────────────

function PatientPanel({ patient, totalVisites, totalPaye }) {
  const initiales = ((patient?.first_name?.[0] ?? '') + (patient?.last_name?.[0] ?? '')).toUpperCase()
  const nom       = patient?.patient_name ?? `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim()
  const sexe      = patient?.gender_id === 'M' || patient?.gender_id === 'masculin' ? 'Masculin'
                  : patient?.gender_id === 'F' || patient?.gender_id === 'feminin'  ? 'Féminin'
                  : patient?.gender_id ?? null
  const dob       = patient?.dob ? new Date(patient.dob).toLocaleDateString('fr-FR') : null
  const tel       = patient?.mobile_number ?? patient?.contact_number ?? null
  const assurance = patient?.partenaire?.nom_partenaire ?? (patient?.company_id ? patient.company_id : null)

  const Row = ({ icon, label, value }) => !value ? null : (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 12, width: 16, flexShrink: 0, opacity: 0.7 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.white, wordBreak: 'break-word', marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )

  return (
    <div style={{
      width: 190, minWidth: 190, flexShrink: 0,
      background: `linear-gradient(160deg, ${colors.bleu} 0%, #003f7a 100%)`,
      borderRadius: `${radius.lg} 0 0 ${radius.lg}`,
      padding: '20px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflowY: 'auto',
    }}>
      {/* Avatar */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: colors.orange,
        border: '3px solid rgba(255,255,255,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 800, color: colors.white,
        boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
        marginBottom: 10, flexShrink: 0,
      }}>
        {initiales || '?'}
      </div>

      {/* Nom */}
      <div style={{ color: colors.white, fontWeight: 800, fontSize: 14, textAlign: 'center', marginBottom: 3, lineHeight: 1.3 }}>
        {nom}
      </div>

      {/* ID */}
      {patient?.patient_id && (
        <div style={{
          color: colors.orange, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.5px', marginBottom: 14,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: radius.full, padding: '2px 10px',
        }}>
          {patient.patient_id}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, width: '100%' }}>
        <div style={{
          flex: 1, textAlign: 'center',
          background: 'rgba(255,255,255,0.1)', borderRadius: radius.sm, padding: '6px 4px',
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: colors.white, lineHeight: 1 }}>{totalVisites}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: 2 }}>Visites</div>
        </div>
        <div style={{
          flex: 1, textAlign: 'center',
          background: 'rgba(255,118,49,0.2)', borderRadius: radius.sm, padding: '6px 4px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: colors.orange, lineHeight: 1 }}>
            {Number(totalPaye || 0).toLocaleString('fr-FR')}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: 2 }}>FCFA</div>
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 12 }} />

      {/* Infos */}
      <div style={{ width: '100%' }}>
        <Row icon="⚥"  label="Genre"          value={sexe}      />
        <Row icon="🎂"  label="Date naissance"  value={dob}       />
        <Row icon="📞"  label="Téléphone"       value={tel}       />
        <Row icon="🏢"  label="Assurance"       value={assurance} />
      </div>
    </div>
  )
}

// ── Badge statut ──────────────────────────────────────────────────────────────

function StatutBadge({ doctorSeen, urgence }) {
  if (urgence) return (
    <span style={{ background: colors.dangerBg, color: colors.danger, borderRadius: radius.full, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
      🚨 Urgence
    </span>
  )
  if (doctorSeen === 1) return (
    <span style={{ background: colors.successBg, color: colors.success, borderRadius: radius.full, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
      ✔ Vu
    </span>
  )
  return (
    <span style={{ background: colors.warningBg, color: colors.warning, borderRadius: radius.full, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
      ⏳ Attente
    </span>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────

export default function HistoriqueVisitesModal({ patient, onClose }) {
  const navigate  = useNavigate()
  const [visites,  setVisites]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [dateFrom, setDateFrom] = useState(monthAgo())
  const [dateTo,   setDateTo]   = useState(today())

  useEffect(() => { if (patient) rechercher() }, [patient])

  const rechercher = async () => {
    if (!patient) return
    setLoading(true)
    try {
      const params = { patient_pin: patient.patient_id, per_page: 100 }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo)   params.date_to   = dateTo
      const r = await visiteApi.liste(params)
      setVisites(r.data?.data?.data ?? r.data?.data ?? [])
    } catch {
      showToast('Erreur lors du chargement des visites', 'error')
    } finally {
      setLoading(false)
    }
  }

  const ouvrirConsultation = (v) => {
    onClose()
    navigate('/consultation', { state: { patient, adt_id: v.adt_id } })
  }

  const totalVisites = visites.length
  const totalPaye    = visites.reduce((s, v) => s + parseFloat(v.Total_a_payer ?? v.bill_amount ?? 0), 0)

  const thSt = {
    padding: '9px 12px',
    fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.4px',
    color: colors.white, background: colors.bleu,
    textAlign: 'left', whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky', top: 0, zIndex: 1,
  }

  const tdSt = (isEven) => ({
    padding: '9px 12px',
    fontSize: 12,
    borderBottom: `1px solid ${colors.gray100}`,
    color: colors.gray800,
    background: isEven ? colors.gray50 : colors.white,
    verticalAlign: 'middle',
  })

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, padding: '16px',
      }}
    >
      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        width: '100%', maxWidth: 1060,
        height: '92vh',
        boxShadow: shadows.xl,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── Barre titre ── */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.bleu}, #003f7a)`,
          color: colors.white,
          padding: '12px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: radius.md,
              background: colors.orange,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>📋</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Historique des Visites</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>
                {patient?.patient_name ?? `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim()}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: radius.sm, width: 32, height: 32,
            cursor: 'pointer', color: colors.white, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* ── Corps ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Panneau gauche */}
          <PatientPanel patient={patient} totalVisites={totalVisites} totalPaye={totalPaye} />

          {/* Panneau droit */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* Barre filtre compacte */}
            <div style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${colors.gray200}`,
              background: colors.gray50,
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.bleu, textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: 4 }}>
                🔍 Période
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase' }}>Du</label>
                <input
                  type="date" value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  style={{
                    border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
                    padding: '5px 8px', fontSize: 12, color: colors.gray900,
                    outline: 'none', background: colors.white,
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase' }}>Au</label>
                <input
                  type="date" value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  style={{
                    border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
                    padding: '5px 8px', fontSize: 12, color: colors.gray900,
                    outline: 'none', background: colors.white,
                  }}
                />
              </div>

              <button onClick={rechercher} disabled={loading} style={{
                background: colors.bleu, color: colors.white,
                border: 'none', borderRadius: radius.sm,
                padding: '6px 16px', fontSize: 12, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {loading ? '⏳' : '🔎'} {loading ? 'Chargement...' : 'Rechercher'}
              </button>

              {!loading && totalVisites > 0 && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    background: `var(--app-primary-15, #002f5915)`, color: colors.bleu,
                    borderRadius: radius.full, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {totalVisites} visite{totalVisites > 1 ? 's' : ''}
                  </span>
                  <span style={{
                    background: `${colors.success}15`, color: colors.success,
                    borderRadius: radius.full, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {fmtMontant(totalPaye)}
                  </span>
                </div>
              )}
            </div>

            {/* Zone tableau — scroll uniquement ici */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
              {loading ? (
                <div style={{ padding: 50, textAlign: 'center', color: colors.gray500 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                  Chargement des visites…
                </div>
              ) : visites.length === 0 ? (
                <div style={{ padding: 50, textAlign: 'center', color: colors.gray500 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Aucune visite trouvée</div>
                  <div style={{ fontSize: 12 }}>Modifiez la période ou relancez la recherche</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{ ...thSt, width: 32, textAlign: 'center' }}>#</th>
                      <th style={thSt}>Date</th>
                      <th style={thSt}>N° Facture</th>
                      <th style={thSt}>Médecin</th>
                      <th style={{ ...thSt, textAlign: 'center' }}>Type</th>
                      <th style={{ ...thSt, textAlign: 'right' }}>Montant</th>
                      <th style={{ ...thSt, textAlign: 'center' }}>Statut</th>
                      <th style={{ ...thSt, textAlign: 'center', width: 60 }}>Détail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visites.map((v, i) => {
                      const isEven    = i % 2 === 0
                      const visitType = v.visit_type === 'IPD'  ? 'Hospitalisation'
                                      : v.visit_type === 'EMRG' ? 'Urgence'
                                      : 'Consultation'
                      return (
                        <tr
                          key={v.adt_id ?? i}
                          style={{ transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = `var(--app-primary-08, #002f5908)`}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          {/* # */}
                          <td style={{ ...tdSt(isEven), textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 20, height: 20, borderRadius: '50%',
                              background: colors.gray200,
                              fontSize: 10, fontWeight: 700, color: colors.gray600,
                            }}>{i + 1}</span>
                          </td>

                          {/* Date */}
                          <td style={tdSt(isEven)}>
                            <span style={{ fontWeight: 600, color: colors.bleu, fontSize: 12 }}>
                              {fmtDate(v.visit_datetime ?? v.created_dttm)}
                            </span>
                          </td>

                          {/* N° Facture */}
                          <td style={tdSt(isEven)}>
                            {v.bill_header?.[0]?.bill_no ? (
                              <span style={{
                                fontFamily: 'monospace', fontSize: 11,
                                background: `var(--app-primary-0d, #002f590d)`, color: colors.bleu,
                                borderRadius: 4, padding: '2px 7px', fontWeight: 600,
                              }}>
                                {v.bill_header[0].bill_no}
                              </span>
                            ) : (
                              <span style={{ color: colors.gray400, fontSize: 11 }}>—</span>
                            )}
                          </td>

                          {/* Médecin */}
                          <td style={{ ...tdSt(isEven), fontSize: 12 }}>
                            {v.medecin ? (
                              <div>
                                <div style={{ fontWeight: 600, color: colors.gray800 }}>
                                  {v.medecin.staff_name || `${v.medecin.first_name ?? ''} ${v.medecin.last_name ?? ''}`.trim() || '—'}
                                </div>
                                {v.medecin.specialization && (
                                  <div style={{ fontSize: 10, color: colors.gray500, marginTop: 1 }}>
                                    {v.medecin.specialization}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: colors.gray400, fontStyle: 'italic', fontSize: 11 }}>Non renseigné</span>
                            )}
                          </td>

                          {/* Type */}
                          <td style={{ ...tdSt(isEven), textAlign: 'center' }}>
                            <span style={{
                              background: v.visit_type === 'EMRG' ? colors.dangerBg
                                        : v.visit_type === 'IPD'  ? colors.infoBg
                                        : colors.successBg,
                              color: v.visit_type === 'EMRG' ? colors.danger
                                   : v.visit_type === 'IPD'  ? colors.info
                                   : colors.success,
                              borderRadius: radius.full, padding: '2px 8px',
                              fontSize: 10, fontWeight: 700,
                            }}>
                              {visitType}
                            </span>
                          </td>

                          {/* Montant */}
                          <td style={{ ...tdSt(isEven), textAlign: 'right' }}>
                            <span style={{ fontWeight: 700, color: colors.orange, fontSize: 12 }}>
                              {fmtMontant(v.Total_a_payer ?? v.bill_amount ?? 0)}
                            </span>
                          </td>

                          {/* Statut */}
                          <td style={{ ...tdSt(isEven), textAlign: 'center' }}>
                            <StatutBadge doctorSeen={v.doctor_seen} urgence={v.urgence} />
                          </td>

                          {/* Détail */}
                          <td style={{ ...tdSt(isEven), textAlign: 'center' }}>
                            <button
                              title="Voir la consultation"
                              onClick={() => ouvrirConsultation(v)}
                              style={{
                                width: 30, height: 30, borderRadius: radius.sm,
                                border: `1.5px solid ${colors.bleu}`,
                                background: `var(--app-primary-10, #002f5910)`,
                                color: colors.bleu,
                                cursor: 'pointer', fontSize: 14,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.13s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = colors.bleu; e.currentTarget.style.color = '#fff' }}
                              onMouseLeave={e => { e.currentTarget.style.background = `var(--app-primary-10, #002f5910)`; e.currentTarget.style.color = colors.bleu }}
                            >👁</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
