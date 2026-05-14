import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useSettingsStore } from '../../store/useSettingsStore'

export function AppShell() {
  const { init } = useSettingsStore()
  useEffect(() => { init() }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <div style={{ display: 'none' }} className="sidebar-wrapper">
        <Sidebar />
      </div>
      <main style={{ flex: 1, minHeight: '100dvh', overflowY: 'auto' }}>
        <Outlet />
      </main>
      <div className="bottom-nav-wrapper">
        <BottomNav />
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .sidebar-wrapper  { display: block !important; }
          .bottom-nav-wrapper { display: none; }
          main { margin-left: var(--sidebar-width); padding: 36px 44px; }
        }
        @media (max-width: 1023px) {
          main { padding: 20px 16px 90px; }
        }
        @media (max-width: 640px) {
          main { padding: 16px 12px 88px; }
        }
      `}</style>
    </div>
  )
}
