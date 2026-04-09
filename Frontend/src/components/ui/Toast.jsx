import { useEffect, useState } from 'react'
import { colors, radius, shadows } from '../../theme'

let toastListeners = []
let toastId = 0

export function showToast(message, type = 'success') {
  const id = ++toastId
  toastListeners.forEach(fn => fn({ id, message, type }))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const listener = (toast) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 3500)
    }
    toastListeners.push(listener)
    return () => { toastListeners = toastListeners.filter(l => l !== listener) }
  }, [])

  const styles = {
    success: { bg: colors.successBg, color: colors.success, icon: '✓' },
    error:   { bg: colors.dangerBg,  color: colors.danger,  icon: '✕' },
    warning: { bg: colors.warningBg, color: colors.warning, icon: '⚠' },
    info:    { bg: colors.infoBg,    color: colors.info,    icon: 'ℹ' },
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => {
        const s = styles[t.type] || styles.success
        return (
          <div key={t.id} style={{
            background: s.bg, color: s.color,
            border: `1.5px solid ${s.color}33`,
            borderRadius: radius.md,
            padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: shadows.md,
            fontSize: 14, fontWeight: 600,
            minWidth: 280, maxWidth: 400,
            animation: 'slideInRight 0.25s ease',
          }}>
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            {t.message}
          </div>
        )
      })}
      <style>{`@keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  )
}
