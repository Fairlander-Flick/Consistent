import { useState } from 'react'
import { useGoalsStore } from '../../store/useGoalsStore'
import { Card } from '../ui/Card'
import { ContributionModal } from './ContributionModal'
import { todayISO } from '../../lib/dateUtils'

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly']

function generateDates(period, count = 30) {
  const today = new Date()
  const dates = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today)
    if (period === 'daily') d.setDate(d.getDate() - i)
    else if (period === 'weekly') d.setDate(d.getDate() - i * 7)
    else if (period === 'monthly') d.setMonth(d.getMonth() - i)
    else d.setFullYear(d.getFullYear() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function ContributionRow({ period, history, onSquareClick }) {
  const dates = generateDates(period, period === 'daily' ? 52 : period === 'weekly' ? 24 : period === 'monthly' ? 18 : 10)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', width: '56px', flexShrink: 0 }}>
        {period}
      </span>
      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
        {dates.map(date => {
          const entry = history.find(h => h.date === date && h.period === period)
          const completed = entry?.completed
          const isToday = date === todayISO()
          return (
            <div
              key={date}
              onClick={() => onSquareClick({ date, period })}
              title={date}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: completed ? 'var(--accent-green)' : 'var(--bg)',
                border: isToday ? '1px solid var(--accent-green)' : '1px solid var(--border)',
                opacity: completed ? 0.85 : 1,
                cursor: 'pointer',
                transition: 'opacity var(--transition)',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export function ContributionGrid() {
  const { history } = useGoalsStore()
  const [selected, setSelected] = useState(null)

  return (
    <Card>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
        Consistency
      </div>
      {PERIODS.map(p => (
        <ContributionRow key={p} period={p} history={history} onSquareClick={setSelected} />
      ))}
      <ContributionModal item={selected} onClose={() => setSelected(null)} />
    </Card>
  )
}
