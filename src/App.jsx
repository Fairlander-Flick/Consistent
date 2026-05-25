import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Consistency } from './pages/Consistency'
import { Calendar } from './pages/Calendar'
import { Finance } from './pages/Finance'
import { Settings } from './pages/Settings'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
// Side-effect import: ensures the training store initializes (and seeds the
// default program if localStorage is missing/empty) regardless of which
// route the user lands on first.
import './store/useTrainingStore'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/consistency" element={<ErrorBoundary><Consistency /></ErrorBoundary>} />
          <Route path="/calendar" element={<ErrorBoundary><Calendar /></ErrorBoundary>} />
          <Route path="/finance" element={<ErrorBoundary><Finance /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
