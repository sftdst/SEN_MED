import { useCallback, useEffect, useState } from 'react'
import { personnelApi, rendezVousApi } from '../../api'
import { colors, radius, shadows, spacing } from '../../theme'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'

// ── Constantes ────────────────────────────────────────────────────────────────
const STATUTS = {
  0: { label: 'En attente', color: colors.warning, bg: colors.warningBg },
  1: { label: 'Accepté',    color: colors.success, bg: colors.successBg },
  2: { label: 'Rejeté',     color: colors.danger,  bg: colors.dangerBg  },
}

const TYPES_RDV = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'bilan',        label: 'Bilan' },
  { value: 'suivi',        label: 'Suivi' },
  { value: 'urgence',      label: 'Urgence' },
  { value: 'visite',       label: 'Visite' },
  { value: 'autre',        label: 'Autre' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtDateHeure = d => {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
const toInputDate = d => {
  if (!d) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  return ''
}

// ── Styles partagés ───────────────────────────────────────────────────────────
const inputSt = {
  border: `1.5px solid ${colors.gray300}`,
  borderRadius: radius.sm,
  padding: '8px 12px',
  fontSize: '13px',
  color: colors.gray800,
  background: colors.white,
  outline: 'none',
  minWidth: 140,
  fontFamily: 'inherit',
}

const thSt = {
  padding: '10px 14px',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: colors.gray600,
  background: colors.gray50,
  borderBottom: `1.5px solid ${colors.gray200}`,
  whiteSpace: 'nowrap',
  textAlign: 'left',
}

const tdSt = {
  padding: '11px 14px',
  fontSize: '13px',
  color: colors.gray800,
  borderBottom: `1px solid ${colors.gray100}`,
  verticalAlign: 'middle',
}

const fieldLabelSt = {
  display: 'block',
  fontSize: '11px', fontWeight: 700,
  color: colors.gray700,
  textTransform: 'uppercase', letterSpacing: '0.4px',
  marginBottom: 6,
}

// ── ActionBtn ─────────────────────────────────────────────────────────────────
function ActionBtn({ label, color, bg, onClick, disabled }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '5px 12px',
        border: `1.5px solid ${color}`,
        borderRadius: radius.sm,
        background: hovered && !disabled ? color : bg,
        color: hovered && !disabled ? '#fff' : color,
        fontSize: '12px', fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        whiteSpace: 'nowrap',
        transition: 'background .15s, color .15s',
        fontFamily: 'inherit',
      }}
    >{label}</button>
  )
}

