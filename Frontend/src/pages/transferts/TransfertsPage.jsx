import { useState, useEffect, useCallback } from 'react'
import { colors, shadows, radius, typography, spacing } from '../../theme'
import { transfertApi } from '../../api'
import TransfertModal from './TransfertModal'

// ── Toast léger ───────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null)
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }
  return { toast, showToast }
}

function Toast({ toast }) {
  if (!toast) return null
  const bg = toast.type === 'success' ? colors.success
           : toast.type === 'error'   ? colors.danger
           : colors.warning
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: '#fff',
      padding: '12px 20px', borderRadius: radius.md,
      boxShadow: shadows.lg, ...typography.body, maxWidth: 360,
    }}>
      {toast.msg}
    </div>
  )
}

// ── Badge statut ──────────────────────────────────────────────────────────────
const STATUT_STYLE = {
  EN_COURS: { bg: colors.warningBg,  color: colors.warning,  label: 'En cours' },
  VALIDE:   { bg: colors.successBg,  color: colors.success,  label: 'Validé'   },
  ANNULE:   { bg: colors.dangerBg,   color: colors.danger,   label: 'Annulé'   },
}

const TYPE_STYLE = {
  INTERNE: { bg: colors.infoBg,     color: colors.info,    label: '🏥 Interne' },
  EXTERNE: { bg: colors.orangeLight, color: colors.orange,  label: '🌍 Externe' },
}

function Badge({ value, map }) {
  const s = map[value] ?? { bg: colors.gray100, color: colors.gray600, label: value }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: radius.full,
      ...typography.label, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// ── Champ formulaire ──────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ ...typography.label, color: colors.gray700 }}>{label}</label>
      {children}
      {error && <span style={{ ...typography.bodySm, color: colors.danger }}>{error}</span>}
    </div>
  )
}

const inputStyle = (err) => ({
  padding: '8px 12px', borderRadius: radius.sm,
  border: `1px solid ${err ? colors.danger : colors.gray300}`,
  ...typography.input, color: colors.gray900,
  outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
})

