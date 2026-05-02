import { useLocation } from 'react-router-dom'
import { colors, shadows } from '../../theme'
import { useChat } from '../../contexts/ChatContext'
import { useAuth } from '../../context/AuthContext'

const titles = {
  '/':              'Tableau de bord',
  '/hopitaux':      'Gestion des Hôpitaux',
  '/departements':  'Gestion des Départements',
  '/type-services': 'Types de Service',
  '/services':      'Gestion des Services',
  '/personnels':    'Gestion du Personnel',
  '/planning':      'Emplois du temps',
  '/partenaires':   'Partenaires & Couvertures',
  '/consultation':  'Consultation Médicale',
}

const STYLE_ID = 'chat-header-anim'
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @keyframes chatShake {
      0%,100% { transform: rotate(0deg) scale(1); }
      15%      { transform: rotate(-18deg) scale(1.15); }
      30%      { transform: rotate(14deg)  scale(1.15); }
      45%      { transform: rotate(-10deg) scale(1.1);  }
      60%      { transform: rotate(8deg)   scale(1.05); }
      75%      { transform: rotate(-4deg)  scale(1.02); }
    }
    @keyframes badgePop {
      0%   { transform: scale(0.5); opacity: 0; }
      60%  { transform: scale(1.3); }
      100% { transform: scale(1);   opacity: 1; }
    }
    @keyframes badgePulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,118,49,0.7); }
      50%     { box-shadow: 0 0 0 6px rgba(255,118,49,0);  }
    }
    .chat-btn-shake { animation: chatShake 0.7s ease; }
    .chat-badge-pop { animation: badgePop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .chat-badge-pulse { animation: badgePulse 1.2s ease infinite; }
  `
  document.head.appendChild(s)
}

export default function Header({ onToggleSidebar }) {
  const { pathname } = useLocation()
  const { logout, user } = useAuth()
  const { setChatOpen, chatOpen, unreadTotal, currentUser, hasNewMsg } = useChat()
  const title = titles[pathname] || 'SenMed'

  const displayName = currentUser?.display_name || user?.first_name || user?.nom || 'Utilisateur'
  const initials = displayName.substring(0, 1).toUpperCase()

  return (
    <header style={{
      height: 60,
      background: colors.white,
      borderBottom: `1px solid ${colors.gray200}`,
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      position: 'sticky', top: 0, zIndex: 50,
      boxShadow: shadows.sm,
    }}>

      {/* Toggle sidebar */}
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

      {/* Chat button */}
      <button
        onClick={() => setChatOpen(o => !o)}
        title={unreadTotal > 0 ? `${unreadTotal} message${unreadTotal > 1 ? 's' : ''} non lu${unreadTotal > 1 ? 's' : ''}` : 'Messagerie interne'}
        style={{
          width: 38, height: 38, borderRadius: '50%',
          background: chatOpen
            ? `linear-gradient(135deg, ${colors.bleu}, #1a4a80)`
            : unreadTotal > 0 ? '#e8f0fe' : colors.gray100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 17, position: 'relative',
          border: chatOpen ? 'none' : unreadTotal > 0 ? `2px solid ${colors.bleu}30` : 'none',
          transition: 'background 0.2s, transform 0.15s',
          outline: 'none',
        }}
        className={hasNewMsg ? 'chat-btn-shake' : ''}
        onMouseEnter={e => { if (!chatOpen) e.currentTarget.style.transform = 'scale(1.08)' }}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        💬
        {unreadTotal > 0 && (
          <span
            key={unreadTotal}
            className={`chat-badge-pop ${hasNewMsg ? 'chat-badge-pulse' : ''}`}
            style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 18, height: 18, borderRadius: 9,
              background: colors.orange, color: '#fff',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #fff',
              lineHeight: 1,
            }}
          >
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {/* Notification bell */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: colors.gray100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 17, position: 'relative',
      }}>
        🔔
        <span style={{
          position: 'absolute', top: 7, right: 7,
          width: 8, height: 8, borderRadius: '50%',
          background: colors.orange,
        }} />
      </div>

      {/* User name */}
      <span style={{ fontSize: 13, color: colors.gray600, fontWeight: 500 }}>
        {displayName}
      </span>

      {/* Avatar + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div
          title={displayName}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.bleu}, #1a4a80)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {initials}
        </div>
        <button
          onClick={logout}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.gray400, fontSize: 14, padding: 4,
            display: 'flex', alignItems: 'center',
            transition: 'color 0.15s',
          }}
          title="Déconnexion"
        >
          🔒
        </button>
      </div>
    </header>
  )
}
