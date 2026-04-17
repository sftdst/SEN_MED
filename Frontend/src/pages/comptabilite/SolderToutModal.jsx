import { useState, useEffect } from 'react'
import { colors, radius, shadows } from '../../theme'
import { comptabiliteApi, paiementApi } from '../../api'

const fmtF  = (n) => Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtD  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const num   = (v) => parseFloat(v) || 0
const today = () => new Date().toISOString().slice(0, 10)

const OPERATEURS = ['Wave', 'Orange Money', 'Free Money', 'Expresso', 'Autre']

const STATUS_MAP = {
  1: { label: 'En attente',         color: '#f57c00', bg: '#fff3e0' },
  2: { label: 'Partiellement payé', color: '#7b1fa2', bg: '#f3e5f5' },
}

function Spinner() {
  return <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid #e2e8f0`, borderTopColor: '#1565c0', animation: 'spin 0.7s linear infinite' }} />
}

function Panel({ title, color = '#1565c0', children }) {
  return (
    <div style={{ position: 'relative', border: `1.5px solid ${color}50`, borderRadius: 6, padding: '16px 12px 10px', background: '#fff' }}>
      <span style={{ position: 'absolute', top: -10, left: 12, background: '#fff', padding: '0 6px', fontSize: 11, fontWeight: 800, color, letterSpacing: '0.3px' }}>{title}</span>
      {children}
    </div>
  )
}

function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: error ? '#c62828' : '#1565c0', display: 'block', marginBottom: 3 }}>
        {label}{required && <span style={{ color: '#c62828', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <div style={{ fontSize: 10, color: '#c62828', marginTop: 2 }}>⚠ {error}</div>}
    </div>
  )
}

