import { useState, useRef, useEffect } from 'react'
import { GraphCard } from '../components/dashboard/GraphCard'
import { FreeTimeCard } from '../components/dashboard/FreeTimeCard'
import { GoalsCard } from '../components/dashboard/GoalsCard'
import { ConsistencyCard } from '../components/dashboard/ConsistencyCard'
import { RecapCard } from '../components/dashboard/RecapCard'
import { WeekPlannerCard } from '../components/dashboard/WeekPlannerCard'
import { DashboardContext } from '../lib/DashboardContext'
import { useSettingsStore } from '../store/useSettingsStore'
import { IconSettings } from '../components/ui/Icons'
import { todayISO } from '../lib/dateUtils'

const FULL_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// Cards that can appear on the dashboard, in masonry order. Visibility is a
// per-card toggle in the "Customize" menu (persisted in settings).
const CARDS = [
  { key: 'recap', label: 'Recap', Comp: RecapCard },
  { key: 'week', label: 'This week', Comp: WeekPlannerCard },
  { key: 'weight', label: 'Weight', Comp: GraphCard },
  { key: 'pursuits', label: 'Pursuits', Comp: GoalsCard },
  { key: 'free', label: 'Free time', Comp: FreeTimeCard },
  { key: 'consistency', label: 'Consistency', Comp: ConsistencyCard },
]

function formatViewDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function Dashboard() {
  const todayStr = todayISO()
  const [viewDate, setViewDate] = useState(todayStr)
  const isViewingPast = viewDate !== todayStr
  const today = new Date()

  const dashboardCards = useSettingsStore(s => s.dashboardCards)
  const setDashboardCard = useSettingsStore(s => s.setDashboardCard)
  const isOn = (k) => dashboardCards?.[k] !== false

  const [custOpen, setCustOpen] = useState(false)
  const custRef = useRef(null)
  useEffect(() => {
    if (!custOpen) return
    const onDoc = (e) => { if (custRef.current && !custRef.current.contains(e.target)) setCustOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [custOpen])

  return (
    // React Compiler auto-memoizes this value, so an inline object is safe here.
    <DashboardContext.Provider value={{ viewDate, setViewDate }}>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub" style={{ marginTop: 4 }}>
            {FULL_DAYS[today.getDay()]} · {FULL_MONTHS[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
          </div>
        </div>

        <div className="dash-cust" ref={custRef}>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => setCustOpen(o => !o)}
            aria-haspopup="true"
            aria-expanded={custOpen}
          >
            <IconSettings size={13} /> Customize
          </button>
          {custOpen && (
            <div className="dash-cust-menu" role="menu">
              <div className="dash-cust-title">Cards on dashboard</div>
              {CARDS.map(c => (
                <label key={c.key} className="dash-cust-row">
                  <span>{c.label}</span>
                  <span className="toggle">
                    <input
                      type="checkbox"
                      aria-label={c.label}
                      checked={isOn(c.key)}
                      onChange={e => setDashboardCard(c.key, e.target.checked)}
                    />
                    <span className="toggle-track" />
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {isViewingPast && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          background: 'var(--faint)',
          border: '1px solid var(--border-strong)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: 13,
        }}>
          <span>
            Viewing <strong>{formatViewDate(viewDate)}</strong>
          </span>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => setViewDate(todayStr)}
          >
            ← Return to today
          </button>
        </div>
      )}

      <div className="dash-grid">
        {CARDS.filter(c => isOn(c.key)).map(({ key, Comp }) => <Comp key={key} />)}
      </div>
    </DashboardContext.Provider>
  )
}
