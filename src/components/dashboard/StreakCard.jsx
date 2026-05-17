import { useMemo } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { useTrainingStore } from '../../store/useTrainingStore'
import { computeStreak, journalDates, trainingDates } from '../../lib/streaks'
import { todayISO } from '../../lib/dateUtils'
import { useDashboard } from '../../lib/DashboardContext'

function StreakStat({ label, current, longest }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label}
      </div>
      <div className="num num-lg" style={{ color: current > 0 ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>
        {current}
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginLeft: 4 }}>
          {current === 1 ? 'day' : 'days'}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
        best · {longest}
      </div>
    </div>
  )
}

export function StreakCard() {
  const { entries } = useJournalStore()
  const { log } = useTrainingStore()
  const today = todayISO()
  const { viewDate } = useDashboard()
  const isViewingPast = viewDate !== today

  const journal = useMemo(
    () => computeStreak(journalDates(entries), today),
    [entries, today]
  )
  const training = useMemo(
    () => computeStreak(trainingDates(log), today),
    [log, today]
  )

  return (
    <div className="card">
      <div className="card-h">
        <h3>Streaks</h3>
        {isViewingPast
          ? <span className="meta" style={{ color: 'var(--text-mid)' }}>as of today</span>
          : journal.current >= 3 && <span className="meta">🔥 on a roll</span>
        }
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <StreakStat label="Journal" current={journal.current} longest={journal.longest} />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StreakStat label="Training" current={training.current} longest={training.longest} />
      </div>
    </div>
  )
}
