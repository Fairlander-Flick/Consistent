import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useDailyReminder } from '../../lib/useDailyReminder'

export function AppShell() {
  const { init } = useSettingsStore()
  useEffect(() => { init() }, [])
  useDailyReminder()

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
