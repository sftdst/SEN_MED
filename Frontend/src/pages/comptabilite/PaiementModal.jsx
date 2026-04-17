import { useState, useEffect, useCallback } from 'react'
import { colors, radius, shadows } from '../../theme'
import { paiementApi } from '../../api'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtF  = (n) => Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtD  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const num   = (v) => parseFloat(v) || 0
const today = () => new Date().toISOString().slice(0, 10)

const STATUS_MAP = {
  1: { label: 'En attente',         color: '#f57c00', bg: '#fff3e0' },
  2: { label: 'Partiellement payé', color: '#7b1fa2', bg: '#f3e5f5' },
  3: { label: 'Payé',               color: '#2e7d32', bg: '#e8f5e9' },
}
const OPERATEURS = ['Wave', 'Orange Money', 'Free Money', 'Expresso', 'Autre']

// ─────────────────────────────────────────────────────────────────────────────
// Micro-composants UI
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ statusId }) {
  const s = STATUS_MAP[statusId] ?? STATUS_MAP[1]
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, border: `1px solid ${s.color}40` }}>
      {s.label}
    </span>
  )
}

// Bouton dans la barre de titre
function TitleBtn({ label, accent, danger, onClick, disabled, loading }) {
  const [hov, setHov] = useState(false)
  let bg = 'transparent', border = 'rgba(255,255,255,0.4)', textColor = '#fff'
  if (accent)  { bg = hov ? '#e0621f' : '#ff7631'; border = '#ff7631' }
  if (danger)  { bg = hov ? '#b71c1c' : '#c62828'; border = '#c62828' }
  if (!accent && !danger && hov) bg = 'rgba(255,255,255,0.15)'
  return (
    <button onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '5px 16px', borderRadius: 20, border: `1.5px solid ${border}`,
        background: bg, color: textColor, fontSize: 12, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >{loading ? '…' : label}</button>
  )
}

// Panneau avec bordure + titre flottant (style fieldset)
function Panel({ title, color = '#1565c0', children, style = {} }) {
  return (
    <div style={{ position: 'relative', border: `1.5px solid ${color}50`, borderRadius: 6, padding: '16px 12px 10px', background: '#fff', ...style }}>
      <span style={{ position: 'absolute', top: -10, left: 12, background: '#fff', padding: '0 6px', fontSize: 11, fontWeight: 800, color, letterSpacing: '0.3px' }}>
        {title}
      </span>
      {children}
    </div>
  )
}

// Champ avec label + indicateur obligatoire
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