// ── Modal Détail ──────────────────────────────────────────────────────────────
function DetailModal({ transfert, onClose, onAction, showToast }) {
  const [loading, setLoading] = useState(false)

  const action = async (fn, msg) => {
    setLoading(true)
    try {
      await fn()
      showToast(msg, 'success')
      onAction()
      onClose()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Erreur.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const t = transfert
  const isInterne = t.type_transfert === 'INTERNE'

  const Row = ({ label, value }) => value ? (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <span style={{ ...typography.label, color: colors.gray500, minWidth: 160 }}>{label}</span>
      <span style={{ ...typography.body, color: colors.gray900 }}>{value}</span>
    </div>
  ) : null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: radius.lg,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: shadows.xl,
      }}>
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...typography.h2, color: colors.bleu }}>Détail du transfert</span>
            <Badge value={t.statut}        map={STATUT_STYLE} />
            <Badge value={t.type_transfert} map={TYPE_STYLE}   />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: colors.gray500 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <Row label="Patient"        value={t.patient?.patient_name} />
          <Row label="Code patient"   value={t.patient?.patient_id} />
          <Row label="Date transfert" value={t.date_transfert ? new Date(t.date_transfert).toLocaleString('fr-FR') : '—'} />
          <Row label="Motif"          value={t.motif} />

          {isInterne && (<>
            <div style={{ margin: '14px 0 6px', ...typography.h3, color: colors.bleu }}>Changements internes</div>
            <Row label="Ancien médecin"   value={t.ancien_medecin?.staff_name} />
            <Row label="Nouveau médecin"  value={t.nouveau_medecin?.staff_name} />
            <Row label="Ancien service"   value={t.ancien_service?.short_name} />
            <Row label="Nouveau service"  value={t.nouveau_service?.short_name} />
            <Row label="Ancienne chambre" value={t.ancienne_chambre ? `${t.ancienne_chambre.nom} (${t.ancienne_chambre.code_chambre})` : null} />
            <Row label="Nouvelle chambre" value={t.nouvelle_chambre ? `${t.nouvelle_chambre.nom} (${t.nouvelle_chambre.code_chambre})` : null} />
          </>)}

          {!isInterne && (<>
            <div style={{ margin: '14px 0 6px', ...typography.h3, color: colors.bleu }}>Destination externe</div>
            <Row label="Structure"          value={t.structure_destination} />
            <Row label="Médecin référent"   value={t.medecin_destination} />
            <Row label="Commentaire"        value={t.commentaire} />
          </>)}
        </div>

        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${colors.gray200}`,
          display: 'flex', justifyContent: 'space-between', gap: 10,
        }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: radius.sm, cursor: 'pointer',
            background: colors.gray100, border: `1px solid ${colors.gray300}`,
            ...typography.button, color: colors.gray700,
          }}>
            Fermer
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {t.statut === 'EN_COURS' && (
              <button
                onClick={() => action(() => transfertApi.annuler(t.id_transfert), 'Transfert annulé.')}
                disabled={loading}
                style={{
                  padding: '8px 18px', borderRadius: radius.sm, cursor: 'pointer',
                  background: colors.dangerBg, border: `1px solid ${colors.danger}`,
                  ...typography.button, color: colors.danger,
                }}
              >
                ✕ Annuler
              </button>
            )}
            {t.statut === 'EN_COURS' && (
              <button
                onClick={() => action(() => transfertApi.valider(t.id_transfert), 'Transfert validé avec succès.')}
                disabled={loading}
                style={{
                  padding: '8px 18px', borderRadius: radius.sm, cursor: 'pointer',
                  background: colors.success, border: 'none',
                  ...typography.button, color: '#fff',
                }}
              >
                ✔ Valider
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function TransfertsPage() {
  const { toast, showToast } = useToast()
  const [transferts, setTransferts] = useState([])
  const [pagination, setPagination]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [showForm, setShowForm]       = useState(false)
  const [selected, setSelected]       = useState(null)
  const [stats, setStats]             = useState(null)
  const [filters, setFilters]         = useState({ type_transfert: '', statut: '', search: '' })
  const [page, setPage]               = useState(1)

  const loadTransferts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15, ...filters }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const r = await transfertApi.liste(params)
      const d = r.data?.data
      setTransferts(d?.data ?? [])
      setPagination(d)
    } catch {
      showToast('Erreur lors du chargement des transferts.', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  const loadStats = async () => {
    try {
      const r = await transfertApi.stats()
      setStats(r.data?.data)
    } catch {}
  }

  useEffect(() => { loadTransferts() }, [loadTransferts])
  useEffect(() => { loadStats() }, [])

  const handleSaved = () => { loadTransferts(); loadStats() }

  const StatCard = ({ label, value, color }) => (
    <div style={{
      background: '#fff', borderRadius: radius.md,
      padding: '14px 20px', boxShadow: shadows.sm,
      border: `1px solid ${colors.gray200}`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ ...typography.label, color: colors.gray500 }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 700, color: color ?? colors.bleu }}>{value ?? '—'}</span>
    </div>
  )

  return (
    <div style={{ padding: spacing.xl, background: colors.gray50, minHeight: '100vh' }}>
      <Toast toast={toast} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl }}>
        <div>
          <h1 style={{ ...typography.h1, color: colors.bleu, margin: 0 }}>🔄 Transferts de Patients</h1>
          <p style={{ ...typography.body, color: colors.gray500, margin: '4px 0 0' }}>
            Gestion des transferts internes et externes
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px', borderRadius: radius.sm,
            background: colors.bleu, border: 'none', cursor: 'pointer',
            ...typography.button, color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          + Nouveau transfert
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginBottom: spacing.xl }}>
          <StatCard label="Total"    value={stats.total}    />
          <StatCard label="En cours" value={stats.enCours}  color={colors.warning} />
          <StatCard label="Validés"  value={stats.valides}  color={colors.success} />
          <StatCard label="Annulés"  value={stats.annules}  color={colors.danger}  />
          <StatCard label="Internes" value={stats.internes} color={colors.info}    />
          <StatCard label="Externes" value={stats.externes} color={colors.orange}  />
        </div>
      )}

      {/* Filtres */}
      <div style={{
        background: '#fff', borderRadius: radius.md, padding: '14px 20px',
        boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
        display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: spacing.lg,
        alignItems: 'flex-end',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ ...typography.label, color: colors.gray600, display: 'block', marginBottom: 4 }}>Recherche patient</label>
          <input
            style={inputStyle()}
            placeholder="Nom ou code patient..."
            value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
          />
        </div>
        <div>
          <label style={{ ...typography.label, color: colors.gray600, display: 'block', marginBottom: 4 }}>Type</label>
          <select
            style={{ ...inputStyle(), width: 160 }}
            value={filters.type_transfert}
            onChange={e => { setFilters(f => ({ ...f, type_transfert: e.target.value })); setPage(1) }}
          >
            <option value="">Tous les types</option>
            <option value="INTERNE">Interne</option>
            <option value="EXTERNE">Externe</option>
          </select>
        </div>
        <div>
          <label style={{ ...typography.label, color: colors.gray600, display: 'block', marginBottom: 4 }}>Statut</label>
          <select
            style={{ ...inputStyle(), width: 160 }}
            value={filters.statut}
            onChange={e => { setFilters(f => ({ ...f, statut: e.target.value })); setPage(1) }}
          >
            <option value="">Tous les statuts</option>
            <option value="EN_COURS">En cours</option>
            <option value="VALIDE">Validés</option>
            <option value="ANNULE">Annulés</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div style={{
        background: '#fff', borderRadius: radius.md,
        boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: colors.gray50, borderBottom: `2px solid ${colors.gray200}` }}>
              {['Patient', 'Type', 'Date', 'Motif', 'Détail', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  ...typography.label, color: colors.gray600,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: colors.gray400, ...typography.body }}>
                  Chargement...
                </td>
              </tr>
            )}
            {!loading && transferts.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: colors.gray400, ...typography.body }}>
                  Aucun transfert trouvé.
                </td>
              </tr>
            )}
            {!loading && transferts.map(t => (
              <tr
                key={t.id_transfert}
                style={{ borderBottom: `1px solid ${colors.gray100}`, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = colors.gray50}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ ...typography.body, fontWeight: 600, color: colors.gray900 }}>
                    {t.patient?.patient_name ?? '—'}
                  </div>
                  <div style={{ ...typography.bodySm, color: colors.gray500 }}>{t.patient?.patient_id}</div>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <Badge value={t.type_transfert} map={TYPE_STYLE} />
                </td>
                <td style={{ padding: '10px 14px', ...typography.body, color: colors.gray700 }}>
                  {new Date(t.date_transfert).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '10px 14px', ...typography.bodySm, color: colors.gray600, maxWidth: 200 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.motif}
                  </div>
                </td>
                <td style={{ padding: '10px 14px', ...typography.bodySm, color: colors.gray600 }}>
                  {t.type_transfert === 'INTERNE'
                    ? t.nouveau_medecin?.staff_name ?? t.nouveau_service?.short_name ?? '—'
                    : t.structure_destination ?? '—'}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <Badge value={t.statut} map={STATUT_STYLE} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <button
                    onClick={() => setSelected(t)}
                    style={{
                      padding: '5px 12px', borderRadius: radius.sm, cursor: 'pointer',
                      background: colors.infoBg, border: `1px solid ${colors.info}`,
                      ...typography.button, color: colors.info,
                    }}
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div style={{
            padding: '12px 20px', borderTop: `1px solid ${colors.gray100}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            ...typography.bodySm, color: colors.gray500,
          }}>
            <span>
              {pagination.from}–{pagination.to} sur {pagination.total} transferts
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '4px 10px', borderRadius: radius.sm, cursor: 'pointer',
                    background: p === page ? colors.bleu : colors.gray100,
                    border: `1px solid ${p === page ? colors.bleu : colors.gray300}`,
                    ...typography.button,
                    color: p === page ? '#fff' : colors.gray700,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <TransfertModal
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
      {selected && (
        <DetailModal
          transfert={selected}
          onClose={() => setSelected(null)}
          onAction={handleSaved}
          showToast={showToast}
        />
      )}
    </div>
  )
}
