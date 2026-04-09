import { useLocation } from 'react-router-dom'
import { colors, shadows } from '../../theme'

const titles = {
  '/':              'Tableau de bord',
  '/hopitaux':      'Gestion des Hôpitaux',
  '/departements':  'Gestion des Départements',
  '/type-services': 'Types de Service',
  '/services':      'Gestion des Services',
  '/personnels':    'Gestion du Personnel',
  '/planning':      'Emplois du temps',
  '/partenaires':   'Partenaires & Couvertures',
}

export default function Header({ onToggleSidebar }) {
  const { pathname } = useLocation()
  const title = titles[pathname] || 'SenMed'

  return (
    <header style={{
      height: 60,
      background: colors.white,
      borderBottom: `1px solid ${colors.gray200}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: shadows.sm,
    }}>
      {/* Toggle sidebar button */}
      <button
        onClick={onToggleSidebar}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.gray600, fontSize: 20, padding: 4,
          display: 'flex', alignItems: 'center',
        }}
      >☰</button>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: colors.gray400, fontSize: 13 }}>SenMed</span>
        <span style={{ color: colors.gray300, fontSize: 13 }}>/</span>
        <span style={{ color: colors.bleu, fontSize: 14, fontWeight: 600 }}>{title}</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Date */}
      <div style={{ fontSize: 13, color: colors.gray500 }}>
        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      {/* Notification bell */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: colors.gray100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 16, position: 'relative',
      }}>
        🔔
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 8, height: 8, borderRadius: '50%',
          background: colors.orange,
        }} />
      </div>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: colors.bleu,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: colors.white, fontWeight: 700, fontSize: 14, cursor: 'pointer',
      }}>A</div>
    </header>
  )
}