function NInput({ value, onChange, readOnly, bg, textColor, bold, large, placeholder = '0,00' }) {
  const [focused, setFocused] = useState(false)
  return (
    <input type="number" min="0" step="any" value={value} onChange={onChange} readOnly={readOnly} placeholder={placeholder}
      style={{ width: '100%', padding: '6px 8px', fontSize: large ? 16 : 12, border: `1.5px solid ${focused ? '#1565c0' : '#cbd5e1'}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box', textAlign: 'right', fontWeight: bold ? 700 : 400, background: readOnly ? (bg || '#f8f9fa') : (bg || '#fff'), color: textColor || (readOnly ? '#64748b' : '#1e293b'), cursor: readOnly ? 'default' : 'text', transition: 'border-color 0.15s' }}
      onFocus={() => !readOnly && setFocused(true)} onBlur={() => setFocused(false)} />
  )
}

function TInput({ value, onChange, readOnly, placeholder, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <input type="text" value={value} onChange={onChange} readOnly={readOnly} placeholder={placeholder}
      style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: `1.5px solid ${error ? '#c62828' : focused ? '#1565c0' : '#cbd5e1'}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box', background: readOnly ? '#f8f9fa' : '#fff', color: readOnly ? '#64748b' : '#1e293b', transition: 'border-color 0.15s' }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  )
}

function DInput({ value, onChange, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <input type="date" value={value} onChange={onChange}
      style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: `1.5px solid ${error ? '#c62828' : focused ? '#1565c0' : '#cbd5e1'}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#fff', transition: 'border-color 0.15s' }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  )
}

function SInput({ value, onChange, options, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <select value={value} onChange={onChange}
      style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: `1.5px solid ${error ? '#c62828' : focused ? '#1565c0' : '#cbd5e1'}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#fff', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <option value="">— Sélectionner —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function TitleBtn({ label, accent, danger, onClick, disabled, loading }) {
  const [hov, setHov] = useState(false)
  let bg = 'transparent', border = 'rgba(255,255,255,0.4)'
  if (accent) { bg = hov ? '#e0621f' : '#ff7631'; border = '#ff7631' }
  if (danger) { bg = hov ? '#b71c1c' : '#c62828'; border = '#c62828' }
  if (!accent && !danger && hov) bg = 'rgba(255,255,255,0.15)'
  return (
    <button onClick={onClick} disabled={disabled || loading} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '5px 16px', borderRadius: 20, border: `1.5px solid ${border}`, background: bg, color: '#fff', fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
      {loading ? '…' : label}
    </button>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function SolderToutModal({ patient, onClose, onSuccess }) {
  const [bills,   setBills]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [apiErr,  setApiErr]  = useState(null)
  const [toast,   setToast]   = useState(null)
  const [errors,  setErrors]  = useState({})

  const [esp,    setEsp]    = useState({ montant: '', recu: '', monnaie_rendue: 'Non' })
  const [car,    setCar]    = useState({ montant: '', numero: '', banque: '' })
  const [chq,    setChq]    = useState({ montant: '', numero: '', date: today(), banque: '' })
  const [mob,    setMob]    = useState({ montant: '', numero: '', operateur: '' })
  const [remise, setRemise] = useState('')

  // Chargement des factures du patient
  useEffect(() => {
    setLoading(true)
    comptabiliteApi.creditPatientFactures(patient.patient_id)
      .then(r => {
        const data = r.data?.data ?? []
        setBills(data)
        // Pré-remplir le montant espèces avec le total restant
        const totalRestant = data.reduce((s, b) => s + num(b.pending_amount), 0)
        if (totalRestant > 0) setEsp(e => ({ ...e, montant: String(totalRestant) }))
      })
      .catch(err => setApiErr(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [patient.patient_id])

  // Calculs
  const cashAmt  = num(esp.montant)
  const cardAmt  = num(car.montant)
  const chqAmt   = num(chq.montant)
  const mobAmt   = num(mob.montant)
  const totalPaye = cashAmt + cardAmt + chqAmt + mobAmt

  const lsRes        = num(esp.recu) - cashAmt
  const montantRendu = lsRes > 0 ? lsRes : 0

  const totalRestant  = bills.reduce((s, b) => s + num(b.pending_amount), 0)
  const totalFactures = bills.reduce((s, b) => s + num(b.bill_amount), 0)
  const remiseVal     = num(remise)
  const enAttente     = Math.max(0, totalRestant - remiseVal - totalPaye)

  // Validation
  const validate = () => {
    const errs = {}
    if (totalPaye <= 0 && remiseVal <= 0) errs._global = 'Veuillez saisir au moins un montant de paiement.'
    if (cardAmt > 0) {
      if (!car.numero.trim()) errs.car_numero = 'N° de carte obligatoire'
      if (!car.banque.trim()) errs.car_banque  = 'Banque obligatoire'
    }
    if (chqAmt > 0) {
      if (!chq.date)          errs.chq_date   = 'Date obligatoire'
      if (!chq.numero.trim()) errs.chq_numero = 'N° chèque/traite obligatoire'
    }
    if (mobAmt > 0) {
      if (!mob.numero.trim())    errs.mob_numero   = 'N° mobile obligatoire'
      if (!mob.operateur.trim()) errs.mob_operateur = 'Opérateur obligatoire'
    }
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setSaving(true); setApiErr(null)

    const payload = {
      remise: remiseVal || undefined,
      ...(cashAmt > 0 ? { especes: { montant: cashAmt, recu: num(esp.recu), monnaie_rendue: montantRendu > 0, montant_rendu: montantRendu } } : {}),
      ...(cardAmt > 0 ? { carte:   { montant: cardAmt, numero: car.numero, banque: car.banque } } : {}),
      ...(chqAmt  > 0 ? { cheque:  { montant: chqAmt,  numero: chq.numero, date: chq.date, banque: chq.banque } } : {}),
      ...(mobAmt  > 0 ? { mobile:  { montant: mobAmt,  numero: mob.numero, operateur: mob.operateur } } : {}),
    }

    try {
      const r = await paiementApi.solderPatient(patient.patient_id, payload)
      setToast({ type: 'success', msg: r.data.message })
      setTimeout(() => { onSuccess?.(); onClose() }, 1400)
    } catch (e) {
      setApiErr(e.response?.data?.message || 'Erreur lors du paiement')
    } finally { setSaving(false) }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(15,23,42,0.68)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, animation: 'fadeIn 0.15s ease' }}>

      <div style={{ background: '#f1f5f9', borderRadius: 10, width: '100%', maxWidth: 1060, height: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.45)', overflow: 'hidden' }}>

        {/* ── Titre ─────────────────────────────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, #7b0000 0%, #c62828 100%)', padding: '10px 18px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💸</div>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Solder toutes les factures</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginLeft: 10 }}>{patient.patient_name}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
            <TitleBtn label="Sauvegarder" accent onClick={handleSave} disabled={saving || loading} loading={saving} />
            <TitleBtn label="Fermer" danger onClick={onClose} />
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ padding: '8px 18px', flexShrink: 0, background: toast.type === 'success' ? '#dcfce7' : '#fee2e2', color: toast.type === 'success' ? '#166534' : '#991b1b', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          </div>
        )}

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <Spinner /><span style={{ color: '#94a3b8', fontSize: 13 }}>Chargement des factures…</span>
          </div>
        ) : (
          <>
            {/* ── Ligne patient + récap ────────────────────────────────────── */}
            <div style={{ background: '#fff', padding: '8px 18px', flexShrink: 0, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 11, color: '#1565c0', fontWeight: 700 }}>Patient : </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{patient.patient_name}</span>
                {patient.ssn_no && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>· SS: {patient.ssn_no}</span>}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{bills.length} facture(s) en cours</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1565c0' }}>{fmtF(totalFactures)} F facturés</div>
                </div>
                <div style={{ textAlign: 'right', borderLeft: '2px solid #fce4e4', paddingLeft: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total à solder</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#c62828' }}>{fmtF(totalRestant)} F</div>
                </div>
              </div>
            </div>

            {/* ── Formulaire paiement ──────────────────────────────────────── */}
            <div style={{ flexShrink: 0, padding: '10px 14px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* 4 modes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>

                <Panel title="Espèces" color="#166534">
                  <Field label="Montant espèces">
                    <NInput value={esp.montant} onChange={e => setEsp(p => ({ ...p, montant: e.target.value }))} />
                  </Field>
                  <Field label="Reçu">
                    <NInput value={esp.recu} onChange={e => setEsp(p => ({ ...p, recu: e.target.value }))} />
                  </Field>
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#166534', display: 'block', marginBottom: 4 }}>Monnaie rendue</label>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {['Oui', 'Non'].map(v => (
                        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: '#334155' }}>
                          <input type="radio" name="mr_solder" checked={esp.monnaie_rendue === v} onChange={() => setEsp(p => ({ ...p, monnaie_rendue: v }))} />{v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Field label="Montant rendu">
                    <NInput value={fmtF(montantRendu)} readOnly bg={montantRendu > 0 ? '#dcfce7' : '#f1f5f9'} textColor={montantRendu > 0 ? '#166534' : '#94a3b8'} bold={montantRendu > 0} />
                  </Field>
                </Panel>

                <Panel title="Carte" color="#1565c0">
                  <Field label="Montant carte">
                    <NInput value={car.montant} onChange={e => { setCar(p => ({ ...p, montant: e.target.value })); setErrors(p => ({ ...p, car_numero: undefined, car_banque: undefined })) }} />
                  </Field>
                  <Field label="N° de carte" required={cardAmt > 0} error={errors.car_numero}>
                    <TInput value={car.numero} onChange={e => { setCar(p => ({ ...p, numero: e.target.value })); setErrors(p => ({ ...p, car_numero: undefined })) }} placeholder="XXXX XXXX XXXX XXXX" error={!!errors.car_numero} />
                  </Field>
                  <Field label="Banque" required={cardAmt > 0} error={errors.car_banque}>
                    <TInput value={car.banque} onChange={e => { setCar(p => ({ ...p, banque: e.target.value })); setErrors(p => ({ ...p, car_banque: undefined })) }} placeholder="SGBS, BHS…" error={!!errors.car_banque} />
                  </Field>
                </Panel>

                <Panel title="Chèque / Traite" color="#6a1b9a">
                  <Field label="Montant chèque/traite">
                    <NInput value={chq.montant} onChange={e => { setChq(p => ({ ...p, montant: e.target.value })); setErrors(p => ({ ...p, chq_date: undefined, chq_numero: undefined })) }} />
                  </Field>
                  <Field label="Date" required={chqAmt > 0} error={errors.chq_date}>
                    <DInput value={chq.date} onChange={e => { setChq(p => ({ ...p, date: e.target.value })); setErrors(p => ({ ...p, chq_date: undefined })) }} error={!!errors.chq_date} />
                  </Field>
                  <Field label="N° chèque/traite" required={chqAmt > 0} error={errors.chq_numero}>
                    <TInput value={chq.numero} onChange={e => { setChq(p => ({ ...p, numero: e.target.value })); setErrors(p => ({ ...p, chq_numero: undefined })) }} placeholder="N° du chèque" error={!!errors.chq_numero} />
                  </Field>
                  <Field label="Banque">
                    <TInput value={chq.banque} onChange={e => setChq(p => ({ ...p, banque: e.target.value }))} placeholder="SGBS, BHS…" />
                  </Field>
                </Panel>

                <Panel title="Paiement Mobile" color="#e65100">
                  <Field label="Montant mobile">
                    <NInput value={mob.montant} onChange={e => { setMob(p => ({ ...p, montant: e.target.value })); setErrors(p => ({ ...p, mob_numero: undefined, mob_operateur: undefined })) }} />
                  </Field>
                  <Field label="N° Mobile" required={mobAmt > 0} error={errors.mob_numero}>
                    <TInput value={mob.numero} onChange={e => { setMob(p => ({ ...p, numero: e.target.value })); setErrors(p => ({ ...p, mob_numero: undefined })) }} placeholder="7X XXX XX XX" error={!!errors.mob_numero} />
                  </Field>
                  <Field label="Opérateur" required={mobAmt > 0} error={errors.mob_operateur}>
                    <SInput value={mob.operateur} onChange={e => { setMob(p => ({ ...p, operateur: e.target.value })); setErrors(p => ({ ...p, mob_operateur: undefined })) }} options={OPERATEURS} error={!!errors.mob_operateur} />
                  </Field>
                </Panel>
              </div>

              {/* Résumé */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                <div style={{ background: '#eff6ff', borderRadius: 6, padding: '8px 12px', border: '1.5px solid #bfdbfe', borderLeft: '3px solid #1565c0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Total à solder</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#c62828' }}>{fmtF(totalRestant)} F</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Remise globale</div>
                  <NInput value={remise} onChange={e => setRemise(e.target.value)} placeholder="0,00" />
                </div>
                <div style={{ background: '#fff3e0', borderRadius: 6, padding: '8px 12px', border: '1.5px solid #fed7aa', borderLeft: '3px solid #c62828' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Montant payé</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#c62828' }}>{fmtF(totalPaye)} F</div>
                </div>
                <div style={{ background: enAttente > 0 ? '#fff7ed' : '#f0fdf4', borderRadius: 6, padding: '8px 12px', border: `1.5px solid ${enAttente > 0 ? '#fed7aa' : '#bbf7d0'}`, borderLeft: `3px solid ${enAttente > 0 ? '#f57c00' : '#15803d'}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Reste après paiement</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: enAttente > 0 ? '#f57c00' : '#15803d' }}>{fmtF(enAttente)} F</div>
                </div>
              </div>

              {(errors._global || apiErr) && (
                <div style={{ padding: '7px 12px', borderRadius: 6, background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⚠️ {errors._global || apiErr}
                </div>
              )}
            </div>

            {/* ── Tableau des factures à solder ────────────────────────────── */}
            <div style={{ flex: 1, minHeight: 0, margin: '0 14px 12px', display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', boxShadow: shadows.sm }}>
              <div style={{ padding: '8px 14px', background: 'linear-gradient(90deg, #7b0000 0%, #c62828 100%)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>📋</span>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Factures à solder</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>{bills.length} facture{bills.length > 1 ? 's' : ''}</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ background: '#fce4e4', borderBottom: '2px solid #ef9a9a' }}>
                      {['#', 'N° Facture', 'Date', 'Montant Facture', 'Déjà Payé', 'Restant', 'Statut'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: ['Montant Facture','Déjà Payé','Restant'].includes(h) ? 'right' : h === '#' ? 'center' : 'left', fontSize: 10, fontWeight: 700, color: '#b71c1c', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b, i) => {
                      const st = STATUS_MAP[b.bill_status_id ?? 1]
                      return (
                        <tr key={b.bill_hd_id} style={{ borderBottom: '1px solid #fce4e4', background: i % 2 === 0 ? '#fff' : '#fff5f5' }}>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#fce4e4', color: '#c62828', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: colors.bleu, background: colors.infoBg, padding: '2px 8px', borderRadius: 4 }}>{b.bill_no || '—'}</span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{fmtD(b.bill_date)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>{fmtF(b.bill_amount)} F</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: colors.success, fontWeight: 600 }}>{fmtF(b.paid_amount)} F</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            <span style={{ fontWeight: 800, color: '#c62828', background: colors.dangerBg, padding: '2px 8px', borderRadius: 4 }}>{fmtF(b.pending_amount)} F</span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {st && <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {bills.length > 0 && (
                    <tfoot>
                      <tr style={{ background: '#fce4e4', borderTop: '2px solid #ef9a9a' }}>
                        <td colSpan={3} style={{ padding: '8px 10px', fontWeight: 700, fontSize: 11, color: '#b71c1c' }}>TOTAL ({bills.length} factures)</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#1e293b' }}>{fmtF(totalFactures)} F</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: colors.success }}>{fmtF(bills.reduce((s, b) => s + num(b.paid_amount), 0))} F</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 900, fontSize: 14, color: '#c62828', background: colors.dangerBg, padding: '2px 10px', borderRadius: 4 }}>{fmtF(totalRestant)} F</span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
