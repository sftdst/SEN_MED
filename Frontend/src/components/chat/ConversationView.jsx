import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../api/axios'
import { colors } from '../../theme'
import { Avatar } from './UserSelectorModal'

// ── Animations CSS ────────────────────────────────────────────────────────────
const STYLE_ID = 'conv-view-anim'
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
    @keyframes recPulse {
      0%,100% { opacity:1; transform:scale(1);   }
      50%      { opacity:.4; transform:scale(.85); }
    }
    @keyframes waveBar {
      0%,100% { height:4px;  }
      50%      { height:18px; }
    }
    .rec-dot   { animation: recPulse 1.1s ease infinite; }
    .wave-bar  { animation: waveBar .8s ease infinite; }
    .wave-bar:nth-child(1){ animation-delay:0s;    }
    .wave-bar:nth-child(2){ animation-delay:.12s;  }
    .wave-bar:nth-child(3){ animation-delay:.24s;  }
    .wave-bar:nth-child(4){ animation-delay:.36s;  }
    .wave-bar:nth-child(5){ animation-delay:.48s;  }
    .wave-bar:nth-child(6){ animation-delay:.36s;  }
    .wave-bar:nth-child(7){ animation-delay:.24s;  }
    .wave-bar:nth-child(8){ animation-delay:.12s;  }
  `
  document.head.appendChild(s)
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ConversationView({ conv, currentUser, onBack, onReadChange }) {
  const [messages,    setMessages]    = useState([])
  const [text,        setText]        = useState('')
  const [sending,     setSending]     = useState(false)
  const [file,        setFile]        = useState(null)
  const [atBottom,    setAtBottom]    = useState(true)

  // ── Vocal ──
  const [recState,   setRecState]   = useState('idle')  // idle | recording
  const [recSeconds, setRecSeconds] = useState(0)
  const audioBlobRef = useRef(null)
  const mediaRecRef  = useRef(null)
  const chunksRef    = useRef([])
  const recTimerRef  = useRef(null)

  const bottomRef  = useRef(null)
  const scrollRef  = useRef(null)
  const lastIdRef  = useRef(0)
  const fileRef    = useRef(null)
  const pollRef    = useRef(null)
  const textRef    = useRef(null)

  // ── Helpers scroll ─────────────────────────────────────────────────────────
  const scrollBottom = (smooth = true) =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' }), 50)

  const markRead = useCallback(() => {
    api.put(`/chat/conversations/${conv.id}/read`, { staff_id: currentUser.id }).catch(() => {})
    onReadChange?.()
  }, [conv.id, currentUser.id, onReadChange])

  // ── Chargement initial ─────────────────────────────────────────────────────
  useEffect(() => {
    lastIdRef.current = 0
    setMessages([])
    api.get(`/chat/conversations/${conv.id}/messages`, {
      params: { staff_id: currentUser.id, limit: 50 },
    }).then(r => {
      const msgs = r.data.data || []
      setMessages(msgs)
      if (msgs.length) lastIdRef.current = msgs[msgs.length - 1].id
      scrollBottom(false)
      markRead()
    })
    return () => { clearInterval(pollRef.current); cancelRecording() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id])

  // ── Polling 3s ─────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (!lastIdRef.current) return
    try {
      const r = await api.get(`/chat/conversations/${conv.id}/messages`, {
        params: { staff_id: currentUser.id, after_id: lastIdRef.current },
      })
      const newMsgs = r.data.data || []
      if (!newMsgs.length) return
      // Dédupliquer pour éviter la course avec sendVoiceBlob / sendMsg
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        const unique = newMsgs.filter(m => !ids.has(m.id))
        if (!unique.length) return prev
        return [...prev, ...unique]
      })
      lastIdRef.current = newMsgs[newMsgs.length - 1].id
      markRead()
      setAtBottom(prev => { if (prev) scrollBottom(); return prev })
    } catch { /* silent */ }
  }, [conv.id, currentUser.id, markRead])

  useEffect(() => {
    pollRef.current = setInterval(poll, 3_000)
    return () => clearInterval(pollRef.current)
  }, [poll])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
  }

  // ── Envoi texte / fichier ──────────────────────────────────────────────────
  const sendMsg = async (overrideFile = null) => {
    const f = overrideFile || file
    if (!text.trim() && !f) return
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('staff_id', currentUser.id)
      if (text.trim()) fd.append('content', text.trim())
      if (f) fd.append('file', f)
      const r = await api.post(`/chat/conversations/${conv.id}/messages`, fd)
      const msg = r.data.data
      lastIdRef.current = msg.id
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        return ids.has(msg.id) ? prev : [...prev, msg]
      })
      setText('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      scrollBottom()
    } catch { /* silent */ } finally {
      setSending(false)
      textRef.current?.focus()
    }
  }

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }

  const resizeTextarea = e => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'
  }

  // ── Enregistrement vocal ───────────────────────────────────────────────────
  const autoSendRef = useRef(false)

  const sendVoiceBlob = async (blob) => {
    if (!blob) return
    setSending(true)
    setRecState('idle')
    setRecSeconds(0)
    try {
      const ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'mp4' : 'webm'
      const voiceFile = new File([blob], `vocal_${Date.now()}.${ext}`, { type: blob.type })
      const fd = new FormData()
      fd.append('staff_id', currentUser.id)
      fd.append('file', voiceFile)
      const r = await api.post(`/chat/conversations/${conv.id}/messages`, fd)
      const msg = r.data.data
      lastIdRef.current = msg.id   // mettre à jour AVANT setMessages pour éviter la duplication par le poll
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        return ids.has(msg.id) ? prev : [...prev, msg]
      })
      scrollBottom()
    } catch { /* silent */ } finally { setSending(false) }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find(m => MediaRecorder.isTypeSupported(m)) || ''

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecRef.current = rec

      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        clearInterval(recTimerRef.current)
        if (!autoSendRef.current) return  // annulé
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        sendVoiceBlob(blob)
      }

      rec.start(200)
      setRecState('recording')
      setRecSeconds(0)
      autoSendRef.current = false
      recTimerRef.current = setInterval(() => setRecSeconds(s => {
        if (s >= 299) { stopAndSend(); return s }
        return s + 1
      }), 1000)
    } catch {
      alert('Accès au microphone refusé. Veuillez autoriser le microphone dans votre navigateur.')
    }
  }

  const stopAndSend = () => {
    autoSendRef.current = true
    clearInterval(recTimerRef.current)
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop()
    }
  }

  const cancelRecording = () => {
    autoSendRef.current = false
    clearInterval(recTimerRef.current)
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop()
    }
    setRecState('idle')
    setRecSeconds(0)
  }

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── Noms ──────────────────────────────────────────────────────────────────
  const contactName = conv.type === 'direct'
    ? (conv.other_staff?.display_name || conv.nom || 'Conversation')
    : (conv.nom || 'Groupe')
  const subtitle = conv.type === 'direct' && conv.other_staff
    ? [conv.other_staff.staff_type, conv.other_staff.specialization].filter(Boolean).join(' · ')
    : `${conv.participants?.length || ''} participants`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f0f4f8' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '10px 14px', background: colors.white,
        borderBottom: `1px solid ${colors.gray200}`,
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <button onClick={onBack} style={{
          background: colors.gray100, border: 'none', borderRadius: 8,
          width: 32, height: 32, cursor: 'pointer', color: colors.gray700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
        }}>←</button>

        {conv.type === 'direct' && conv.other_staff
          ? <Avatar name={conv.other_staff.display_name} photo={conv.other_staff.photo_url} size={36} role={conv.other_staff.staff_type} />
          : <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.bleu}, #1a4a80)`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
            }}>👥</div>
        }

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {contactName}
          </div>
          {subtitle && <div style={{ fontSize: 11, color: colors.gray500, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} onScroll={onScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, color: colors.gray400 }}>
            <div style={{ fontSize: 36 }}>👋</div>
            <div style={{ fontSize: 13, textAlign: 'center' }}>Démarrez la conversation<br />en envoyant un message</div>
          </div>
        )}

        {groupByDate(messages).map(({ label, msgs }) => (
          <div key={label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 4px 8px' }}>
              <div style={{ flex: 1, height: 1, background: colors.gray200 }} />
              <span style={{ fontSize: 11, color: colors.gray400, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
              <div style={{ flex: 1, height: 1, background: colors.gray200 }} />
            </div>

            {msgs.map((msg, idx) => {
              const isMe     = msg.sender_id === currentUser.id
              const prevMsg  = msgs[idx - 1]
              const nextMsg  = msgs[idx + 1]
              const samePrev = prevMsg?.sender_id === msg.sender_id
              const sameNext = nextMsg?.sender_id === msg.sender_id

              return (
                <div key={msg.id} style={{
                  display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: 6,
                  marginBottom: sameNext ? 2 : 8,
                  paddingLeft: isMe ? 40 : 0, paddingRight: isMe ? 0 : 40,
                }}>
                  {!isMe && (
                    <div style={{ width: 28, flexShrink: 0 }}>
                      {!sameNext && <Avatar name={msg.sender_name} size={28} role={msg.sender_type} />}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2 }}>
                    {!isMe && !samePrev && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: colors.gray500, paddingLeft: 4 }}>
                        {msg.sender_name}
                      </span>
                    )}

                    {/* Bulle */}
                    <div style={{
                      background: isMe ? `linear-gradient(135deg, ${colors.bleu}, #1a4a80)` : colors.white,
                      color: isMe ? '#fff' : colors.gray900,
                      borderRadius: isMe
                        ? (samePrev ? '14px 4px 4px 14px' : sameNext ? '14px 14px 4px 14px' : '14px 4px 14px 14px')
                        : (samePrev ? '4px 14px 14px 4px' : sameNext ? '14px 14px 14px 4px' : '4px 14px 14px 14px'),
                      padding: msg.type === 'image' ? '4px' : msg.type === 'audio' ? '8px 12px' : '9px 13px',
                      maxWidth: '100%',
                      boxShadow: isMe ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                      wordBreak: 'break-word',
                    }}>
                      {msg.type === 'image' && msg.file_url && (
                        <img src={msg.file_url} alt={msg.file_name}
                          style={{ maxWidth: 210, maxHeight: 180, borderRadius: 10, display: 'block', cursor: 'pointer' }}
                          onClick={() => window.open(msg.file_url, '_blank')} />
                      )}
                      {msg.type === 'audio' && msg.file_url && (
                        <AudioBubble url={msg.file_url} isMe={isMe} />
                      )}
                      {msg.type === 'file' && msg.file_url && (
                        <a href={msg.file_url} target="_blank" rel="noreferrer" style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          color: isMe ? 'rgba(255,255,255,0.9)' : colors.info,
                          textDecoration: 'none', fontSize: 12,
                        }}>
                          <span style={{ fontSize: 20 }}>📎</span>
                          <span style={{ textDecoration: 'underline', wordBreak: 'break-all' }}>{msg.file_name}</span>
                        </a>
                      )}
                      {msg.content && (
                        <span style={{ fontSize: 13, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                      )}
                    </div>

                    <span style={{ fontSize: 10, color: colors.gray400, paddingLeft: 4, paddingRight: 4 }}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom */}
      {!atBottom && (
        <button onClick={() => scrollBottom()} style={{
          position: 'absolute', bottom: 80, right: 16,
          width: 34, height: 34, borderRadius: '50%',
          background: colors.bleu, color: '#fff',
          border: 'none', cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
        }}>↓</button>
      )}

      {/* ── Aperçu fichier ── */}
      {file && recState === 'idle' && (
        <div style={{
          padding: '8px 14px', background: '#e8f0fe',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          borderTop: '1px solid #c5d5f5',
        }}>
          <span style={{ fontSize: 18 }}>{file.type.startsWith('image/') ? '🖼️' : '📎'}</span>
          <span style={{ fontSize: 12, color: colors.info, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
          <button onClick={() => { setFile(null); fileRef.current.value = '' }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.info, fontSize: 18 }}>✕</button>
        </div>
      )}

      {/* ══ Zone de saisie ══ */}
      <div style={{
        padding: '10px 12px', background: colors.white,
        borderTop: `1px solid ${colors.gray200}`,
        flexShrink: 0,
      }}>

        {/* ── État : enregistrement en cours ── */}
        {recState === 'recording' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Point rouge clignotant */}
            <div className="rec-dot" style={{
              width: 12, height: 12, borderRadius: '50%',
              background: '#e53935', flexShrink: 0,
            }} />

            {/* Chrono */}
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e53935', minWidth: 42 }}>
              {fmtTime(recSeconds)}
            </span>

            {/* Waveform animée */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 28 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="wave-bar" style={{
                  width: 3, borderRadius: 3,
                  background: colors.bleu, minHeight: 4,
                }} />
              ))}
            </div>

            {/* Annuler */}
            <button onClick={cancelRecording} style={{
              background: colors.gray100, border: 'none', borderRadius: 8,
              width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: colors.gray600, flexShrink: 0,
            }}>✕</button>

            {/* Arrêter et envoyer automatiquement */}
            <button onClick={stopAndSend} title="Arrêter et envoyer" style={{
              background: `linear-gradient(135deg, #e53935, #c62828)`,
              border: 'none', borderRadius: '50%',
              width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', flexShrink: 0,
            }}>➤</button>
          </div>
        )}

        {/* ── État : envoi en cours après vocal ── */}
        {recState === 'idle' && sending && !text.trim() && !file && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
            <span style={{ fontSize: 14 }}>🎙️</span>
            <span style={{ fontSize: 13, color: colors.gray500 }}>Envoi du message vocal…</span>
          </div>
        )}

        {/* ── État : normal (texte) ── */}
        {recState === 'idle' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {/* Joindre un fichier */}
            <button onClick={() => fileRef.current?.click()} title="Joindre un fichier" style={{
              background: colors.gray100, border: 'none', borderRadius: 10,
              width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, flexShrink: 0, color: colors.gray600, transition: 'background 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = colors.gray200}
              onMouseLeave={e => e.currentTarget.style.background = colors.gray100}
            >📎</button>
            <input ref={fileRef} type="file" hidden onChange={e => setFile(e.target.files[0] || null)} />

            {/* Texte */}
            <textarea
              ref={textRef}
              value={text}
              onChange={e => { setText(e.target.value); resizeTextarea(e) }}
              onKeyDown={onKey}
              placeholder="Écrire un message…"
              rows={1}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 20,
                border: `1.5px solid ${colors.gray200}`,
                fontSize: 13, resize: 'none', outline: 'none',
                fontFamily: 'inherit', lineHeight: '1.45',
                maxHeight: 110, overflowY: 'auto',
                background: colors.gray50, transition: 'border-color 0.15s',
              }}
              onFocus={e  => e.target.style.borderColor = colors.bleu}
              onBlur={e => e.target.style.borderColor = colors.gray200}
            />

            {/* Micro OU Envoyer */}
            {text.trim() || file ? (
              <button onClick={() => sendMsg()} disabled={sending} style={{
                background: sending ? colors.gray200 : `linear-gradient(135deg, ${colors.bleu}, #1a4a80)`,
                border: 'none', borderRadius: '50%',
                width: 36, height: 36, cursor: sending ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
                color: sending ? colors.gray400 : '#fff', transition: 'all 0.15s',
              }}>{sending ? '…' : '➤'}</button>
            ) : (
              <button onClick={startRecording} title="Enregistrer un message vocal" style={{
                background: colors.gray100, border: 'none', borderRadius: '50%',
                width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0, color: colors.gray600, transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fde8e8'; e.currentTarget.style.color = '#e53935' }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.gray100; e.currentTarget.style.color = colors.gray600 }}
              >🎙️</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Lecteur audio inline (style WhatsApp) ────────────────────────────────────
function AudioBubble({ url, isMe }) {
  const [playing,  setPlaying]  = useState(false)
  const [current,  setCurrent]  = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadErr,  setLoadErr]  = useState(false)
  const audioRef = useRef(null)

  const fmt = s => (!s || isNaN(s) || !isFinite(s))
    ? '0:00'
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const progress = duration > 0 ? current / duration : 0

  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
    } else {
      try { await a.play() } catch { /* autoplay bloqué — ignoré */ }
    }
  }

  const seek = e => {
    const a = audioRef.current
    if (!a || !duration) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    a.currentTime = ratio * duration
  }

  const trackBg   = isMe ? 'rgba(255,255,255,0.28)' : colors.gray200
  const trackFill = isMe ? '#fff'                    : colors.bleu
  const btnBg     = isMe ? 'rgba(255,255,255,0.18)'  : `var(--app-primary-18, #002f5918)`
  const iconCol   = isMe ? '#fff'                    : colors.bleu
  const timeCol   = isMe ? 'rgba(255,255,255,0.70)'  : colors.gray400

  if (loadErr) return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
      color: isMe ? '#fff' : colors.info, textDecoration: 'none',
    }}>
      <span>🎙️</span><span style={{ textDecoration: 'underline' }}>Écouter le message</span>
    </a>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 210, maxWidth: 260 }}>
      <audio
        ref={audioRef}
        src={url}
        preload="auto"
        onPlay={()           => setPlaying(true)}
        onPause={()          => setPlaying(false)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onDurationChange={()  => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
        onEnded={() => {
          setPlaying(false)
          setCurrent(0)
          if (audioRef.current) audioRef.current.currentTime = 0
        }}
        onError={() => setLoadErr(true)}
      />

      {/* ▶ / ⏸ */}
      <button onClick={toggle} style={{
        width: 38, height: 38, borderRadius: '50%',
        background: btnBg, border: 'none', cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, color: iconCol, transition: 'transform 0.12s',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Barre + temps */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div onClick={seek} style={{
          position: 'relative', height: 4, borderRadius: 4,
          background: trackBg, cursor: 'pointer', marginBottom: 5,
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`, borderRadius: 4, background: trackFill,
          }} />
          <div style={{
            position: 'absolute', top: '50%',
            left: `${progress * 100}%`,
            transform: 'translate(-50%,-50%)',
            width: 11, height: 11, borderRadius: '50%',
            background: trackFill,
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: timeCol, userSelect: 'none' }}>
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Grouper les messages par date ─────────────────────────────────────────────
function groupByDate(messages) {
  const groups = []
  const map = {}
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  for (const msg of messages) {
    const d = new Date(msg.created_at); d.setHours(0, 0, 0, 0)
    let label
    if (d.getTime() === today.getTime())          label = "Aujourd'hui"
    else if (d.getTime() === yesterday.getTime()) label = 'Hier'
    else label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

    if (!map[label]) { map[label] = []; groups.push({ label, msgs: map[label] }) }
    map[label].push(msg)
  }
  return groups
}