// Input numérique
function NInput({ value, onChange, readOnly, bg, textColor, bold, large, placeholder = '0,00' }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="number" min="0" step="any"
      value={value} onChange={onChange} readOnly={readOnly}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '6px 8px', fontSize: large ? 16 : 12,
        border: `1.5px solid ${focused ? '#1565c0' : '#cbd5e1'}`,
        borderRadius: 4, outline: 'none', boxSizing: 'border-box',
        textAlign: 'right', fontWeight: bold ? 700 : 400,
        background: readOnly ? (bg || '#f8f9fa') : (bg || '#fff'),
        color: textColor || (readOnly ? '#64748b' : '#1e293b'),
        cursor: readOnly ? 'default' : 'text',
        transition: 'border-color 0.15s',
      }}
      onFocus={() => !readOnly && setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

// Input texte
function TInput({ value, onChange, readOnly, placeholder, error, bg }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="text" value={value} onChange={onChange} readOnly={readOnly}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '6px 8px', fontSize: 12,
        border: `1.5px solid ${error ? '#c62828' : focused ? '#1565c0' : '#cbd5e1'}`,
        borderRadius: 4, outline: 'none', boxSizing: 'border-box',
        background: readOnly ? '#f8f9fa' : (bg || '#fff'),
        color: readOnly ? '#64748b' : '#1e293b',
        transition: 'border-color 0.15s',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

// Input date
function DInput({ value, onChange, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <input type="date" value={value} onChange={onChange}
      style={{
        width: '100%', padding: '6px 8px', fontSize: 12,
        border: `1.5px solid ${error ? '#c62828' : focused ? '#1565c0' : '#cbd5e1'}`,
        borderRadius: 4, outline: 'none', boxSizing: 'border-box',
        color: '#1e293b', background: '#fff', transition: 'border-color 0.15s',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

// Select
function SInput({ value, onChange, options, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <select value={value} onChange={onChange}
      style={{
        width: '100%', padding: '6px 8px', fontSize: 12,
        border: `1.5px solid ${error ? '#c62828' : focused ? '#1565c0' : '#cbd5e1'}`,
        borderRadius: 4, outline: 'none', boxSizing: 'border-box',
        color: '#1e293b', background: '#fff', cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <option value="">— Sélectionner —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// Carte résumé montant
function AmountCard({ label, value, color, bg, large }) {
  return (
    <div style={{ background: bg || '#f8f9fa', borderRadius: 6, padding: '10px 14px', border: `1.5px solid ${color}30`, borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: large ? 20 : 15, fontWeight: 800, color, lineHeight: 1.2 }}>{value} F</div>
    </div>
  )
}

function Spinner() {
  return <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid #e2e8f0`, borderTopColor: '#1565c0', animation: 'spin 0.7s linear infinite' }} />
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PaiementModal({ billId, patientName, onClose, onSuccess, totalEncours }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [apiErr,  setApiErr]  = useState(null)
  const [toast,   setToast]   = useState(null)
  const [errors,  setErrors]  = useState({})

  // Modes de paiement
  const [esp, setEsp] = useState({ montant: '', recu: '', monnaie_rendue: 'Non' })
  const [car, setCar] = useState({ montant: '', numero: '', banque: '' })
  const [chq, setChq] = useState({ montant: '', numero: '', date: today(), banque: '' })
  const [mob, setMob] = useState({ montant: '', numero: '', operateur: '' })
  const [remise, setRemise] = useState('')

  // ── Chargement ──────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true); setApiErr(null)
    paiementApi.detail(billId)
      .then(r => {
        const d = r.data.data
        setData(d)
        const partenaire = parseFloat(d?.totaux?.total_partenaire) || 0
        const brut       = parseFloat(d?.totaux?.total_brut) || 0
        const patient    = parseFloat(d?.totaux?.total_patient) || 0
        const restant    = parseFloat(d?.totaux?.total_restant) || 0
        // Si pas de couverture : le patient paie l'intégralité, sinon sa part restante
        const montantSuggere = partenaire === 0 ? (restant > 0 ? restant : brut) : restant
        if (montantSuggere > 0) setEsp(e => ({ ...e, montant: String(montantSuggere) }))
      })
      .catch(err => setApiErr(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [billId])
  useEffect(() => { load() }, [load])

  // ── Calculs ──────────────────────────────────────────────────────────────────
  const cashAmt   = num(esp.montant)
  const cardAmt   = num(car.montant)
  const chqAmt    = num(chq.montant)
  const mobAmt    = num(mob.montant)

  // Montant Payé = somme des 4 modes
  const totalPaye = cashAmt + cardAmt + chqAmt + mobAmt

  // Règle monnaie rendue : lsRes = Reçu − Espèces ; si > 0 → montantRendu, sinon 0
  const lsRes         = num(esp.recu) - cashAmt
  const montantRendu  = lsRes > 0 ? lsRes : 0

  // Si pas de couverture partenaire, le patient paie l'intégralité de la facture
  const totalPartenaire = num(data?.totaux?.total_partenaire)
  const totalPatient    = totalPartenaire === 0
    ? num(data?.totaux?.total_brut)
    : num(data?.totaux?.total_patient)
  const totalDejaPaye = num(data?.totaux?.total_deja_paye)
  const remiseVal     = num(remise)
  const netPatient    = Math.max(0, totalPatient - remiseVal)
  const enAttente     = Math.max(0, netPatient - totalDejaPaye - totalPaye)
  const rembourse     = Math.max(0, totalDejaPaye + totalPaye - netPatient)

  const bill     = data?.bill
  const services = data?.services ?? []
  const totaux   = data?.totaux
  const statusId = bill?.bill_status_id ?? 1

  // ── Validation ────────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (totalPaye <= 0 && remiseVal <= 0) {
      errs._global = 'Veuillez saisir au moins un montant de paiement.'
    }
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

  // ── Sauvegarder ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setSaving(true); setApiErr(null)
    const payload = {
      remise: remiseVal || undefined,
      ...(cashAmt > 0 ? { especes: { montant: cashAmt, recu: num(esp.recu), monnaie_rendue: montantRendu > 0, montant_rendu: montantRendu }} : {}),
      ...(cardAmt > 0 ? { carte:   { montant: cardAmt, numero: car.numero, banque: car.banque }} : {}),
      ...(chqAmt  > 0 ? { cheque:  { montant: chqAmt,  numero: chq.numero, date: chq.date, banque: chq.banque }} : {}),
      ...(mobAmt  > 0 ? { mobile:  { montant: mobAmt,  numero: mob.numero, operateur: mob.operateur }} : {}),
    }
    try {
      const r = await paiementApi.payer(billId, payload)
      setToast({ type: 'success', msg: r.data.message })
      setTimeout(() => { onSuccess?.(); onClose() }, 1400)
    } catch (e) {
      setApiErr(e.response?.data?.message || 'Erreur lors du paiement')
    } finally { setSaving(false) }
  }

  const handleEnAttente = async () => { await paiementApi.enAttente(billId).catch(() => {}); onClose() }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, animation: 'fadeIn 0.15s ease' }}>

      <div style={{ background: '#f1f5f9', borderRadius: 10, width: '100%', maxWidth: 1080, height: '96vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.45)', overflow: 'hidden' }}>

        {/* ══ BARRE DE TITRE ════════════════════════════════════════════════ */}
        <div style={{ background: 'linear-gradient(135deg, #001f3f 0%, #003f7a 100%)', padding: '10px 18px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ff7631', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>💳</div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Facturation</span>
          {bill && <StatusBadge statusId={statusId} />}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <TitleBtn label="Remboursement"     onClick={() => {}} />
            <TitleBtn label="Paiement en attente" onClick={handleEnAttente} />
            <TitleBtn label="Avance"            onClick={() => {}} />
            <TitleBtn label="Sauvegarder" accent onClick={handleSave} disabled={saving || statusId === 3} loading={saving} />
            <TitleBtn label="Fermer"      danger  onClick={onClose} />
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
            <Spinner /><span style={{ color: '#94a3b8', fontSize: 13 }}>Chargement…</span>
          </div>
        ) : apiErr && !data ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 36 }}>⚠️</span>
            <span style={{ color: '#c62828', fontSize: 13 }}>{apiErr}</span>
            <button onClick={load} style={{ padding: '6px 18px', borderRadius: 6, border: `1px solid #c62828`, background: 'none', color: '#c62828', cursor: 'pointer', fontWeight: 700 }}>Réessayer</button>
          </div>
        ) : (
          <>
            {/* ══ PATIENT ═══════════════════════════════════════════════════ */}
            <div style={{ background: '#fff', padding: '7px 18px', flexShrink: 0, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#1565c0', fontWeight: 700 }}>Nom du patient :</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{patientName || bill?.patient_name || '—'}</span>
              {bill?.partenaire_nom && <span style={{ marginLeft: 10, fontSize: 11, color: '#64748b' }}>· Assureur : <b style={{ color: '#1565c0' }}>{bill.partenaire_nom}</b></span>}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>Facture : <b style={{ fontFamily: 'monospace', color: '#1565c0' }}>{bill?.bill_no || '—'}</b></span>
            </div>

            {/* ══ FORMULAIRE (hauteur fixe) ══════════════════════════════════ */}
            <div style={{ flexShrink: 0, padding: '10px 14px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* ── Entête montants ──────────────────────────────────────── */}
              <Panel title="Entête de paiement" color="#1565c0">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr auto 1fr 1fr 1fr', gap: '6px 16px', alignItems: 'end' }}>
                  <Field label="Numéro de facture">
                    <TInput value={bill?.bill_no || ''} readOnly bg="#eff6ff" />
                  </Field>
                  <Field label="Date de facture">
                    <TInput value={bill?.bill_date ? new Date(bill.bill_date).toLocaleDateString('fr-FR') : today()} readOnly bg="#eff6ff" />
                  </Field>
                  <div style={{ paddingBottom: 2 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f57c00', marginBottom: 4 }}>Total des encours :</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#f57c00', lineHeight: 1 }}>
                      {fmtF(totalEncours != null ? totalEncours : totaux?.total_restant)} F
                    </div>
                    {totalEncours != null && (
                      <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Cumul toutes factures patient</div>
                    )}
                  </div>
                  <Field label="Montant de la facture">
                    <NInput value={fmtF(totaux?.total_brut)} readOnly />
                  </Field>
                  <Field label="Montant Patient">
                    <NInput value={fmtF(totalPatient)} readOnly bg="#fff3e0" textColor="#c62828" bold large />
                  </Field>
                  <Field label="Part Compagnie">
                    <NInput value={fmtF(totaux?.total_partenaire)} readOnly bg={totalPartenaire === 0 ? '#f8f9fa' : '#f0fdf4'} textColor={totalPartenaire === 0 ? '#94a3b8' : '#15803d'} bold />
                  </Field>
                </div>
              </Panel>

              {/* ── 4 modes de paiement ──────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>

                {/* ESPÈCES */}
                <Panel title="Espèces" color="#166534">
                  <Field label="Payé en espèces">
                    <NInput value={esp.montant} onChange={e => setEsp(p => ({ ...p, montant: e.target.value }))} placeholder="0,00" />
                  </Field>
                  <Field label="Reçu">
                    {/* Reçu est numérique */}
                    <NInput value={esp.recu} onChange={e => setEsp(p => ({ ...p, recu: e.target.value }))} placeholder="0,00" />
                  </Field>
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#166534', display: 'block', marginBottom: 4 }}>Monnaie rendu</label>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {['Oui', 'Non'].map(v => (
                        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: '#334155' }}>
                          <input type="radio" name={`mr_${billId}`} checked={esp.monnaie_rendue === v}
                            onChange={() => setEsp(p => ({ ...p, monnaie_rendue: v }))} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Field label="Montant rendu">
                    <NInput
                      value={fmtF(montantRendu)} readOnly
                      bg={montantRendu > 0 ? '#dcfce7' : '#f1f5f9'}
                      textColor={montantRendu > 0 ? '#166534' : '#94a3b8'}
                      bold={montantRendu > 0}
                    />
                  </Field>
                </Panel>

                {/* CARTE */}
                <Panel title="Carte" color="#1565c0">
                  <Field label="Payé par carte">
                    <NInput value={car.montant} onChange={e => { setCar(p => ({ ...p, montant: e.target.value })); setErrors(p => ({ ...p, car_numero: undefined, car_banque: undefined })) }} placeholder="0,00" />
                  </Field>
                  <Field label="N ° de carte" required={cardAmt > 0} error={errors.car_numero}>
                    <TInput value={car.numero} onChange={e => { setCar(p => ({ ...p, numero: e.target.value })); setErrors(p => ({ ...p, car_numero: undefined })) }}
                      placeholder="XXXX XXXX XXXX XXXX" error={!!errors.car_numero} />
                  </Field>
                  <Field label="Banque" required={cardAmt > 0} error={errors.car_banque}>
                    <TInput value={car.banque} onChange={e => { setCar(p => ({ ...p, banque: e.target.value })); setErrors(p => ({ ...p, car_banque: undefined })) }}
                      placeholder="SGBS, BHS, CBAO…" error={!!errors.car_banque} />
                  </Field>
                </Panel>

                {/* CHÈQUE / TRAITE */}
                <Panel title="Chèque / Traite" color="#6a1b9a">
                  <Field label="Payé par chèque/traite">
                    <NInput value={chq.montant} onChange={e => { setChq(p => ({ ...p, montant: e.target.value })); setErrors(p => ({ ...p, chq_date: undefined, chq_numero: undefined })) }} placeholder="0,00" />
                  </Field>
                  <Field label="Date du chèque/traite" required={chqAmt > 0} error={errors.chq_date}>
                    <DInput value={chq.date} onChange={e => { setChq(p => ({ ...p, date: e.target.value })); setErrors(p => ({ ...p, chq_date: undefined })) }} error={!!errors.chq_date} />
                  </Field>
                  <Field label="Chèque/traite (N°)" required={chqAmt > 0} error={errors.chq_numero}>
                    <TInput value={chq.numero} onChange={e => { setChq(p => ({ ...p, numero: e.target.value })); setErrors(p => ({ ...p, chq_numero: undefined })) }}
                      placeholder="N° du chèque" error={!!errors.chq_numero} />
                  </Field>
                  <Field label="Banque">
                    <TInput value={chq.banque} onChange={e => setChq(p => ({ ...p, banque: e.target.value }))} placeholder="SGBS, BHS…" />
                  </Field>
                </Panel>

                {/* PAIEMENT MOBILE */}
                <Panel title="Paiement Mobil" color="#e65100">
                  <Field label="Montant">
                    <NInput value={mob.montant} onChange={e => { setMob(p => ({ ...p, montant: e.target.value })); setErrors(p => ({ ...p, mob_numero: undefined, mob_operateur: undefined })) }} placeholder="0,00" />
                  </Field>
                  <Field label="N° Mobil" required={mobAmt > 0} error={errors.mob_numero}>
                    <TInput value={mob.numero} onChange={e => { setMob(p => ({ ...p, numero: e.target.value })); setErrors(p => ({ ...p, mob_numero: undefined })) }}
                      placeholder="7X XXX XX XX" error={!!errors.mob_numero} />
                  </Field>
                  <Field label="Opérateur" required={mobAmt > 0} error={errors.mob_operateur}>
                    <SInput value={mob.operateur}
                      onChange={e => { setMob(p => ({ ...p, operateur: e.target.value })); setErrors(p => ({ ...p, mob_operateur: undefined })) }}
                      options={OPERATEURS} error={!!errors.mob_operateur} />
                  </Field>
                </Panel>
              </div>

              {/* ── Ligne résumé ─────────────────────────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                <AmountCard label="Montant remboursé"  value={fmtF(rembourse)}   color="#1565c0" bg="#eff6ff" />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Remise</div>
                  <NInput value={remise} onChange={e => setRemise(e.target.value)} placeholder="0,00" />
                </div>
                <AmountCard label="Montant Payé"       value={fmtF(totalPaye)}   color="#c62828" bg="#fff3e0" large />
                <AmountCard label="Montant en attente" value={fmtF(enAttente)}   color={enAttente > 0 ? '#f57c00' : '#15803d'} bg={enAttente > 0 ? '#fff7ed' : '#f0fdf4'} />
              </div>

              {/* Erreur globale ou API */}
              {(errors._global || apiErr) && (
                <div style={{ padding: '7px 12px', borderRadius: 6, background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⚠️ {errors._global || apiErr}
                </div>
              )}
            </div>

            {/* ══ TABLEAU SERVICES — flex:1, toujours ancré ═════════════════ */}
            <div style={{ flex: 1, minHeight: 0, margin: '0 14px 12px', display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', boxShadow: shadows.sm }}>
              {/* En-tête tableau */}
              <div style={{ padding: '8px 14px', background: 'linear-gradient(90deg, #1e3a5f 0%, #1565c0 100%)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>📋</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Détails de Paiement</span>
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                    {services.length} service{services.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <SmBtn label="Ajouter" onClick={() => {}} />
                  <SmBtn label="Retirer" onClick={() => {}} danger />
                </div>
              </div>

              {/* Table avec scroll interne */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ background: '#dbeafe', borderBottom: '2px solid #93c5fd' }}>
                      {[
                        { l: 'Date',           w: 95,  a: 'center' },
                        { l: 'Sélect.',        w: 48,  a: 'center' },
                        { l: 'Nom du service', w: null             },
                        { l: 'Prix service',   w: 110, a: 'right'  },
                        { l: 'Part Patient',   w: 110, a: 'right'  },
                        { l: 'Part Assureur',  w: 110, a: 'right'  },
                        { l: 'Montant Payé',   w: 110, a: 'right'  },
                        { l: 'Statut',         w: 100, a: 'center' },
                      ].map(col => (
                        <th key={col.l} style={{ padding: '8px 10px', textAlign: col.a ?? 'left', fontSize: 10, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.4px', width: col.w ?? undefined, whiteSpace: 'nowrap' }}>{col.l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {services.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: 28, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun service facturé.</td></tr>
                    ) : services.map((svc, idx) => {
                      const st = svc.StatutPaiement ?? 'EN_ATTENTE'
                      const paye = st === 'PAYE'
                      const partiel = st === 'PARTIELLEMENT_PAYE'
                      const stCfg = paye
                        ? { label: '✅ Payé',    color: '#166534', bg: '#dcfce7' }
                        : partiel
                        ? { label: '⚡ Partiel', color: '#7b1fa2', bg: '#f3e5f5' }
                        : { label: '⏳ Attente', color: '#92400e', bg: '#fef3c7' }
                      return (
                        <tr key={svc.IDgen_mst_facture ?? idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>{fmtD(svc.DateCreation)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}><input type="checkbox" style={{ cursor: 'pointer', accentColor: '#1565c0' }} /></td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: paye ? '#166534' : '#1e293b' }}>{svc.NomDescription || svc.IDService || '—'}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>{fmtF(svc.MontantTotalFacture)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#c62828' }}>{fmtF(svc.patient_payable)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#15803d' }}>{fmtF(svc.MontantPartenaire)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: paye ? '#166534' : '#94a3b8' }}>{fmtF(svc.MontantPayer)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: stCfg.bg, color: stCfg.color }}>{stCfg.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>

                  {services.length > 0 && (
                    <tfoot>
                      <tr style={{ background: '#eff6ff', borderTop: '2px solid #bfdbfe' }}>
                        <td colSpan={3} style={{ padding: '7px 10px', fontSize: 11, fontWeight: 700, color: '#475569' }}>
                          TOTAL — {services.length} service{services.length !== 1 ? 's' : ''}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#1e293b' }}>{fmtF(totaux?.total_brut)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#c62828' }}>{fmtF(totaux?.total_patient)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>{fmtF(totaux?.total_partenaire)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#1565c0' }}>{fmtF(totaux?.total_deja_paye)}</td>
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

// ── Bouton compact entête tableau ─────────────────────────────────────────────
function SmBtn({ label, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
        border: `1px solid ${danger ? '#fca5a5' : 'rgba(255,255,255,0.4)'}`,
        background: hov ? (danger ? '#fee2e2' : 'rgba(255,255,255,0.25)') : (danger ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)'),
        color: danger ? (hov ? '#991b1b' : '#fca5a5') : '#fff',
        transition: 'all 0.12s',
      }}>{label}</button>
  )
}
