import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useTrainingStore } from '../../store/useTrainingStore'
import { todayISO, isoWeekDates } from '../../lib/dateUtils'

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const PROGRAM_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function weekdayProgramKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return PROGRAM_DAYS[(d.getDay() + 6) % 7]
}

export function ThisWeekCard() {
  const { log, program, logSession, deleteSession } = useTrainingStore()
  const todayStr = todayISO()
  const weekDates = isoWeekDates()

  const weekData = useMemo(() => {
    return weekDates.map((date, i) => {
      const isFuture = date > todayStr
      const logged = !!log.find(l => l.date === date)
      const dayKey = weekdayProgramKey(date)
      const hasExercises = (program[dayKey]?.exercises?.length ?? 0) > 0
      const dayName = program[dayKey]?.name || ''

      let state
      if (logged) {
        state = 'workout'
      } else if (!hasExercises) {
        state = 'rest'
      } else {
        state = 'upcoming'
      }

      return { label: DAY_LABELS[i], date, state, isToday: date === todayStr, dayKey, dayName }
    })
  }, [weekDates, log, program, todayStr])

  const todayData = weekData.find(d => d.isToday)
  const todaySession = log.find(l => l.date === todayStr)
  const sessionsDone = weekData.filter(d => d.state === 'workout').length
  const sessionsTotal = weekData.filter(d => d.state !== 'rest').length

  const stateStyle = {
    workout:  { background: 'var(--accent)', border: 'none', icon: '✓', iconColor: '#0a0a0a' },
    rest:     { background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.35)', icon: '○', iconColor: 'var(--accent)' },
    upcoming: { background: '#111', border: '1px solid #222', icon: '·', iconColor: 'var(--muted)' },
  }

  const todayVolume = todaySession
    ? todaySession.exercises.reduce((s, ex) => s + ex.sets.reduce((ss, set) => ss + set.reps * set.weight, 0), 0)
    : 0
  const todayDuration = todaySession?.durationMinutes ?? 0

  return (
    <div
      className="card area-workout"
      style={{ borderColor: todayData?.state === 'workout' ? 'var(--accent-line)' : undefined }}
    >
      <div className="card-h">
        <h3>This Week</h3>
        <span className="meta">{sessionsDone}/{sessionsTotal} sessions</span>
      </div>

      {/* 7-day row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 16 }}>
        {weekData.map((d, i) => {
          const s = stateStyle[d.state]
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
              <div style={{
                fontSize: 10,
                color: d.isToday ? 'var(--text)' : 'var(--muted)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: d.isToday ? 600 : 400,
              }}>
                {d.label}
              </div>
              <div style={{
                width: '100%', aspectRatio: '1 / 1', maxWidth: 36,
                borderRadius: 5,
                background: s.background,
                border: d.isToday ? `2px solid var(--text)` : s.border,
                boxShadow: d.isToday ? `inset 0 0 0 2px ${s.background}` : undefined,
                display: 'grid', placeItems: 'center',
                transition: 'all 180ms',
                fontSize: 13,
                color: s.iconColor,
              }}>
                {s.icon}
              </div>
            </div>
          )
        })}
      </div>

      {/* Today block */}
      {todayData && (
        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '12px 14px',
          marginBottom: 16,
        }}>
          {todayData.state === 'upcoming' && (
            <>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                Today · {new Date().toLocaleString('en', { weekday: 'long' })}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>
                {todayData.dayName || 'Workout day'}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className="btn primary"
                  onClick={() => logSession(todayStr, [], 0)}
                >
                  Mark done
                </button>
                <NavLink to="/consistency" className="btn ghost">
                  Open program →
                </NavLink>
              </div>
            </>
          )}

          {todayData.state === 'rest' && (
            <>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                Today · {new Date().toLocaleString('en', { weekday: 'long' })}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Rest day — kaliteli dinlen</div>
            </>
          )}

          {todayData.state === 'workout' && (
            <div className="row between">
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                  ✓ {todayData.dayName || 'Session'} logged
                </div>
                <div className="mono" style={{ fontSize: 12 }}>
                  {todayVolume.toLocaleString()} kg · {todayDuration} min
                </div>
              </div>
              <button
                className="btn ghost"
                onClick={() => deleteSession(todayStr)}
              >
                Undo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--muted)' }}>
        <span className="row" style={{ gap: 5 }}>
          <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: 2 }} />Workout
        </span>
        <span className="row" style={{ gap: 5 }}>
          <span style={{ width: 8, height: 8, background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 2 }} />Rest
        </span>
        <span className="row" style={{ gap: 5 }}>
          <span style={{ width: 8, height: 8, background: '#111', border: '1px solid #222', borderRadius: 2 }} />Upcoming
        </span>
      </div>
    </div>
  )
}
