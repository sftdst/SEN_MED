import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { visiteApi, patientApi } from '../../api'
import { colors, radius, shadows } from '../../theme'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import { showToast } from '../../components/ui/Toast'
import Pagination from '../../components/ui/Pagination'
import CreerVisiteModal from './CreerVisiteModal'
import PaiementModal from '../comptabilite/PaiementModal'

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 10)

const fmtDate = d => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

const fmtHeure = d => {
  if (!d) return ''
  try { return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

const fmtN = n => Number(n || 0).toLocaleString('fr-FR')

// ── Recherche patient (autocomplete) ─────────────────────────────────────────

function PatientSearch({ onSelect }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open,    setOpen]    = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const search = async q => {
    setQuery(q)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await patientApi.liste({ search: q, per_page: 8 })
      setResults(res.data?.data?.data ?? [])
      setOpen(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  const pick = p => {
    setQuery(p.patient_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim())
    setOpen(false)
    onSelect(p)
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: 360 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: colors.gray400, pointerEvents: 'none' }}>🔍</span>
        <input
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Patient — nom, code, téléphone…"
          style={{
            width: '100%', boxSizing: 'border-box',
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            padding: '9px 12px 9px 34px', fontSize: 13, outline: 'none',
            background: colors.white, transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = colors.bleu}
          onBlur={e => e.target.style.borderColor = colors.gray300}
        />
        {loading && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: colors.gray400 }}>…</span>}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0,
          background: colors.white, border: `1px solid ${colors.gray200}`,
          borderRadius: radius.md, boxShadow: shadows.lg, zIndex: 300,
          maxHeight: 260, overflowY: 'auto',
        }}>
          {results.map(p => {
            const nom = p.patient_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
            const ini = ((p.first_name?.[0] ?? '') + (p.last_name?.[0] ?? '')).toUpperCase() || '?'
            return (
              <div key={p.patient_id} onClick={() => pick(p)}
                style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${colors.gray100}` }}
                onMouseEnter={e => e.currentTarget.style.background = colors.gray50}
                onMouseLeave={e => e.currentTarget.style.background = colors.white}
              >
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: colors.bleu, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {ini}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: colors.gray900 }}>{nom}</div>
                  <div style={{ fontSize: 11, color: colors.gray500 }}>
                    {p.patient_id}{p.dob ? ` · ${new Date(p.dob).toLocaleDateString('fr-FR')}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatutVisite({ doctorSeen, urgence }) {
  if (urgence)
    return <Badge bg="#fef2f2" color="#dc2626" border="#fecaca">🚨 Urgence</Badge>
  if (doctorSeen === 1 || doctorSeen === '1')
    return <Badge bg="#f0fdf4" color="#16a34a" border="#bbf7d0">✔ Terminée</Badge>
  return <Badge bg="#fff7ed" color="#c2410c" border="#fed7aa">⏳ En attente</Badge>
}

function StatutPaiement({ billHeader }) {
  const b = billHeader?.[0]
  if (!b) return <Badge bg={colors.gray100} color={colors.gray500} border={colors.gray200}>—</Badge>
  const pending = parseFloat(b.pending_amount ?? 0)
  const paid    = parseFloat(b.paid_amount ?? 0)
  if (pending <= 0 && paid > 0)
    return <Badge bg="#f0fdf4" color="#16a34a" border="#bbf7d0">✔ Soldé</Badge>
  if (paid > 0 && pending > 0)
    return <Badge bg="#eff6ff" color="#1a56db" border="#bfdbfe">⬤ Partiel</Badge>
  return <Badge bg="#fff7ed" color="#c2410c" border="#fed7aa">En attente</Badge>
}

function Badge({ bg, color, border, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

// ── Carte résumé ──────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, color, bg }) {
  return (
    <div style={{
      background: bg || '#f8fafc', borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 140,
      border: '1px solid #e2e8f0',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: color || '#0f172a', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function VisitesPage() {
  const navigate = useNavigate()

  const [visites,    setVisites]    = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [search,     setSearch]     = useState('')
  const [dateFrom,   setDateFrom]   = useState(todayISO())  // ← par défaut aujourd'hui
  const [dateTo,     setDateTo]     = useState(todayISO())  // ← par défaut aujourd'hui

  const [modalOpen,   setModalOpen]   = useState(false)
  const [patientSel,  setPatientSel]  = useState(null)
  const [paiementModal, setPaiementModal] = useState(null)

  const load = async (p = 1, params = {}) => {
    setLoading(true)
    try {
      const q = { page: p, per_page: 20, ...params }
      if (search)   q.search    = search
      if (dateFrom) q.date_from = dateFrom
      if (dateTo)   q.date_to   = dateTo
      const res = await visiteApi.liste(q)
      const d   = res.data?.data
      setVisites(d?.data ?? [])
      setPagination({ current_page: d?.current_page, last_page: d?.last_page, total: d?.total })
    } catch {
      showToast('Erreur lors du chargement des visites', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const handleSearch = () => { setPage(1); load(1) }
  const handlePage   = p  => { setPage(p); load(p) }

  const onVisiteSaved = () => load(page)

  const handlePaiement = visite => {
    const billId      = visite.bill_hd_id ?? visite.bill_id
    const patientName = patientSel?.patient_name ?? `${patientSel?.first_name ?? ''} ${patientSel?.last_name ?? ''}`.trim()
    if (!billId) { showToast('Identifiant de facture introuvable', 'error'); return }
    setModalOpen(false)
    setPaiementModal({ billId, patientName })
  }

  const ouvrirConsultation = v => {
    const pat = v.patient
    navigate('/consultation', { state: { patient: pat, adt_id: v.adt_id } })
  }

  // Totaux
  const nbTerminees  = visites.filter(v => v.doctor_seen === 1 || v.doctor_seen === '1').length
  const nbAttente    = visites.length - nbTerminees
  const totalMontant = visites.reduce((s, v) => s + parseFloat(v.Total_a_payer ?? v.bill_amount ?? 0), 0)

  const getMedecin = v => {
    const m = v.medecin
    if (!m) return null
    return m.staff_name || `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <PageHeader
        title="Visites"
        subtitle={
          loading ? 'Chargement…'
          : pagination ? `${pagination.total ?? visites.length} visite(s) · ${dateFrom === dateTo ? fmtDate(dateFrom) : `${fmtDate(dateFrom)} → ${fmtDate(dateTo)}`}`
          : ''
        }
      />

      {/* ── Barre filtres ── */}
      <div style={{
        background: colors.white, borderRadius: radius.md,
        padding: '14px 20px', boxShadow: shadows.sm,
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <PatientSearch onSelect={p => { setPatientSel(p); setModalOpen(true) }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray500, whiteSpace: 'nowrap' }}>Du</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputSt} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: colors.gray500, whiteSpace: 'nowrap' }}>Au</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputSt} />
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Nom patient…"
          style={{ ...inputSt, width: 180 }}
        />

        <Button variant="secondary" onClick={handleSearch} size="md">
          🔎 Filtrer
        </Button>

        <button
          onClick={() => { setDateFrom(todayISO()); setDateTo(todayISO()); setTimeout(handleSearch, 0) }}
          style={{
            border: `1px solid ${colors.bleu}`, background: `${colors.bleu}0d`,
            color: colors.bleu, borderRadius: radius.sm, padding: '8px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          📅 Aujourd'hui
        </button>

        {pagination?.total != null && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span style={{ background: `${colors.bleu}15`, color: colors.bleu, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>
              {pagination.total} visites
            </span>
            <span style={{ background: `${colors.success}15`, color: colors.success, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>
              {fmtN(totalMontant)} FCFA
            </span>
          </div>
        )}
      </div>

      {/* ── Cartes résumé ── */}
      {!loading && visites.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <SummaryCard icon="🏥" label="Total visites" value={pagination?.total ?? visites.length} color={colors.bleu} />
          <SummaryCard icon="✅" label="Terminées"     value={nbTerminees} color="#16a34a" />
          <SummaryCard icon="⏳" label="En attente"    value={nbAttente}   color="#c2410c" />
          <SummaryCard icon="💰" label="Montant total" value={`${fmtN(totalMontant)} F`} color="#7c3aed" />
        </div>
      )}

      {/* ── Tableau ── */}
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 13 }}>Chargement…</div>
          </div>
        ) : visites.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: colors.gray400 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: colors.gray600 }}>Aucune visite trouvée</div>
            <div style={{ fontSize: 12 }}>Modifiez la période ou les filtres</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  {[
                    { l: '#',            w: 44,  c: 'center' },
                    { l: 'Date / Heure', w: 140 },
                    { l: 'Patient',      w: 180 },
                    { l: 'N° Facture',   w: 150 },
                    { l: 'Médecin',      w: 180 },
                    { l: 'Département',  w: 140 },
                    { l: 'Montant',      w: 110, c: 'right' },
                    { l: 'Statut',       w: 110, c: 'center' },
                    { l: 'Paiement',     w: 100, c: 'center' },
                    { l: '',             w: 80,  c: 'center' },
                  ].map(h => (
                    <th key={h.l} style={{
                      padding: '11px 14px', fontSize: 10, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      color: '#fff', background: colors.bleu,
                      textAlign: h.c || 'left', whiteSpace: 'nowrap',
                      width: h.w, position: 'sticky', top: 0, zIndex: 1,
                      borderRight: '1px solid rgba(255,255,255,0.1)',
                    }}>{h.l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visites.map((v, i) => {
                  const pat     = v.patient
                  const nomPat  = pat?.patient_name ?? `${pat?.first_name ?? ''} ${pat?.last_name ?? ''}`.trim() ?? v.patient_pin
                  const medNom  = getMedecin(v)
                  const medSpec = v.medecin?.specialization
                  const dept    = v.departement?.NomDepartement
                  const billNo  = v.bill_header?.[0]?.bill_no
                  const isEven  = i % 2 === 0

                  return (
                    <tr
                      key={v.adt_id ?? i}
                      style={{ background: isEven ? '#fff' : '#fafbfc', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}07`}
                      onMouseLeave={e => e.currentTarget.style.background = isEven ? '#fff' : '#fafbfc'}
                    >
                      {/* # */}
                      <td style={{ ...tdBase, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 24, height: 24, borderRadius: '50%',
                          background: colors.gray100, fontSize: 11, fontWeight: 700, color: colors.gray500,
                        }}>{i + 1}</span>
                      </td>

                      {/* Date / Heure */}
                      <td style={tdBase}>
                        <div style={{ fontWeight: 600, color: colors.bleu, fontSize: 12 }}>
                          {fmtDate(v.visit_datetime ?? v.created_dttm)}
                        </div>
                        {fmtHeure(v.visit_datetime ?? v.created_dttm) && (
                          <div style={{ fontSize: 10, color: colors.gray400, marginTop: 1 }}>
                            {fmtHeure(v.visit_datetime ?? v.created_dttm)}
                          </div>
                        )}
                      </td>

                      {/* Patient */}
                      <td style={tdBase}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: colors.gray900 }}>{nomPat}</div>
                        {pat?.patient_id && (
                          <div style={{ fontSize: 10, color: colors.gray400, marginTop: 1, fontFamily: 'monospace' }}>
                            {pat.patient_id}
                          </div>
                        )}
                      </td>

                      {/* N° Facture */}
                      <td style={tdBase}>
                        {billNo ? (
                          <span style={{
                            fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
                            background: `${colors.bleu}0d`, color: colors.bleu,
                            borderRadius: 5, padding: '2px 8px',
                          }}>{billNo}</span>
                        ) : (
                          <span style={{ color: colors.gray300, fontSize: 11 }}>—</span>
                        )}
                      </td>

                      {/* Médecin */}
                      <td style={tdBase}>
                        {medNom ? (
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12, color: colors.gray800 }}>
                              {medNom}
                            </div>
                            {medSpec && (
                              <div style={{ fontSize: 10, color: colors.gray400, marginTop: 1 }}>
                                {medSpec}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: colors.gray300, fontStyle: 'italic', fontSize: 11 }}>Non renseigné</span>
                        )}
                      </td>

                      {/* Département */}
                      <td style={tdBase}>
                        {dept ? (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: '#7c3aed',
                            background: '#f5f3ff', borderRadius: 5, padding: '2px 8px',
                          }}>{dept}</span>
                        ) : (
                          <span style={{ color: colors.gray300, fontSize: 11 }}>—</span>
                        )}
                      </td>

                      {/* Montant */}
                      <td style={{ ...tdBase, textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: colors.orange }}>
                          {fmtN(v.Total_a_payer ?? v.bill_amount ?? 0)}
                        </span>
                        <div style={{ fontSize: 10, color: colors.gray400, marginTop: 1 }}>FCFA</div>
                      </td>

                      {/* Statut visite */}
                      <td style={{ ...tdBase, textAlign: 'center' }}>
                        <StatutVisite doctorSeen={v.doctor_seen} urgence={v.urgence} />
                      </td>

                      {/* Statut paiement */}
                      <td style={{ ...tdBase, textAlign: 'center' }}>
                        <StatutPaiement billHeader={v.bill_header} />
                      </td>

                      {/* Actions */}
                      <td style={{ ...tdBase, textAlign: 'center' }}>
                        <button
                          title="Ouvrir la consultation"
                          onClick={() => ouvrirConsultation(v)}
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            border: `1.5px solid ${colors.bleu}`,
                            background: `${colors.bleu}10`, color: colors.bleu,
                            cursor: 'pointer', fontSize: 14,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.13s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = colors.bleu; e.currentTarget.style.color = '#fff' }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${colors.bleu}10`; e.currentTarget.style.color = colors.bleu }}
                        >👁</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${colors.gray100}` }}>
            <Pagination
              currentPage={pagination.current_page}
              totalPages={pagination.last_page}
              onPageChange={handlePage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && patientSel && (
        <CreerVisiteModal
          patient={patientSel}
          onClose={() => { setModalOpen(false); setPatientSel(null) }}
          onSaved={onVisiteSaved}
          onPaiement={handlePaiement}
        />
      )}
      {paiementModal && (
        <PaiementModal
          billId={paiementModal.billId}
          patientName={paiementModal.patientName}
          onClose={() => setPaiementModal(null)}
          onSuccess={() => { setPaiementModal(null); load(page) }}
        />
      )}
    </div>
  )
}

const inputSt = {
  border: `1.5px solid ${colors.gray300}`,
  borderRadius: radius.sm,
  padding: '8px 10px',
  fontSize: 13, outline: 'none',
  background: colors.white,
  transition: 'border-color 0.15s',
}

const tdBase = {
  padding: '10px 14px',
  fontSize: 12,
  borderBottom: `1px solid ${colors.gray100}`,
  verticalAlign: 'middle',
}
