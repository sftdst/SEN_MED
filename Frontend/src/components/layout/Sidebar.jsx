import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { colors } from '../../theme'

const navItems = [
  {
    group: 'ACCUEIL',
    icon: '⊞',
    items: [
      { to: '/', label: 'Tableau de bord' },
      { to: '/patients', label: 'Patients' },
      { to: '/visites', label: 'Visites' },
      { to: '/salle-attente', label: "Salle d'attente" },
      { to: '/hospitalisation', label: 'Hospitalisation' },
      { to: '/transferts',     label: 'Transferts' },
      { to: '/planning',        label: 'Espace médical' },
      { to: '/rendezvous',      label: 'Gestion des RDV' },
    ]
  },
  {
    group: 'ESPACE MÉDECIN',
    icon: '👨‍⚕️',
    items: [
      { to: '/espace-medecin', label: 'Tableau de bord' },
    ]
  },
  {
    group: 'GESTION PHARMACEUTIQUE',
    icon: '💊',
    items: [
      { to: '/pharmacie', label: 'Pharmacie' },
    ]
  },
  {
    group: 'COMPTABILITÉ',
    icon: '💰',
    items: [
      { to: '/comptabilite', label: 'Comptabilité' },
    ]
  },
  {
    group: 'ADMINISTRATION',
    icon: '🏢',
    items: [
      { to: '/personnels', label: 'Utilisateurs' },
      { to: '/departements', label: 'Départements' },
      { to: '/type-services', label: 'Types de service' },
      { to: '/services', label: 'Services' },
      { to: '/hopitaux', label: 'Hôpitaux' },
      { to: '/partenaires', label: 'Partenaires' },
    ]
  },
  {
    group: 'CONFIGURATION',
    icon: '⚙️',
    items: [
      { to: '/config-systeme',   label: 'Configuration système' },
      { to: '/config-sanitaire', label: 'Config. sanitaire'     },
      { to: '/tarification',     label: 'Tarification'          },
      { to: '/laboratoire',      label: 'Laboratoire'           },
    ]
  },
]

function NavItem({ item, collapsed }) {
  const [expanded, setExpanded] = useState(item.group === 'ACCUEIL')

  if (item.group) {
    if (collapsed) {
      return (
        <div style={{ padding: '8px', display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: 18 }}>{item.icon}</span>
        </div>
      )
    }
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: '11px 20px',
            margin: '2px 8px', borderRadius: 8,
            background: expanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
            border: 'none', cursor: 'pointer',
            color: colors.white,
            fontWeight: 700, fontSize: 13,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          <span style={{ flex: 1, textAlign: 'left' }}>{item.group}</span>
          <span style={{ 
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s', fontSize: 10, color: colors.white 
          }}>▼</span>
        </button>
        {expanded && (
          <div style={{ 
            display: 'block',
            marginLeft: 16, paddingLeft: 12, 
            borderLeft: `2px solid ${colors.orange}`,
          }}>
            {item.items?.map((sub, i) => (
              sub.children ? (
                <div key={i}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 20px 10px 28px',
                    margin: '2px 4px', borderRadius: 6,
                    color: colors.white,
                    fontWeight: 600, fontSize: 13,
                  }}>
                    <span>{sub.label}</span>
                  </div>
                  {sub.children.map((child, j) => (
                    <NavLink
                      key={j}
                      to={child.to}
                      style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 20px 8px 48px',
                        margin: '2px 4px', borderRadius: 6,
                        textDecoration: 'none',
                        color: colors.white,
                        background: isActive ? colors.orange : 'transparent',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 12,
                      })}
                    >
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : (
                <NavLink
                  key={i}
                  to={sub.to}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 20px 10px 28px',
                    margin: '2px 4px', borderRadius: 6,
                    textDecoration: 'none',
                    color: colors.white,
                    background: isActive ? colors.orange : 'transparent',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                  })}
                >
                  <span>{sub.label}</span>
                </NavLink>
              )
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 12,
        padding: collapsed ? '12px 0' : '11px 20px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        margin: '2px 8px', borderRadius: 8,
        textDecoration: 'none',
        color: colors.white,
        background: isActive ? colors.orange : 'transparent',
        fontWeight: 700, fontSize: 14,
      })}
    >
      <span style={{ fontSize: 18 }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar({ collapsed = false }) {
  const W = collapsed ? 68 : 240

  return (
    <aside style={{
      width: W, minWidth: W,
      background: colors.bleu, height: '100vh',
      position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden', zIndex: 100,
      boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
    }}>
      <div style={{
        padding: collapsed ? '20px 0' : '22px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, background: colors.orange,
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: colors.white, flexShrink: 0,
        }}>S</div>
        {!collapsed && (
          <div>
            <div style={{ color: colors.white, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>
              Sen<span style={{ color: colors.orange }}>Med</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>
              Soins Médicaux
            </div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {navItems.map((item, idx) => (
          <NavItem key={idx} item={item} collapsed={collapsed} />
        ))}
      </nav>

    </aside>
  )
}