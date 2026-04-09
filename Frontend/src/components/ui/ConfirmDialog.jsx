import { colors, radius, shadows, spacing, typography } from '../../theme'
import Button from './Button'

export default function ConfirmDialog({ open, onConfirm, onCancel, message, title = 'Confirmer la suppression' }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,47,89,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        boxShadow: shadows.xl,
        width: 420, padding: spacing.xl,
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: colors.dangerBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: `0 auto ${spacing.md}`,
          fontSize: 26,
        }}>🗑️</div>
        <h3 style={{ margin: `0 0 ${spacing.xs}`, color: colors.gray900, ...typography.h3 }}>{title}</h3>
        <p style={{ margin: `0 0 ${spacing.lg}`, color: colors.gray600, ...typography.body, lineHeight: 1.5 }}>
          {message || 'Cette action est irréversible. Voulez-vous continuer ?'}
        </p>
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
          <Button variant="ghost" onClick={onCancel}>Annuler</Button>
          <Button variant="danger" onClick={onConfirm}>Supprimer</Button>
        </div>
      </div>
    </div>
  )
}
