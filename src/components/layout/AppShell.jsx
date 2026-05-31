import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Toaster } from '../ui/Toaster'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useDailyReminder } from '../../lib/useDailyReminder'

export function AppShell() {
  const { init } = useSettingsStore()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => { init() }, [init])
  useDailyReminder()

  useEffect(() => {
    function onKey(e) {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        navigate('/consistency')
      }
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        navigate('/consistency')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        {/* Keyed by pathname so each navigation remounts the content and
            replays the soft fade-up entrance (.route-enter in tokens.css). */}
        <div className="route-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <Toaster />
    </div>
  )
}
