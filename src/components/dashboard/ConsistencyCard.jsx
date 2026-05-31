import { useState, useMemo } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { todayISO } from '../../lib/dateUtils'
import { useDashboard } from '../../lib/DashboardContext'
import { buildYearGrid } from '../../lib/consistencyGrid'
import { CardTitleLink } from './CardTitleLink'
import { Swap } from '../ui/transitions'

const DOW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const CELL = 12
const GAP = 3
const PITCH = CELL + GAP

function buildTooltip(dateStr, byDate) {
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
    const ds = `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}-${String(wd.getDate()).padStart(2, '0')}`
    const entry = byDate.get(ds)
    if (entry?.score != null) scores.push(entry.score / 10)
  }
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) : 0
  const monLabel = monday.toLocaleString('en', { month: 'short', day: 'numeric' })
  const sunLabel = sunday.toLocaleString('en', { month: 'short', day: 'numeric' })

  return `${line1}\nWeek: ${monLabel} – ${sunLabel} · ${avg}%`
}

export function ConsistencyCard() {
  const { entries } = useJournalStore()
  const { viewDate, setViewDate } = useDashboard()
  const todayStr = todayISO()
  const currentYear = new Date().getFullYear()

  const years = useMemo(() => {
    const dataYears = []
    for (const e of entries) {
      const y = parseInt(e.date.slice(0, 4))
      if (!isNaN(y)) dataYears.push(y)
    }
    const minYear = dataYears.length ? Math.min(...dataYears) : currentYear
    return Array.from({ length: currentYear - minYear + 1 }, (_, i) => minYear + i)
  }, [entries, currentYear])

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [hover, setHover] = useState(null)

  const byDate = useMemo(() => new Map(entries.map(e => [e.date, e])), [entries])

  const { cells, monthCols, totalCols } = useMemo(
    () => buildYearGrid(selectedYear, byDate), [selectedYear, byDate]
  )

  const activeDays = useMemo(
    () => cells.filter(c => c && c.level > 0).length, [cells]
  )

  function handleCellClick(dateStr) {
    setViewDate(dateStr === viewDate || dateStr === todayStr ? todayStr : dateStr)
  }

  return (
    <div className="card area-contrib">
      <div className="card-h">
        <CardTitleLink to="/consistency">Consistency</CardTitleLink>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <span className="meta">{activeDays} active days in {selectedYear}</span>
          <div className="tabs">
            {years.map(y => (
              <button key={y} className={selectedYear === y ? 'active' : ''} onClick={() => setSelectedYear(y)}>{y}</button>
            ))}
          </div>
        </div>
      </div>

      <Swap swapKey={selectedYear} style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginTop: 18, flexShrink: 0 }}>
          {DOW_LABELS.map((lbl, i) => (
            <div key={i} style={{ height: CELL, fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', lineHeight: `${CELL}px`, width: 24, textAlign: 'right' }}>
              {lbl}
            </div>
          ))}
        </div>

        <div style={{ flexShrink: 0 }}>
          <div style={{ position: 'relative', height: 14, marginBottom: 4, width: totalCols * PITCH }}>
            {monthCols.map(({ label, col }) => (
              <div key={label} style={{
                position: 'absolute', left: col * PITCH, top: 0,
                fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', lineHeight: '14px',
              }}>
                {label}
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gridAutoFlow: 'column',
            gridAutoColumns: `${CELL}px`,
            gap: GAP,
          }}>
            {cells.map((cell, i) => cell === null ? (
              <div key={`lead-${i}`} style={{ width: CELL, height: CELL }} />
            ) : (
              <div
                key={cell.dateStr}
                className="cg-square"
                data-fill={cell.level}
                data-today={cell.dateStr === todayStr ? '1' : '0'}
                style={{
                  width: CELL, height: CELL, cursor: 'pointer',
                  outline: cell.dateStr === viewDate && viewDate !== todayStr ? '1.5px solid var(--accent)' : 'none',
                  outlineOffset: '1px',
                }}
                onMouseEnter={e => setHover({ dateStr: cell.dateStr, rect: e.currentTarget.getBoundingClientRect() })}
                onMouseLeave={() => setHover(null)}
                onClick={() => handleCellClick(cell.dateStr)}
              />
            ))}
          </div>
        </div>
      </Swap>

      {hover && (
        <div className="tt" style={{
          position: 'fixed', left: hover.rect.left, top: hover.rect.top - 52,
          whiteSpace: 'pre', fontSize: 10, lineHeight: 1.6, pointerEvents: 'none',
        }}>
          {buildTooltip(hover.dateStr, byDate)}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--muted)' }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(l => (
          <div key={l} className="cg-square" data-fill={l} style={{ width: CELL, height: CELL, cursor: 'default' }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
