import { useState, useMemo } from 'react'
import { useWeightStore } from '../store/useWeightStore'
import { useTrainingStore } from '../store/useTrainingStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useJournalStore } from '../store/useJournalStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { todayISO, isoToDisplay } from '../lib/dateUtils'
import { weightProgress } from '../lib/weightGoal'
import { trendSeries, sleepScoreInsight, correlationLabel } from '../lib/wellbeing'
import { listExercises, exerciseProgression, personalRecords } from '../lib/progression'
import { WeightChart } from '../components/ui/Widgets'
import {
  IconPlus, IconCheck, IconTrash, IconChevRight,
} from '../components/ui/Icons'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function Consistency() {
  const [section, setSection] = useState('training')

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Consistency</h1>
          <div className="sub" style={{ marginTop: 4 }}>Log weight · Edit program · Track sessions</div>
        </div>
        <div className="tabs" style={{ fontSize: 12 }}>
          <button className={section === 'training' ? 'active' : ''} onClick={() => setSection('training')}>Training</button>
          <button className={section === 'weight' ? 'active' : ''} onClick={() => setSection('weight')}>Weight log</button>
          <button className={section === 'wellbeing' ? 'active' : ''} onClick={() => setSection('wellbeing')}>Wellbeing</button>
        </div>
      </div>

      {section === 'weight' && <WeightSection />}
      {section === 'training' && <TrainingSection />}
      {section === 'wellbeing' && <WellbeingSection />}
    </>
  )
}

