import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/axios'
import { colors } from '../../theme'
import { useChat } from '../../contexts/ChatContext'
import { Avatar } from './UserSelectorModal'
import UserSelectorModal from './UserSelectorModal'
import NewConversationModal from './NewConversationModal'
import ConversationView from './ConversationView'

export default function ChatDrawer() {
  const {
    currentUser, setCurrentUser,
    chatOpen, setChatOpen,
    activeConvId, setActiveConvId,
    fetchUnread,
  } = useChat()

  const [conversations, setConversations] = useState([])
  const [activeConv,    setActiveConv]    = useState(null)
  const [showUserSel,   setShowUserSel]   = useState(false)
  const [showNewConv,   setShowNewConv]   = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [search,        setSearch]        = useState('')
  const convPollRef = useRef(null)

  // ── Charge les conversations ────────────────────────────────────────────────
  const loadConversations = useCallback(async (user = currentUser) => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await api.get('/chat/conversations', { params: { staff_id: user.id } })
      setConversations(data.data || [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [currentUser])

  // Polling 5s quand le drawer est ouvert
  useEffect(() => {
    if (!chatOpen || !currentUser) { clearInterval(convPollRef.current); return }
    loadConversations()
    convPollRef.current = setInterval(() => loadConversations(), 5_000)
    return () => clearInterval(convPollRef.current)
  }, [chatOpen, currentUser, loadConversations])

  // Jump externe vers une conversation
  useEffect(() => {
    if (!activeConvId || !conversations.length) return
    const conv = conversations.find(c => c.id === activeConvId)
    if (conv) { setActiveConv(conv); setActiveConvId(null) }
  }, [activeConvId, conversations, setActiveConvId])

  const handleSelectUser = user => {
    setCurrentUser(user)
    setShowUserSel(false)
    loadConversations(user)
  }

  const handleNewConv = conv => {
    setShowNewConv(false)
    setConversations(prev => prev.find(c => c.id === conv.id) ? prev : [{ ...conv, unread_count: 0 }, ...prev])
    setActiveConv({ ...conv, unread_count: 0 })
  }

  const backToList = () => { setActiveConv(null); loadConversations() }

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0)

  const filteredConvs = search.trim()
    ? conversations.filter(c => {
        const name = c.type === 'direct'
          ? (c.other_staff?.display_name || c.nom || '')
          : (c.nom || '')
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : conversations

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={() => setChatOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,10,40,0.20)', zIndex: 1199,
          opacity: chatOpen ? 1 : 0,
          pointerEvents: chatOpen ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* ── Drawer ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 390,
        background: colors.white,
        zIndex: 1200,
        transform: chatOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        willChange: 'transform',
      }}>
        <div style={{ width: 390, height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* ── En-tête ── */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.bleu} 0%, #1a4a80 100%)`,
            padding: '14px 16px 12px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: currentUser && !activeConv ? 12 : 0 }}>
              <div style={{ fontSize: 20 }}>💬</div>
              <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: 16 }}>
                Messagerie
                {totalUnread > 0 && (
                  <span style={{
                    marginLeft: 8, background: colors.orange, color: '#fff',
                    borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                  }}>{totalUnread > 99 ? '99+' : totalUnread}</span>
                )}
              </div>
              {!activeConv && (
                <button
                  onClick={() => currentUser ? setShowNewConv(true) : setShowUserSel(true)}
                  title="Nouvelle conversation"
                  style={{
                    background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 8,
                    width: 32, height: 32, cursor: 'pointer', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                >+</button>
              )}
              <button
                onClick={() => { setChatOpen(false); setActiveConv(null) }}
                style={{
                  background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 8,
                  width: 32, height: 32, cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              >✕</button>
            </div>

            {/* Barre de recherche (liste seulement) */}
            {currentUser && !activeConv && (
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.5)', fontSize: 13, pointerEvents: 'none',
                }}>🔍</span>
                <input
                  placeholder="Rechercher une conversation…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px 8px 32px',
                    borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.15)', color: '#fff',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    '::placeholder': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />
              </div>
            )}
          </div>

          {/* ── Corps ── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {!currentUser ? (
              <WelcomeScreen onSelect={() => setShowUserSel(true)} />
            ) : activeConv ? (
              <ConversationView
                conv={activeConv}
                currentUser={currentUser}
                onBack={backToList}
                onReadChange={() => { loadConversations(); fetchUnread() }}
              />
            ) : (
              <ConversationList
                conversations={filteredConvs}
                loading={loading}
                currentUser={currentUser}
                onOpen={setActiveConv}
                onNew={() => setShowNewConv(true)}
              />
            )}
          </div>

          {/* ── Profil en bas ── */}
          {currentUser && !activeConv && (
            <div style={{
              padding: '10px 14px',
              borderTop: `1px solid ${colors.gray100}`,
              display: 'flex', alignItems: 'center', gap: 10,
              background: colors.gray50, flexShrink: 0,
            }}>
              <Avatar name={currentUser.display_name} photo={currentUser.photo_url} size={32} role={currentUser.staff_type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: colors.gray800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.display_name}
                </div>
                <div style={{ fontSize: 10, color: colors.gray500 }}>
                  {currentUser.staff_type || 'Personnel médical'}
                  {currentUser.specialization ? ` · ${currentUser.specialization}` : ''}
                </div>
              </div>
              <button
                onClick={() => setShowUserSel(true)}
                style={{
                  background: 'none', border: `1px solid ${colors.gray200}`,
                  borderRadius: 6, padding: '4px 10px',
                  cursor: 'pointer', fontSize: 11, color: colors.gray600, fontWeight: 600,
                }}
              >Changer</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showUserSel && <UserSelectorModal onSelect={handleSelectUser} />}
      {showNewConv && currentUser && (
        <NewConversationModal
          currentUser={currentUser}
          onClose={() => setShowNewConv(false)}
          onCreated={handleNewConv}
        />
      )}
    </>
  )
}

