import { useState } from 'react'
import { colors, radius, shadows } from '../../theme'

const MENU_ITEMS = [
  { key: 'accueil',       label: 'Tableau de bord', icon: '🏠' },
  { key: 'factures',      label: 'Factures',        icon: '📄' },
  { key: 'paiements',     label: 'Paiements',       icon: '💳' },
  { key: 'historique',    label: 'Historique paiement', icon: '📜' },
  { key: 'credits',       label: 'Crédit patient',   icon: '💸' },
  { key: 'rapports',      label: 'Rapports',        icon: '📊' },
  { key: 'avances',       label: 'Gestion avances', icon: '💵' },
  { key: 'partenaires',   label: 'Partenaire',      icon: '🤝' },
  { key: 'devis',         label: 'Devis',           icon: '📋' },
]

function PlaceholderTab({ item }) {
  return (
    <div style={{
      background: colors.white, borderRadius: radius.lg,
      padding: 48, textAlign: 'center',
      boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{item?.icon || '📌'}</div>
      <h3 style={{ margin: '0 0 8px', color: colors.gray700, fontSize: 18, fontWeight: 700 }}>
        {item?.label || 'Section'} - Coming Soon
      </h3>
      <p style={{ margin: 0, color: colors.gray500, fontSize: 13 }}>
        Cette fonctionnalité sera disponible bientôt.
      </p>
    </div>
  )
}

function AccueilTab() {
  const cards = [
    { label: 'Total factures',    val: '124',    icon: '📄', color: colors.bleu,    bg: colors.infoBg    },
    { label: 'Montant payé',     val: '2.5M F', icon: '✅', color: colors.success, bg: colors.successBg },
    { label: 'En attente',       val: '450K F',  icon: '⏳', color: colors.warning, bg: colors.warningBg },
    { label: 'Crédits patients', val: '180K F',  icon: '💳', color: colors.danger,  bg: colors.dangerBg  },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: colors.white, borderRadius: radius.md,
            padding: '20px 24px', boxShadow: shadows.sm,
            border: `1px solid ${colors.gray200}`,
            borderLeft: `4px solid ${c.color}`,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: radius.md,
              background: c.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: colors.gray500, fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color, lineHeight: 1.2 }}>{c.val}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        background: colors.white, borderRadius: radius.md, padding: 32,
        boxShadow: shadows.sm, border: `1px solid ${colors.gray200}`,
        textAlign: 'center', color: colors.gray500,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
          Naviguez dans le menu ci-dessus pour gérer la comptabilité.
        </p>
      </div>
    </div>
  )
}

export default function ComptabilitePage() {
  const [activeTab, setActiveTab] = useState('accueil')

  const activeItem = MENU_ITEMS.find(m => m.key === activeTab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header gradient */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bleu} 0%, #003f7a 100%)`,
        borderRadius: radius.lg, padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, boxShadow: shadows.md,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: colors.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>💰</div>
          <div>
            <h1 style={{ margin: 0, color: colors.white, fontSize: 20, fontWeight: 800 }}>
              Comptabilité
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {activeItem?.label ?? 'Gestion financière'}
            </p>
          </div>
        </div>
      </div>

      {/* Corps : menu horizontal + contenu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Menu horizontal */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          background: colors.bleu,
          borderRadius: radius.lg,
          padding: '12px 16px',
          boxShadow: shadows.md,
        }}>
          {MENU_ITEMS.map(item => {
            const active = activeTab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px',
                  borderRadius: 20,
                  border: 'none', cursor: 'pointer',
                  background: active ? colors.orange : 'rgba(255,255,255,0.1)',
                  color: colors.white,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Zone de contenu principale */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'accueil' && <AccueilTab />}
          {['factures','paiements','historique','credits','rapports','avances','partenaires','devis'].includes(activeTab) && (
            <PlaceholderTab item={MENU_ITEMS.find(m => m.key === activeTab)} />
          )}
        </div>
      </div>
    </div>
  )
}