// ── Weight section ──────────────────────────────────────────
function WeightSection() {
  const { entries, addEntry, deleteEntry } = useWeightStore()
  const weightTarget = useSettingsStore(s => s.weightTarget)
  const [val, setVal] = useState('')
  const [date, setDate] = useState(todayISO())

  const goal = useMemo(() => weightProgress(entries, weightTarget), [entries, weightTarget])

  const sorted = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries])
  const chartData = sorted.length >= 2
    ? sorted.map(e => ({ date: e.date, value: e.kg }))
    : null

  const stats = useMemo(() => {
    if (sorted.length < 2) return null
    const last = sorted[sorted.length - 1].kg
    const first = sorted[0].kg
    const sevenAgo = sorted[Math.max(0, sorted.length - 8)]?.kg ?? first
    const vals = sorted.map(e => e.kg)
    return {
      current: last,
      total: last - first,
      weekDelta: last - sevenAgo,
      min: Math.min(...vals),
      max: Math.max(...vals),
    }
  }, [sorted])

  const handleAdd = () => {
    const v = parseFloat(val)
    if (isNaN(v) || v <= 0) return
    addEntry(date, v)
    setVal('')
  }

  const reversed = [...sorted].reverse()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
      <div className="col gap-4">
        <div className="card">
          <div className="card-h">
            <h3>Weight Trend</h3>
            <span className="meta">{sorted.length} entries</span>
          </div>
          {chartData ? (
            <WeightChart data={chartData} height={240} />
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              Log at least two entries to see a trend.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-h">
            <h3>History</h3>
            <span className="meta">most recent first</span>
          </div>
          {reversed.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>No entries yet.</div>
          ) : (
            <div className="scroll" style={{ maxHeight: 320 }}>
              {reversed.map((w, i) => {
                const prev = reversed[i + 1]
                const delta = prev ? w.kg - prev.kg : 0
                return (
                  <div key={w.date} className="list-row" style={{ gridTemplateColumns: '110px 1fr auto auto' }}>
                    <div className="mono dim">{w.date}</div>
                    <div className="num" style={{ fontSize: 14 }}>
                      {w.kg.toFixed(1)} <span className="dim" style={{ fontSize: 10 }}>kg</span>
                    </div>
                    <div className={'delta ' + (delta < 0 ? 'pos' : delta > 0 ? 'neg' : '')}>
                      {prev ? `${delta < 0 ? '↓' : delta > 0 ? '↑' : '—'} ${Math.abs(delta).toFixed(1)}` : '—'}
                    </div>
                    <button className="btn ghost icon" onClick={() => deleteEntry(w.date)}>
                      <IconTrash size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="col gap-4">
        <div className="card">
          <div className="card-h"><h3>Add Entry</h3></div>
          <div className="col gap-2">
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>Weight (kg)</label>
            <input className="input" placeholder="77.4" value={val} onChange={e => setVal(e.target.value)} />
            <label style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Date</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <button className="btn primary" onClick={handleAdd} style={{ marginTop: 10, justifyContent: 'center', width: '100%' }}>
              <IconPlus size={12} /> Log weight
            </button>
          </div>
        </div>

        {stats && (
          <div className="card">
            <div className="card-h"><h3>Stats</h3><span className="meta">{sorted.length} entries</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <StatBlock label="Current" value={stats.current.toFixed(1)} />
              <StatBlock
                label="Total Δ"
                value={`${stats.total > 0 ? '+' : ''}${stats.total.toFixed(1)}`}
                color={stats.total < 0 ? 'var(--accent)' : stats.total > 0 ? 'var(--negative)' : undefined}
              />
              <StatBlock label="Min" value={stats.min.toFixed(1)} />
              <StatBlock label="Max" value={stats.max.toFixed(1)} />
            </div>
          </div>
        )}

        {goal && (
          <div className="card">
            <div className="card-h">
              <h3>Goal</h3>
              <span className="meta">{goal.target.toFixed(1)} kg</span>
            </div>
            {goal.reached ? (
              <div style={{ padding: '12px 0', textAlign: 'center' }}>
                <div className="num num-lg" style={{ color: 'var(--accent)' }}>Reached 🎉</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                  You're at your {goal.target.toFixed(1)} kg target.
                </div>
              </div>
            ) : goal.overshot ? (
              <div style={{ padding: '12px 0', textAlign: 'center' }}>
                <div className="num num-lg" style={{ color: 'var(--accent)' }}>Overshot</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                  You passed your {goal.target.toFixed(1)} kg target — current: {goal.current.toFixed(1)} kg.
                </div>
              </div>
            ) : (
              <>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <span className="num num-md">{goal.current.toFixed(1)} kg</span>
                  <span className="mono dim" style={{ fontSize: 12 }}>
                    {Math.abs(goal.remaining).toFixed(1)} kg to go
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--faint)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.round(goal.pct * 100)}%`,
                    height: '100%',
                    background: 'var(--accent)',
                    transition: 'width 240ms',
                  }} />
                </div>
                <div className="row between" style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                  <span className="mono">{Math.round(goal.pct * 100)}% there</span>
                  <span className="mono">
                    {goal.etaDate
                      ? `ETA ${isoToDisplay(goal.etaDate)}`
                      : goal.ratePerWeek != null
                        ? `${goal.ratePerWeek >= 0 ? '+' : ''}${goal.ratePerWeek.toFixed(2)} kg/wk`
                        : 'log more to project'}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBlock({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div className="num num-md" style={{ marginTop: 4, color }}>{value}</div>
    </div>
  )
}

// ── Wellbeing section (sleep & mood trends) ─────────────────
function WellbeingSection() {
  const { entries } = useJournalStore()

  const sleepData = useMemo(() => trendSeries(entries, 'sleepHours'), [entries])
  const scoreData = useMemo(() => trendSeries(entries, 'score'), [entries])
  const insight = useMemo(() => sleepScoreInsight(entries), [entries])

  const sleepAvg = sleepData.length
    ? sleepData.reduce((s, d) => s + d.value, 0) / sleepData.length : null
  const scoreAvg = scoreData.length
    ? scoreData.reduce((s, d) => s + d.value, 0) / scoreData.length : null

  const delta = insight.restedAvg != null && insight.shortAvg != null
    ? insight.restedAvg - insight.shortAvg : null

  return (
    <div className="col gap-4">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-h">
            <h3>Sleep trend</h3>
            <span className="meta">{sleepAvg != null ? `avg ${sleepAvg.toFixed(1)} h` : `${sleepData.length} pts`}</span>
          </div>
          {sleepData.length >= 2 ? (
            <WeightChart data={sleepData} height={220} />
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              Log sleep on at least two days to see a trend.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Mood trend</h3>
            <span className="meta">{scoreAvg != null ? `avg ${scoreAvg.toFixed(1)} / 10` : `${scoreData.length} pts`}</span>
          </div>
          {scoreData.length >= 2 ? (
            <WeightChart data={scoreData} height={220} />
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              Rate at least two days to see a trend.
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Sleep × mood</h3>
          <span className="meta">{insight.n} matched {insight.n === 1 ? 'day' : 'days'}</span>
        </div>
        {insight.n < 3 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
            Log sleep and a day score together for a few days to unlock this insight.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <StatBlock
              label={`≥ ${insight.threshold}h nights`}
              value={insight.restedAvg != null ? insight.restedAvg.toFixed(1) : '—'}
              color="var(--accent)"
            />
            <StatBlock
              label={`< ${insight.threshold}h nights`}
              value={insight.shortAvg != null ? insight.shortAvg.toFixed(1) : '—'}
              color={delta != null && delta > 0 ? 'var(--negative)' : undefined}
            />
            <StatBlock
              label="Correlation"
              value={insight.r != null ? insight.r.toFixed(2) : '—'}
            />
            <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--text-mid)', marginTop: 4 }}>
              {delta != null && Math.abs(delta) >= 0.1 ? (
                <>You score <strong style={{ color: delta > 0 ? 'var(--accent)' : 'var(--negative)' }}>
                  {Math.abs(delta).toFixed(1)} pts {delta > 0 ? 'higher' : 'lower'}
                </strong> on days after {insight.threshold}h+ of sleep — {correlationLabel(insight.r)}.</>
              ) : (
                <>Sleep shows {correlationLabel(insight.r)} with your day score so far.</>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Training section ────────────────────────────────────────
function TrainingSection() {
  const [tab, setTab] = useState('today')
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="tabs">
          <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>Today's session</button>
          <button className={tab === 'program' ? 'active' : ''} onClick={() => setTab('program')}>Program editor</button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>History</button>
          <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}>Progress</button>
        </div>
      </div>
      {tab === 'today' && <DailyLog />}
      {tab === 'program' && <ProgramEditor />}
      {tab === 'history' && <HistoryList />}
      {tab === 'progress' && <ProgressionView />}
    </>
  )
}

// ── Progression / PR tracking ───────────────────────────────
const PROG_METRICS = [
  { key: 'best1RM', label: 'Est. 1RM', unit: 'kg' },
  { key: 'topWeight', label: 'Top weight', unit: 'kg' },
  { key: 'volume', label: 'Volume', unit: 'kg' },
]

function ProgressionView() {
  const { log } = useTrainingStore()
  const exercises = useMemo(() => listExercises(log), [log])
  const [exercise, setExercise] = useState('')
  const [metricKey, setMetricKey] = useState('best1RM')

  const selected = exercise && exercises.includes(exercise) ? exercise : exercises[0]
  const metric = PROG_METRICS.find(m => m.key === metricKey)

  const prog = useMemo(
    () => (selected ? exerciseProgression(log, selected) : []),
    [log, selected]
  )
  const pr = useMemo(
    () => (selected ? personalRecords(log, selected) : null),
    [log, selected]
  )
  const chartData = prog.map(p => ({ date: p.date, value: p[metricKey] }))

  if (exercises.length === 0) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div className="num num-lg">No data yet</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
          Log a few sessions with weights to track progression and personal records.
        </div>
      </div>
    )
  }

  const first = prog[0]?.[metricKey]
  const last = prog[prog.length - 1]?.[metricKey]
  const change = first != null && last != null ? last - first : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
      <div className="col gap-4">
        <div className="card">
          <div className="card-h">
            <h3>{selected} · {metric.label}</h3>
            <div className="tabs">
              {PROG_METRICS.map(m => (
                <button key={m.key} className={m.key === metricKey ? 'active' : ''} onClick={() => setMetricKey(m.key)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {chartData.length >= 2 ? (
            <>
              <WeightChart data={chartData} height={240} />
              {change != null && (
                <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 10 }}>
                  {metric.label} {change >= 0 ? 'up' : 'down'}{' '}
                  <strong style={{ color: change >= 0 ? 'var(--accent)' : 'var(--negative)' }}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)} {metric.unit}
                  </strong>{' '}
                  over {prog.length} sessions.
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              Log at least two sessions of {selected} to see progression.
            </div>
          )}
        </div>
      </div>

      <div className="col gap-4">
        <div className="card">
          <div className="card-h"><h3>Exercise</h3></div>
          <select className="select" value={selected} onChange={e => setExercise(e.target.value)}>
            {exercises.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        {pr && (
          <div className="card">
            <div className="card-h"><h3>Personal records</h3><span className="meta">{pr.sessions} sessions</span></div>
            <div className="col gap-3">
              <PrRow label="Best est. 1RM" value={`${pr.best1RM} kg`} date={pr.best1RMDate} />
              <PrRow label="Top weight" value={`${pr.topWeight} kg`} date={pr.topWeightDate} />
              <PrRow label="Best volume" value={`${Math.round(pr.bestVolume).toLocaleString()} kg`} date={pr.bestVolumeDate} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PrRow({ label, value, date }) {
  return (
    <div className="row between">
      <div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div className="num num-md" style={{ marginTop: 2 }}>{value}</div>
      </div>
      <div className="mono dim" style={{ fontSize: 11 }}>{isoToDisplay(date)}</div>
    </div>
  )
}

// ── Daily Log ──────────────────────────────────────────────
function DailyLog() {
  const { program, logSession, getSessionForDate } = useTrainingStore()
  const today = todayISO()
  const d = new Date(today + 'T00:00:00')
  const dayLabel = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]
  const todayProgram = program[dayLabel] || { name: '', exercises: [] }
  const logged = getSessionForDate(today)

  const [sets, setSets] = useState(() => {
    if (logged) return logged.exercises.map(ex => ex.sets.map(s => ({ ...s, done: true })))
    return todayProgram.exercises.map(ex => ex.sets.map(s => ({ ...s, done: false })))
  })
  const [durationMinutes, setDurationMinutes] = useState(() => logged?.durationMinutes ?? 0)

  if (!todayProgram.exercises || todayProgram.exercises.length === 0) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>Today</div>
        <div className="num num-lg" style={{ marginTop: 12 }}>{todayProgram.name || 'Rest day'}</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
          {todayProgram.name ? 'No exercises configured. Edit the program first.' : 'No program set for today.'}
        </div>
      </div>
    )
  }

  const updateSet = (exIdx, sIdx, field, value) => {
    setSets(prev => {
      const c = prev.map(arr => arr.map(s => ({ ...s })))
      c[exIdx][sIdx][field] = field === 'done' ? !c[exIdx][sIdx].done : parseFloat(value) || 0
      return c
    })
  }

  const flat = sets.flat()
  const sessionVolume = flat.filter(s => s.done).reduce((sum, s) => sum + (s.reps * s.weight), 0)

  const handleLog = () => {
    const exercises = todayProgram.exercises.map((ex, i) => ({
      ...ex,
      sets: (sets[i] ?? []).map(({ done, ...rest }) => rest),
    }))
    logSession(today, exercises, durationMinutes)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
      <div className="col gap-3">
        <div className="card">
          <div className="card-h">
            <h3>{dayLabel} · {todayProgram.name || 'Session'}</h3>
            <span className="meta">
              {todayProgram.exercises.length} exercises · {todayProgram.exercises.reduce((s, e) => s + e.sets.length, 0)} sets
            </span>
          </div>
          <div className="col gap-4">
            {todayProgram.exercises.map((ex, exIdx) => (
              <div key={ex.id || exIdx}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ex.name}</div>
                  <div className="mono dim" style={{ fontSize: 11 }}>{ex.sets.length} sets</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 32px', gap: 8, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>#</span><span>Reps</span><span>Weight</span><span></span>
                </div>
                {sets[exIdx]?.map((s, sIdx) => (
                  <div key={sIdx} className="list-row" style={{ gridTemplateColumns: '24px 1fr 1fr 32px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="mono dim">{sIdx + 1}</div>
                    <input className="input" value={s.reps} onChange={e => updateSet(exIdx, sIdx, 'reps', e.target.value)} style={{ height: 30, padding: '4px 8px' }} />
                    <input className="input" value={s.weight} onChange={e => updateSet(exIdx, sIdx, 'weight', e.target.value)} style={{ height: 30, padding: '4px 8px' }} />
                    <button className={'btn ' + (s.done ? 'primary' : '')}
                            style={{ width: 30, height: 30, padding: 0, display: 'grid', placeItems: 'center' }}
                            onClick={() => updateSet(exIdx, sIdx, 'done')}>
                      <IconCheck size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col gap-3">
        <div className="card">
          <div className="card-h"><h3>Session</h3></div>
          <div className="col gap-3">
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completed sets</div>
              <div className="num num-lg" style={{ marginTop: 4 }}>
                {flat.filter(s => s.done).length}<span className="dim" style={{ fontSize: 14 }}>/{flat.length}</span>
              </div>
            </div>
            <div className="divider"></div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Volume so far</div>
              <div className="num num-md" style={{ marginTop: 4 }}>
                {sessionVolume.toLocaleString()} <span className="dim" style={{ fontSize: 11 }}>kg</span>
              </div>
            </div>
            <div className="divider"></div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duration</div>
              <div className="row" style={{ gap: 6, marginTop: 4, alignItems: 'center' }}>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={durationMinutes || ''}
                  onChange={e => setDurationMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 70, textAlign: 'right' }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>min</span>
              </div>
            </div>
            <button className="btn primary" onClick={handleLog} style={{ justifyContent: 'center' }}>
              <IconCheck size={12} /> {logged ? 'Update session' : 'Log session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Program Editor ─────────────────────────────────────────
function ProgramEditor() {
  const { program, setDayName, addExercise, addSet, removeExercise } = useTrainingStore()
  const [editingDay, setEditingDay] = useState('Mon')
  const [newExName, setNewExName] = useState('')
  const [setReps, setSetReps] = useState({})
  const [setWeight, setSetWeight] = useState({})
  const [setSetsCount, setSetSetsCount] = useState({})

  const handleAddSet = (day, exId) => {
    const key = `${day}-${exId}`
    const r = setReps[key]
    const w = setWeight[key]
    if (!r || !w) return
    const count = parseInt(setSetsCount[key]) || 1
    for (let i = 0; i < count; i++) addSet(day, exId, r, w)
    setSetReps(prev => ({ ...prev, [key]: '' }))
    setSetWeight(prev => ({ ...prev, [key]: '' }))
    setSetSetsCount(prev => ({ ...prev, [key]: '' }))
  }

  const editing = program[editingDay]

  return (
    <div className="col gap-3">
      <div className="card">
        <div className="card-h">
          <h3>Weekly Program</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          {DAYS.map(day => {
            const dayData = program[day]
            const isActive = day === editingDay
            return (
              <div key={day}
                   onClick={() => setEditingDay(day)}
                   style={{
                     background: 'var(--bg)',
                     border: '1px solid ' + (isActive ? 'var(--accent)' : 'var(--border)'),
                     borderRadius: 6,
                     padding: 12,
                     minHeight: 200,
                     cursor: 'pointer',
                   }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{day}</div>
                  <div className="chip" style={{
                    background: dayData.name ? 'var(--accent-soft)' : 'transparent',
                    color: dayData.name ? 'var(--accent)' : 'var(--muted)',
                    padding: '1px 6px',
                    fontSize: 10,
                  }}>{dayData.name || 'Rest'}</div>
                </div>
                <div className="col" style={{ gap: 6 }}>
                  {dayData.exercises.length === 0 ? (
                    <div style={{ color: 'var(--muted)', fontSize: 11, textAlign: 'center', padding: '16px 0', fontStyle: 'italic' }}>—</div>
                  ) : dayData.exercises.map((ex, eIdx) => (
                    <div key={ex.id} style={{
                      borderTop: eIdx > 0 ? '1px solid var(--border)' : 'none',
                      paddingTop: eIdx > 0 ? 6 : 0,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 500 }}>{ex.name}</div>
                      {ex.sets.length > 0 && (
                        <div className="mono dim" style={{ fontSize: 10, marginTop: 2 }}>
                          {ex.sets.length}×{ex.sets[0].reps}@{ex.sets[0].weight}kg
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Edit · {editingDay} · {editing.name || 'Untitled'}</h3>
        </div>
        <div className="col gap-3">
          <input
            className="input"
            placeholder="Session name (e.g. Push, Upper Body)"
            value={editing.name}
            onChange={e => setDayName(editingDay, e.target.value)}
            style={{ maxWidth: 320 }}
          />
          {editing.exercises.map(ex => {
            const key = `${editingDay}-${ex.id}`
            return (
              <div key={ex.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{ex.name}</div>
                  <button className="btn ghost icon" onClick={() => removeExercise(editingDay, ex.id)}>
                    <IconTrash size={12} />
                  </button>
                </div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {ex.sets.map((s, sIdx) => (
                    <div key={sIdx} className="mono" style={{
                      fontSize: 11,
                      background: 'var(--faint)',
                      border: '1px solid var(--border)',
                      padding: '4px 8px',
                      borderRadius: 4,
                    }}>
                      {s.reps} × {s.weight}<span className="dim">kg</span>
                    </div>
                  ))}
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <input className="input" placeholder="sets" type="number" min="1" value={setSetsCount[key] || ''}
                         onChange={e => setSetSetsCount(prev => ({ ...prev, [key]: e.target.value }))}
                         style={{ width: 60 }} />
                  <input className="input" placeholder="reps" type="number" value={setReps[key] || ''}
                         onChange={e => setSetReps(prev => ({ ...prev, [key]: e.target.value }))}
                         style={{ width: 70 }} />
                  <input className="input" placeholder="kg" type="number" value={setWeight[key] || ''}
                         onChange={e => setSetWeight(prev => ({ ...prev, [key]: e.target.value }))}
                         style={{ width: 70 }} />
                  <button className="btn" onClick={() => handleAddSet(editingDay, ex.id)}>
                    <IconPlus size={11} /> Add
                  </button>
                </div>
              </div>
            )
          })}
          <div className="row" style={{ gap: 6 }}>
            <input
              className="input"
              placeholder="New exercise name…"
              value={newExName}
              onChange={e => setNewExName(e.target.value)}
              style={{ flex: 1, maxWidth: 320 }}
            />
            <button className="btn" onClick={() => {
              if (newExName.trim()) {
                addExercise(editingDay, newExName.trim())
                setNewExName('')
              }
            }}>
              <IconPlus size={12} /> Exercise
            </button>
          </div>
        </div>
      </div>

      <WeeklyScheduleEditor />
    </div>
  )
}

// ── History ────────────────────────────────────────────────
function HistoryList() {
  const { log } = useTrainingStore()
  const [open, setOpen] = useState(null)

  if (log.length === 0) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>History</div>
        <div className="num num-lg" style={{ marginTop: 12 }}>No sessions yet</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-h">
        <h3>Session History</h3>
        <span className="meta">{log.length} sessions</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 100px 24px', gap: 12, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
        <span>Date</span><span>Session</span><span>Sets</span><span>Volume</span><span></span>
      </div>
      {log.map((h, i) => {
        const totalSets = h.exercises.reduce((s, e) => s + e.sets.length, 0)
        const totalVolume = h.exercises.reduce((s, e) => s + e.sets.reduce((vs, set) => vs + set.reps * set.weight, 0), 0)
        return (
          <div key={h.date + i}>
            <div className="list-row" style={{ gridTemplateColumns: '110px 1fr 80px 100px 24px', cursor: 'pointer' }} onClick={() => setOpen(open === i ? null : i)}>
              <div className="mono dim">{h.date}</div>
              <div style={{ fontWeight: 500 }}>{h.exercises.length} exercises</div>
              <div className="mono">{totalSets}</div>
              <div className="mono">{totalVolume.toLocaleString()} kg</div>
              <IconChevRight size={12} style={{ color: 'var(--muted)', transform: open === i ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }} />
            </div>
            {open === i && (
              <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '12px 4px' }}>
                <div className="row" style={{ gap: 24, padding: '4px 4px', flexWrap: 'wrap' }}>
                  {h.exercises.map((ex, eIdx) => (
                    <div key={eIdx}>
                      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{ex.name}</div>
                      <div className="mono dim" style={{ fontSize: 11 }}>
                        {ex.sets.map(s => `${s.reps}×${s.weight}`).join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Weekly Schedule editor (recurring class/work/other blocks) ──
const KIND_OPTS = [
  { value: 'class', label: 'Class' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
]

function WeeklyScheduleEditor() {
  const { recurring, addRecurringBlock, removeRecurringBlock } = useScheduleStore()
  const [drafts, setDrafts] = useState({}) // keyed by day

  const draftFor = (day) => drafts[day] || { kind: 'class', label: '', start: '09:00', end: '10:00' }
  const setDraft = (day, patch) =>
    setDrafts(prev => ({ ...prev, [day]: { ...draftFor(day), ...patch } }))

  const handleAdd = (day) => {
    const d = draftFor(day)
    if (!d.label.trim() || !d.start || !d.end) return
    addRecurringBlock(day, { kind: d.kind, label: d.label.trim(), start: d.start, end: d.end })
    setDrafts(prev => ({ ...prev, [day]: { kind: 'class', label: '', start: '09:00', end: '10:00' } }))
  }

  return (
    <div className="card">
      <div className="card-h">
        <h3>Weekly Schedule</h3>
        <span className="meta">recurring class / work blocks</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {DAYS.map(day => {
          const blocks = recurring[day] || []
          const d = draftFor(day)
          return (
            <div key={day} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, minHeight: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{day}</div>
              <div className="col" style={{ gap: 6, marginBottom: 10 }}>
                {blocks.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: 11, textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>—</div>
                ) : blocks.map(b => (
                  <div key={b.id} className="row between" style={{ fontSize: 11, gap: 4 }}>
                    <div style={{ minWidth: 0 }}>
                      <span className="chip" style={{ padding: '0 5px', fontSize: 9, marginRight: 4 }}>{b.kind}</span>
                      <span style={{ fontWeight: 500 }}>{b.label}</span>
                      <div className="mono dim" style={{ fontSize: 10 }}>{b.start}–{b.end}</div>
                    </div>
                    <div className="x" style={{ color: 'var(--negative)', fontSize: 14, cursor: 'pointer' }}
                         onClick={() => removeRecurringBlock(day, b.id)}>×</div>
                  </div>
                ))}
              </div>
              <div className="col" style={{ gap: 5 }}>
                <select className="select" value={d.kind} onChange={e => setDraft(day, { kind: e.target.value })}
                        style={{ height: 28, fontSize: 11, padding: '2px 6px' }}>
                  {KIND_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input className="input" placeholder="label" value={d.label}
                       onChange={e => setDraft(day, { label: e.target.value })}
                       style={{ height: 28, fontSize: 11, padding: '4px 6px' }} />
                <div className="row" style={{ gap: 4 }}>
                  <input className="input" type="time" value={d.start}
                         onChange={e => setDraft(day, { start: e.target.value })}
                         style={{ height: 28, fontSize: 11, padding: '2px 4px', flex: 1 }} />
                  <input className="input" type="time" value={d.end}
                         onChange={e => setDraft(day, { end: e.target.value })}
                         style={{ height: 28, fontSize: 11, padding: '2px 4px', flex: 1 }} />
                </div>
                <button className="btn" onClick={() => handleAdd(day)} style={{ justifyContent: 'center', fontSize: 11, height: 28 }}>
                  Add
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
