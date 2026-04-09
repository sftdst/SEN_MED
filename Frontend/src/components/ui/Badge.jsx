import { colors, radius, typography, spacing } from '../../theme'

const presets = {
  success: { bg: colors.successBg, color: colors.success },
  danger:  { bg: colors.dangerBg,  color: colors.danger  },
  warning: { bg: colors.warningBg, color: colors.warning },
  info:    { bg: colors.infoBg,    color: colors.info    },
  orange:  { bg: colors.orangeLight, color: colors.orange },
  default: { bg: colors.gray200,   color: colors.gray700 },
}

export default function Badge({ children, variant = 'default', style = {} }) {
  const p = presets[variant] || presets.default
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: spacing.xs,
      background: p.bg,
      color: p.color,
      borderRadius: radius.full,
      padding: `${spacing.xs} ${spacing.sm}`,
      ...typography.caption,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  if (status === 1 || status === '1') return <Badge variant="success">Actif</Badge>
  if (status === 0 || status === '0') return <Badge variant="default">Inactif</Badge>
  return <Badge variant="default">{status}</Badge>
}
