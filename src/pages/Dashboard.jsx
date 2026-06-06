import { useState, useRef, useEffect, useCallback } from 'react'
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
import { readMs } from '../components/ui/transitions'

const FULL_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// Cards that can appear on the dashboard, in masonry order. Visibility is a
// per-card toggle in the "Customize" menu (persisted in settings).
const CARDS = [
  { key: 'recap', label: 'Recap', Comp: RecapCard },
  { key: 'week', label: 'This week', Comp: WeekPlannerCard },
  { key: 'weight', label: 'Weight', Comp: GraphCard },
  { key: 'goals', label: 'Goals', Comp: GoalsCard },
  { key: 'free', label: 'Time Management', Comp: FreeTimeCard },
  { key: 'consistency', label: 'Consistency', Comp: ConsistencyCard },
]

function formatViewDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
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
  const [custClosing, setCustClosing] = useState(false)
  const custRef = useRef(null)

  const closeCust = useCallback(() => {
    if (custClosing) return
    setCustOpen(false)
    setCustClosing(true)
    setTimeout(() => setCustClosing(false), readMs('--dropdown-close-dur', 150))
  }, [custClosing])

  useEffect(() => {
    if (!custOpen) return
    const onDoc = (e) => { if (custRef.current && !custRef.current.contains(e.target)) closeCust() }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [custOpen, closeCust])

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
            onClick={() => custOpen ? closeCust() : setCustOpen(true)}
            aria-haspopup="true"
            aria-expanded={custOpen}
          >
            <IconSettings size={13} /> Customize
          </button>
          <div
            className={'dash-cust-menu t-dropdown' + (custOpen ? ' is-open' : '') + (custClosing ? ' is-closing' : '')}
            data-origin="top-right"
            role="menu"
          >
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
            as if you were back in <strong>{formatViewDate(viewDate)}</strong>
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

      <div className="bento">
        {/* The right column (Weight · This Week · Time) sets the height; Goals on
            the left fills the space under Recap to match it and scrolls inside
            when its tree overflows. Below tablet width both stack. */}
        <div className="bento-col">
          {isOn('recap') && <RecapCard />}
          {isOn('goals') && <GoalsCard />}
        </div>
        <div className="bento-col">
          {isOn('weight') && <GraphCard />}
          {isOn('week') && <WeekPlannerCard />}
          {isOn('free') && <FreeTimeCard />}
        </div>
        {isOn('consistency') && <ConsistencyCard />}
      </div>
    </DashboardContext.Provider>
  )
}
