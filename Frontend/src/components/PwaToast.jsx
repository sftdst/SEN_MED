import { useRegisterSW } from 'virtual:pwa-register/react'
import { useState, useEffect } from 'react'

export default function PwaToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh:  [needRefresh,  setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (offlineReady || needRefresh) setVisible(true)
  }, [offlineReady, needRefresh])

  const close = () => {
    setVisible(false)
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#003268',
      color: '#fff',
      padding: '12px 16px 12px 18px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 99999,
      boxShadow: '0 6px 24px rgba(0,0,50,.3)',
      fontSize: '13px',
      maxWidth: '380px',
      width: 'calc(100% - 40px)',
    }}>
      <span style={{ flex: 1 }}>
        {needRefresh
          ? '🔄 Nouvelle version disponible'
          : '✓ Application disponible hors ligne'}
      </span>

      {needRefresh && (
        <button
          onClick={() => updateServiceWorker(true)}
          style={{
            background: '#00897B',
            border: 'none',
            color: '#fff',
            padding: '5px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          Mettre à jour
        </button>
      )}

      <button
        onClick={close}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,.6)',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
        aria-label="Fermer"
      >×</button>
    </div>
  )
}
