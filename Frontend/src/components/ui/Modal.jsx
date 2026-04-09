import { useEffect } from 'react'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import Button from './Button'

export default function Modal({ open, onClose, title, children, width = 560, footer = null }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,47,89,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: spacing.lg,
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div style={{
        background: colors.white,
        borderRadius: radius.lg,
        boxShadow: shadows.xl,
        width: '100%',
        maxWidth: width,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.2s ease',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `${spacing.md} ${spacing.lg}`,
          borderBottom: `2px solid ${colors.gray100}`,
          background: colors.bleu,
        }}>
          <h2 style={{ margin: 0, ...typography.h2, color: colors.white }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: colors.white, width: 32, height: 32,
              borderRadius: radius.full, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 300,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: spacing.lg, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            borderTop: `1px solid ${colors.gray200}`,
            display: 'flex', justifyContent: 'flex-end', gap: spacing.sm,
            background: colors.gray50,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
