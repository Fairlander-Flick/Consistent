import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLifelongStore } from '../../store/useLifelongStore'
import { useEssentialsStore } from '../../store/useEssentialsStore'
import { useDashboard } from '../../lib/DashboardContext'
import { todayISO } from '../../lib/dateUtils'
import {
  dailyAvailableHours, dayBreakdown, dayUsedHours, buildWeekFree,
} from '../../lib/timeBudget'
import { CardTitleLink } from './CardTitleLink'

const WD_INITIAL = { Mon: 'M', Tue: 'T', Wed: 'W', Thu: 'T', Fri: 'F', Sat: 'S', Sun: 'S' }

// round1 already trims precision; just stringify (8 → "8", 1.5 → "1.5").
function fmt(n) {
  return String(n)
}

// Descending green ramp derived from --accent, so segments read as one family.
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
  const date = viewDate || todayISO()

  const { available, free, over, breakdown, segs, week, hasEssentials } = useMemo(() => {
    const avail = dailyAvailableHours(essentials)
    const u = dayUsedHours(date, nodes)
    const bd = dayBreakdown(date, nodes)
    const denom = Math.max(avail, u) || 1
    return {
      available: avail,
      free: Math.round((avail - u) * 10) / 10,
      over: u > avail,
      breakdown: bd,
      segs: segments(bd, denom),
      week: buildWeekFree(date, nodes, essentials, todayISO()),
      hasEssentials: (Number(essentials.sleepPerDay) || 0) > 0 || (essentials.factors || []).length > 0,
    }
  }, [date, nodes, essentials])

  const shownLegend = breakdown.slice(0, 4)
  const moreCount = breakdown.length - shownLegend.length

  return (
    <div className="card area-free">
      <div className="card-h">
        <CardTitleLink to="/planner">Free time</CardTitleLink>
        <span className="meta">today</span>
      </div>

      <div className="ft-ring-wrap">
        <div className="ft-ring">
          <svg width="132" height="132" viewBox="0 0 42 42" className="ft-ring-in" role="img"
            aria-label={`${Math.max(0, free)} hours free of ${available} available today`}>
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

      {breakdown.length === 0 ? (
        <div className="ft-empty">
          {hasEssentials
            ? <>No sessions scheduled today — all {available}h free.</>
            : <>Set your <Link to="/settings">Life Essentials</Link> to size your day.</>}
        </div>
      ) : (
        <>
          {shownLegend.map((b, i) => (
            <div className="ft-leg" key={b.pursuitId}>
              <span className="dot" style={{ background: ramp(i) }} />
              <span className="nm">{b.title}</span>
              <span className="hr">{fmt(b.hours)}h</span>
            </div>
          ))}
          {moreCount > 0 && <div className="ft-more">+{moreCount} more</div>}
        </>
      )}

      <div className="ft-week">
        {week.map(d => {
          const fillPct = d.available > 0 ? Math.min(100, (d.used / d.available) * 100) : 0
          return (
            <div className={'ft-day' + (d.isToday ? ' today' : '') + (d.over ? ' over' : '')} key={d.date}>
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
