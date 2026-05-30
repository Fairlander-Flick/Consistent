import { useState, useMemo } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { todayISO } from '../../lib/dateUtils'
import { useDashboard } from '../../lib/DashboardContext'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DOW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const CELL = 12
const GAP = 3
const PITCH = CELL + GAP

function buildYearGrid(year, entries) {
  const jan1 = new Date(year, 0, 1)
  const leadingEmpty = (jan1.getDay() + 6) % 7
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInYear = isLeap ? 366 : 365

  const cells = Array.from({ length: leadingEmpty }, () => null)
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(year, 0, 1 + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const entry = entries.find(e => e.date === dateStr)
    const score = entry?.score ?? null
    const level = score === null ? 0 : score >= 8 ? 4 : score >= 6 ? 3 : score >= 4 ? 2 : 1
    cells.push({ dateStr, level })
  }

  const monthCols = MONTH_LABELS.map((label, m) => {
    const firstOfMonth = new Date(year, m, 1)
    const diffDays = Math.round((firstOfMonth - jan1) / 86400000)
    const col = Math.floor((leadingEmpty + diffDays) / 7)
    return { label, col }
  })

  const totalCols = Math.ceil(cells.length / 7)
  return { cells, monthCols, totalCols }
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
    const ds = `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}-${String(wd.getDate()).padStart(2, '0')}`
    const entry = entries.find(e => e.date === ds)
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
    const dataYears = entries.map(e => parseInt(e.date.slice(0, 4))).filter(y => !isNaN(y))
    const minYear = dataYears.length ? Math.min(...dataYears) : currentYear
    return Array.from({ length: currentYear - minYear + 1 }, (_, i) => minYear + i)
  }, [entries, currentYear])

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [hover, setHover] = useState(null)

  const { cells, monthCols, totalCols } = useMemo(
    () => buildYearGrid(selectedYear, entries), [selectedYear, entries]
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
        <h3>Consistency</h3>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <span className="meta">{activeDays} active days in {selectedYear}</span>
          <div className="tabs">
            {years.map(y => (
              <button key={y} className={selectedYear === y ? 'active' : ''} onClick={() => setSelectedYear(y)}>{y}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
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
              <div key={i} style={{ width: CELL, height: CELL }} />
            ) : (
              <div
                key={i}
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
      </div>

      {hover && (
        <div className="tt" style={{
          position: 'fixed', left: hover.rect.left, top: hover.rect.top - 52,
          whiteSpace: 'pre', fontSize: 10, lineHeight: 1.6, pointerEvents: 'none',
        }}>
          {buildTooltip(hover.dateStr, entries)}
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
