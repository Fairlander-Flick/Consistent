import { useTrainingStore } from '../../store/useTrainingStore'
import { Card } from '../ui/Card'
import { isoWeekDates, weekDays, todayISO } from '../../lib/dateUtils'
import { DUMMY_TRAINED } from '../../lib/dummyData'

export function WeeklyRing() {
  const { isWorkedOut, log } = useTrainingStore()
  const hasData = log.length > 0
  const dates  = isoWeekDates()
  const labels = weekDays()
  const today  = todayISO()

  const isDone = (date) => hasData ? isWorkedOut(date) : DUMMY_TRAINED.has(date)
  const count  = dates.filter(isDone).length

  return (
    <Card style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="label" style={{ marginBottom: 0 }}>This week</span>
        {!hasData && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>sample</span>
        )}
      </div>

      <div className="metric-lg" style={{ marginTop: '10px', marginBottom: '16px' }}>
        {count}
        <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>
          / 7
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '8px', fontFamily: 'var(--font)', letterSpacing: 0 }}>
          sessions
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-track" style={{ marginBottom: '18px' }}>
        <div className="progress-fill" style={{ width: `${(count / 7) * 100}%` }} />
      </div>

      {/* Day tiles */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between', flex: 1, alignItems: 'flex-end' }}>
        {dates.map((date, i) => {
          const done    = isDone(date)
          const isToday = date === today
          const future  = date > today

          return (
            <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1 }}>
              <div style={{
                width: '100%',
                aspectRatio: '1',
                maxWidth: '36px',
                borderRadius: '7px',
                background: done
                  ? 'var(--accent-green)'
                  : future
                    ? 'var(--bg-elevated)'
                    : 'var(--bg-elevated)',
                outline: isToday && !done ? '1.5px solid var(--accent-green)' : 'none',
                outlineOffset: '1px',
                opacity: future ? 0.35 : 1,
                transition: 'background var(--transition)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {done && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" style={{ opacity: 0.9 }}>
                    <path d="M1 3.5L3.5 6L8 1" stroke="#041009" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: isToday ? 'var(--accent-green)' : 'var(--text-muted)',
              }}>
                {labels[i]}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
