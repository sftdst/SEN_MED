import { useState, useEffect, useCallback, useRef } from 'react'
import { colors, radius, shadows } from '../../theme'
import { paiementApi } from '../../api'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtF = (n) => Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' F'
const fmtN = (n) => Number(n ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtDT = (d) => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
const num  = (v) => parseFloat(v) || 0
const today      = () => new Date().toISOString().slice(0, 10)
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10) }

// ── Statuts ───────────────────────────────────────────────────────────────────
const STATUTS = {
  1: { label: 'En attente',         color: '#92400e', bg: '#fef3c7', icon: '⏳' },
  2: { label: 'Partiellement payé', color: '#6b21a8', bg: '#f3e5f5', icon: '⚡' },
  3: { label: 'Payé',               color: '#14532d', bg: '#dcfce7', icon: '✅' },
}

const MODE_ICONS = { ESPECES: '💵', CARTE: '💳', CHEQUE: '🏦', MOBILE: '📱' }

// ── Petits composants ─────────────────────────────────────────────────────────
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

const inputStyle = { padding: '8px 11px', borderRadius: radius.sm, border: `1.5px solid ${colors.gray200}`, fontSize: 13, color: colors.gray800, background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s' }
const focus = (e) => (e.target.style.borderColor = colors.bleu)
const blur  = (e) => (e.target.style.borderColor = colors.gray200)

function FLabel({ label }) {
  return <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: colors.gray500, marginBottom: 4, display: 'block' }}>{label}</label>
}

