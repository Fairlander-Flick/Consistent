import { useTrainingStore } from '../../store/useTrainingStore'
import { Card } from '../ui/Card'
import { isoWeekDates, weekDays, todayISO } from '../../lib/dateUtils'

export function WeeklyRing() {
  const { isWorkedOut } = useTrainingStore()
  const dates = isoWeekDates()
  const labels = weekDays()
  const today = todayISO()

  return (
    <Card>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        This Week
      </div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
        {dates.map((date, i) => {
          const done = isWorkedOut(date)
          const isToday = date === today
          return (
            <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: done ? 'var(--accent-green)' : 'var(--bg)',
                border: isToday
                  ? '1px solid var(--accent-green)'
                  : '1px solid var(--border)',
                opacity: done ? 0.9 : 1,
              }} />
              <span style={{
                fontSize: '9px',
                color: isToday ? 'var(--accent-green)' : 'var(--text-muted)',
                fontWeight: isToday ? 600 : 400,
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
