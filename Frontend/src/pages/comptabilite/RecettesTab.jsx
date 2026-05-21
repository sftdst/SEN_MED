import { useState, useEffect, useCallback } from 'react'
import { colors, radius, shadows } from '../../theme'
import { comptabiliteApi } from '../../api'
import { showToast } from '../../components/ui/Toast'

function fmt(n) {
  return new Intl.NumberFormat('fr-SN').format(n ?? 0) + ' FCFA'
}

function fmtDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('fr-FR')
}

const TYPE_LABELS = {
  acompte:  { label: 'Acompte',  color: '#d97706', bg: '#fef3c7' },
  reliquat: { label: 'Reliquat', color: '#1d4ed8', bg: '#dbeafe' },
  penalite: { label: 'Pénalité', color: '#991b1b', bg: '#fee2e2' },
}

const SOURCE_LABELS = {
  materiel_medical: { label: 'Matériel Médical', icon: '🏥', color: colors.bleu },
  pharmacie:        { label: 'Pharmacie',         icon: '💊', color: '#16a34a' },
}

function TypeBadge({ type }) {
  const t = TYPE_LABELS[type] || { label: type, color: colors.gray600, bg: colors.gray100 }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, color: t.color, background: t.bg,
    }}>{t.label}</span>
  )
}

export default function RecettesTab() {
  const today = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [dateDebut, setDateDebut] = useState(firstDay)
  const [dateFin, setDateFin]     = useState(today)
  const [source, setSource]       = useState('')
  const [search, setSearch]       = useState('')
  const [data, setData]           = useState([])
  const [totaux, setTotaux]       = useState([])
  const [meta, setMeta]           = useState(null)
  const [loading, setLoading]     = useState(false)

  const charger = useCallback(() => {
    setLoading(true)
    comptabiliteApi.recettes({ date_debut: dateDebut, date_fin: dateFin, source: source || undefined, search: search || undefined, per_page: 50 })
      .then(r => {
        setData(r.data.data.data ?? [])
        setMeta(r.data.data)
        setTotaux(r.data.totaux ?? [])
      })
      .catch(() => showToast('Erreur chargement recettes', 'error'))
      .finally(() => setLoading(false))
  }, [dateDebut, dateFin, source, search])

  useEffect(() => { charger() }, [charger])

  const totalGlobal = totaux.reduce((s, t) => s + parseFloat(t.total || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.gray800, margin: 0 }}>
        Recettes diverses
      </h2>

      {/* Totaux par source */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12 }}>
        <div style={{
          background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
          padding: '16px 20px', borderLeft: `4px solid ${colors.bleu}`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 28 }}>💰</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase' }}>Total période</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: colors.bleu }}>{fmt(totalGlobal)}</div>
          </div>
        </div>
        {totaux.map(t => {
          const s = SOURCE_LABELS[t.source] || { label: t.source, icon: '💵', color: colors.gray600 }
          return (
            <div key={t.source} style={{
              background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
              padding: '16px 20px', borderLeft: `4px solid ${s.color}`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{fmt(t.total)}</div>
                <div style={{ fontSize: 11, color: colors.gray400 }}>{t.nb_recettes} transaction(s)</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filtres */}
      <div style={{
        background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm,
        padding: '14px 18px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginBottom: 4 }}>Du</div>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} style={{
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            padding: '7px 10px', fontSize: 13, outline: 'none', color: colors.gray800,
          }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginBottom: 4 }}>Au</div>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} style={{
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            padding: '7px 10px', fontSize: 13, outline: 'none', color: colors.gray800,
          }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginBottom: 4 }}>Source</div>
          <select value={source} onChange={e => setSource(e.target.value)} style={{
            border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
            padding: '7px 12px', fontSize: 13, outline: 'none', background: colors.white, color: colors.gray800,
          }}>
            <option value="">Toutes</option>
            <option value="materiel_medical">Matériel Médical</option>
            <option value="pharmacie">Pharmacie</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: colors.gray500, marginBottom: 4 }}>Rechercher</div>
          <input
            placeholder="Client, référence, libellé..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: `1.5px solid ${colors.gray300}`, borderRadius: radius.sm,
              padding: '7px 10px', fontSize: 13, outline: 'none', color: colors.gray800, minWidth: 220,
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: colors.white, borderRadius: radius.md, boxShadow: shadows.sm, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: colors.gray50, borderBottom: `1px solid ${colors.gray200}` }}>
              {['Date', 'Source', 'Libellé', 'Client', 'Référence', 'Type', 'Montant'].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  fontWeight: 700, color: colors.gray600, fontSize: 11, textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: colors.gray400 }}>Chargement...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: colors.gray400 }}>Aucune recette sur cette période</td></tr>
            ) : data.map(r => {
              const s = SOURCE_LABELS[r.source] || { label: r.source, icon: '💵', color: colors.gray600 }
              return (
                <tr key={r.id} style={{ borderBottom: `1px solid ${colors.gray100}` }}>
                  <td style={{ padding: '10px 14px', color: colors.gray700 }}>{fmtDate(r.date_recette)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span>{s.icon}</span>
                      <span style={{ color: s.color, fontWeight: 600, fontSize: 12 }}>{s.label}</span>
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: colors.gray800, maxWidth: 280 }}>
                    <div style={{ fontSize: 12 }}>{r.libelle}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: colors.gray600 }}>{r.client_nom || '-'}</td>
                  <td style={{ padding: '10px 14px', color: colors.gray500, fontSize: 12 }}>{r.reference || '-'}</td>
                  <td style={{ padding: '10px 14px' }}><TypeBadge type={r.type_paiement} /></td>
                  <td style={{ padding: '10px 14px', fontWeight: 800, color: '#16a34a', textAlign: 'right' }}>
                    {fmt(r.montant)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr style={{ background: colors.gray50, borderTop: `2px solid ${colors.gray200}` }}>
                <td colSpan={6} style={{ padding: '10px 14px', fontWeight: 700, color: colors.gray700 }}>
                  Total ({meta?.total ?? data.length} recette{(meta?.total ?? data.length) > 1 ? 's' : ''})
                </td>
                <td style={{ padding: '10px 14px', fontWeight: 800, color: colors.bleu, textAlign: 'right', fontSize: 15 }}>
                  {fmt(totalGlobal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
