import { useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useEssentialsStore } from '../../store/useEssentialsStore'
import { useDashboard } from '../../lib/DashboardContext'
import { todayISO } from '../../lib/dateUtils'
import {
  dailyAvailableHours, dayBreakdown, dayUsedHours, buildWeekFree, sessionsForDate,
} from '../../lib/timeBudget'
import { CardTitleLink } from './CardTitleLink'
import { useSelectPill } from '../ui/transitions'

const WD_INITIAL = { Mon: 'M', Tue: 'T', Wed: 'W', Thu: 'T', Fri: 'F', Sat: 'S', Sun: 'S' }

// round1 already trims precision; just stringify (8 → "8", 1.5 → "1.5").
function fmt(n) {
  return String(n)
}

// Descending accent ramp derived from --accent, so segments read as one family.
function ramp(i) {
  const pct = Math.max(34, 100 - i * 18)
  return `color-mix(in oklab, var(--accent) ${pct}%, var(--track))`
}

// Donut segment geometry on a 100-unit circumference (r≈15.9 in a 42 viewBox).
function segments(breakdown, denom) {
  let start = 0
  return breakdown.map((b, i) => {
    const len = denom > 0 ? (b.hours / denom) * 100 : 0
    const seg = { len, offset: -start, color: ramp(i), ...b }
    start += len
    return seg
  })
}

export function FreeTimeCard() {
  const nodes = useLifelongStore(s => s.nodes)
  const essentials = useEssentialsStore()
  const { viewDate } = useDashboard()
  const today = todayISO()
  const baseDate = viewDate || today

  // Which day's breakdown is shown — click a day in the week strip to switch.
  const [selectedDate, setSelectedDate] = useState(baseDate)
  // Sliding selection pill glides between days instead of snapping an outline.
  const weekRef = useRef(null)

  const { available, free, over, segs, sessions, colorOf, week, hasEssentials } = useMemo(() => {
    const avail = dailyAvailableHours(essentials)
    const u = dayUsedHours(selectedDate, nodes)
    const bd = dayBreakdown(selectedDate, nodes)
    const denom = Math.max(avail, u) || 1
    const cmap = new Map()
    bd.forEach((b, i) => cmap.set(b.pursuitId, ramp(i)))
    return {
      available: avail,
      free: Math.round((avail - u) * 10) / 10,
      over: u > avail,
      segs: segments(bd, denom),
      sessions: [...sessionsForDate(selectedDate, nodes)].sort((a, b) => b.hours - a.hours),
      colorOf: cmap,
      week: buildWeekFree(baseDate, nodes, essentials, today),
      hasEssentials: (Number(essentials.sleepPerDay) || 0) > 0 || (essentials.factors || []).length > 0,
    }
  }, [selectedDate, baseDate, nodes, essentials, today])

  useSelectPill(weekRef, [week.length], { variant: 'underline' })

  const sel = week.find(d => d.date === selectedDate)
  const selLabel = !sel || sel.isToday ? 'today' : `${sel.weekday} ${Number(selectedDate.slice(8, 10))}`
  const shownSessions = sessions.slice(0, 5)
  const moreCount = sessions.length - shownSessions.length

  return (
    <div className="card">
      <div className="card-h">
        <CardTitleLink to="/planner">Time Management</CardTitleLink>
        <span className="meta">{selLabel}</span>
      </div>

      <div className="ft-ring-wrap">
        <div className="ft-ring">
          <svg width="132" height="132" viewBox="0 0 42 42" className="ft-ring-in" role="img"
            aria-label={`${Math.max(0, free)} hours free of ${available} available on ${selLabel}`}>
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--track)" strokeWidth="4.2" />
            {segs.map(s => (
              <circle key={s.pursuitId} cx="21" cy="21" r="15.9" fill="none"
                stroke={s.color} strokeWidth="4.2"
                strokeDasharray={`${s.len} ${100 - s.len}`} strokeDashoffset={s.offset}
                transform="rotate(-90 21 21)" />
            ))}
          </svg>
          <div className="ft-center">
            <div className={'ft-h' + (over ? ' over' : '')}>{Math.max(0, free)}h</div>
            <div className="ft-l">{over ? 'OVER' : 'FREE'}</div>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="ft-empty">
          {hasEssentials
            ? <>Nothing scheduled {selLabel === 'today' ? 'today' : `on ${selLabel}`} — all {available}h free.</>
            : <>Set your <Link to="/settings">Life Essentials</Link> to size your day.</>}
        </div>
      ) : (
        <>
          {shownSessions.map(s => (
            <div className="ft-leg" key={s.id}>
              <span className="dot" style={{ background: colorOf.get(s.rootId) || 'var(--muted)' }} />
              <span className="nm">{s.title}{s.rootTitle && s.rootTitle !== s.title ? ` · ${s.rootTitle}` : ''}</span>
              <span className="hr">{fmt(s.hours)}h</span>
            </div>
          ))}
          {moreCount > 0 && <div className="ft-more">+{moreCount} more</div>}
        </>
      )}

      <div className="ft-week" ref={weekRef}>
        {week.map(d => {
          const fillPct = d.available > 0 ? Math.min(100, (d.used / d.available) * 100) : 0
          const isSel = d.date === selectedDate
          return (
            <div
              className={'ft-day' + (d.isToday ? ' today' : '') + (d.over ? ' over' : '') + (isSel ? ' sel' : '')}
              key={d.date}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              title={`${d.weekday}: ${fmt(d.used)}h scheduled · ${fmt(Math.max(0, d.free))}h free`}
              onClick={() => setSelectedDate(d.date)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDate(d.date) } }}
            >
              <span className="wd">{WD_INITIAL[d.weekday]}</span>
              <svg width="22" height="22" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="17" fill="none" stroke="var(--track)" strokeWidth="6" />
                {fillPct > 0 && (
                  <circle cx="21" cy="21" r="17" fill="none"
                    stroke={d.over ? 'var(--negative)' : 'var(--accent)'} strokeWidth="6"
                    strokeDasharray={`${fillPct} ${100 - fillPct}`} transform="rotate(-90 21 21)" />
                )}
              </svg>
              <span className="fr">{fmt(Math.max(0, d.free))}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
