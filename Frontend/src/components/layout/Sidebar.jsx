import { NavLink } from 'react-router-dom'
import { colors } from '../../theme'

const navItems = [
  { to: '/',               icon: '⊞',  label: 'Tableau de bord',  group: null },
  { group: 'ORGANISATION' },
  { to: '/hopitaux',       icon: '🏥', label: 'Hôpitaux'          },
  { to: '/departements',   icon: '🏢', label: 'Départements'      },
  { to: '/type-services',  icon: '📋', label: 'Types de service'  },
  { to: '/services',       icon: '⚕️', label: 'Services'          },
  { group: 'RESSOURCES HUMAINES' },
  { to: '/personnels',     icon: '👤', label: 'Personnel'         },
  { to: '/planning',       icon: '📅', label: 'Emplois du temps'  },
  { group: 'FINANCES & PARTENAIRES' },
  { to: '/partenaires',    icon: '🤝', label: 'Partenaires'       },
]

export default function Sidebar({ collapsed = false }) {
  const W = collapsed ? 68 : 240

  return (
    <aside style={{
      width: W, minWidth: W,
      background: colors.bleu,
      height: '100vh',
      position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      zIndex: 100,
      boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '22px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
      }}>
        <div style={{
          width: 36, height: 36,
          background: colors.orange,
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: colors.white,
          flexShrink: 0,
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

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {navItems.map((item, idx) => {
          if (item.group) {
            return !collapsed ? (
              <div key={idx} style={{
                padding: '12px 16px 4px',
                color: 'rgba(255,255,255,0.35)',
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>{item.group}</div>
            ) : <div key={idx} style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 12px' }} />
          }
          return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '12px 0' : '11px 20px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              margin: '2px 8px',
              borderRadius: 8,
              textDecoration: 'none',
              color: isActive ? colors.white : 'rgba(255,255,255,0.65)',
              background: isActive ? colors.orange : 'transparent',
              fontWeight: isActive ? 700 : 500,
              fontSize: 14,
              transition: 'all 0.15s ease',
              position: 'relative',
            })}
            onMouseEnter={e => {
              const link = e.currentTarget
              if (!link.classList.contains('active'))
                link.style.background = 'rgba(255,255,255,0.08)'
            }}
            onMouseLeave={e => {
              const link = e.currentTarget
              if (!link.style.background.includes(colors.orange))
                link.style.background = 'transparent'
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: collapsed ? '16px 0' : '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: colors.orange,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: colors.white, fontWeight: 700, fontSize: 13, flexShrink: 0,
        }}>A</div>
        {!collapsed && (
          <div>
            <div style={{ color: colors.white, fontSize: 13, fontWeight: 600 }}>Admin</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Administrateur</div>
          </div>
        )}
      </div>
    </aside>
  )
}
