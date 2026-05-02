import { useEffect } from 'react'
import { useChat } from '../../contexts/ChatContext'
import { colors } from '../../theme'

export default function MessageriePage() {
  const { setChatOpen } = useChat()

  useEffect(() => { setChatOpen(true) }, [setChatOpen])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ fontSize: 56 }}>💬</div>
      <div style={{ fontWeight: 700, fontSize: 20, color: colors.bleu }}>Messagerie interne</div>
      <div style={{ fontSize: 14, color: colors.gray500 }}>Le panneau de messagerie s'ouvre sur la droite</div>
    </div>
  )
}
