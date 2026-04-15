import { useEffect, useState } from 'react'
import { visiteApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import { showToast } from '../../components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const fmtMontant = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'

const today = () => new Date().toISOString().slice(0, 10)
const monthAgo = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

// ── Carte patient (panneau gauche) ────────────────────────────────────────────

function PatientPanel({ patient }) {
  const initiales = ((patient?.first_name?.[0] ?? '') + (patient?.last_name?.[0] ?? '')).toUpperCase()
  const nom       = patient?.patient_name ?? `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim()
  const sexe      = patient?.gender_id === 'M' || patient?.gender_id === 'masculin' ? 'Masculin'
                  : patient?.gender_id === 'F' || patient?.gender_id === 'feminin'  ? 'Féminin'
                  : patient?.gender_id ?? '—'
  const dob       = patient?.dob ? new Date(patient.dob).toLocaleDateString('fr-FR') : null
  const tel       = patient?.mobile_number ?? patient?.contact_number ?? null
  const assurance = patient?.partenaire?.nom_partenaire ?? (patient?.company_id ? patient.company_id : null)
  const couverture = patient?.type_couverture ?? null

  const infoRow = (icon, label, value) =>
    value ? (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, width: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 1 }}>
            {label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.white, wordBreak: 'break-word' }}>
            {value}
          </div>
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
      {/* Avatar */}
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

      {/* Nom */}
      <div style={{
        color: colors.white, fontWeight: 800, fontSize: 16,
        textAlign: 'center', marginBottom: 4, lineHeight: 1.3,
      }}>
        {nom}
      </div>

      {/* ID patient */}
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

      {/* Séparateur */}
      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: 16 }} />

      {/* Infos */}
      <div style={{ width: '100%' }}>
        {infoRow('⚥', 'Genre', sexe)}
        {infoRow('🎂', 'Date de naissance', dob)}
        {infoRow('📞', 'Téléphone', tel)}
        {infoRow('🏢', 'Assurance', assurance)}
        {infoRow('🛡', 'Couverture', couverture)}
      </div>
    </div>
  )
}

// ── Badge statut ──────────────────────────────────────────────────────────────

function StatutBadge({ doctorSeen, urgence }) {
  if (urgence) return (
    <span style={{
      background: colors.dangerBg, color: colors.danger,
      borderRadius: radius.full, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
    }}>🚨 Urgence</span>
  )
  if (doctorSeen === 1) return (
    <span style={{
      background: colors.successBg, color: colors.success,
      borderRadius: radius.full, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
    }}>✔ Vu</span>
  )
  return (
    <span style={{
      background: colors.warningBg, color: colors.warning,
      borderRadius: radius.full, padding: '3px 10px',
      fontSize: 11, fontWeight: 700,
    }}>⏳ En attente</span>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────

export default function HistoriqueVisitesModal({ patient, onClose }) {
  const [visites,   setVisites]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [dateFrom,  setDateFrom]  = useState(monthAgo())
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
        patient_pin: patient.patient_id,
        per_page: 100,
      }
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

  // ── Styles tableau ──────────────────────────────────────────
  const thStyle = {
    padding: '10px 14px',
    fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.4px',
    color: colors.white, background: colors.bleu,
    textAlign: 'left', whiteSpace: 'nowrap',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  }
  const tdStyle = (isSelected, isEven) => ({
    padding: '10px 14px',
    fontSize: 13,
    borderBottom: `1px solid ${colors.gray200}`,
    color: isSelected ? colors.white : colors.gray800,
    background: isSelected ? colors.bleuLight
              : isEven ? colors.gray50 : colors.white,
    transition: 'background 0.1s',
    cursor: 'pointer',
    verticalAlign: 'middle',
  })

  const totalVisites = visites.length
  const totalPaye    = visites.reduce((s, v) => s + (parseFloat(v.Total_a_payer ?? v.bill_amount ?? 0)), 0)

  return (
    <div style={{
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
        width: '100%', maxWidth: 940,
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
            <span style={{ fontSize: 18 }}>📋</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Historique des Visites</div>
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

        {/* ── Corps : gauche + droite ────────────────────────── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Panneau gauche */}
          <PatientPanel patient={patient} />

          {/* Panneau droit */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            overflow: 'hidden', minWidth: 0,
          }}>
            {/* Filtre date */}
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

                {/* Compteurs */}
                {!loading && totalVisites > 0 && (
                  <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
                    <StatPill label="Visites" value={totalVisites} color={colors.bleu} />
                    <StatPill label="Total facturé" value={fmtMontant(totalPaye)} color={colors.success} />
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
                <span>🗂</span> Historique des visites
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: colors.gray500 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  Chargement…
                </div>
              ) : visites.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: colors.gray500 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Aucune visite trouvée</div>
                  <div style={{ fontSize: 12 }}>Modifiez la période de recherche</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>#</th>
                      <th style={thStyle}>Date de Consultation</th>
                      <th style={thStyle}>N° Facture</th>
                      <th style={thStyle}>Consultant</th>
                      <th style={thStyle}>Type</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Montant</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visites.map((v, i) => {
                      const isSel  = selected?.adt_id === v.adt_id
                      const isEven = i % 2 === 0
                      const td     = (children, extra = {}) => (
                        <td style={{ ...tdStyle(isSel, isEven), ...extra }}>{children}</td>
                      )
                      const visitType = v.visit_type === 'IPD' ? 'Hospitalisation'
                                      : v.visit_type === 'EMRG' ? 'Urgence'
                                      : 'Consultation'
                      return (
                        <tr key={v.adt_id ?? i}
                          onClick={() => setSelected(isSel ? null : v)}
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
                              {fmtDate(v.visit_datetime ?? v.created_dttm)}
                            </span>
                          )}
                          {td(
                            <span style={{
                              fontFamily: 'monospace', fontSize: 12,
                              color: isSel ? 'rgba(255,255,255,0.85)' : colors.gray600,
                            }}>
                              {v.bill_no ?? '—'}
                            </span>
                          )}
                          {td(v.consulting_doctor_id ?? '—')}
                          {td(
                            <span style={{
                              background: isSel ? 'rgba(255,255,255,0.15)' : colors.infoBg,
                              color: isSel ? colors.white : colors.info,
                              borderRadius: radius.full, padding: '2px 9px',
                              fontSize: 11, fontWeight: 600,
                            }}>
                              {visitType}
                            </span>
                          )}
                          {td(
                            <span style={{ fontWeight: 700 }}>
                              {fmtMontant(v.Total_a_payer ?? v.bill_amount ?? 0)}
                            </span>,
                            { textAlign: 'right' }
                          )}
                          {td(
                            <StatutBadge doctorSeen={v.doctor_seen} urgence={v.urgence} />,
                            { textAlign: 'center' }
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Détail visite sélectionnée */}
            {selected && (
              <div style={{
                padding: '14px 20px',
                borderTop: `2px solid ${colors.bleu}20`,
                background: colors.gray50,
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.bleu, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
                  Détails — {fmtDate(selected.visit_datetime ?? selected.created_dttm)}
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <DetailItem label="Lieu" value={selected.visit_place ?? '—'} />
                  <DetailItem label="Médecin" value={selected.consulting_doctor_id ?? '—'} />
                  <DetailItem label="Département" value={selected.IDgen_mst_Departement ?? '—'} />
                  <DetailItem label="Part patient" value={fmtMontant(selected.montant_patient ?? 0)} />
                  <DetailItem label="Part assurance" value={fmtMontant(selected.montant_compagny ?? 0)} />
                  {selected.urgence   && <span style={{ background: colors.dangerBg, color: colors.danger, borderRadius: radius.full, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>🚨 Urgence</span>}
                  {selected.Hospitaliser && <span style={{ background: colors.infoBg, color: colors.info, borderRadius: radius.full, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>🏨 Hospitalisé</span>}
                  {selected.prise_en_charge && <span style={{ background: colors.successBg, color: colors.success, borderRadius: radius.full, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✅ Prise en charge</span>}
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
