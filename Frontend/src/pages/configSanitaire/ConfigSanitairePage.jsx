import { useState } from 'react'
import { colors, radius, shadows, spacing } from '../../theme'

// ── Données mock ──────────────────────────────────────────────────────────────
const mockData = {
  examen_clinique: [
    { id: 1, type: 'Consultation générale',    description: 'Examen clinique général',       status: 'Actif' },
    { id: 2, type: 'Consultation spécialisée', description: 'Examen clinique spécialisé',    status: 'Actif' },
    { id: 3, type: 'Urgence',                  description: 'Examen clinique en urgence',    status: 'Actif' },
  ],
  signe_fonctionnel: [
    { id: 1, nom: 'Douleur',  description: 'Évaluation de la douleur',       type: 'Symptôme' },
    { id: 2, nom: 'Fièvre',   description: 'Température corporelle élevée',  type: 'Symptôme' },
    { id: 3, nom: 'Toux',     description: 'Toux persistante',               type: 'Symptôme' },
    { id: 4, nom: 'Fatigue',  description: 'Fatigue générale',               type: 'Symptôme' },
  ],
  plan_soin: [
    { id: 1, nom: 'Soins post-opératoire', description: 'Plan de soins post-opératoire',              duree: '7 jours'  },
    { id: 2, nom: 'Traitement chronique',  description: 'Plan de soins pour maladie chronique',       duree: '30 jours' },
    { id: 3, nom: 'Soins quotidiens',      description: 'Plan de soins quotidien',                    duree: 'Continu'  },
  ],
  imagerie: [
    { id: 1, type: 'Radiographie', description: 'Examen radiographique',                    disponible: true  },
    { id: 2, type: 'Échographie',  description: 'Examen échographique',                     disponible: true  },
    { id: 3, type: 'Scanner',      description: 'Tomographie scannée',                      disponible: true  },
    { id: 4, type: 'IRM',          description: 'Imagerie par résonance magnétique',        disponible: false },
  ],
  laboratoire: [
    { id: 1, type: 'Analyse sanguine', description: 'Hématologie et biochimie',         tarif: 15000 },
    { id: 2, type: 'Analyse urine',    description: 'Examen cytobactériologique',        tarif: 8000  },
    { id: 3, type: 'Analyse selles',   description: 'Parasitologie',                    tarif: 10000 },
    { id: 4, type: 'Analyse spéciale', description: 'Sérologie et immunologie',         tarif: 25000 },
  ],
  examen_specialise: [
    { id: 1, type: 'Cardiologie',    description: 'Examen cardiologique',    tarif: 35000 },
    { id: 2, type: 'Neurologie',     description: 'Examen neurologique',     tarif: 40000 },
    { id: 3, type: 'Dermatologie',   description: 'Examen dermatologique',   tarif: 20000 },
    { id: 4, type: 'Ophtalmologie',  description: 'Examen ophtalmologique',  tarif: 25000 },
  ],
  procedure_infirmiere: [
    { id: 1, nom: 'Injection',    description: 'Injection intramusculaire / IV / SC',  categorie: 'Soin curatif'  },
    { id: 2, nom: 'Pansement',    description: 'Pansement simple et complexe',         categorie: 'Soin curatif'  },
    { id: 3, nom: 'Perfusion',    description: 'Pose de perfusion',                   categorie: 'Soin curatif'  },
    { id: 4, nom: 'Surveillance', description: 'Surveillance des constantes',         categorie: 'Soin préventif' },
  ],
}

// ── Onglets ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'examen_clinique',      label: 'Examen clinique',      icon: '🩺' },
  { key: 'signe_fonctionnel',    label: 'Signe fonctionnel',    icon: '🔍' },
  { key: 'plan_soin',            label: 'Plan de soin',         icon: '📋' },
  { key: 'imagerie',             label: 'Imagerie',             icon: '🖼️' },
  { key: 'laboratoire',          label: 'Laboratoire',          icon: '🧪' },
  { key: 'examen_specialise',    label: 'Examen spécialisé',    icon: '🔬' },
  { key: 'procedure_infirmiere', label: 'Procédure infirmière', icon: '💉' },
]

