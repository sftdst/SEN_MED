import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { colors } from '../../theme'
import { useAuth } from '../../context/AuthContext'

// ── Menu items avec permissions requises ────────────────────────────────────
const navItemsDef = [
  {
    group: 'ACCUEIL',
    icon: '⊞',
    items: [
      { to: '/', label: 'Tableau de bord', permission: 'dashboard' },
      { to: '/patients', label: 'Patients', permission: 'patients' },
      { to: '/visites', label: 'Visites', permission: 'visites' },
      { to: '/salle-attente', label: "Salle d'attente", permission: 'salle-attente' },
      { to: '/hospitalisation', label: 'Hospitalisation', permission: 'hospitalisation' },
      { to: '/transferts', label: 'Transferts', permission: 'transferts' },
    ],
  },
  {
    group: 'ESPACE MÉDECIN',
    icon: '👨‍⚕️',
    items: [
      { to: '/espace-medecin', label: 'Tableau de bord', permission: 'espace-medecin' },
    ],
  },
  {
    group: 'GESTION RDV',
    icon: '📅',
    items: [
      { to: '/rendezvous', label: 'Gestion des RDV', permission: 'rendezvous' },
    ],
  },
  {
    group: 'SOINS INFIRMIERS',
    icon: '🩺',
    items: [
      { to: '/dossier-soins', label: 'Dossier de Soins Infirmiers', permission: 'dossier-soins' },
    ],
  },
  {
    group: 'GESTION PHARMACEUTIQUE',
    icon: '💊',
    items: [
      { to: '/pharmacie', label: 'Pharmacie', permission: 'pharmacie' },
    ],
  },
  {
    group: 'COMPTABILITÉ',
    icon: '💰',
    items: [
      { to: '/comptabilite', label: 'Comptabilité', permission: 'comptabilite' },
      { to: '/tarification', label: 'Tarification', permission: 'tarification' },
    ],
  },
  {
    group: 'RESSOURCES HUMAINES',
    icon: '👥',
    items: [
      { to: '/personnels', label: 'Gestion personnel', permission: 'personnels' },
      { to: '/ressources-humaines/conges', label: 'Gestion congés', permission: 'conges' },
      { to: '/ressources-humaines/absences', label: 'Absences & retards', permission: 'absences-retards' },
      { to: '/ressources-humaines/contrats', label: 'Gestion contrats', permission: 'contrats' },
    ],
  },
  {
    group: 'CONFIGURATION',
    icon: '⚙️',
    items: [
      { to: '/config-systeme', label: 'Configuration système', permission: 'config-systeme' },
      { to: '/config-sanitaire', label: 'Config. sanitaire', permission: 'config-sanitaire' },
      { to: '/formulaires', label: 'Formulaires', permission: 'formulaires' },
      { to: '/config-profils-droits', label: 'Profil et droits', permission: 'profil-droits' },
    ],
  },
  {
    group: 'LABORATOIRE',
    icon: '🧪',
    items: [
      { to: '/laboratoire', label: 'Laboratoire', permission: 'laboratoire' },
    ],
  },
  {
    group: 'ADMINISTRATION',
    icon: '🏢',
    items: [
      { to: '/departements', label: 'Départements', permission: 'departements' },
      { to: '/hopitaux', label: 'Hôpitaux', permission: 'hopitaux' },
      { to: '/partenaires', label: 'Partenaires', permission: 'partenaires' },
    ],
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
                        padding: '8px 20px 10px 48px',
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
  const { hasPermission } = useAuth()
  const W = collapsed ? 68 : 240

  // Filter items based on user permissions
  const filteredNavItems = navItemsDef
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        // If no permission required, always show
        if (!item.permission) return true
        // Check permission
        return hasPermission(item.permission)
      }),
    }))
    .filter(group => group.items.length > 0)

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
        {filteredNavItems.map((item, idx) => (
          <NavItem key={idx} item={item} collapsed={collapsed} />
        ))}
      </nav>

    </aside>
  )
}
