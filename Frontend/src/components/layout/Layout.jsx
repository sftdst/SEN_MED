import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { colors } from '../../theme'
import { ToastContainer } from '../ui/Toast'
import { ChatProvider } from '../../contexts/ChatContext'
import ChatDrawer from '../chat/ChatDrawer'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ChatProvider>
      <div style={{ display: 'flex', height: '100vh', background: colors.gray50, overflow: 'hidden' }}>
        <Sidebar collapsed={collapsed} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header onToggleSidebar={() => setCollapsed(c => !c)} />
          <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
            <Outlet />
          </main>
        </div>
        <ToastContainer />
        <ChatDrawer />
      </div>
    </ChatProvider>
  )
}
