import { colors } from '../../theme'

export default function Spinner({ size = 24, color = colors.orange }) {
  return (
    <div style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `3px solid ${color}22`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      animation: 'senmed-spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes senmed-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      flexDirection: 'column',
      gap: 16,
    }}>
      <Spinner size={40} />
      <span style={{ color: colors.gray500, fontSize: 14 }}>Chargement...</span>
    </div>
  )
}