// ── Écran de bienvenue ─────────────────────────────────────────────────────────
function WelcomeScreen({ onSelect }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, gap: 0,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: `linear-gradient(135deg, ${colors.bleu}20, ${colors.bleu}10)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 20,
      }}>💬</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: colors.gray800, marginBottom: 8, textAlign: 'center' }}>
        Messagerie SenMed
      </div>
      <div style={{ fontSize: 13, color: colors.gray500, textAlign: 'center', lineHeight: 1.6, marginBottom: 28, maxWidth: 260 }}>
        Communiquez en temps réel avec tous les membres du personnel médical
      </div>
      <button
        onClick={onSelect}
        style={{
          padding: '11px 28px', borderRadius: 12, border: 'none',
          background: `linear-gradient(135deg, ${colors.bleu}, #1a4a80)`,
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          boxShadow: `0 4px 14px ${colors.bleu}40`,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${colors.bleu}50` }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 14px ${colors.bleu}40` }}
      >Choisir mon profil</button>
    </div>
  )
}

// ── Liste des conversations ────────────────────────────────────────────────────
function ConversationList({ conversations, loading, currentUser, onOpen, onNew }) {
  if (loading && !conversations.length) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[...Array(5)].map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    )
  }

  if (!loading && !conversations.length) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0, padding: 32,
      }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📭</div>
        <div style={{ fontWeight: 700, fontSize: 14, color: colors.gray700, marginBottom: 6 }}>
          Aucune conversation
        </div>
        <div style={{ fontSize: 12, color: colors.gray400, marginBottom: 20, textAlign: 'center' }}>
          Démarrez une discussion avec un collègue
        </div>
        <button
          onClick={onNew}
          style={{
            padding: '9px 22px', borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg, ${colors.bleu}, #1a4a80)`,
            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >+ Nouvelle conversation</button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {conversations.map(conv => {
        const name    = conv.type === 'direct'
          ? (conv.other_staff?.display_name || conv.nom || '—')
          : (conv.nom || 'Groupe')
        const lastMsg = conv.last_message
        const isMe    = lastMsg?.sender_id === currentUser.id
        const preview = !lastMsg ? 'Aucun message'
          : lastMsg.type !== 'text' ? `📎 ${lastMsg.file_name || 'Fichier'}`
          : (lastMsg.content || '')
        const hasUnread = conv.unread_count > 0

        return (
          <button
            key={conv.id}
            onClick={() => onOpen(conv)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '13px 16px',
              background: hasUnread ? '#f0f4ff' : 'none',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              borderBottom: `1px solid ${colors.gray100}`,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = hasUnread ? '#e8eeff' : colors.gray50}
            onMouseLeave={e => e.currentTarget.style.background = hasUnread ? '#f0f4ff' : 'none'}
          >
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {conv.type === 'direct'
                ? <Avatar name={conv.other_staff?.display_name || name} photo={conv.other_staff?.photo_url} size={44} role={conv.other_staff?.staff_type} />
                : <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.bleu}cc, #1a4a80)`,
                    color: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20,
                  }}>👥</div>
              }
              {hasUnread && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 10, height: 10, borderRadius: '50%',
                  background: colors.orange,
                  border: '2px solid #fff',
                }} />
              )}
            </div>

            {/* Contenu */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontWeight: hasUnread ? 800 : 600, fontSize: 13, color: colors.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {name}
                </span>
                <span style={{ fontSize: 10, color: hasUnread ? colors.bleu : colors.gray400, flexShrink: 0, marginLeft: 6, fontWeight: hasUnread ? 700 : 400 }}>
                  {lastMsg ? formatTime(lastMsg.created_at) : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 12, color: hasUnread ? colors.gray700 : colors.gray400,
                  fontWeight: hasUnread ? 600 : 400,
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1,
                }}>
                  {isMe ? <span style={{ color: colors.bleuMuted }}>Vous : </span> : null}{preview}
                </span>
                {hasUnread && (
                  <span style={{
                    background: colors.bleu, color: '#fff',
                    borderRadius: 10, padding: '1px 6px',
                    fontSize: 10, fontWeight: 700, flexShrink: 0, minWidth: 18, textAlign: 'center',
                  }}>{conv.unread_count}</span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: `1px solid ${colors.gray100}` }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: colors.gray100, flexShrink: 0, animation: 'pulse 1.4s infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, background: colors.gray100, borderRadius: 6, width: '60%', marginBottom: 8 }} />
        <div style={{ height: 10, background: colors.gray100, borderRadius: 6, width: '85%' }} />
      </div>
    </div>
  )
}

// ── Formatage du temps ─────────────────────────────────────────────────────────
function formatTime(dt) {
  if (!dt) return ''
  const d   = new Date(dt)
  const now = new Date()
  const diff = now - d
  if (diff < 60_000)     return 'À l\'instant'
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)} min`
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
