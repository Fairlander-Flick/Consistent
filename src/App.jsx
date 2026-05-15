import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Consistency } from './pages/Consistency'
import { Finance } from './pages/Finance'
import { Settings } from './pages/Settings'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/consistency" element={<ErrorBoundary><Consistency /></ErrorBoundary>} />
          <Route path="/finance" element={<ErrorBoundary><Finance /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
