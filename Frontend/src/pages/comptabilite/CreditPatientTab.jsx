import { useState, useEffect, useCallback, useRef } from 'react'
import { colors, radius, shadows } from '../../theme'
import { comptabiliteApi } from '../../api'
import PaiementModal from './PaiementModal'
import SolderToutModal from './SolderToutModal'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtF  = (n) => Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' F'
const fmtD  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const num   = (v) => parseFloat(v) || 0
const today      = () => new Date().toISOString().slice(0, 10)
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10) }

const STATUTS = {
  1: { label: 'En attente',         color: '#92400e', bg: '#fef3c7', icon: '⏳' },
  2: { label: 'Partiellement payé', color: '#6b21a8', bg: '#f3e5f5', icon: '⚡' },
}

const inputStyle = {
  padding: '8px 11px', borderRadius: radius.sm,
  border: `1.5px solid ${colors.gray200}`, fontSize: 13,
  color: colors.gray800, background: '#fff', outline: 'none',
  width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s',
}
const focus = (e) => (e.target.style.borderColor = colors.bleu)
const blur  = (e) => (e.target.style.borderColor = colors.gray200)

function FLabel({ label }) {
  return (
    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: colors.gray500, marginBottom: 4, display: 'block' }}>
      {label}
    </label>
  )
}

