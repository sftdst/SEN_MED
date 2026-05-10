import { useState, useEffect } from 'react'
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { prefs } = useTheme()
  const isDark = prefs.theme_mode === 'dark'

  // Détection redimensionnement
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleMobileSidebar = () => setMobileSidebarOpen(o => !o)
  const closeMobileSidebar = () => setMobileSidebarOpen(false)

  return (
    <ChatProvider>
      <div style={{
        display: 'flex', height: '100vh',
        background: isDark ? '#0f172a' : colors.gray50,
        overflow: 'hidden',
        transition: 'background .3s',
      }}>
        {/* Overlay pour mobile */}
        {isMobile && mobileSidebarOpen && (
          <div className="sidebar-overlay active" onClick={closeMobileSidebar} />
        )}

        <Sidebar
          collapsed={collapsed}
          isMobile={isMobile}
          isOpen={mobileSidebarOpen}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header
            onToggleSidebar={() => setCollapsed(c => !c)}
            isMobile={isMobile}
            onToggleMobileSidebar={toggleMobileSidebar}
            mobileSidebarOpen={mobileSidebarOpen}
          />
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