// ── AccepterModal ─────────────────────────────────────────────────────────────
function AccepterModal({ demande, onClose, onConfirm, saving }) {
  const [medecins,   setMedecins]   = useState([])
  const [creneaux,   setCreneaux]   = useState([])
  const [loadingMed, setLoadingMed] = useState(true)
  const [loadingCr,  setLoadingCr]  = useState(false)

  const [form, setForm] = useState({
    consulting_doctor_id: '',
    appointment_date: '',
    creneau: '',
    appointment_type: 'consultation',
  })

  // Reset + charger médecins à l'ouverture
  useEffect(() => {
    if (!demande) return
    setForm({
      consulting_doctor_id: '',
      appointment_date: toInputDate(demande.appointment_date),
      creneau: '',
      appointment_type: 'consultation',
    })
    setCreneaux([])
    setLoadingMed(true)
    personnelApi.liste({ staff_type: 'medecin', per_page: 200 })
      .then(res => {
        setMedecins(res.data?.data?.data ?? [])
      })
      .catch(() => setMedecins([]))
      .finally(() => setLoadingMed(false))
  }, [demande?.appointment_id])

  // Charger créneaux quand médecin ou date change
  useEffect(() => {
    if (!form.consulting_doctor_id || !form.appointment_date) {
      setCreneaux([])
      return
    }
    setLoadingCr(true)
    setForm(f => ({ ...f, creneau: '' }))
    rendezVousApi.creneauxDisponibles({
      medecin_id: form.consulting_doctor_id,
      date: form.appointment_date,
    })
      .then(res => {
        const list = res.data?.data ?? res.data ?? []
        setCreneaux(Array.isArray(list) ? list.filter(c => !c.occupe) : [])
      })
      .catch(() => setCreneaux([]))
      .finally(() => setLoadingCr(false))
  }, [form.consulting_doctor_id, form.appointment_date])

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = () => {
    if (!form.consulting_doctor_id) { showToast('Veuillez sélectionner un médecin', 'error'); return }
    if (!form.appointment_date)     { showToast('La date est requise', 'error'); return }
    if (!form.creneau)              { showToast('Veuillez sélectionner un créneau', 'error'); return }
    const slot = creneaux.find(c => `${c.debut}-${c.fin}` === form.creneau)
    if (!slot) { showToast('Créneau invalide', 'error'); return }
    onConfirm({
      consulting_doctor_id: form.consulting_doctor_id,
      appointment_date:     form.appointment_date,
      start_time:           slot.debut,
      end_time:             slot.fin,
      appointment_type:     form.appointment_type,
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Modal
      open={!!demande}
      onClose={onClose}
      title="Confirmer le rendez-vous"
      width={540}
      footer={
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end', padding: `0 ${spacing.lg} ${spacing.lg}` }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.sm,
              background: colors.white,
              color: colors.gray600,
              fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Annuler</button>
          <button
            disabled={saving}
            onClick={handleSubmit}
            style={{
              padding: '9px 22px',
              border: 'none',
              borderRadius: radius.sm,
              background: saving ? colors.gray400 : colors.success,
              color: '#fff',
              fontSize: '13px', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background .15s',
            }}
          >{saving ? 'En cours…' : '✓ Confirmer le rendez-vous'}</button>
        </div>
      }
    >
      <div style={{ padding: `${spacing.md} ${spacing.lg}` }}>

        {/* Info patient */}
        <div style={{
          background: colors.gray50,
          border: `1px solid ${colors.gray200}`,
          borderRadius: radius.sm,
          padding: '10px 14px',
          marginBottom: spacing.lg,
          fontSize: '13px', color: colors.gray700,
        }}>
          <strong>{demande?.nom_personne}</strong>
          {demande?.telephone && <> · {demande.telephone}</>}
          {demande?.email && (
            <> · <a href={`mailto:${demande.email}`} style={{ color: colors.bleu }}>{demande.email}</a></>
          )}
          {demande?.remarks && (
            <div style={{ marginTop: 4, color: colors.gray500, fontStyle: 'italic', fontSize: '12px' }}>
              Motif : {demande.remarks}
            </div>
          )}
        </div>

        {/* Médecin */}
        <div style={{ marginBottom: spacing.md }}>
          <label style={fieldLabelSt}>Médecin *</label>
          {loadingMed ? (
            <div style={{ fontSize: '13px', color: colors.gray400, padding: '8px 0' }}>Chargement des médecins…</div>
          ) : (
            <select
              name="consulting_doctor_id"
              value={form.consulting_doctor_id}
              onChange={ch}
              style={{ ...inputSt, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
            >
              <option value="">-- Sélectionner un médecin --</option>
              {medecins.map(m => (
                <option key={m.id} value={m.id}>
                  {m.staff_name || `${m.first_name || ''} ${m.last_name || ''}`.trim()}
                  {m.specialization ? ` — ${m.specialization}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date */}
        <div style={{ marginBottom: spacing.md }}>
          <label style={fieldLabelSt}>Date du rendez-vous *</label>
          <input
            type="date"
            name="appointment_date"
            value={form.appointment_date}
            onChange={ch}
            min={today}
            style={{ ...inputSt, width: '100%', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300}
          />
        </div>

        {/* Créneaux */}
        <div style={{ marginBottom: spacing.md }}>
          <label style={fieldLabelSt}>
            Créneau *
            {loadingCr && (
              <span style={{ fontWeight: 400, color: colors.gray400, marginLeft: 8, textTransform: 'none', fontSize: '11px' }}>
                chargement…
              </span>
            )}
          </label>
          {!form.consulting_doctor_id || !form.appointment_date ? (
            <div style={{ fontSize: '12px', color: colors.gray400, fontStyle: 'italic' }}>
              Sélectionnez d'abord un médecin et une date
            </div>
          ) : creneaux.length === 0 && !loadingCr ? (
            <div style={{ fontSize: '12px', color: colors.danger, fontStyle: 'italic' }}>
              Aucun créneau disponible pour cette sélection
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {creneaux.map(c => {
                const key = `${c.debut}-${c.fin}`
                const selected = form.creneau === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, creneau: key }))}
                    style={{
                      padding: '6px 14px',
                      border: `1.5px solid ${selected ? colors.bleu : colors.gray300}`,
                      borderRadius: radius.sm,
                      background: selected ? colors.bleu : colors.white,
                      color: selected ? '#fff' : colors.gray700,
                      fontSize: '13px', fontWeight: selected ? 700 : 400,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all .15s',
                    }}
                  >
                    {c.label || `${c.debut} – ${c.fin}`}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Type de RDV */}
        <div>
          <label style={fieldLabelSt}>Type de rendez-vous</label>
          <select
            name="appointment_type"
            value={form.appointment_type}
            onChange={ch}
            style={{ ...inputSt, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
          >
            {TYPES_RDV.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

      </div>
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function DemandesRdvPage() {
  const [demandes, setDemandes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  const [filters, setFilters] = useState({
    recherche: '', date_debut: '', date_fin: '', statut: '',
  })

  const [acceptModal, setAcceptModal] = useState(null) // demande object
  const [rejectModal, setRejectModal] = useState(null) // { id, nom }
  const [motifRejet,  setMotifRejet]  = useState('')

  // ── Chargement ────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await rendezVousApi.demandes(filters)
      const data = res.data?.data ?? res.data ?? []
      setDemandes(Array.isArray(data) ? data : [])
    } catch {
      showToast('Erreur de chargement des demandes', 'error')
      setDemandes([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  // ── Actions ───────────────────────────────────────────────
  const handleAccepterConfirm = async (formData) => {
    if (!acceptModal) return
    setSaving(true)
    try {
      await rendezVousApi.accepter(acceptModal.appointment_id, formData)
      showToast('Rendez-vous confirmé — email envoyé au patient')
      setAcceptModal(null)
      load()
    } catch {
      showToast("Erreur lors de l'acceptation", 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRejeter = async () => {
    if (!rejectModal) return
    setSaving(true)
    try {
      await rendezVousApi.rejeter(rejectModal.id, { motif: motifRejet })
      showToast('Demande rejetée — email envoyé au patient')
      setRejectModal(null)
      setMotifRejet('')
      load()
    } catch {
      showToast('Erreur lors du rejet', 'error')
    } finally {
      setSaving(false)
    }
  }

  const fch = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }))
  const clearFilters = () => setFilters({ recherche: '', date_debut: '', date_fin: '', statut: '' })
  const hasFilters = filters.recherche || filters.date_debut || filters.date_fin || filters.statut

  // ── Stats ─────────────────────────────────────────────────
  const stats = [
    { label: 'Total',      value: demandes.length,                                  color: colors.bleu,    bg: colors.gray50    },
    { label: 'En attente', value: demandes.filter(d => +d.statut_app === 0).length, color: colors.warning, bg: colors.warningBg },
    { label: 'Acceptées',  value: demandes.filter(d => +d.statut_app === 1).length, color: colors.success, bg: colors.successBg },
    { label: 'Rejetées',   value: demandes.filter(d => +d.statut_app === 2).length, color: colors.danger,  bg: colors.dangerBg  },
  ]

  return (
    <div>
      {/* ── En-tête ───────────────────────────────────────── */}
      <PageHeader
        title="Demandes de rendez-vous"
        subtitle="Demandes reçues via le site web — accepter ou rejeter avec motif"
        actions={
          <button
            onClick={load}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.sm,
              background: colors.white,
              fontSize: '13px', fontWeight: 600, color: colors.gray700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseOver={e => e.currentTarget.style.background = colors.gray100}
            onMouseOut={e => e.currentTarget.style.background = colors.white}
          >↻ Actualiser</button>
        }
      />

      {/* ── Statistiques ──────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: spacing.md,
        marginBottom: spacing.lg,
      }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: s.bg,
            border: `1.5px solid ${s.color}22`,
            borderRadius: radius.md,
            padding: `14px ${spacing.lg}`,
            boxShadow: shadows.sm,
          }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: s.color, fontWeight: 600, marginTop: 5, opacity: 0.85 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filtres ───────────────────────────────────────── */}
      <div style={{
        background: colors.white,
        border: `1px solid ${colors.gray200}`,
        borderRadius: radius.md,
        boxShadow: shadows.sm,
        padding: `${spacing.sm} ${spacing.lg}`,
        marginBottom: spacing.lg,
        display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: colors.gray400, pointerEvents: 'none', fontSize: 14,
          }}>🔍</span>
          <input
            name="recherche"
            value={filters.recherche}
            onChange={fch}
            placeholder="Nom, téléphone, email, référence…"
            style={{ ...inputSt, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '.04em' }}>Date début</span>
          <input type="date" name="date_debut" value={filters.date_debut} onChange={fch}
            style={inputSt}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '.04em' }}>Date fin</span>
          <input type="date" name="date_fin" value={filters.date_fin} onChange={fch}
            style={inputSt}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300} />
        </div>

        <select name="statut" value={filters.statut} onChange={fch}
          style={{ ...inputSt, cursor: 'pointer', minWidth: 160 }}>
          <option value="">Tous les statuts</option>
          <option value="0">En attente</option>
          <option value="1">Accepté</option>
          <option value="2">Rejeté</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} style={{
            ...inputSt, cursor: 'pointer', color: colors.gray600,
            fontWeight: 600, minWidth: 'auto',
          }}>× Effacer</button>
        )}
      </div>

      {/* ── Tableau ───────────────────────────────────────── */}
      {loading ? (
        <FullPageSpinner />
      ) : demandes.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: radius.md,
          color: colors.gray500, fontSize: '14px',
        }}>
          📭 Aucune demande trouvée
        </div>
      ) : (
        <div style={{
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: radius.md,
          boxShadow: shadows.sm,
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Référence', 'Patient', 'Téléphone', 'Email', 'Date souhaitée', 'Motif', 'Reçu le', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={thSt}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demandes.map(d => {
                  const s = STATUTS[+d.statut_app] ?? STATUTS[0]
                  return (
                    <tr
                      key={d.appointment_id}
                      onMouseOver={e => e.currentTarget.style.background = colors.gray50}
                      onMouseOut={e => e.currentTarget.style.background = ''}
                      style={{ transition: 'background .1s' }}
                    >
                      <td style={tdSt}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: colors.gray100,
                          borderRadius: radius.sm,
                          fontSize: '11px', fontWeight: 700,
                          color: colors.bleu, fontFamily: 'monospace',
                        }}>{d.appointment_id}</span>
                      </td>

                      <td style={{ ...tdSt, fontWeight: 600 }}>{d.nom_personne || '—'}</td>
                      <td style={tdSt}>{d.telephone || '—'}</td>

                      <td style={tdSt}>
                        {d.email
                          ? <a href={`mailto:${d.email}`} style={{ color: colors.bleu, textDecoration: 'none' }}>{d.email}</a>
                          : '—'}
                      </td>

                      <td style={{ ...tdSt, fontWeight: 500 }}>{fmtDate(d.appointment_date)}</td>

                      <td style={{ ...tdSt, maxWidth: 180 }}>
                        <span
                          title={d.remarks || ''}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            color: colors.gray600,
                          }}
                        >{d.remarks || '—'}</span>
                      </td>

                      <td style={{ ...tdSt, fontSize: '12px', color: colors.gray600 }}>
                        {fmtDateHeure(d.created_dttm)}
                      </td>

                      <td style={tdSt}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px',
                          borderRadius: radius.full,
                          background: s.bg, color: s.color,
                          border: `1px solid ${s.color}40`,
                          fontSize: '11px', fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                          {s.label}
                        </span>
                      </td>

                      <td style={tdSt}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {+d.statut_app === 0 && (
                            <>
                              <ActionBtn
                                label="✓ Accepter"
                                color={colors.success}
                                bg={colors.successBg}
                                disabled={saving}
                                onClick={() => setAcceptModal(d)}
                              />
                              <ActionBtn
                                label="✕ Rejeter"
                                color={colors.danger}
                                bg={colors.dangerBg}
                                onClick={() => { setRejectModal({ id: d.appointment_id, nom: d.nom_personne }); setMotifRejet('') }}
                              />
                            </>
                          )}
                          {+d.statut_app === 1 && (
                            <ActionBtn
                              label="✕ Annuler"
                              color={colors.danger}
                              bg={colors.dangerBg}
                              onClick={() => { setRejectModal({ id: d.appointment_id, nom: d.nom_personne }); setMotifRejet('') }}
                            />
                          )}
                          {+d.statut_app === 2 && (
                            <span
                              title={d.motif_annule_report || ''}
                              style={{ fontSize: '12px', color: colors.gray400, fontStyle: 'italic' }}
                            >
                              {d.motif_annule_report
                                ? (d.motif_annule_report.length > 22 ? d.motif_annule_report.slice(0, 22) + '…' : d.motif_annule_report)
                                : '—'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            background: colors.gray50,
            borderTop: `1px solid ${colors.gray200}`,
            fontSize: '12px', color: colors.gray500,
          }}>
            {demandes.length} demande{demandes.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── Modal Accepter ────────────────────────────────── */}
      <AccepterModal
        demande={acceptModal}
        onClose={() => setAcceptModal(null)}
        onConfirm={handleAccepterConfirm}
        saving={saving}
      />

      {/* ── Modal Rejeter ─────────────────────────────────── */}
      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Rejeter la demande"
        width={440}
        footer={
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end', padding: `0 ${spacing.lg} ${spacing.lg}` }}>
            <button
              onClick={() => setRejectModal(null)}
              style={{
                padding: '9px 18px',
                border: `1.5px solid ${colors.gray300}`,
                borderRadius: radius.sm,
                background: colors.white,
                color: colors.gray600,
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Annuler</button>
            <button
              disabled={saving}
              onClick={handleRejeter}
              style={{
                padding: '9px 20px',
                border: 'none',
                borderRadius: radius.sm,
                background: saving ? colors.gray400 : colors.danger,
                color: '#fff',
                fontSize: '13px', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background .15s',
              }}
            >{saving ? 'En cours…' : 'Confirmer le rejet'}</button>
          </div>
        }
      >
        <div style={{ padding: `${spacing.md} ${spacing.lg}` }}>
          <p style={{ fontSize: '14px', color: colors.gray700, marginBottom: spacing.lg }}>
            Rejeter la demande de <strong>{rejectModal?.nom || 'ce patient'}</strong> ?
            <br />
            <span style={{ fontSize: '12px', color: colors.gray500 }}>Un email de notification sera envoyé au patient.</span>
          </p>
          <label style={fieldLabelSt}>
            Motif du rejet&nbsp;
            <span style={{ fontWeight: 400, color: colors.gray400, textTransform: 'none' }}>(optionnel)</span>
          </label>
          <textarea
            value={motifRejet}
            onChange={e => setMotifRejet(e.target.value)}
            placeholder="Expliquez la raison du rejet…"
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1.5px solid ${colors.gray300}`,
              borderRadius: radius.sm,
              padding: '9px 12px',
              fontSize: '13px', color: colors.gray800,
              resize: 'vertical', outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = colors.bleu}
            onBlur={e => e.target.style.borderColor = colors.gray300}
          />
        </div>
      </Modal>
    </div>
  )
}
