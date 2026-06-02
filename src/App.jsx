import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Goals } from './pages/Goals'
import { Planner } from './pages/Planner'
import { Consistency } from './pages/Consistency'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useAuthStore } from './store/useAuthStore'

export default function App() {
  const { init, status } = useAuthStore()

  useEffect(() => { init() }, [init])

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        color: 'var(--muted)', fontSize: 13, background: 'var(--bg)',
      }}>
        Loading…
      </div>
    )
  }

  if (status === 'guest') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route element={<AppShell />}>
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/goals" element={<ErrorBoundary><Goals /></ErrorBoundary>} />
          <Route path="/planner" element={<ErrorBoundary><Planner /></ErrorBoundary>} />
          <Route path="/consistency" element={<ErrorBoundary><Consistency /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