// ── Helpers composants ────────────────────────────────────────────────────────
function Badge({ children, variant = 'default' }) {
  const MAP = {
    success: { bg: colors.successBg, color: colors.success },
    danger:  { bg: colors.dangerBg,  color: colors.danger  },
    warning: { bg: colors.warningBg, color: colors.warning },
    info:    { bg: colors.infoBg,    color: colors.info    },
    orange:  { bg: '#fff3ee',        color: colors.orange  },
    default: { bg: colors.gray100,   color: colors.gray700 },
  }
  const s = MAP[variant] || MAP.default
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: radius.full,
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {children}
    </span>
  )
}

function ActionBtn({ label, color, bgColor, onClick }) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: '4px 10px', borderRadius: radius.sm,
        border: `1.5px solid ${color}`,
        background: h ? color : bgColor,
        color: h ? '#fff' : color,
        fontSize: 10, fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.13s', whiteSpace: 'nowrap',
      }}
    >{label}</button>
  )
}

// ── En-tête section ───────────────────────────────────────────────────────────
function SectionHead({ icon, title, count, onAdd }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: radius.md,
          background: `linear-gradient(135deg, ${colors.bleu}, #003f7a)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, boxShadow: `0 4px 10px ${colors.bleu}30`,
        }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: colors.gray900 }}>{title}</div>
          <div style={{ fontSize: 11, color: colors.gray500, marginTop: 1 }}>
            <strong style={{ color: colors.bleu }}>{count}</strong> élément{count > 1 ? 's' : ''} configuré{count > 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <button
        onClick={onAdd}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: radius.sm,
          border: 'none', background: colors.orange,
          color: '#fff', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.15s',
          boxShadow: `0 3px 10px ${colors.orange}40`,
        }}
        onMouseEnter={e => e.currentTarget.style.background = colors.orangeDark}
        onMouseLeave={e => e.currentTarget.style.background = colors.orange}
      >
        <span style={{ fontSize: 14 }}>＋</span> Nouveau
      </button>
    </div>
  )
}

// ── Tableau générique ─────────────────────────────────────────────────────────
function DataTable({ cols, rows }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: radius.md, border: `1px solid ${colors.gray200}` }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} style={{
                padding: '11px 14px',
                background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
                color: '#fff', fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                textAlign: c.align || 'left',
                whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} style={{
                padding: '30px', textAlign: 'center',
                color: colors.gray500, fontSize: 13, fontStyle: 'italic',
              }}>Aucune donnée disponible</td>
            </tr>
          ) : rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              style={{
                background: i % 2 === 0 ? '#fff' : colors.gray50,
                borderBottom: `1px solid ${colors.gray100}`,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${colors.bleu}06`}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : colors.gray50}
            >
              {cols.map((c, j) => (
                <td key={j} style={{
                  padding: '12px 14px', fontSize: 12,
                  color: colors.gray800, verticalAlign: 'middle',
                  textAlign: c.align || 'left',
                }}>
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ConfigSanitairePage() {
  const [activeTab, setActiveTab] = useState('examen_clinique')

  const tab = TABS.find(t => t.key === activeTab)
  const data = mockData[activeTab] || []

  const statsTotal = TABS.reduce((acc, t) => acc + (mockData[t.key]?.length || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── En-tête ── */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
        borderRadius: radius.lg, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: shadows.md, flexWrap: 'wrap', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: radius.md,
            background: colors.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: `0 4px 12px ${colors.orange}50`,
          }}>⚕️</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>
              Configuration Sanitaire
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 3 }}>
              Paramétrage des référentiels médicaux · {statsTotal} éléments configurés
            </div>
          </div>
        </div>

        {/* Compteurs par section */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Catégories', val: TABS.length,   color: 'rgba(255,255,255,0.8)', bg: 'rgba(255,255,255,0.1)',  border: 'rgba(255,255,255,0.2)' },
            { label: 'Éléments',   val: statsTotal,    color: colors.orange,           bg: `${colors.orange}20`,    border: `${colors.orange}40`    },
            { label: 'Actifs',     val: statsTotal,    color: '#4caf50',               bg: 'rgba(76,175,80,0.15)',  border: 'rgba(76,175,80,0.3)'   },
          ].map(s => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '7px 16px',
              background: s.bg, borderRadius: radius.md, border: `1px solid ${s.border}`,
            }}>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Onglets ── */}
      <div style={{
        background: '#fff', borderRadius: radius.lg,
        boxShadow: shadows.sm, padding: '10px 12px',
        display: 'flex', gap: 6, overflowX: 'auto',
        border: `1px solid ${colors.gray200}`,
      }}>
        {TABS.map(t => {
          const active = t.key === activeTab
          const count  = mockData[t.key]?.length || 0
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: radius.sm,
                border: active ? `1.5px solid ${colors.orange}` : '1.5px solid transparent',
                background: active
                  ? `linear-gradient(135deg, ${colors.orange}15, ${colors.orange}08)`
                  : colors.gray100,
                color: active ? colors.orange : colors.gray600,
                fontSize: 12, fontWeight: active ? 700 : 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                boxShadow: active ? `0 2px 8px ${colors.orange}25` : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = colors.gray200 }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = colors.gray100 }}
            >
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              <span>{t.label}</span>
              <span style={{
                padding: '1px 7px', borderRadius: radius.full, fontSize: 9, fontWeight: 700,
                background: active ? colors.orange : colors.gray300,
                color: active ? '#fff' : colors.gray600,
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Contenu ── */}
      <div style={{
        background: '#fff', borderRadius: radius.lg,
        boxShadow: shadows.sm, padding: '20px 24px',
        border: `1px solid ${colors.gray200}`,
      }}>
        <SectionHead
          icon={tab?.icon}
          title={tab?.label}
          count={data.length}
          onAdd={() => {}}
        />

        <TabContent tabKey={activeTab} data={data} />
      </div>
    </div>
  )
}

