import { colors, radius, shadows, typography, spacing } from '../../theme'

const variants = {
  primary: {
    background: colors.orange,
    color: colors.white,
    border: 'none',
    hover: colors.orangeDark,
  },
  secondary: {
    background: colors.white,
    color: colors.bleu,
    border: `1.5px solid ${colors.bleu}`,
    hover: colors.gray100,
  },
  danger: {
    background: colors.danger,
    color: colors.white,
    border: 'none',
    hover: '#b71c1c',
  },
  warning: {
    background: colors.warning,
    color: colors.white,
    border: 'none',
    hover: colors.orangeDark,
  },
  ghost: {
    background: 'transparent',
    color: colors.gray600,
    border: `1.5px solid ${colors.gray300}`,
    hover: colors.gray100,
  },
  success: {
    background: colors.success,
    color: colors.white,
    border: 'none',
    hover: '#1b5e20',
  },
}

const sizes = {
  sm: { padding: `${spacing.xs} ${spacing.sm}`, fontSize: typography.button.fontSize, height: '28px' },
  md: { padding: `${spacing.sm} ${spacing.md}`, fontSize: typography.button.fontSize, height: '32px' },
  lg: { padding: `${spacing.sm} ${spacing.lg}`, fontSize: typography.button.fontSize, height: '36px' },
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  fullWidth = false,
  icon = null,
  style = {},
}) {
  const v = variants[variant] || variants.primary
  const s = sizes[size] || sizes.md

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: v.background,
        color: v.color,
        border: v.border || 'none',
        borderRadius: radius.sm,
        padding: s.padding,
        fontSize: s.fontSize,
        height: s.height,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'all 0.18s ease',
        width: fullWidth ? '100%' : 'auto',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        boxShadow: (variant === 'primary' || variant === 'warning') ? shadows.sm : 'none',
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.background = v.hover
      }}
      onMouseLeave={e => {
        if (!disabled) e.currentTarget.style.background = v.background
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  )
}
