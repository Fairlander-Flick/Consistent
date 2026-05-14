import { useState, useMemo } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { todayISO } from '../../lib/dateUtils'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DOW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

function buildYearCells(year, entries) {
  return Array.from({ length: 12 }, (_, m) => {
    const firstDay = new Date(year, m, 1)
    const daysInMonth = new Date(year, m + 1, 0).getDate()
    const startWeekday = (firstDay.getDay() + 6) % 7 // Mon=0
    const cells = Array.from({ length: startWeekday }, () => null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const entry = entries.find(e => e.date === dateStr)
      const score = entry?.score ?? null
      const level = score === null ? 0 : score >= 8 ? 4 : score >= 6 ? 3 : score >= 4 ? 2 : 1
      cells.push({ dateStr, level })
    }
    return cells
  })
}

function buildTooltip(dateStr, entries) {
  const d = new Date(dateStr + 'T00:00:00')
  const line1 = d.toLocaleString('en', { weekday: 'short' }) + ' · ' +
    d.toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric' })

  const dayOfWeek = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - dayOfWeek)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const scores = []
  for (let i = 0; i < 7; i++) {
    const wd = new Date(monday)
    wd.setDate(monday.getDate() + i)
    const iso = `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}-${String(wd.getDate()).padStart(2, '0')}`
    const entry = entries.find(e => e.date === iso)
    if (entry?.score != null) scores.push(entry.score / 10)
  }
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) : 0
  const monLabel = monday.toLocaleString('en', { month: 'short', day: 'numeric' })
  const sunLabel = sunday.toLocaleString('en', { month: 'short', day: 'numeric' })

  return `${line1}\nWeek: ${monLabel} – ${sunLabel} · ${avg}%`
}

export function ConsistencyCard() {
  const { entries } = useJournalStore()
  const todayStr = todayISO()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2025 }, (_, i) => 2026 + i)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [hover, setHover] = useState(null) // { dateStr, rect }

  const months = useMemo(() => buildYearCells(selectedYear, entries), [selectedYear, entries])

  return (
    <div className="card area-contrib">
      <div className="card-h">
        <h3>Consistency</h3>
        <div className="tabs">
          {years.map(y => (
            <button key={y} className={selectedYear === y ? 'active' : ''} onClick={() => setSelectedYear(y)}>
              {y}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
        {/* Day-of-week labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 18, marginRight: 8, flexShrink: 0 }}>
          {DOW_LABELS.map((lbl, i) => (
            <div key={i} style={{ height: 11, fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', lineHeight: '11px', width: 24, textAlign: 'right' }}>
              {lbl}
            </div>
          ))}
        </div>

        {/* Month blocks */}
        <div style={{ display: 'flex', gap: 4 }}>
          {months.map((cells, mIdx) => (
            <div key={mIdx} style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, height: 14, lineHeight: '14px' }}>
                {MONTH_LABELS[mIdx]}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateRows: 'repeat(7, 11px)',
                gridAutoFlow: 'column',
                gridAutoColumns: '11px',
                gap: 3,
              }}>
                {cells.map((cell, i) => cell === null ? (
                  <div key={i} style={{ width: 11, height: 11 }} />
                ) : (
                  <div
                    key={i}
                    className="cg-square"
                    data-fill={cell.level}
                    data-today={cell.dateStr === todayStr ? '1' : '0'}
                    style={{ width: 11, height: 11 }}
                    onMouseEnter={(e) => setHover({ dateStr: cell.dateStr, rect: e.currentTarget.getBoundingClientRect() })}
                    onMouseLeave={() => setHover(null)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip (fixed so it escapes overflow:auto) */}
      {hover && (
        <div
          className="tt"
          style={{
            position: 'fixed',
            left: hover.rect.left,
            top: hover.rect.top - 52,
            whiteSpace: 'pre',
            fontSize: 10,
            lineHeight: 1.6,
            pointerEvents: 'none',
          }}
        >
          {buildTooltip(hover.dateStr, entries)}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(l => (
          <div key={l} className="cg-square" data-fill={l} style={{ width: 11, height: 11, cursor: 'default' }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