function Avatar({ name = '' }) {
  const p = name.trim().split(' ').filter(Boolean)
  const i = p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : (p[0]?.[0] ?? '?').toUpperCase()
  const hues = ['#1565c0','#2e7d32','#6a1b9a','#c62828','#f57c00','#00838f']
  const c = hues[name.charCodeAt(0) % hues.length] ?? colors.bleu
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `${c}15`, border: `2px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: c }}>
      {i}
    </div>
  )
}

function Spinner() {
  return <div style={{ width: 26, height: 26, borderRadius: '50%', border: `3px solid ${colors.gray200}`, borderTopColor: colors.bleu, animation: 'spin 0.7s linear infinite' }} />
}

// ── Modal détail paiement ─────────────────────────────────────────────────────
function DetailModal({ billId, patientName, onClose }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    paiementApi.detail(billId)
      .then(r => setData(r.data.data))
      .catch(err => setError(err.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false))
  }, [billId])

  const bill    = data?.bill
  const services = data?.services ?? []
  const totaux  = data?.totaux

  const modeBlocks = bill ? [
    { key: 'ESPECES', label: 'Espèces',         icon: '💵', color: '#166534', bg: '#f0fdf4', montant: num(bill.cash_amount),
      details: [
        { l: 'Montant reçu',   v: `${fmtN(bill.mont_recu)} F` },
        { l: 'Monnaie rendue', v: bill.status_monaie === 'OUI' ? `${fmtN(bill.mont_monaie)} F` : 'Non' },
      ]},
    { key: 'CARTE',   label: 'Carte bancaire',  icon: '💳', color: '#1565c0', bg: '#eff6ff', montant: num(bill.card_amount),
      details: [
        { l: 'N° carte', v: bill.card_no  || '—' },
        { l: 'Banque',   v: bill.bank_id  || '—' },
      ]},
    { key: 'CHEQUE',  label: 'Chèque / Traite', icon: '🏦', color: '#6a1b9a', bg: '#faf5ff', montant: num(bill.cheque_amount),
      details: [
        { l: 'N° chèque', v: bill.cheque_no   || '—' },
        { l: 'Date',      v: fmtD(bill.cheque_date) },
        { l: 'Banque',    v: bill.bank_id      || '—' },
      ]},
    { key: 'MOBILE',  label: 'Paiement mobile', icon: '📱', color: '#c2410c', bg: '#fff7ed', montant: num(bill.montant_mobile),
      details: [
        { l: 'N° mobile',  v: bill.telephone       || '—' },
        { l: 'Opérateur',  v: bill.operateur_mobil || '—' },
      ]},
  ].filter(m => m.montant > 0) : []

  const st = STATUTS[bill?.bill_status_id ?? 1]

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.45)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #001f3f 0%, #003f7a 100%)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ff7631', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧾</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Détail du paiement</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 }}>{patientName}{bill?.bill_no ? ` · ${bill.bill_no}` : ''}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 48 }}><Spinner /><span style={{ color: colors.gray500 }}>Chargement…</span></div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: colors.danger, padding: 32 }}>⚠️ {error}</div>
          ) : (
            <>
              {/* Infos facture */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 10 }}>
                {[
                  { l: 'N° Facture',   v: bill?.bill_no || '—',         color: colors.bleu,    bg: colors.infoBg    },
                  { l: 'Date',         v: fmtD(bill?.bill_date),         color: colors.gray700, bg: colors.gray50    },
                  { l: 'Montant Total',v: fmtF(totaux?.total_brut),      color: colors.gray800, bg: colors.gray50    },
                  { l: 'Payé',         v: fmtF(bill?.paid_amount),       color: colors.success, bg: colors.successBg },
                  { l: 'Restant',      v: fmtF(bill?.pending_amount),    color: colors.warning, bg: colors.warningBg },
                  { l: 'Remise',       v: fmtF(bill?.discount_amount),   color: '#7b1fa2',      bg: '#f3e5f5'        },
                ].map(c => (
                  <div key={c.l} style={{ background: c.bg, borderRadius: 6, padding: '8px 12px', borderLeft: `3px solid ${c.color}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{c.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c.color, marginTop: 2 }}>{c.v}</div>
                  </div>
                ))}
              </div>

              {/* Statut */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: colors.gray600 }}>Statut :</span>
                <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                  {st.icon} {st.label}
                </span>
                {bill?.mode_paye && (
                  <span style={{ marginLeft: 4, fontSize: 11, color: colors.gray500 }}>
                    · Modes : {bill.mode_paye.split('+').map(m => (
                      <span key={m} style={{ marginLeft: 4, padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: colors.infoBg, color: colors.bleu }}>{MODE_ICONS[m] || ''} {m}</span>
                    ))}
                  </span>
                )}
              </div>

              {/* Détail par mode */}
              {modeBlocks.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.gray700, marginBottom: 8 }}>Répartition des paiements</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 10 }}>
                    {modeBlocks.map(m => (
                      <div key={m.key} style={{ background: m.bg, border: `1.5px solid ${m.color}30`, borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>{m.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: 12, color: m.color }}>{m.label}</span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: m.color, marginBottom: 6 }}>{fmtF(m.montant)}</div>
                        {m.details.map(d => d.v !== '—' && (
                          <div key={d.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.gray600, marginTop: 3 }}>
                            <span>{d.l}</span>
                            <span style={{ fontWeight: 600, color: colors.gray800 }}>{d.v}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {services.length > 0 && (
                <div style={{ border: `1px solid ${colors.gray200}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', background: colors.gray50, borderBottom: `1px solid ${colors.gray200}`, fontSize: 11, fontWeight: 700, color: colors.gray700 }}>
                    Services facturés ({services.length})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#dbeafe' }}>
                        {['Service','Prix','Part Patient','Payé','Statut'].map(h => (
                          <th key={h} style={{ padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#1e40af', textAlign: h === 'Service' ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((s, i) => {
                        const st2 = s.StatutPaiement === 'PAYE' ? { c: '#166534', bg: '#dcfce7', l: '✅ Payé' }
                          : s.StatutPaiement === 'PARTIELLEMENT_PAYE' ? { c: '#6b21a8', bg: '#f3e5f5', l: '⚡ Partiel' }
                          : { c: '#92400e', bg: '#fef3c7', l: '⏳ Attente' }
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${colors.gray100}`, background: i % 2 ? colors.gray50 : '#fff' }}>
                            <td style={{ padding: '7px 10px', fontWeight: 600, color: colors.gray800 }}>{s.NomDescription || s.IDService || '—'}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: colors.gray700 }}>{fmtN(s.MontantTotalFacture)}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: '#c62828', fontWeight: 600 }}>{fmtN(s.patient_payable)}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', color: colors.bleu, fontWeight: 700 }}>{fmtN(s.MontantPayer)}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: st2.bg, color: st2.c }}>{st2.l}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
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
// HISTORIQUE TAB PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function HistoriqueTab() {
  const [rows,       setRows]       = useState([])
  const [totaux,     setTotaux]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [meta,       setMeta]       = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 })
  const [detail,     setDetail]     = useState(null) // { billId, patientName }

  // Filtres
  const [dateDebut,   setDateDebut]   = useState(monthStart())
  const [dateFin,     setDateFin]     = useState(today())
  const [search,      setSearch]      = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [billNo,      setBillNo]      = useState('')
  const [billNoInput, setBillNoInput] = useState('')
  const [statut,      setStatut]      = useState('')
  const [page,        setPage]        = useState(1)
  const debounceRef = useRef(null)

  // ── Chargement ────────────────────────────────────────────────────────────
  const load = useCallback((p = 1) => {
    setLoading(true); setError(null)
    const params = { page: p, per_page: 20 }
    if (dateDebut) params.date_debut = dateDebut
    if (dateFin)   params.date_fin   = dateFin
    if (search)    params.search     = search
    if (billNo)    params.bill_no    = billNo
    if (statut)    params.statut     = statut

    paiementApi.historique(params)
      .then(r => {
        const d = r.data?.data
        setRows(d?.data ?? [])
        setTotaux(r.data?.totaux ?? null)
        setMeta({ total: d?.total ?? 0, current_page: d?.current_page ?? 1, last_page: d?.last_page ?? 1, per_page: d?.per_page ?? 20 })
      })
      .catch(err => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [dateDebut, dateFin, search, billNo, statut])

  useEffect(() => { load(page) }, [load, page])
  useEffect(() => { setPage(1) }, [dateDebut, dateFin, search, billNo, statut])

  const debounce = (setter, val, delay = 400) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setter(val), delay)
  }

  const handleReset = () => {
    setDateDebut(monthStart()); setDateFin(today()); setSearch(''); setSearchInput(''); setBillNo(''); setBillNoInput(''); setStatut('')
  }

  const hasFilters = search || billNo || statut || dateDebut !== monthStart() || dateFin !== today()

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {detail && <DetailModal billId={detail.billId} patientName={detail.patientName} onClose={() => setDetail(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Cartes stats ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12 }}>
          <StatCard label="Paiements"      value={Number(totaux?.nb_paiements ?? 0).toLocaleString('fr-FR')} icon="🧾" color={colors.bleu}    bg={colors.infoBg}    />
          <StatCard label="Total facturé"  value={fmtF(totaux?.total_factures)}   icon="💰" color={colors.warning} bg={colors.warningBg} />
          <StatCard label="Total encaissé" value={fmtF(totaux?.total_paye)}       icon="✅" color={colors.success} bg={colors.successBg} sub="Tous modes confondus" />
          <StatCard label="Reste à recouvrer" value={fmtF(totaux?.total_restant)} icon="⏳" color={colors.danger}  bg={colors.dangerBg}  />
        </div>

        {/* ── Zone de recherche ──────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, border: `1px solid ${colors.gray100}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 18px', background: `linear-gradient(90deg, ${colors.bleu}08, transparent)`, borderBottom: `1px solid ${colors.gray100}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                <input value={searchInput} onChange={e => { setSearchInput(e.target.value); debounce(setSearch, e.target.value) }}
                  placeholder="Nom, prénom, n° SS…" style={{ ...inputStyle, paddingLeft: 28 }} onFocus={focus} onBlur={blur} />
              </div>
            </div>
            <div>
              <FLabel label="N° Facture" />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.gray400, pointerEvents: 'none' }}>🔢</span>
                <input value={billNoInput} onChange={e => { setBillNoInput(e.target.value); debounce(setBillNo, e.target.value) }}
                  placeholder="BILL-2026…" style={{ ...inputStyle, paddingLeft: 28 }} onFocus={focus} onBlur={blur} />
              </div>
            </div>
            <div>
              <FLabel label="Statut" />
              <select value={statut} onChange={e => setStatut(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
                <option value="">— Tous —</option>
                <option value="3">✅ Payé</option>
                <option value="2">⚡ Partiellement payé</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => load(1)} style={{ width: '100%', padding: '9px 0', borderRadius: radius.sm, cursor: 'pointer', background: colors.bleu, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {loading ? '⏳' : '🔍'} Rechercher
              </button>
            </div>
          </div>
        </div>

        {/* ── Tableau ────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: radius.lg, boxShadow: shadows.sm, border: `1px solid ${colors.gray100}`, overflow: 'hidden' }}>
          {/* En-tête */}
          <div style={{ padding: '11px 18px', background: `linear-gradient(90deg, ${colors.bleu} 0%, ${colors.bleuLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15 }}>📜</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Historique des paiements</span>
              {!loading && (
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                  {meta.total} résultat{meta.total !== 1 ? 's' : ''}
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
                <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                  {[
                    { l: '#',              w: 46,  a: 'center' },
                    { l: 'Patient',        w: null             },
                    { l: 'N° Facture',     w: 160             },
                    { l: 'Date',           w: 100, a: 'center' },
                    { l: 'Montant Total',  w: 130, a: 'right'  },
                    { l: 'Montant Payé',   w: 130, a: 'right'  },
                    { l: 'Reste',          w: 110, a: 'right'  },
                    { l: 'Mode(s)',        w: 160             },
                    { l: 'Statut',         w: 140, a: 'center' },
                    { l: 'Actions',        w: 90,  a: 'center' },
                  ].map(c => (
                    <th key={c.l} style={{ padding: '10px 12px', textAlign: c.a ?? 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: colors.gray500, width: c.w ?? undefined, whiteSpace: 'nowrap' }}>
                      {c.l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Spinner /><span style={{ color: colors.gray500, fontSize: 13 }}>Chargement…</span>
                    </div>
                  </td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 36 }}>📭</span>
                      <div style={{ fontWeight: 700, color: colors.gray600, fontSize: 14 }}>Aucun paiement trouvé</div>
                      <div style={{ fontSize: 12, color: colors.gray400 }}>{hasFilters ? 'Modifiez les filtres.' : 'Aucun paiement enregistré.'}</div>
                    </div>
                  </td></tr>
                ) : rows.map((row, idx) => {
                  const num_row = (meta.current_page - 1) * meta.per_page + idx + 1
                  const st      = STATUTS[row.bill_status_id ?? 1]
                  const modes   = (row.mode_paye || '').split('+').filter(Boolean)
                  const paidPct = num(row.bill_amount) > 0 ? Math.min(100, Math.round(num(row.paid_amount) / num(row.bill_amount) * 100)) : 0

                  return (
                    <tr key={row.bill_hd_id ?? idx} style={{ borderBottom: `1px solid ${colors.gray100}`, background: idx % 2 === 0 ? '#fff' : colors.gray50, transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}05`}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : colors.gray50}>

                      {/* # */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: colors.infoBg, color: colors.bleu, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{num_row}</span>
                      </td>

                      {/* Patient */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <Avatar name={row.patient_name || ''} />
                          <div>
                            <div style={{ fontWeight: 600, color: colors.gray800, fontSize: 13 }}>{row.patient_name || '—'}</div>
                            <div style={{ fontSize: 10, color: colors.gray500 }}>{row.patient_id}{row.ssn_no ? ` · ${row.ssn_no}` : ''}</div>
                          </div>
                        </div>
                      </td>

                      {/* N° Facture */}
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: colors.bleu, background: colors.infoBg, padding: '2px 8px', borderRadius: radius.sm, border: `1px solid ${colors.bleu}20` }}>
                          {row.bill_no || '—'}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: colors.gray600, fontSize: 12 }}>
                        {fmtD(row.bill_date)}
                      </td>

                      {/* Montant Total */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: colors.gray800 }}>
                        {fmtF(row.bill_amount)}
                      </td>

                      {/* Montant Payé */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: colors.success }}>{fmtF(row.paid_amount)}</div>
                        <div style={{ width: 70, height: 4, background: colors.gray200, borderRadius: 2, overflow: 'hidden', marginTop: 3, marginLeft: 'auto' }}>
                          <div style={{ width: `${paidPct}%`, height: '100%', background: colors.success, borderRadius: 2, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize: 9, color: colors.gray400, textAlign: 'right', marginTop: 1 }}>{paidPct}%</div>
                      </td>

                      {/* Reste */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: num(row.pending_amount) > 0 ? colors.warning : colors.success, fontSize: 12 }}>
                        {fmtF(row.pending_amount)}
                      </td>

                      {/* Modes */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {modes.length === 0 ? <span style={{ fontSize: 11, color: colors.gray400 }}>—</span>
                            : modes.map(m => (
                              <span key={m} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: colors.infoBg, color: colors.bleu, border: `1px solid ${colors.bleu}20` }}>
                                {MODE_ICONS[m] || ''} {m}
                              </span>
                            ))}
                        </div>
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}>
                          {st.icon} {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <DetailBtn onClick={() => setDetail({ billId: row.bill_hd_id, patientName: row.patient_name })} />
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
              <span style={{ fontSize: 12, color: colors.gray500 }}>Page {meta.current_page} / {meta.last_page} · {meta.total} résultat{meta.total !== 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[...Array(Math.min(meta.last_page, 7))].map((_, i) => {
                  const p = i + 1; const active = p === meta.current_page
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: radius.sm, cursor: 'pointer', border: `1.5px solid ${active ? colors.bleu : colors.gray200}`, background: active ? colors.bleu : '#fff', color: active ? '#fff' : colors.gray600, fontSize: 12, fontWeight: active ? 700 : 500 }}>{p}</button>
                  )
                })}
              </div>
            </div>
          )}
          {rows.length > 0 && meta.last_page === 1 && (
            <div style={{ padding: '8px 18px', borderTop: `1px solid ${colors.gray100}`, background: colors.gray50, textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: colors.gray400 }}>{rows.length} paiement{rows.length !== 1 ? 's' : ''} affiché{rows.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

      </div>
    </>
  )
}

function DetailBtn({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '5px 12px', borderRadius: radius.sm, cursor: 'pointer', border: `1.5px solid ${colors.bleu}`, background: hov ? colors.bleu : `${colors.bleu}12`, color: hov ? '#fff' : colors.bleu, fontSize: 11, fontWeight: 700, transition: 'all 0.12s', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span>👁</span><span>Détail</span>
    </button>
  )
}
