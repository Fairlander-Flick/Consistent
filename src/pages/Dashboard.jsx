import { useState } from 'react'
import { GraphCard } from '../components/dashboard/GraphCard'
import { ThisWeekCard } from '../components/dashboard/ThisWeekCard'
import { JournalCard } from '../components/dashboard/JournalCard'
import { GoalsCard } from '../components/dashboard/GoalsCard'
import { ConsistencyCard } from '../components/dashboard/ConsistencyCard'
import { DashboardContext } from '../lib/DashboardContext'
import { todayISO } from '../lib/dateUtils'

const FULL_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatViewDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function Dashboard() {
  const todayStr = todayISO()
  const [viewDate, setViewDate] = useState(todayStr)
  const isViewingPast = viewDate !== todayStr
  const today = new Date()

  return (
    <DashboardContext.Provider value={{ viewDate, setViewDate }}>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub" style={{ marginTop: 4 }}>
            {FULL_DAYS[today.getDay()]} · {FULL_MONTHS[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
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
            Viewing <strong>{formatViewDate(viewDate)}</strong>
          </span>
          <button
            className="btn ghost sm"
            onClick={() => setViewDate(todayStr)}
          >
            ← Return to today
          </button>
        </div>
      )}

      <div className="bento">
        <GraphCard />
        <ThisWeekCard />
        <JournalCard />
        <GoalsCard />
        <ConsistencyCard />
      </div>
    </DashboardContext.Provider>
  )
}
