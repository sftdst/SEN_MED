import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

// ─── SVG Icon registry ────────────────────────────────────────────────────────
function Ico({ name, size = 15 }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: '1.9', strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { display: 'block', flexShrink: 0 },
  }
  switch (name) {
    case 'home':        return <svg {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    case 'grid':        return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    case 'user':        return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case 'users':       return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'clipboard':   return <svg {...p}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>
    case 'clock':       return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
    case 'bed':         return <svg {...p}><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M2 10V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M2 20h20M5 10h7"/></svg>
    case 'arrows':      return <svg {...p}><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
    case 'stethoscope': return <svg {...p}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
    case 'calendar':    return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    case 'activity':    return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    case 'pill':        return <svg {...p}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
    case 'barChart':    return <svg {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
    case 'tag':         return <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
    case 'userPlus':    return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
    case 'calendarOk':  return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18m-9 5 2 2 4-4"/></svg>
    case 'inbox':       return <svg {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
    case 'userX':       return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>
    case 'fileText':    return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    case 'settings':    return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    case 'globe':       return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>
    case 'shield':      return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'flask':       return <svg {...p}><path d="M9 3h6M9 3v8L5.2 17A2 2 0 0 0 7 20h10a2 2 0 0 0 1.8-3L15 11V3"/></svg>
    case 'building':    return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 9v12M15 9v12"/></svg>
    case 'hospital':    return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
    case 'handshake':   return <svg {...p}><path d="M11 17 9 19l-7-7 4-4 2.5 2.5"/><path d="m13 7-5.5 5.5M9.5 14.5 11 16l7-7-4-4-2 2"/><path d="m14 6 3-3 4 4-3.5 3.5"/></svg>
    case 'image':       return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    case 'crossMed':    return <svg {...p} fill="currentColor" stroke="none"><rect x="9.5" y="2" width="5" height="20" rx="2.5"/><rect x="2" y="9.5" width="20" height="5" rx="2.5"/></svg>
    case 'chevron':     return <svg {...p}><polyline points="6 9 12 15 18 9"/></svg>
    case 'logout':      return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
    default:            return null
  }
}

// ─── Menu definition ──────────────────────────────────────────────────────────
const navItemsDef = [
  {
    group: 'ACCUEIL', groupIcon: 'home',
    items: [
      { to: '/',                label: 'Tableau de bord',           permission: 'dashboard',        icon: 'grid' },
      { to: '/patients',        label: 'Patients',                  permission: 'patients',         icon: 'user' },
      { to: '/visites',         label: 'Visites',                   permission: 'visites',          icon: 'clipboard' },
      { to: '/salle-attente',   label: "Salle d'attente",           permission: 'salle-attente',    icon: 'clock' },
      { to: '/hospitalisation', label: 'Hospitalisation',           permission: 'hospitalisation',  icon: 'bed' },
      { to: '/transferts',      label: 'Transferts',                permission: 'transferts',       icon: 'arrows' },
    ],
  },
  {
    group: 'ESPACE MÉDECIN', groupIcon: 'stethoscope',
    items: [
      { to: '/espace-medecin', label: 'Tableau de bord', permission: 'espace-medecin', icon: 'activity' },
    ],
  },
  {
    group: 'GESTION RDV', groupIcon: 'calendar',
    items: [
      { to: '/rendezvous',          label: 'Gestion des RDV',  permission: 'rendezvous', icon: 'calendar'   },
      { to: '/rendezvous/demandes', label: 'Demandes',          permission: 'rendezvous', icon: 'inbox'      },
      { to: '/planning',            label: 'Emplois du temps',  permission: 'rendezvous', icon: 'calendarOk' },
    ],
  },
  {
    group: 'SOINS INFIRMIERS', groupIcon: 'activity',
    items: [
      { to: '/dossier-soins',        label: 'Dossier de Soins',  permission: 'dossier-soins', icon: 'activity' },
      { to: '/dossier-soins/images', label: 'Galerie d\'images', permission: 'dossier-soins', icon: 'image'    },
    ],
  },
  {
    group: 'PHARMACIE', groupIcon: 'pill',
    items: [
      { to: '/pharmacie', label: 'Pharmacie', permission: 'pharmacie', icon: 'pill' },
    ],
  },
  {
    group: 'COMPTABILITÉ', groupIcon: 'barChart',
    items: [
      { to: '/comptabilite', label: 'Comptabilité', permission: 'comptabilite', icon: 'barChart' },
      { to: '/tarification',  label: 'Tarification',  permission: 'tarification',  icon: 'tag' },
    ],
  },
  {
    group: 'RESSOURCES HUMAINES', groupIcon: 'users',
    items: [
      { to: '/personnels',                   label: 'Gestion personnel',  permission: 'personnels',        icon: 'userPlus' },
      { to: '/ressources-humaines/conges',   label: 'Gestion congés',     permission: 'conges',            icon: 'calendarOk' },
      { to: '/ressources-humaines/absences', label: 'Absences & retards', permission: 'absences-retards',  icon: 'userX' },
      { to: '/ressources-humaines/contrats', label: 'Gestion contrats',   permission: 'contrats',          icon: 'fileText' },
    ],
  },
  {
    group: 'CONFIGURATION', groupIcon: 'settings',
    items: [
      { to: '/config-systeme',        label: 'Configuration système', permission: 'config-systeme',   icon: 'settings' },
      { to: '/config-page-web',       label: 'Page web',              permission: 'config-systeme',   icon: 'globe' },
      { to: '/config-sanitaire',      label: 'Config. sanitaire',     permission: 'config-sanitaire', icon: 'hospital' },
      { to: '/formulaires',           label: 'Formulaires',           permission: 'formulaires',      icon: 'fileText' },
      { to: '/config-profils-droits', label: 'Profil et droits',      permission: 'profil-droits',    icon: 'shield' },
    ],
  },
  {
    group: 'LABORATOIRE', groupIcon: 'flask',
    items: [
      { to: '/laboratoire', label: 'Laboratoire', permission: 'laboratoire', icon: 'flask' },
    ],
  },
  {
    group: 'ADMINISTRATION', groupIcon: 'building',
    items: [
      { to: '/departements', label: 'Départements', permission: 'departements', icon: 'building' },
      { to: '/hopitaux',     label: 'Hôpitaux',     permission: 'hopitaux',     icon: 'hospital' },
      { to: '/partenaires',  label: 'Partenaires',  permission: 'partenaires',  icon: 'handshake' },
    ],
  },
]

// ─── Nav link ─────────────────────────────────────────────────────────────────
function SideLink({ item, collapsed }) {
  const [hovered, setHovered] = useState(false)
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center',
        gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '9px 14px',
        margin: collapsed ? '2px 6px' : '2px 8px',
        borderRadius: 10,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        letterSpacing: '0.1px',
        transition: 'all 0.18s ease',
        // Active : fond dégradé orange bien visible
        background: isActive
          ? 'linear-gradient(90deg, rgba(255,118,49,0.36) 0%, rgba(255,118,49,0.12) 100%)'
          : hovered
          ? 'rgba(255,255,255,0.11)'
          : 'transparent',
        boxShadow: isActive && !collapsed
          ? 'inset 3px 0 0 var(--app-accent, #ff7631)'
          : 'none',
        color: isActive ? '#ffffff' : hovered ? '#ffffff' : 'rgba(255,255,255,0.88)',
      })}
    >
      {/* Icône avec couleur accent si actif */}
      <span style={{ color: 'inherit', display: 'flex' }}>
        <Ico name={item.icon || 'grid'} size={15} />
      </span>
      {!collapsed && <span style={{ lineHeight: 1.35 }}>{item.label}</span>}
    </NavLink>
  )
}