// ── Contenu par onglet ────────────────────────────────────────────────────────
function TabContent({ tabKey, data }) {
  const ACTIONS = (
    <div style={{ display: 'flex', gap: 5 }}>
      <ActionBtn label="✏️ Modifier" color={colors.bleu}    bgColor={`${colors.bleu}0d`}    />
      <ActionBtn label="🗑 Suppr."   color={colors.danger}  bgColor={colors.dangerBg}        />
    </div>
  )

  switch (tabKey) {

    case 'examen_clinique':
      return (
        <DataTable
          cols={[
            { key: 'id',          label: '#',         align: 'center', render: r => <span style={{ color: colors.gray500, fontSize: 11 }}>{r.id}</span> },
            { key: 'type',        label: 'Type',       render: r => <span style={{ fontWeight: 700, color: colors.bleu }}>{r.type}</span> },
            { key: 'description', label: 'Description' },
            { key: 'status',      label: 'Statut',     render: r => <Badge variant="success">{r.status}</Badge> },
            { key: '_',           label: 'Actions',    align: 'right', render: () => ACTIONS },
          ]}
          rows={data}
        />
      )

    case 'signe_fonctionnel':
      return (
        <DataTable
          cols={[
            { key: 'id',          label: '#',        align: 'center', render: r => <span style={{ color: colors.gray500, fontSize: 11 }}>{r.id}</span> },
            { key: 'nom',         label: 'Nom',       render: r => <span style={{ fontWeight: 700, color: colors.bleu }}>{r.nom}</span> },
            { key: 'description', label: 'Description' },
            { key: 'type',        label: 'Type',      render: r => <Badge variant="warning">{r.type}</Badge> },
            { key: '_',           label: 'Actions',   align: 'right', render: () => ACTIONS },
          ]}
          rows={data}
        />
      )

    case 'plan_soin':
      return (
        <DataTable
          cols={[
            { key: 'id',          label: '#',        align: 'center', render: r => <span style={{ color: colors.gray500, fontSize: 11 }}>{r.id}</span> },
            { key: 'nom',         label: 'Nom',       render: r => <span style={{ fontWeight: 700, color: colors.bleu }}>{r.nom}</span> },
            { key: 'description', label: 'Description' },
            { key: 'duree',       label: 'Durée',     render: r => (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: radius.full,
                background: colors.infoBg, color: colors.info,
                fontSize: 10, fontWeight: 700,
              }}>⏱ {r.duree}</span>
            )},
            { key: '_', label: 'Actions', align: 'right', render: () => ACTIONS },
          ]}
          rows={data}
        />
      )

    case 'imagerie':
      return (
        <DataTable
          cols={[
            { key: 'id',          label: '#',             align: 'center', render: r => <span style={{ color: colors.gray500, fontSize: 11 }}>{r.id}</span> },
            { key: 'type',        label: 'Type',           render: r => <span style={{ fontWeight: 700, color: colors.bleu }}>{r.type}</span> },
            { key: 'description', label: 'Description' },
            { key: 'disponible',  label: 'Disponibilité',  render: r => (
              <Badge variant={r.disponible ? 'success' : 'danger'}>
                {r.disponible ? 'Disponible' : 'Indisponible'}
              </Badge>
            )},
            { key: '_', label: 'Actions', align: 'right', render: () => ACTIONS },
          ]}
          rows={data}
        />
      )

    case 'laboratoire':
      return (
        <DataTable
          cols={[
            { key: 'id',          label: '#',           align: 'center', render: r => <span style={{ color: colors.gray500, fontSize: 11 }}>{r.id}</span> },
            { key: 'type',        label: 'Type',         render: r => <span style={{ fontWeight: 700, color: colors.bleu }}>{r.type}</span> },
            { key: 'description', label: 'Description' },
            { key: 'tarif',       label: 'Tarif (FCFA)', align: 'right', render: r => (
              <span style={{ fontWeight: 700, color: colors.orange }}>
                {r.tarif.toLocaleString('fr-FR')} F
              </span>
            )},
            { key: '_', label: 'Actions', align: 'right', render: () => ACTIONS },
          ]}
          rows={data}
        />
      )

    case 'examen_specialise':
      return (
        <DataTable
          cols={[
            { key: 'id',          label: '#',           align: 'center', render: r => <span style={{ color: colors.gray500, fontSize: 11 }}>{r.id}</span> },
            { key: 'type',        label: 'Spécialité',   render: r => <span style={{ fontWeight: 700, color: colors.bleu }}>{r.type}</span> },
            { key: 'description', label: 'Description' },
            { key: 'tarif',       label: 'Tarif (FCFA)', align: 'right', render: r => (
              <span style={{ fontWeight: 700, color: colors.orange }}>
                {r.tarif.toLocaleString('fr-FR')} F
              </span>
            )},
            { key: '_', label: 'Actions', align: 'right', render: () => ACTIONS },
          ]}
          rows={data}
        />
      )

    case 'procedure_infirmiere':
      return (
        <DataTable
          cols={[
            { key: 'id',          label: '#',          align: 'center', render: r => <span style={{ color: colors.gray500, fontSize: 11 }}>{r.id}</span> },
            { key: 'nom',         label: 'Procédure',   render: r => <span style={{ fontWeight: 700, color: colors.bleu }}>{r.nom}</span> },
            { key: 'description', label: 'Description' },
            { key: 'categorie',   label: 'Catégorie',   render: r => <Badge variant="info">{r.categorie}</Badge> },
            { key: '_', label: 'Actions', align: 'right', render: () => ACTIONS },
          ]}
          rows={data}
        />
      )

    default:
      return null
  }
}
