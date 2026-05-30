import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Consistency } from './pages/Consistency'
import { Journal } from './pages/Journal'
import { Finance } from './pages/Finance'
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
        Loading...
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
          <Route path="/consistency" element={<ErrorBoundary><Consistency /></ErrorBoundary>} />
          <Route path="/journal" element={<ErrorBoundary><Journal /></ErrorBoundary>} />
          <Route path="/finance" element={<ErrorBoundary><Finance /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
