import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useSettingsStore } from '../../store/useSettingsStore'

export function AppShell() {
  const { init } = useSettingsStore()
  useEffect(() => { init() }, [])

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