// ─── Group with collapse ──────────────────────────────────────────────────────
function NavGroup({ group, collapsed }) {
  const location = useLocation()

  // Vérifie si un item du groupe correspond à la route active
  const hasActive = group.items.some(it =>
    it.to === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(it.to)
  )

  const [expanded, setExpanded] = useState(() => group.group === 'ACCUEIL' || hasActive)
  const [btnHover, setBtnHover] = useState(false)

  // Ré-ouvre le groupe si on navigue vers un de ses enfants depuis l'extérieur
  useEffect(() => {
    if (hasActive) setExpanded(true)
  }, [hasActive])

  if (collapsed) {
    return (
      <div style={{ margin: '3px 0' }}>
        {group.items.map((item, i) => (
          <SideLink key={i} item={item} collapsed />
        ))}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 2 }}>
      {/* En-tête de section */}
      <button
        onClick={() => setExpanded(v => !v)}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          width: 'calc(100% - 16px)', marginLeft: 8,
          padding: '6px 10px', marginTop: 14,
          background: btnHover
            ? 'rgba(255,255,255,0.06)'
            : hasActive ? 'rgba(255,255,255,0.03)' : 'transparent',
          border: 'none', cursor: 'pointer', borderRadius: 8,
          // Plus visible si section active
          color: hasActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.68)',
          fontWeight: 700, fontSize: 10.5,
          textTransform: 'uppercase', letterSpacing: '0.9px',
          transition: 'all 0.15s',
        }}
      >
        {/* Pastille orange si section active */}
        {hasActive && (
          <span style={{
            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
            background: 'var(--app-accent, #ff7631)',
            boxShadow: '0 0 5px var(--app-accent, #ff7631)',
          }} />
        )}
        <Ico name={group.groupIcon} size={12} />
        <span style={{ flex: 1, textAlign: 'left' }}>{group.group}</span>
        <span style={{
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.22s ease',
          display: 'flex', alignItems: 'center',
          opacity: 0.6,
        }}>
          <Ico name="chevron" size={11} />
        </span>
      </button>

      {/* Séparateur sous l'en-tête */}
      {!expanded && (
        <div style={{ height: 1, margin: '4px 18px 0', background: 'rgba(255,255,255,0.05)' }} />
      )}

      {/* Items */}
      {expanded && (
        <div style={{ marginTop: 3 }}>
          {group.items.map((item, i) => (
            <SideLink key={i} item={item} collapsed={false} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ collapsed = false }) {
  const { hasPermission, user, logout } = useAuth()
  const { prefs } = useTheme()
  const W = collapsed ? 66 : 248

  // Scrollbar fine injectée une fois
  useEffect(() => {
    const id = 'sb-scroll-css'
    if (!document.getElementById(id)) {
      const s = document.createElement('style')
      s.id = id
      s.textContent = [
        '.sb-nav::-webkit-scrollbar{width:3px}',
        '.sb-nav::-webkit-scrollbar-track{background:transparent}',
        '.sb-nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.14);border-radius:4px}',
        '.sb-nav::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.26)}',
      ].join('')
      document.head.appendChild(s)
    }
  }, [])

  const filteredNav = navItemsDef
    .map(g => ({ ...g, items: g.items.filter(it => !it.permission || hasPermission(it.permission)) }))
    .filter(g => g.items.length > 0)

  const initials = user?.name
    ? user.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
    : 'U'

  return (
    <aside style={{
      width: W, minWidth: W,
      background: 'linear-gradient(175deg, #003268 0%, #001e3d 100%)',
      height: '100vh',
      position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden', zIndex: 100,
      boxShadow: '4px 0 28px rgba(0,0,0,0.32)',
    }}>

      {/* Barre accent en haut */}
      <div style={{
        height: 3, flexShrink: 0,
        background: 'linear-gradient(90deg, var(--app-accent, #ff7631) 0%, var(--app-primary, #002f59) 100%)',
      }} />

      {/* Logo ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '15px 0' : '17px 16px 15px',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 12, flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        minHeight: 68,
      }}>
        {/* Badge médical */}
        <div style={{
          width: 38, height: 38, flexShrink: 0, borderRadius: 11, color: '#fff',
          background: 'linear-gradient(135deg, var(--app-accent, #ff7631) 0%, #c94f1a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(255,118,49,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        }}>
          <Ico name="crossMed" size={18} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              color: '#fff', fontWeight: 800, fontSize: 18,
              lineHeight: 1.1, letterSpacing: '-0.4px', whiteSpace: 'nowrap',
            }}>
              {prefs.app_name}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.62)', fontSize: 11,
              marginTop: 3, whiteSpace: 'nowrap', letterSpacing: '0.2px',
            }}>
              {prefs.app_slogan}
            </div>
          </div>
        )}
      </div>

      {/* Navigation scrollable ──────────────────────────────────────── */}
      <nav className="sb-nav" style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '4px 0 12px',
      }}>
        {filteredNav.map((group, idx) => (
          <NavGroup key={idx} group={group} collapsed={collapsed} />
        ))}
      </nav>

      {/* Pied de page utilisateur ────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '10px 0' : '11px 12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10, flexShrink: 0,
      }}>
        {/* Avatar initiales */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--app-accent, #ff7631) 0%, #a03a10 100%)',
          border: '2px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.5px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {initials}
        </div>

        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#fff', fontWeight: 600, fontSize: 13,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.name || 'Utilisateur'}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.role?.name || '—'}
              </div>
            </div>

            <button
              onClick={logout}
              title="Se déconnecter"
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.22)'
                e.currentTarget.style.color = '#fca5a5'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.48)'
              }}
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.72)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s',
              }}
            >
              <Ico name="logout" size={14} />
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
