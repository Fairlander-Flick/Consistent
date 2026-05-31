import { useMemo, useState, useRef } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { useGoalsStore } from '../../store/useGoalsStore'
import { periodRecap, monthDates, yearDates } from '../../lib/recap'
import { isoWeekDates, todayISO } from '../../lib/dateUtils'
import { useDashboard } from '../../lib/DashboardContext'
import { Swap, PopNumber, useTabPill } from '../ui/transitions'

function Metric({ label, value, sub, tone }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </div>
      <PopNumber className="num num-md" value={value} style={{ color: tone === 'pos' ? 'var(--accent)' : tone === 'neg' ? 'var(--negative)' : 'var(--text)' }} />

      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  )
}

export function RecapCard() {
  const { entries } = useJournalStore()
  const { goals } = useGoalsStore()
  const [period, setPeriod] = useState('week')
  const { viewDate } = useDashboard()
  const isViewingPast = viewDate !== todayISO()
  const tabsRef = useRef(null)
  useTabPill(tabsRef)

  const dates = useMemo(() => {
    const now = new Date()
    if (period === 'week') return isoWeekDates(now)
    if (period === 'month') return monthDates(now.getFullYear(), now.getMonth())
    return yearDates(now.getFullYear())
  }, [period])

  const goalPeriod = period === 'week' ? goals.weekly : period === 'month' ? goals.monthly : goals.yearly

  const r = useMemo(
    () => periodRecap({ journalEntries: entries, goalPeriod }, dates),
    [entries, goalPeriod, dates]
  )

  return (
    <div className="card area-recap">
      <div className="card-h">
        <h3>Recap</h3>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          {isViewingPast && (
            <span className="meta" style={{ color: 'var(--text-mid)' }}>as of today</span>
          )}
          <div className="tabs" ref={tabsRef}>
            <button type="button" className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>This week</button>
            <button type="button" className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>This month</button>
            <button type="button" className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>This year</button>
          </div>
        </div>
      </div>
      <Swap swapKey={period} className="recap-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Metric
          label="Avg sleep"
          value={r.sleepAvg != null ? `${r.sleepAvg.toFixed(1)}h` : '—'}
          sub={r.moodAvg != null ? `mood ${r.moodAvg.toFixed(1)}` : 'no mood'}
        />
        <Metric
          label="Goals"
          value={r.goalsTotal ? `${r.goalsDone}/${r.goalsTotal}` : '—'}
          sub={r.goalsTotal ? `${Math.round((r.goalsDone / r.goalsTotal) * 100)}% done` : 'none set'}
          tone={r.goalsTotal && r.goalsDone === r.goalsTotal ? 'pos' : undefined}
        />
      </Swap>
    </div>
  )
}
