import { useMemo, useState, useRef } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { buildYearGrid } from '../../lib/consistencyGrid'
import { getWeekStart } from '../../lib/dateUtils'
import { useTabPill } from '../ui/transitions'

const DOW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const CELL = 12
const GAP = 3
const PITCH = CELL + GAP

function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function weekStartISO(dateStr) {
  return isoOf(getWeekStart(new Date(dateStr + 'T00:00:00')))
}

// Year contribution grid repurposed as a week picker: click any day to jump the
// Planner to that week; the selected week's column is outlined.
export function PlannerConsistency({ refDate, onPick }) {
  const { entries } = useJournalStore()
  const currentYear = new Date().getFullYear()
  const selectedWeek = weekStartISO(refDate)
  const tabsRef = useRef(null)
  useTabPill(tabsRef)

  const years = useMemo(() => {
    const ys = entries.map(e => parseInt(e.date.slice(0, 4))).filter(y => !isNaN(y))
    const min = ys.length ? Math.min(...ys) : currentYear
    const max = Math.max(currentYear, Number(refDate.slice(0, 4)) || currentYear)
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }, [entries, currentYear, refDate])

  const [year, setYear] = useState(Number(refDate.slice(0, 4)) || currentYear)
  const byDate = useMemo(() => new Map(entries.map(e => [e.date, e])), [entries])
  const { cells, monthCols, totalCols } = useMemo(() => buildYearGrid(year, byDate), [year, byDate])

  return (
    <div className="card">
      <div className="card-h">
        <h3>Pick a week</h3>
        <div className="tabs" ref={tabsRef}>
          {years.map(y => (
            <button type="button" key={y} className={year === y ? 'active' : ''} onClick={() => setYear(y)}>{y}</button>
          ))}
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
              <div key={`lead-${i}`} style={{ width: CELL, height: CELL }} />
            ) : (
              <button
                type="button"
                key={cell.dateStr}
                className="cg-square"
                data-fill={cell.level}
                title={cell.dateStr}
                aria-label={`Jump to week of ${cell.dateStr}`}
                style={{
                  width: CELL, height: CELL, cursor: 'pointer', padding: 0,
                  outline: weekStartISO(cell.dateStr) === selectedWeek ? '1.5px solid var(--accent)' : 'none',
                  outlineOffset: '1px',
                }}
                onClick={() => onPick(cell.dateStr)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
