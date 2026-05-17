import { useMemo, useState } from 'react'
import { useTrainingStore } from '../store/useTrainingStore'
import { useJournalStore } from '../store/useJournalStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useWeightStore } from '../store/useWeightStore'
import { todayISO, isoToDisplay } from '../lib/dateUtils'
import { IconChevLeft, IconChevRight } from '../components/ui/Icons'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function iso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function weekdayKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return DAYS[(d.getDay() + 6) % 7]
}
function scoreLevel(score) {
  if (score == null) return 0
  return score >= 8 ? 4 : score >= 6 ? 3 : score >= 4 ? 2 : 1
}
function sessionVolume(session) {
  if (!session) return 0
  return (session.exercises || []).reduce(
    (sum, ex) => sum + (ex.sets || []).reduce((s, set) => s + (set.reps || 0) * (set.weight || 0), 0),
    0
  )
}

export function Calendar() {
  const { log } = useTrainingStore()
  const { entries: journal } = useJournalStore()
  const { recurring, oneoffs } = useScheduleStore()
  const { entries: weight } = useWeightStore()

  const today = todayISO()
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selected, setSelected] = useState(today)

  const grid = useMemo(() => {
    const first = new Date(view.y, view.m, 1)
    const lead = (first.getDay() + 6) % 7
    const days = new Date(view.y, view.m + 1, 0).getDate()
    const cells = Array.from({ length: lead }, () => null)
    for (let d = 1; d <= days; d++) {
      const date = iso(view.y, view.m, d)
      const session = log.find(s => s.date === date) || null
      const j = journal.find(e => e.date === date) || null
      const sched = (recurring[weekdayKey(date)] || []).length +
        oneoffs.filter(o => o.date === date).length
      cells.push({
        date,
        day: d,
        hasTraining: !!(session && (session.exercises?.length ?? 0) > 0),
        scoreLvl: scoreLevel(j?.score),
        sched,
        hasWeight: weight.some(w => w.date === date),
      })
    }
    return cells
  }, [view, log, journal, recurring, oneoffs, weight])

  const monthCount = useMemo(() => {
    const c = grid.filter(Boolean)
    return {
      trained: c.filter(x => x.hasTraining).length,
      journaled: c.filter(x => x.scoreLvl > 0).length,
    }
  }, [grid])

  const detail = useMemo(() => {
    const session = log.find(s => s.date === selected) || null
    const j = journal.find(e => e.date === selected) || null
    const w = weight.find(x => x.date === selected) || null
    const blocks = [
      ...(recurring[weekdayKey(selected)] || []).map(b => ({ ...b, source: 'weekly' })),
      ...oneoffs.filter(o => o.date === selected).map(o => ({ ...o, source: 'one-off' })),
    ].sort((a, b) => String(a.start).localeCompare(String(b.start)))
    return { session, j, w, blocks }
  }, [selected, log, journal, weight, recurring, oneoffs])

  const goPrev = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })
  const goNext = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calendar</h1>
          <div className="sub" style={{ marginTop: 4 }}>Training · Journal · Schedule in one view</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn icon" onClick={goPrev}><IconChevLeft size={14} /></button>
          <div className="mono" style={{ fontSize: 12, padding: '0 10px', minWidth: 140, textAlign: 'center', color: 'var(--text-mid)' }}>
            {MONTHS_FULL[view.m]} {view.y}
          </div>
          <button className="btn icon" onClick={goNext}><IconChevRight size={14} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="card-h">
            <h3>{MONTHS_FULL[view.m]} {view.y}</h3>
            <span className="meta">{monthCount.trained} trained · {monthCount.journaled} journaled</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {DAYS.map(d => (
              <div key={d} style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', paddingBottom: 4 }}>
                {d}
              </div>
            ))}
            {grid.map((c, i) => c === null ? (
              <div key={`e${i}`} />
            ) : (
              <button
                key={c.date}
                onClick={() => setSelected(c.date)}
                title={isoToDisplay(c.date)}
                style={{
                  aspectRatio: '1 / 1',
                  border: c.date === selected ? '1.5px solid var(--accent)'
                    : c.date === today ? '1px solid var(--text)' : '1px solid var(--border)',
                  background: c.scoreLvl > 0
                    ? `color-mix(in oklab, var(--accent) ${[0, 28, 55, 85, 100][c.scoreLvl]}%, var(--faint))`
                    : 'var(--card)',
                  borderRadius: 6,
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: c.scoreLvl >= 3 ? '#0a0a0a' : 'var(--text-mid)',
                }}
              >
                <span className="mono" style={{ fontSize: 11, fontWeight: c.date === today ? 700 : 400 }}>{c.day}</span>
                <span className="row" style={{ gap: 3, justifyContent: 'flex-end' }}>
                  {c.hasTraining && <span title="Trained" style={{ width: 6, height: 6, borderRadius: '50%', background: c.scoreLvl >= 3 ? '#0a0a0a' : 'var(--accent)' }} />}
                  {c.hasWeight && <span title="Weigh-in" style={{ width: 6, height: 6, borderRadius: '50%', background: c.scoreLvl >= 3 ? '#0a0a0a' : 'var(--sched-class)' }} />}
                  {c.sched > 0 && <span className="mono" style={{ fontSize: 9, opacity: 0.8 }}>{c.sched}</span>}
                </span>
              </button>
            ))}
          </div>

          <div className="row" style={{ gap: 16, marginTop: 14, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
            <span className="row" style={{ gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> Trained</span>
            <span className="row" style={{ gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sched-class)' }} /> Weigh-in</span>
            <span className="row" style={{ gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'color-mix(in oklab, var(--accent) 55%, var(--faint))' }} /> Journal score</span>
            <span>#&nbsp;= scheduled blocks</span>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>{isoToDisplay(selected)}</h3>
            {selected === today && <span className="meta">today</span>}
          </div>

          <div className="col gap-4">
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Training</div>
              {detail.session ? (
                <div style={{ fontSize: 13 }}>
                  {detail.session.exercises?.length || 0} exercises ·{' '}
                  {Math.round(sessionVolume(detail.session)).toLocaleString()} kg
                  {detail.session.durationMinutes ? ` · ${detail.session.durationMinutes} min` : ''}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>No session logged.</div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Journal</div>
              {detail.j && (detail.j.score != null || detail.j.sleepHours != null) ? (
                <div className="row" style={{ gap: 16, fontSize: 13 }}>
                  <span>Score <strong>{detail.j.score ?? '—'}</strong>/10</span>
                  <span>Sleep <strong>{detail.j.sleepHours ?? '—'}</strong>h</span>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>No journal entry.</div>
              )}
            </div>

            {detail.w && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Weight</div>
                <div style={{ fontSize: 13 }}><strong>{detail.w.kg.toFixed(1)}</strong> kg</div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Schedule</div>
              {detail.blocks.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nothing scheduled.</div>
              ) : (
                <div className="col" style={{ gap: 6 }}>
                  {detail.blocks.map(b => (
                    <div key={b.id} className="row between" style={{ fontSize: 12 }}>
                      <span>{b.label || b.kind}</span>
                      <span className="mono dim" style={{ fontSize: 11 }}>
                        {b.start}{b.end ? `–${b.end}` : ''} · {b.source}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
