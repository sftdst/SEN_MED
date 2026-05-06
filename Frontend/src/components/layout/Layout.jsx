import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { colors } from '../../theme'
import { ToastContainer } from '../ui/Toast'
import { ChatProvider } from '../../contexts/ChatContext'
import ChatDrawer from '../chat/ChatDrawer'
import { useTheme } from '../../contexts/ThemeContext'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { prefs } = useTheme()
  const isDark = prefs.theme_mode === 'dark'

  return (
    <ChatProvider>
      <div style={{
        display: 'flex', height: '100vh',
        background: isDark ? '#0f172a' : colors.gray50,
        overflow: 'hidden',
        transition: 'background .3s',
      }}>
        <Sidebar collapsed={collapsed} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header onToggleSidebar={() => setCollapsed(c => !c)} />
          <main
            id="app-main"
            style={{ flex: 1, overflowY: 'auto', padding: 28 }}
            data-theme={prefs.theme_mode}
          >
            <Outlet />
          </main>
        </div>
        <ToastContainer />
        <ChatDrawer />
      </div>
    </ChatProvider>
  )
}
