import { useState, useMemo } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { useTrainingStore } from '../../store/useTrainingStore'
import { todayISO } from '../../lib/dateUtils'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DOW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const CELL = 11
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
  const { log: trainingLog } = useTrainingStore()
  const todayStr = todayISO()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2025 }, (_, i) => 2026 + i)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [hover, setHover] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  const { cells, monthCols, totalCols } = useMemo(
    () => buildYearGrid(selectedYear, entries), [selectedYear, entries]
  )

  function handleCellClick(dateStr) {
    if (dateStr === todayStr || dateStr === selectedDate) {
      setSelectedDate(null)
    } else {
      setSelectedDate(dateStr)
    }
  }

  const selectedEntry = selectedDate ? entries.find(e => e.date === selectedDate) : null
  const selectedSession = selectedDate ? trainingLog.find(l => l.date === selectedDate) : null
  const hasSelectedData = selectedEntry || selectedSession

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

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        {/* Day-of-week gutter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginTop: 18, flexShrink: 0 }}>
          {DOW_LABELS.map((lbl, i) => (
            <div key={i} style={{ height: CELL, fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)', lineHeight: `${CELL}px`, width: 24, textAlign: 'right' }}>
              {lbl}
            </div>
          ))}
        </div>

        <div style={{ flexShrink: 0 }}>
          {/* Floating month labels */}
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

          {/* Grid */}
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
                data-selected={cell.dateStr === selectedDate ? '1' : '0'}
                style={{
                  width: CELL,
                  height: CELL,
                  cursor: 'pointer',
                  outline: cell.dateStr === selectedDate ? '1.5px solid var(--accent)' : 'none',
                  outlineOffset: '1px',
                }}
                onMouseEnter={(e) => setHover({ dateStr: cell.dateStr, rect: e.currentTarget.getBoundingClientRect() })}
                onMouseLeave={() => setHover(null)}
                onClick={() => handleCellClick(cell.dateStr)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hover && !selectedDate && (
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

      {/* Selected day detail */}
      {selectedDate && (
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'var(--bg)',
          borderRadius: 6,
          border: '1px solid var(--border)',
          fontSize: 12,
        }}>
          <div className="row between" style={{ marginBottom: hasSelectedData ? 8 : 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <button
              className="btn ghost sm"
              style={{ padding: '2px 8px', fontSize: 11 }}
              onClick={() => setSelectedDate(null)}
            >
              ✕ Close
            </button>
          </div>
          {!hasSelectedData && (
            <div style={{ color: 'var(--muted)' }}>No data logged for this day.</div>
          )}
          {hasSelectedData && (
            <div className="row" style={{ gap: 20, flexWrap: 'wrap' }}>
              {selectedEntry?.score != null && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
                  <div className="num" style={{ fontSize: 16, color: 'var(--accent)' }}>{selectedEntry.score}<span style={{ fontSize: 11, color: 'var(--muted)' }}>/10</span></div>
                </div>
              )}
              {selectedEntry?.sleepHours != null && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sleep</div>
                  <div className="num" style={{ fontSize: 16 }}>{selectedEntry.sleepHours}<span style={{ fontSize: 11, color: 'var(--muted)' }}>h</span></div>
                </div>
              )}
              {selectedSession && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Training</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {selectedSession.exercises.length} exercises ·{' '}
                    <span className="mono" style={{ fontSize: 12 }}>
                      {selectedSession.exercises
                        .reduce((s, e) => s + e.sets.reduce((vs, set) => vs + set.reps * set.weight, 0), 0)
                        .toLocaleString()} kg
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
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
