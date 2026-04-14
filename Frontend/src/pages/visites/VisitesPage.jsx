import { useEffect, useRef, useState } from 'react'
import { visiteApi, patientApi } from '../../api'
import { colors, radius, shadows, spacing } from '../../theme'
import Button from '../../components/ui/Button'
import PageHeader from '../../components/ui/PageHeader'
import { showToast } from '../../components/ui/Toast'
import { FullPageSpinner } from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import CreerVisiteModal from './CreerVisiteModal'

const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtN    = n => Number(n || 0).toLocaleString('fr-FR')

// ── Barre de recherche patient ────────────────────────────────────────────────

function PatientSearch({ onSelect }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = async (q) => {
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

  const pick = (p) => {
    setQuery(p.patient_name ?? `${p.first_name} ${p.last_name}`)
    setOpen(false)
    onSelect(p)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
          color: colors.gray400, fontSize: 14, pointerEvents: 'none',
        }}>🔍</span>
        <input
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Rechercher un patient (nom, code, tél)…"
          style={{
            width: '100%', boxSizing: 'border-box',
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            padding: '9px 12px 9px 34px',
            fontSize: 13, outline: 'none',
            background: colors.white,
          }}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: colors.gray400 }}>
            …
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0,
          background: colors.white, border: `1px solid ${colors.gray200}`,
          borderRadius: radius.md, boxShadow: shadows.lg,
          zIndex: 200, maxHeight: 280, overflowY: 'auto',
        }}>
          {results.map(p => (
            <div key={p.id_Rep} onClick={() => pick(p)}
              style={{
                padding: '10px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: `1px solid ${colors.gray100}`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = colors.gray50}
              onMouseLeave={e => e.currentTarget.style.background = colors.white}
            >
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: colors.bleu, color: colors.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {(p.first_name?.[0] ?? '') + (p.last_name?.[0] ?? '')}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {p.patient_name ?? `${p.first_name} ${p.last_name}`}
                </div>
                <div style={{ fontSize: 11, color: colors.gray500 }}>
                  {p.patient_id} &nbsp;·&nbsp; {fmtDate(p.dob)}
                  {p.company_id && <span> &nbsp;·&nbsp; {p.company_id}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tableau des visites ───────────────────────────────────────────────────────

function StatutBadge({ montant_patient, montant_compagny }) {
  const total    = (montant_patient ?? 0) + (montant_compagny ?? 0)
  const assure   = (montant_compagny ?? 0) > 0
  const bg    = assure ? colors.infoBg      : colors.gray100
  const color = assure ? colors.info        : colors.gray600
  const label = assure ? 'Assuré'           : 'Non assuré'
  return (
    <span style={{
      background: bg, color, borderRadius: 20,
      padding: '3px 10px', fontSize: 11, fontWeight: 700,
    }}>{label}</span>
  )
}

const TH = ({ children, right }) => (
  <th style={{
    padding: '10px 14px', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.5px',
    color: colors.white, background: colors.bleu,
    textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap',
    borderBottom: `2px solid ${colors.bleuLight}`,
  }}>{children}</th>
)

const TD = ({ children, right, bold, muted }) => (
  <td style={{
    padding: '10px 14px', fontSize: 13,
    textAlign: right ? 'right' : 'left',
    fontWeight: bold ? 600 : 400,
    color: muted ? colors.gray500 : colors.gray900,
    borderBottom: `1px solid ${colors.gray100}`,
    verticalAlign: 'middle',
  }}>{children}</td>
)

// ── Page principale ───────────────────────────────────────────────────────────

export default function VisitesPage() {
  const [visites, setVisites]       = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')

  // Modal création
  const [modalOpen, setModalOpen]   = useState(false)
  const [patientSel, setPatientSel] = useState(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, per_page: 15 }
      if (search)   params.search    = search
      if (dateFrom) params.date_from = dateFrom
      if (dateTo)   params.date_to   = dateTo
      const res = await visiteApi.liste(params)
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
  const handlePage   = (p) => { setPage(p); load(p) }

  const openModal = (patient) => {
    setPatientSel(patient)
    setModalOpen(true)
  }

  const onVisiteSaved = () => {
    load(page)
    setPatientSel(null)
  }

  if (loading && visites.length === 0) return <FullPageSpinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title="Visites"
        subtitle={pagination ? `${pagination.total ?? 0} visite(s)` : ''}
      />

      {/* Barre d'actions */}
      <div style={{
        background: colors.white, borderRadius: radius.md,
        padding: '16px 20px', boxShadow: shadows.sm,
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Recherche patient → ouvre modal */}
        <PatientSearch onSelect={openModal} />

        {/* Filtres date */}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          placeholder="Depuis" title="Depuis"
          style={inputStyle} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          placeholder="Jusqu'à" title="Jusqu'à"
          style={inputStyle} />
        <Button variant="secondary" onClick={handleSearch} size="md">Filtrer</Button>

        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: colors.gray500, fontStyle: 'italic' }}>
          Recherchez un patient ci-dessus pour créer une visite
        </div>
      </div>

      {/* Tableau */}
      <div style={{
        background: colors.white, borderRadius: radius.md,
        boxShadow: shadows.sm, overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH>Date</TH>
                <TH>Patient</TH>
                <TH>Médecin</TH>
                <TH>Département</TH>
                <TH>Lieu</TH>
                <TH right>Total</TH>
                <TH right>Part Patient</TH>
                <TH right>Part Cie</TH>
                <TH>Statut</TH>
              </tr>
            </thead>
            <tbody>
              {visites.length === 0 && (
                <tr>
                  <td colSpan={9} style={{
                    padding: 48, textAlign: 'center',
                    color: colors.gray400, fontSize: 14,
                  }}>
                    Aucune visite enregistrée
                  </td>
                </tr>
              )}
              {visites.map((v, i) => {
                const pat    = v.patient
                const nomPat = pat?.patient_name ?? pat?.patient_id ?? v.patient_pin
                const bg     = i % 2 === 0 ? colors.white : colors.gray50
                return (
                  <tr key={v.adt_id} style={{ background: bg }}
                    onMouseEnter={e => e.currentTarget.style.background = colors.bleu + '0a'}
                    onMouseLeave={e => e.currentTarget.style.background = bg}
                  >
                    <TD muted>{fmtDate(v.visit_datetime)}</TD>
                    <TD bold>{nomPat}</TD>
                    <TD muted>{v.doctor_seen ?? v.consulting_doctor_id ?? '—'}</TD>
                    <TD muted>{v.IDgen_mst_Departement ?? '—'}</TD>
                    <TD muted>{v.visit_place ?? '—'}</TD>
                    <TD right bold>{fmtN(v.Total_a_payer)}</TD>
                    <TD right>{fmtN(v.montant_patient)}</TD>
                    <TD right>{fmtN(v.montant_compagny)}</TD>
                    <TD><StatutBadge montant_patient={v.montant_patient} montant_compagny={v.montant_compagny} /></TD>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

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

      {/* Modal */}
      {modalOpen && patientSel && (
        <CreerVisiteModal
          patient={patientSel}
          onClose={() => { setModalOpen(false); setPatientSel(null) }}
          onSaved={onVisiteSaved}
        />
      )}
    </div>
  )
}

const inputStyle = {
  border: `1.5px solid ${colors.gray300}`,
  borderRadius: radius.sm,
  padding: '8px 10px',
  fontSize: 13, outline: 'none',
  background: colors.white,
}
