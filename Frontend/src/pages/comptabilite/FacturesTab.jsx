import { useState, useEffect, useCallback, useRef } from 'react'
import { colors, radius, shadows } from '../../theme'
import { comptabiliteApi } from '../../api'
import PaiementModal from './PaiementModal'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtF  = (n) => Number(n || 0).toLocaleString('fr-FR') + ' F'
const fmtN  = (n) => Number(n || 0).toLocaleString('fr-FR')
const fmtD  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const today = () => new Date().toISOString().slice(0, 10)
const monthStart = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

// ── Petits composants ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, bg }) {
  return (
    <div style={{
      background: '#fff', borderRadius: radius.md,
      padding: '16px 20px', boxShadow: shadows.sm,
      borderLeft: `4px solid ${color}`,
      display: 'flex', alignItems: 'center', gap: 14,
      border: `1px solid ${colors.gray100}`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: radius.sm,
        background: bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.2, marginTop: 2 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 10, color: colors.gray400, marginTop: 1 }}>{sub}</div>
        )}
      </div>
    </div>
  )
}

function FilterInput({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <label style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.5px', color: colors.gray500,
      }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  padding: '9px 12px', borderRadius: radius.sm,
  border: `1.5px solid ${colors.gray200}`,
  fontSize: 13, color: colors.gray800, background: '#fff',
  outline: 'none', width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: radius.full,
      fontSize: 10, fontWeight: 700,
      background: bg, color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function FacturesTab() {
  // Données
  const [rows,       setRows]       = useState([])
  const [totaux,     setTotaux]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [partenaires, setPartenaires] = useState([])
  const [meta,       setMeta]       = useState({ total: 0, current_page: 1, last_page: 1, per_page: 20 })

  // Filtres
  const [dateDebut,    setDateDebut]    = useState(monthStart())
  const [dateFin,      setDateFin]      = useState(today())
  const [partenaire,   setPartenaire]   = useState('')
  const [search,       setSearch]       = useState('')
  const [searchInput,  setSearchInput]  = useState('')
  const [page,         setPage]         = useState(1)
  const [perPage]                       = useState(20)

  // Détail facture (expand row)
  const [expanded, setExpanded] = useState(null)

  // Modal paiement
  const [paiementModal, setPaiementModal] = useState(null) // { billId, patientName }

  const debounceRef = useRef(null)

  // ── Chargement partenaires (une fois) ────────────────────────────────────
  useEffect(() => {
    comptabiliteApi.partenaires()
      .then(r => setPartenaires(r.data?.data ?? []))
      .catch(() => {})
  }, [])

  // ── Chargement factures ───────────────────────────────────────────────────
  const load = useCallback((p = 1) => {
    setLoading(true)
    const params = { page: p, per_page: perPage }
    if (dateDebut)  params.date_debut    = dateDebut
    if (dateFin)    params.date_fin      = dateFin
    if (partenaire) params.partenaire_id = partenaire
    if (search)     params.search        = search

    setError(null)
    comptabiliteApi.facturesEnAttente(params)
      .then(r => {
        const d = r.data?.data
        setRows(d?.data ?? [])
        setTotaux(r.data?.totaux ?? null)
        setMeta({
          total:        d?.total        ?? 0,
          current_page: d?.current_page ?? 1,
          last_page:    d?.last_page    ?? 1,
          per_page:     d?.per_page     ?? perPage,
        })
      })
      .catch(err => {
        const msg = err.response?.data?.message || err.message || 'Erreur serveur'
        setError(msg)
        setRows([])
      })
      .finally(() => setLoading(false))
  }, [dateDebut, dateFin, partenaire, search, perPage])

  useEffect(() => { load(page) }, [load, page])

  // Reset page quand les filtres changent
  useEffect(() => { setPage(1) }, [dateDebut, dateFin, partenaire, search])

  // Debounce search
  const handleSearchChange = (v) => {
    setSearchInput(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(v), 400)
  }

  const handleReset = () => {
    setDateDebut(monthStart())
    setDateFin(today())
    setPartenaire('')
    setSearch('')
    setSearchInput('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasFilters = partenaire || search || dateDebut !== monthStart() || dateFin !== today()

  return (
    <>
    {paiementModal && (
      <PaiementModal
        billId={paiementModal.billId}
        patientName={paiementModal.patientName}
        onClose={() => setPaiementModal(null)}
        onSuccess={() => { setPaiementModal(null); load(page) }}
      />
    )}

    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Erreur API ─────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: '#fff5f5', border: `1.5px solid ${colors.danger}40`,
          borderLeft: `4px solid ${colors.danger}`,
          borderRadius: radius.md, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: colors.danger, fontSize: 13 }}>Erreur de chargement</div>
            <div style={{ fontSize: 12, color: colors.gray600, marginTop: 2 }}>{error}</div>
          </div>
          <button
            onClick={() => { setError(null); load(1) }}
            style={{
              marginLeft: 'auto', padding: '5px 12px', borderRadius: radius.sm,
              border: `1px solid ${colors.danger}`, background: 'transparent',
              color: colors.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >Réessayer</button>
        </div>
      )}

      {/* ── Cartes totaux ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 12,
      }}>
        <StatCard
          label="Factures en attente"
          value={fmtN(totaux?.nb_factures ?? meta.total)}
          icon="📄"
          color={colors.bleu}
          bg={colors.infoBg}
        />
        <StatCard
          label="Montant total dû"
          value={fmtF(totaux?.total_brut)}
          icon="💰"
          color={colors.warning}
          bg={colors.warningBg}
        />
        <StatCard
          label="Part patient"
          value={fmtF(totaux?.total_patient)}
          sub="À encaisser"
          icon="🧾"
          color="#c62828"
          bg={colors.dangerBg}
        />
        <StatCard
          label="Part partenaire"
          value={fmtF(totaux?.total_partenaire)}
          sub="Assureur / Société"
          icon="🤝"
          color={colors.success}
          bg={colors.successBg}
        />
      </div>

      {/* ── Zone de recherche ──────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: radius.lg,
        boxShadow: shadows.sm,
        border: `1px solid ${colors.gray100}`,
        overflow: 'hidden',
      }}>
        {/* Header filtre */}
        <div style={{
          padding: '12px 20px',
          background: `linear-gradient(90deg, ${colors.bleu}08 0%, transparent 100%)`,
          borderBottom: `1px solid ${colors.gray100}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🔍</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.gray700 }}>
              Filtres de recherche
            </span>
            {hasFilters && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px',
                borderRadius: radius.full, background: colors.orange,
                color: '#fff',
              }}>Actifs</span>
            )}
          </div>
          {hasFilters && (
            <button
              onClick={handleReset}
              style={{
                fontSize: 11, fontWeight: 600, color: colors.danger,
                background: `${colors.danger}0d`, border: `1px solid ${colors.danger}30`,
                borderRadius: radius.sm, padding: '4px 12px', cursor: 'pointer',
              }}
            >✕ Réinitialiser</button>
          )}
        </div>

        {/* Champs filtres */}
        <div style={{
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, alignItems: 'end',
        }}>
          <FilterInput label="Date début">
            <input
              type="date" value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = colors.bleu}
              onBlur={e  => e.target.style.borderColor = colors.gray200}
            />
          </FilterInput>

          <FilterInput label="Date fin">
            <input
              type="date" value={dateFin}
              onChange={e => setDateFin(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = colors.bleu}
              onBlur={e  => e.target.style.borderColor = colors.gray200}
            />
          </FilterInput>

          <FilterInput label="Partenaire / Assureur">
            <select
              value={partenaire}
              onChange={e => setPartenaire(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = colors.bleu}
              onBlur={e  => e.target.style.borderColor = colors.gray200}
            >
              <option value="">— Tous les partenaires —</option>
              {partenaires.map(p => (
                <option key={p.id_gen_partenaire} value={p.id_gen_partenaire}>
                  {p.Nom}
                </option>
              ))}
            </select>
          </FilterInput>

          <FilterInput label="Patient · Prénom / N° sécu">
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: colors.gray400, pointerEvents: 'none',
              }}>🔍</span>
              <input
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Nom, prénom ou n° SS…"
                style={{ ...inputStyle, paddingLeft: 30 }}
                onFocus={e => e.target.style.borderColor = colors.bleu}
                onBlur={e  => e.target.style.borderColor = colors.gray200}
              />
            </div>
          </FilterInput>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => load(1)}
              style={{
                width: '100%', padding: '9px 0',
                borderRadius: radius.sm, cursor: 'pointer',
                background: colors.bleu, border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: shadows.sm, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {loading ? '⏳' : '🔍'} Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* ── Tableau ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: radius.lg,
        boxShadow: shadows.sm, border: `1px solid ${colors.gray100}`,
        overflow: 'hidden',
      }}>
        {/* En-tête tableau */}
        <div style={{
          padding: '12px 20px',
          background: `linear-gradient(90deg, ${colors.bleu} 0%, ${colors.bleuLight} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15 }}>📋</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
              Factures en attente
            </span>
            {!loading && (
              <span style={{
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                borderRadius: radius.full, padding: '2px 10px', fontSize: 11, fontWeight: 700,
              }}>
                {meta.total} résultat{meta.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {loading && (
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Chargement…</span>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
                {[
                  { label: '#',              w: 48,  align: 'center' },
                  { label: 'Patient',        w: null },
                  { label: 'Montant Total',  w: 140, align: 'right' },
                  { label: 'Part Patient',   w: 130, align: 'right' },
                  { label: 'Part Partenaire',w: 140, align: 'right' },
                  { label: 'N° Facture',     w: 160 },
                  { label: 'Date',           w: 100, align: 'center' },
                  { label: 'Options',        w: 120, align: 'center' },
                ].map(col => (
                  <th key={col.label} style={{
                    padding: '11px 14px',
                    textAlign: col.align ?? 'left',
                    fontSize: 10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    color: colors.gray500,
                    width: col.w ?? undefined,
                    whiteSpace: 'nowrap',
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <LoadingSpinner />
                      <span style={{ fontSize: 13, color: colors.gray500 }}>Chargement des factures…</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 40 }}>🎉</span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.gray600 }}>
                        Aucune facture en attente
                      </div>
                      <div style={{ fontSize: 12, color: colors.gray400 }}>
                        {hasFilters ? 'Modifiez les filtres pour élargir la recherche.' : 'Toutes les factures ont été réglées.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const num       = (meta.current_page - 1) * meta.per_page + idx + 1
                  const isExp     = expanded === row.bill_id
                  const montantTot = Number(row.montant_total || 0)
                  const montantPat = Number(row.montant_patient || 0)
                  const montantPar = Number(row.montant_partenaire || 0)
                  const hasPartenaire = montantPar > 0

                  return (
                    <tr
                      key={row.bill_id ?? idx}
                      style={{
                        borderBottom: `1px solid ${colors.gray100}`,
                        background: isExp ? `${colors.bleu}06` : idx % 2 === 0 ? '#fff' : colors.gray50,
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = `${colors.orange}06` }}
                      onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : colors.gray50 }}
                    >
                      {/* # */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: colors.infoBg, color: colors.bleu,
                          fontSize: 10, fontWeight: 700,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>{num}</span>
                      </td>

                      {/* Patient */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={row.patient_name} />
                          <div>
                            <div style={{ fontWeight: 600, color: colors.gray800, fontSize: 13 }}>
                              {row.patient_name || '—'}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, color: colors.gray500 }}>
                                {row.patient_id}
                              </span>
                              {row.ssn_no && (
                                <span style={{ fontSize: 10, color: colors.gray400 }}>
                                  · SS: {row.ssn_no}
                                </span>
                              )}
                              {row.partenaire_nom && (
                                <Badge
                                  label={row.partenaire_nom}
                                  color="#1565c0"
                                  bg="#e3f2fd"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Montant Total */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: colors.warning }}>
                          {fmtF(montantTot)}
                        </div>
                        <div style={{ fontSize: 10, color: colors.gray400, marginTop: 1 }}>
                          {row.nb_services} service{row.nb_services > 1 ? 's' : ''}
                        </div>
                      </td>

                      {/* Part Patient */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <AmountCell
                          value={montantPat}
                          color="#c62828"
                          bg={colors.dangerBg}
                          pct={montantTot > 0 ? Math.round(montantPat / montantTot * 100) : 0}
                        />
                      </td>

                      {/* Part Partenaire */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {hasPartenaire ? (
                          <AmountCell
                            value={montantPar}
                            color={colors.success}
                            bg={colors.successBg}
                            pct={montantTot > 0 ? Math.round(montantPar / montantTot * 100) : 0}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: colors.gray400 }}>—</span>
                        )}
                      </td>

                      {/* N° Facture */}
                      <td style={{ padding: '12px 14px' }}>
                        {row.bill_no ? (
                          <span style={{
                            fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                            color: colors.bleu, background: colors.infoBg,
                            padding: '3px 8px', borderRadius: radius.sm,
                            border: `1px solid ${colors.bleu}20`,
                          }}>
                            {row.bill_no}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: colors.gray400 }}>—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, color: colors.gray600 }}>
                          {fmtD(row.bill_date)}
                        </span>
                      </td>

                      {/* Options */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                          <ActionBtn
                            label="Détail"
                            icon="👁"
                            color={colors.bleu}
                            onClick={() => setExpanded(isExp ? null : row.bill_id)}
                            active={isExp}
                          />
                          <ActionBtn
                            label="Payer"
                            icon="💳"
                            color={colors.success}
                            onClick={() => setPaiementModal({ billId: row.bill_id, patientName: row.patient_name })}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div style={{
            padding: '12px 20px',
            borderTop: `1px solid ${colors.gray100}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: colors.gray50,
          }}>
            <span style={{ fontSize: 12, color: colors.gray500 }}>
              Page {meta.current_page} / {meta.last_page}
              &nbsp;·&nbsp; {meta.total} résultat{meta.total !== 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[...Array(Math.min(meta.last_page, 7))].map((_, i) => {
                const p = i + 1
                const active = p === meta.current_page
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 32, height: 32, borderRadius: radius.sm, cursor: 'pointer',
                      border: `1.5px solid ${active ? colors.bleu : colors.gray200}`,
                      background: active ? colors.bleu : '#fff',
                      color: active ? '#fff' : colors.gray600,
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      transition: 'all 0.12s',
                    }}
                  >{p}</button>
                )
              })}
              {meta.last_page > 7 && (
                <>
                  <span style={{ padding: '0 4px', lineHeight: '32px', color: colors.gray400 }}>…</span>
                  <button
                    onClick={() => setPage(meta.last_page)}
                    style={{
                      width: 32, height: 32, borderRadius: radius.sm, cursor: 'pointer',
                      border: `1.5px solid ${meta.current_page === meta.last_page ? colors.bleu : colors.gray200}`,
                      background: meta.current_page === meta.last_page ? colors.bleu : '#fff',
                      color: meta.current_page === meta.last_page ? '#fff' : colors.gray600,
                      fontSize: 12, fontWeight: 500,
                    }}
                  >{meta.last_page}</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer info si peu de résultats */}
        {rows.length > 0 && meta.last_page === 1 && (
          <div style={{
            padding: '10px 20px', borderTop: `1px solid ${colors.gray100}`,
            background: colors.gray50, textAlign: 'right',
          }}>
            <span style={{ fontSize: 11, color: colors.gray400 }}>
              {rows.length} facture{rows.length !== 1 ? 's' : ''} affichée{rows.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

// ── Composants locaux ─────────────────────────────────────────────────────────
function Avatar({ name = '' }) {
  const parts  = name.trim().split(' ').filter(Boolean)
  const initls = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] ?? '?').toUpperCase()

  const hues = ['#1565c0', '#2e7d32', '#6a1b9a', '#c62828', '#f57c00', '#00838f']
  const col  = hues[name.charCodeAt(0) % hues.length] ?? colors.bleu

  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: `${col}15`, border: `2px solid ${col}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: col,
    }}>
      {initls}
    </div>
  )
}

function AmountCell({ value, color, bg, pct }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
      <span style={{
        fontSize: 13, fontWeight: 700, color,
        background: bg, padding: '2px 7px', borderRadius: radius.sm,
      }}>
        {Number(value || 0).toLocaleString('fr-FR')} F
      </span>
      {pct > 0 && (
        <div style={{ width: 60, height: 4, background: colors.gray100, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(pct, 100)}%`, height: '100%',
            background: color, borderRadius: 2, transition: 'width 0.4s',
          }} />
        </div>
      )}
    </div>
  )
}

function ActionBtn({ label, icon, color, onClick, active }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        padding: '5px 10px', borderRadius: radius.sm, cursor: 'pointer',
        border: `1.5px solid ${color}`,
        background: hov || active ? color : `${color}12`,
        color: hov || active ? '#fff' : color,
        fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 4,
        transition: 'all 0.12s', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function LoadingSpinner() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      border: `3px solid ${colors.gray200}`,
      borderTopColor: colors.bleu,
      animation: 'spin 0.8s linear infinite',
    }} />
  )
}
