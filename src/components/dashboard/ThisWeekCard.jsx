import { useMemo, useState } from 'react'
import { useTrainingStore } from '../../store/useTrainingStore'
import { useScheduleStore } from '../../store/useScheduleStore'
import { todayISO, isoWeekDates } from '../../lib/dateUtils'
import { useDashboard } from '../../lib/DashboardContext'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PROGRAM_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOUR_PX = 26
const MIN_BLOCK_PX = 16
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function weekdayProgramKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return PROGRAM_DAYS[(d.getDay() + 6) % 7]
}

function hhmmToMin(s) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

function kindColors(kind) {
  if (kind === 'work') return { base: 'var(--sched-work)', soft: 'var(--sched-work-soft)', line: 'var(--sched-work-line)' }
  if (kind === 'class') return { base: 'var(--sched-class)', soft: 'var(--sched-class-soft)', line: 'var(--sched-class-line)' }
  return { base: 'var(--sched-oneoff)', soft: 'var(--sched-oneoff-soft)', line: 'var(--sched-oneoff-line)' }
}

function dayMonthLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return { mon: MONTH_SHORT[d.getMonth()], day: d.getDate() }
}

export function ThisWeekCard() {
  const { log, program, logSession, deleteSession } = useTrainingStore()
  const { weekBlocks, addOneoff, removeOneoff, recurring, oneoffs } = useScheduleStore()
  const { viewDate } = useDashboard()
  const todayStr = todayISO()
  const week = useMemo(() => isoWeekDates(new Date(viewDate + 'T00:00:00')), [viewDate])

  const [addForm, setAddForm] = useState(null)        // dayIdx | null
  const [draft, setDraft] = useState({ kind: 'class', label: '', start: '09:00', end: '10:00' })
  const [hoverBlock, setHoverBlock] = useState(null)  // block id

  const weekData = useMemo(() => week.map((date, i) => {
    const logged = !!log.find(l => l.date === date)
    const dayKey = weekdayProgramKey(date)
    const hasExercises = (program[dayKey]?.exercises?.length ?? 0) > 0
    const dayName = program[dayKey]?.name || ''
    let state = logged ? 'workout' : !hasExercises ? 'rest' : 'upcoming'
    return { label: DAY_LABELS[i], date, state, isToday: date === todayStr, dayName }
  }), [week, log, program, todayStr])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const perDay = useMemo(() => weekBlocks(week), [week, recurring, oneoffs])
  const allBlocks = useMemo(() => perDay.flat(), [perDay])

  const { gridStartMin, gridEndMin } = useMemo(() => {
    if (allBlocks.length === 0) return { gridStartMin: 8 * 60, gridEndMin: 18 * 60 }
    const starts = allBlocks.map(b => hhmmToMin(b.start))
    const ends = allBlocks.map(b => hhmmToMin(b.end))
    let s = Math.floor(Math.min(...starts) / 60) * 60
    let e = Math.ceil(Math.max(...ends) / 60) * 60
    s = Math.min(s, 8 * 60)
    e = Math.max(e, 18 * 60)
    return { gridStartMin: s, gridEndMin: e }
  }, [allBlocks])

  const totalMin = gridEndMin - gridStartMin
  const bodyH = (totalMin / 60) * HOUR_PX
  const hourMarks = []
  for (let m = gridStartMin; m <= gridEndMin; m += 60) hourMarks.push(m)

  const totals = useMemo(() => {
    let workMin = 0, classMin = 0
    allBlocks.forEach(b => {
      const dur = hhmmToMin(b.end) - hhmmToMin(b.start)
      if (b.kind === 'work') workMin += dur
      else if (b.kind === 'class') classMin += dur
    })
    const fmt = n => Number.isInteger(n) ? n : n.toFixed(1)
    return { work: fmt(workMin / 60), class: fmt(classMin / 60) }
  }, [allBlocks])

  const a = dayMonthLabel(week[0])
  const b = dayMonthLabel(week[6])
  const rangeLabel = a.mon === b.mon ? `${a.mon} ${a.day} – ${b.day}` : `${a.mon} ${a.day} – ${b.mon} ${b.day}`

  const todayWorkout = weekData.find(d => d.isToday)?.state === 'workout'

  const openAdd = (i) => {
    setDraft({ kind: 'class', label: '', start: '09:00', end: '10:00' })
    setAddForm(i)
  }
  const saveOneoff = () => {
    if (!draft.label.trim() || !draft.start || !draft.end) return
    addOneoff({ date: week[addForm], kind: draft.kind, label: draft.label.trim(), start: draft.start, end: draft.end })
    setAddForm(null)
  }

  const minToTop = (min) => ((min - gridStartMin) / 60) * HOUR_PX

  return (
    <div className="card area-workout" style={{ borderColor: todayWorkout ? 'var(--accent-line)' : undefined }}>
      <div className="card-h">
        <h3>This Week</h3>
        <span className="meta">{rangeLabel} · {totals.work}h work · {totals.class}h class</span>
      </div>

      <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
        {/* Hour axis */}
        <div style={{ flexShrink: 0, width: 38, position: 'relative', marginTop: 72 }}>
          <div style={{ position: 'relative', height: bodyH }}>
            {hourMarks.map(m => (
              <div key={m} style={{
                position: 'absolute', top: minToTop(m) - 6, right: 6,
                fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
              }}>
                {String(Math.floor(m / 60)).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* 7 day columns */}
        {week.map((date, i) => {
          const wd = weekData[i]
          const blocks = perDay[i]
          const s = wd.state
          const pill =
            s === 'workout' ? { bg: 'var(--accent)', fg: '#0a0a0a', txt: '✓ Trained' } :
            s === 'rest' ? { bg: 'rgba(74,222,128,0.18)', fg: 'var(--accent)', txt: 'Rest day — recover well' } :
            { bg: '#111', fg: 'var(--muted)', txt: wd.dayName || 'Workout' }
          return (
            <div key={date} style={{ flex: 1, minWidth: 86, position: 'relative', borderLeft: '1px solid var(--border)' }}>
              {/* Column header */}
              <div style={{ padding: '0 4px', height: 72, boxSizing: 'border-box' }}>
                <div className="row between" style={{ marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                    color: wd.isToday ? 'var(--text)' : 'var(--muted)', fontWeight: wd.isToday ? 600 : 400,
                  }}>
                    {wd.label} {dayMonthLabel(date).day}
                  </span>
                  <button
                    onClick={() => addForm === i ? setAddForm(null) : openAdd(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0 }}
                    title="Add one-off"
                  >＋</button>
                </div>
                <div style={{
                  background: pill.bg, color: pill.fg, fontSize: 9, borderRadius: 4,
                  padding: '3px 5px', textAlign: 'center', lineHeight: 1.3, minHeight: 22,
                }}>
                  {pill.txt}
                </div>
                {wd.isToday && s === 'upcoming' && (
                  <button className="btn sm" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                          onClick={() => logSession(todayStr, [], 0)}>Mark done</button>
                )}
                {wd.isToday && s === 'workout' && (
                  <button className="btn sm ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                          onClick={() => deleteSession(todayStr)}>Undo</button>
                )}
              </div>

              {/* One-off add form */}
              {addForm === i && (
                <div style={{
                  position: 'absolute', top: 72, left: 2, right: 2, zIndex: 10,
                  background: 'var(--card)', border: '1px solid var(--border-strong)',
                  borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                  <select className="select" value={draft.kind}
                          onChange={e => setDraft(p => ({ ...p, kind: e.target.value }))}
                          style={{ height: 26, fontSize: 10, padding: '2px 4px' }}>
                    <option value="class">Class</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                  <input className="input" placeholder="label" value={draft.label}
                         onChange={e => setDraft(p => ({ ...p, label: e.target.value }))}
                         style={{ height: 26, fontSize: 10, padding: '2px 6px' }} />
                  <div className="row" style={{ gap: 4 }}>
                    <input className="input" type="time" value={draft.start}
                           onChange={e => setDraft(p => ({ ...p, start: e.target.value }))}
                           style={{ height: 26, fontSize: 10, padding: '2px 2px', flex: 1 }} />
                    <input className="input" type="time" value={draft.end}
                           onChange={e => setDraft(p => ({ ...p, end: e.target.value }))}
                           style={{ height: 26, fontSize: 10, padding: '2px 2px', flex: 1 }} />
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="btn sm" style={{ flex: 1, justifyContent: 'center' }} onClick={saveOneoff}>Save</button>
                    <button className="btn sm ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAddForm(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Time-grid body */}
              <div style={{
                position: 'relative', height: bodyH,
                background: wd.isToday ? 'var(--faint)' : 'transparent',
                borderTop: wd.isToday ? '2px solid var(--text)' : '1px solid var(--border)',
              }}>
                {hourMarks.slice(1, -1).map(m => (
                  <div key={m} style={{ position: 'absolute', left: 0, right: 0, top: minToTop(m), borderTop: '1px solid var(--border)' }} />
                ))}
                {blocks.map(blk => {
                  const c = kindColors(blk.kind)
                  const top = minToTop(hhmmToMin(blk.start))
                  const h = Math.max(MIN_BLOCK_PX, ((hhmmToMin(blk.end) - hhmmToMin(blk.start)) / 60) * HOUR_PX)
                  return (
                    <div key={blk.id}
                         onMouseEnter={() => setHoverBlock(blk.id)}
                         onMouseLeave={() => setHoverBlock(null)}
                         style={{
                           position: 'absolute', top, left: 2, right: 2, height: h,
                           background: c.soft, borderLeft: `2px solid ${c.base}`,
                           borderRadius: 3, padding: '2px 4px', overflow: 'hidden',
                           fontSize: 9, color: c.base, lineHeight: 1.2,
                         }}>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{blk.label}</div>
                      <div style={{ opacity: 0.8 }}>{blk.start}–{blk.end}</div>
                      {blk.source === 'oneoff' && hoverBlock === blk.id && (
                        <div onClick={() => removeOneoff(blk.id)}
                             style={{ position: 'absolute', top: 1, right: 3, cursor: 'pointer', color: 'var(--negative)', fontSize: 12, lineHeight: 1 }}>×</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
        <span className="row" style={{ gap: 5 }}>
          <span style={{ width: 8, height: 8, background: 'var(--sched-class)', borderRadius: 2 }} />Class
        </span>
        <span className="row" style={{ gap: 5 }}>
          <span style={{ width: 8, height: 8, background: 'var(--sched-work)', borderRadius: 2 }} />Work
        </span>
        <span className="row" style={{ gap: 5 }}>
          <span style={{ width: 8, height: 8, background: 'var(--sched-oneoff)', borderRadius: 2 }} />One-off
        </span>
      </div>
    </div>
  )
}
