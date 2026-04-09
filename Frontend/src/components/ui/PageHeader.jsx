import { colors, typography, spacing } from '../../theme'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: spacing.lg, flexWrap: 'wrap', gap: spacing.sm,
    }}>
      <div>
        <h1 style={{
          margin: 0,
          ...typography.h1,
          color: colors.bleu
        }}>{title}</h1>
        {subtitle && <p style={{
          margin: `${spacing.xs} 0 0`,
          ...typography.bodySm,
          color: colors.gray500
        }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}
