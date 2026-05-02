import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/axios'

const ChatCtx = createContext(null)

export function ChatProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('senmed_chat_user')) } catch { return null }
  })
  const [chatOpen, setChatOpen]             = useState(false)
  const [activeConvId, setActiveConvId]     = useState(null)
  const [unreadTotal, setUnreadTotal]       = useState(0)
  const [hasNewMsg, setHasNewMsg]           = useState(false)
  const pollRef                             = useRef(null)
  const prevUnreadRef                       = useRef(0)

  const setCurrentUser = useCallback((user) => {
    setCurrentUserState(user)
    if (user) localStorage.setItem('senmed_chat_user', JSON.stringify(user))
    else      localStorage.removeItem('senmed_chat_user')
  }, [])

  const fetchUnread = useCallback(async () => {
    if (!currentUser) return
    try {
      const { data } = await api.get('/chat/unread-count', { params: { staff_id: currentUser.id } })
      const count = data.count || 0
      if (count > prevUnreadRef.current) {
        setHasNewMsg(true)
        setTimeout(() => setHasNewMsg(false), 1000)
      }
      prevUnreadRef.current = count
      setUnreadTotal(count)
    } catch { /* silent */ }
  }, [currentUser])

  useEffect(() => {
    fetchUnread()
    pollRef.current = setInterval(fetchUnread, 5_000)
    return () => clearInterval(pollRef.current)
  }, [fetchUnread])

  const openConversation = useCallback((convId) => {
    setActiveConvId(convId)
    setChatOpen(true)
  }, [])

  return (
    <ChatCtx.Provider value={{
      currentUser, setCurrentUser,
      chatOpen, setChatOpen,
      activeConvId, setActiveConvId,
      unreadTotal, setUnreadTotal,
      hasNewMsg,
      openConversation, fetchUnread,
    }}>
      {children}
    </ChatCtx.Provider>
  )
}

export const useChat = () => useContext(ChatCtx)
