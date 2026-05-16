import { useMemo, useState } from 'react'
import { useTrainingStore } from '../../store/useTrainingStore'
import { useJournalStore } from '../../store/useJournalStore'
import { useFinanceStore } from '../../store/useFinanceStore'
import { useGoalsStore } from '../../store/useGoalsStore'
import { periodRecap, monthDates } from '../../lib/recap'
import { isoWeekDates } from '../../lib/dateUtils'

function Metric({ label, value, sub, tone }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </div>
      <div className="num num-md" style={{ color: tone === 'pos' ? 'var(--accent)' : tone === 'neg' ? 'var(--negative)' : 'var(--text)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  )
}

export function RecapCard() {
  const { log } = useTrainingStore()
  const { entries } = useJournalStore()
  const { transactions } = useFinanceStore()
  const { goals } = useGoalsStore()
  const [period, setPeriod] = useState('week')

  const dates = useMemo(() => {
    if (period === 'week') return isoWeekDates(new Date())
    const now = new Date()
    return monthDates(now.getFullYear(), now.getMonth())
  }, [period])

  const goalPeriod = period === 'week' ? goals.weekly : goals.monthly

  const r = useMemo(
    () => periodRecap({ log, journalEntries: entries, transactions, goalPeriod }, dates),
    [log, entries, transactions, goalPeriod, dates]
  )

  return (
    <div className="card">
      <div className="card-h">
        <h3>Recap</h3>
        <div className="tabs">
          <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>This week</button>
          <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>This month</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Metric
          label="Trained"
          value={`${r.trainingCount}×`}
          sub={r.trainingMinutes ? `${r.trainingMinutes} min` : '—'}
        />
        <Metric
          label="Avg sleep"
          value={r.sleepAvg != null ? `${r.sleepAvg.toFixed(1)}h` : '—'}
          sub={r.moodAvg != null ? `mood ${r.moodAvg.toFixed(1)}` : 'no mood'}
        />
        <Metric
          label="Net"
          value={`${r.net < 0 ? '−' : ''}€${Math.abs(Math.round(r.net)).toLocaleString()}`}
          sub={`€${Math.round(r.spend).toLocaleString()} spent`}
          tone={r.net < 0 ? 'neg' : r.net > 0 ? 'pos' : undefined}
        />
        <Metric
          label="Goals"
          value={r.goalsTotal ? `${r.goalsDone}/${r.goalsTotal}` : '—'}
          sub={r.goalsTotal ? `${Math.round((r.goalsDone / r.goalsTotal) * 100)}% done` : 'none set'}
          tone={r.goalsTotal && r.goalsDone === r.goalsTotal ? 'pos' : undefined}
        />
      </div>
    </div>
  )
}
