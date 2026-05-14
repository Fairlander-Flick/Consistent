import { useState } from 'react'
import { useGoalsStore } from '../../store/useGoalsStore'
import { Card } from '../ui/Card'
import { ContributionModal } from './ContributionModal'
import { todayISO } from '../../lib/dateUtils'

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly']

function generateDates(period, count) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    const offset = count - 1 - i
    if (period === 'daily')   d.setDate(d.getDate() - offset)
    else if (period === 'weekly')  d.setDate(d.getDate() - offset * 7)
    else if (period === 'monthly') d.setMonth(d.getMonth() - offset)
    else                           d.setFullYear(d.getFullYear() - offset)
    return d.toISOString().slice(0, 10)
  })
}

const COUNTS = { daily: 52, weekly: 26, monthly: 18, yearly: 10 }

function ContributionRow({ period, history, onSquareClick }) {
  const dates    = generateDates(period, COUNTS[period])
  const todayStr = todayISO()

  const filled   = history.filter(h => h.period === period && h.completed).length
  const total    = dates.length

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{
          fontSize: '9px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {period}
        </span>
        <span className="nums" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
          {filled}/{total}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
        {dates.map(date => {
          const entry     = history.find(h => h.date === date && h.period === period)
          const completed = entry?.completed
          const isToday   = date === todayStr

          return (
            <div
              key={date}
              onClick={() => onSquareClick({ date, period })}
              title={date}
              style={{
                width: '13px',
                height: '13px',
                borderRadius: '3px',
                background: completed
                  ? `rgba(35,194,106,${0.5 + 0.5 * (completed ? 1 : 0)})`
                  : 'var(--bg-elevated)',
                outline: isToday ? '1.5px solid var(--accent-green)' : 'none',
                outlineOffset: '1px',
                cursor: 'pointer',
                transition: 'background var(--transition), transform 80ms',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
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
      <span className="label">Consistency</span>
      {PERIODS.map(p => (
        <ContributionRow key={p} period={p} history={history} onSquareClick={setSelected} />
      ))}
      <ContributionModal item={selected} onClose={() => setSelected(null)} />
    </Card>
  )
}