function StatCard({ label, value, sub, icon, color, bg }) {
  return (
    <div style={{ background: '#fff', borderRadius: radius.md, padding: '14px 18px', boxShadow: shadows.sm, border: `1px solid ${colors.gray100}`, borderLeft: `4px solid ${color}`, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: radius.sm, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: colors.gray400, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

function Avatar({ name = '' }) {
  const p = name.trim().split(' ').filter(Boolean)
  const i = p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : (p[0]?.[0] ?? '?').toUpperCase()
  const hues = ['#1565c0', '#2e7d32', '#6a1b9a', '#c62828', '#f57c00', '#00838f']
  const c = hues[name.charCodeAt(0) % hues.length] ?? colors.bleu
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: `${c}15`, border: `2px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c }}>
      {i}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width: 26, height: 26, borderRadius: '50%', border: `3px solid ${colors.gray200}`, borderTopColor: colors.bleu, animation: 'spin 0.7s linear infinite' }} />
  )
}

function ActionBtn({ label, icon, color, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '4px 8px', borderRadius: radius.sm, cursor: 'pointer', border: `1.5px solid ${color}`, background: hov ? color : `${color}12`, color: hov ? '#fff' : color, fontSize: 10, fontWeight: 700, transition: 'all 0.12s', display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 12 }}>{icon}</span><span>{label}</span>
    </button>
  )
}

// ── Modal détail : factures cumulées d'un patient ─────────────────────────────
function DetailModal({ patient, onClose, onPayer }) {
  const [bills,   setBills]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    comptabiliteApi.creditPatientFactures(patient.patient_id)
      .then(r => setBills(r.data?.data ?? []))
      .catch(err => setError(err.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false))
  }, [patient.patient_id])

  const totalRestant = bills.reduce((s, b) => s + num(b.pending_amount), 0)
  const totalFacture = bills.reduce((s, b) => s + num(b.bill_amount), 0)
  const totalPaye    = bills.reduce((s, b) => s + num(b.paid_amount), 0)

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.45)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #7b0000 0%, #c62828 100%)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={patient.patient_name || ''} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{patient.patient_name}</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 1 }}>
              {patient.ssn_no ? `N° SS : ${patient.ssn_no}` : 'Crédit patient'}
              {patient.partenaire_nom ? ` · ${patient.partenaire_nom}` : ''}
            </div>
          </div>
          {/* Résumé rapide */}
          <div style={{ textAlign: 'right', marginRight: 12 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>Total à recouvrer</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ffcdd2' }}>{fmtF(patient.total_restant)}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>✕</button>
        </div>

        {/* Cartes récap */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, padding: '14px 18px 0' }}>
          {[
            { l: 'Total facturé', v: fmtF(totalFacture), c: colors.gray800, bg: colors.gray50 },
            { l: 'Déjà payé',     v: fmtF(totalPaye),    c: colors.success, bg: colors.successBg },
            { l: 'Reste dû',      v: fmtF(totalRestant), c: '#c62828',      bg: colors.dangerBg },
          ].map(x => (
            <div key={x.l} style={{ background: x.bg, borderRadius: 8, padding: '8px 14px', borderLeft: `3px solid ${x.c}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase' }}>{x.l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: x.c, marginTop: 2 }}>{x.v}</div>
            </div>
          ))}
        </div>

        {/* Table des factures */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
              <Spinner /><span style={{ color: colors.gray500 }}>Chargement…</span>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: colors.danger, padding: 32 }}>⚠️ {error}</div>
          ) : bills.length === 0 ? (
            <div style={{ textAlign: 'center', color: colors.gray500, padding: 32 }}>Aucune facture en cours.</div>
          ) : (
            <div style={{ border: `1px solid ${colors.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#fce4e4', borderBottom: `1px solid #ef9a9a`, fontSize: 11, fontWeight: 700, color: '#b71c1c' }}>
                {bills.length} facture{bills.length > 1 ? 's' : ''} en cours
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: colors.gray50, borderBottom: `1.5px solid ${colors.gray200}` }}>
                    {['N° Facture', 'Date', 'Montant Total', 'Déjà payé', 'Reste dû', 'Statut', 'Action'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: colors.gray500, textAlign: h === 'Action' ? 'center' : h === 'N° Facture' || h === 'Date' || h === 'Statut' ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b, i) => {
                    const st = STATUTS[b.bill_status_id ?? 1]
                    return (
                      <tr key={b.bill_hd_id} style={{ borderBottom: `1px solid ${colors.gray100}`, background: i % 2 === 0 ? '#fff' : '#fff5f5' }}>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: colors.bleu, background: colors.infoBg, padding: '2px 8px', borderRadius: radius.sm }}>
                            {b.bill_no || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: 12, color: colors.gray600 }}>{fmtD(b.bill_date)}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: colors.gray800 }}>{fmtF(b.bill_amount)}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, color: colors.success }}>{fmtF(b.paid_amount)}</td>
                        <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: '#c62828', background: colors.dangerBg, padding: '2px 8px', borderRadius: radius.sm }}>
                            {fmtF(b.pending_amount)}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          {st && (
                            <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>
                              {st.icon} {st.label}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                          <ActionBtn label="Payer" icon="💳" color={colors.success}
                            onClick={() => { onClose(); onPayer({ billId: b.bill_hd_id, patientName: patient.patient_name, totalEncours: num(patient.total_restant) }) }} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Pied de tableau total */}
                <tfoot>
                  <tr style={{ background: '#fce4e4', borderTop: `2px solid #ef9a9a` }}>
                    <td colSpan={2} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 12, color: '#b71c1c' }}>Total</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: colors.gray800 }}>{fmtF(totalFacture)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: colors.success }}>{fmtF(totalPaye)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 900, fontSize: 14, color: '#c62828', background: colors.dangerBg, padding: '2px 10px', borderRadius: radius.sm }}>{fmtF(totalRestant)}</span>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div style={{ padding: '10px 18px', borderTop: `1px solid ${colors.gray200}`, background: colors.gray50, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 20px', borderRadius: radius.sm, border: `1.5px solid ${colors.gray300}`, background: '#fff', color: colors.gray700, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = colors.gray100}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// CREDIT PATIENT TAB
// ═════════════════════════════════════════════════════════════════════════════
export default function CreditPatientTab() {
  const [rows,       setRows]       = useState([])
  const [totaux,     setTotaux]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [meta,       setMeta]       = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 })

  const [detail,         setDetail]         = useState(null)  // patient row
  const [paiementModal,  setPaiementModal]  = useState(null)  // { billId, patientName, totalEncours }
  const [solderModal,    setSolderModal]    = useState(null)  // patient row

  const [dateDebut,   setDateDebut]   = useState(monthStart())
  const [dateFin,     setDateFin]     = useState(today())
  const [search,      setSearch]      = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page,        setPage]        = useState(1)
  const debounceRef = useRef(null)

  const load = useCallback((p = 1) => {
    setLoading(true); setError(null)
    const params = { page: p, per_page: 20 }
    if (dateDebut) params.date_debut = dateDebut
    if (dateFin)   params.date_fin   = dateFin
    if (search)    params.search     = search

    comptabiliteApi.creditsPatients(params)
      .then(r => {
        const d = r.data?.data
        setRows(d?.data ?? [])
        setTotaux(r.data?.totaux ?? null)
        setMeta({ total: d?.total ?? 0, current_page: d?.current_page ?? 1, last_page: d?.last_page ?? 1, per_page: d?.per_page ?? 20 })
      })
      .catch(err => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [dateDebut, dateFin, search])

  useEffect(() => { load(page) }, [load, page])
  useEffect(() => { setPage(1) }, [dateDebut, dateFin, search])

  const debounce = (setter, val) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setter(val), 400)
  }

  const handleReset = () => {
    setDateDebut(monthStart()); setDateFin(today()); setSearch(''); setSearchInput('')
  }

  const hasFilters = search || dateDebut !== monthStart() || dateFin !== today()

  // info = { billId, patientName, totalEncours }
  const handlePayer = (info) => {
    setDetail(null)
    setPaiementModal(info)
  }

  return (
    <>
      {detail && (
        <DetailModal
          patient={detail}
          onClose={() => setDetail(null)}
          onPayer={handlePayer}
        />
      )}
      {paiementModal && (
        <PaiementModal
          billId={paiementModal.billId}
          patientName={paiementModal.patientName}
          totalEncours={paiementModal.totalEncours}
          onClose={() => setPaiementModal(null)}
          onSuccess={() => { setPaiementModal(null); load(page) }}
        />
      )}
      {solderModal && (
        <SolderToutModal
          patient={solderModal}
          onClose={() => setSolderModal(null)}
          onSuccess={() => { setSolderModal(null); load(page) }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Cartes stats ─────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12 }}>
          <StatCard label="Patients débiteurs"  value={Number(totaux?.nb_patients ?? 0).toLocaleString('fr-FR')} icon="👤" color={colors.danger}  bg={colors.dangerBg}  sub={`${Number(totaux?.nb_credits ?? 0)} facture(s)`} />
          <StatCard label="Total facturé"        value={fmtF(totaux?.total_factures)}  icon="💰" color={colors.warning} bg={colors.warningBg} />
          <StatCard label="Déjà encaissé"        value={fmtF(totaux?.total_paye)}      icon="✅" color={colors.success} bg={colors.successBg} sub="Paiements partiels" />
          <StatCard label="Total à recouvrer"    value={fmtF(totaux?.total_restant)}   icon="💸" color="#c62828"        bg={colors.dangerBg}  sub="Montants restants dus" />
        </div>

        {/* ── Zone de recherche ─────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, border: `1px solid ${colors.gray100}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 18px', background: 'linear-gradient(90deg, #c6282808, transparent)', borderBottom: `1px solid ${colors.gray100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🔍</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray700 }}>Filtres de recherche</span>
              {hasFilters && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: colors.orange, color: '#fff' }}>Actifs</span>}
            </div>
            {hasFilters && (
              <button onClick={handleReset} style={{ fontSize: 11, fontWeight: 600, color: colors.danger, background: `${colors.danger}0d`, border: `1px solid ${colors.danger}30`, borderRadius: radius.sm, padding: '4px 12px', cursor: 'pointer' }}>
                ✕ Réinitialiser
              </button>
            )}
          </div>

          <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 12, alignItems: 'end' }}>
            <div>
              <FLabel label="Date début" />
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <FLabel label="Date fin" />
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <FLabel label="Patient (nom / n° sécu)" />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.gray400, pointerEvents: 'none' }}>👤</span>
                <input value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); debounce(setSearch, e.target.value) }}
                  placeholder="Nom, prénom, n° SS…"
                  style={{ ...inputStyle, paddingLeft: 28 }} onFocus={focus} onBlur={blur} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => load(1)} style={{ width: '100%', padding: '9px 0', borderRadius: radius.sm, cursor: 'pointer', background: '#c62828', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {loading ? '⏳' : '🔍'} Rechercher
              </button>
            </div>
          </div>
        </div>

        {/* ── Tableau ────────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, border: `1px solid ${colors.gray100}`, overflow: 'hidden' }}>
          <div style={{ padding: '11px 18px', background: 'linear-gradient(90deg, #c62828 0%, #e53935 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15 }}>💸</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Crédits patients — Montants à recouvrer</span>
              {!loading && (
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                  {meta.total} patient{meta.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {loading && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Chargement…</span>}
          </div>

          {error && (
            <div style={{ padding: '12px 18px', background: colors.dangerBg, color: colors.danger, fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center', borderBottom: `1px solid ${colors.danger}20` }}>
              ⚠️ {error}
              <button onClick={() => load(page)} style={{ marginLeft: 'auto', padding: '4px 12px', border: `1px solid ${colors.danger}`, background: 'none', color: colors.danger, borderRadius: radius.sm, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Réessayer</button>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fce4e4', borderBottom: `2px solid #ef9a9a` }}>
                  {[
                    { l: '#',              w: 40,  a: 'center' },
                    { l: 'Patient',        w: 200              },
                    { l: 'Nb fact.',       w: 70,  a: 'center' },
                    { l: 'Dernière fact.', w: 100, a: 'center' },
                    { l: 'Total facturé',  w: 120, a: 'right'  },
                    { l: 'Déjà payé',      w: 110, a: 'right'  },
                    { l: 'Total restant',  w: 130, a: 'right'  },
                    { l: 'Actions',        w: 220, a: 'center' },
                  ].map(c => (
                    <th key={c.l} style={{ padding: '10px 12px', textAlign: c.a ?? 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b71c1c', width: c.w ?? undefined, whiteSpace: 'nowrap' }}>
                      {c.l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Spinner /><span style={{ color: colors.gray500, fontSize: 13 }}>Chargement…</span>
                    </div>
                  </td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 36 }}>🎉</span>
                      <div style={{ fontWeight: 700, color: colors.gray600, fontSize: 14 }}>Aucun crédit en attente</div>
                      <div style={{ fontSize: 12, color: colors.gray400 }}>{hasFilters ? 'Modifiez les filtres.' : 'Tous les patients ont réglé leurs factures.'}</div>
                    </div>
                  </td></tr>
                ) : rows.map((row, idx) => {
                  const numRow  = (meta.current_page - 1) * meta.per_page + idx + 1
                  const restant = num(row.total_restant)
                  const pct     = num(row.total_factures) > 0 ? Math.min(100, Math.round(num(row.total_paye) / num(row.total_factures) * 100)) : 0

                  return (
                    <tr key={row.patient_id ?? idx}
                      style={{ borderBottom: `1px solid ${colors.gray100}`, background: idx % 2 === 0 ? '#fff' : '#fff5f5', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fce4e4'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fff5f5'}>

                      {/* # */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: colors.dangerBg, color: '#c62828', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{numRow}</span>
                      </td>

                      {/* Patient */}
                      <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={row.patient_name || ''} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: colors.gray800, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.patient_name || '—'}</div>
                            <div style={{ fontSize: 10, color: colors.gray500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row.ssn_no ? `SS: ${row.ssn_no}` : `ID: ${row.patient_id}`}
                              {row.partenaire_nom && (
                                <span style={{ marginLeft: 4, padding: '1px 5px', borderRadius: 10, fontSize: 9, fontWeight: 700, background: colors.infoBg, color: colors.bleu }}>
                                  {row.partenaire_nom}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Nb factures */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#fce4e4', color: '#c62828', fontSize: 12, fontWeight: 800 }}>
                          {row.nb_factures}
                        </span>
                      </td>

                      {/* Dernière facture */}
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: colors.gray600, fontSize: 12 }}>
                        {fmtD(row.derniere_facture)}
                      </td>

                      {/* Total facturé */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: colors.gray800 }}>
                        {fmtF(row.total_factures)}
                      </td>

                      {/* Déjà payé */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: colors.success }}>{fmtF(row.total_paye)}</div>
                        <div style={{ width: 60, height: 3, background: colors.gray200, borderRadius: 2, overflow: 'hidden', marginTop: 3, marginLeft: 'auto' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: colors.success, borderRadius: 2 }} />
                        </div>
                      </td>

                      {/* Total restant */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{ fontWeight: 900, fontSize: 15, color: '#c62828', background: colors.dangerBg, padding: '3px 10px', borderRadius: radius.sm }}>
                          {fmtF(restant)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                          <ActionBtn label="Détail"     icon="👁"  color={colors.bleu}    onClick={() => setDetail(row)} />
                          <ActionBtn label="Payer"      icon="💳"  color={colors.success} onClick={() => setDetail(row)} />
                          <ActionBtn label="Solder tout" icon="✅" color="#c62828"        onClick={() => setSolderModal(row)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div style={{ padding: '10px 18px', borderTop: `1px solid ${colors.gray100}`, background: colors.gray50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: colors.gray500 }}>Page {meta.current_page} / {meta.last_page} · {meta.total} patient{meta.total !== 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[...Array(Math.min(meta.last_page, 7))].map((_, i) => {
                  const p = i + 1; const active = p === meta.current_page
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: radius.sm, cursor: 'pointer', border: `1.5px solid ${active ? '#c62828' : colors.gray200}`, background: active ? '#c62828' : '#fff', color: active ? '#fff' : colors.gray600, fontSize: 12, fontWeight: active ? 700 : 500 }}>{p}</button>
                  )
                })}
              </div>
            </div>
          )}
          {rows.length > 0 && meta.last_page === 1 && (
            <div style={{ padding: '8px 18px', borderTop: `1px solid ${colors.gray100}`, background: colors.gray50, textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: colors.gray400 }}>{rows.length} patient{rows.length !== 1 ? 's' : ''} affiché{rows.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
