import { useState } from 'react'
import { useWeightStore } from '../store/useWeightStore'
import { useTrainingStore } from '../store/useTrainingStore'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { todayISO, isoToDisplay } from '../lib/dateUtils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function WeightLogSection() {
  const { entries, addEntry, deleteEntry } = useWeightStore()
  const [kg, setKg] = useState('')
  const [date, setDate] = useState(todayISO())

  const handleAdd = () => {
    const val = parseFloat(kg)
    if (isNaN(val) || val <= 0) return
    addEntry(date, val)
    setKg('')
  }

  return (
    <Card style={{ marginBottom: '10px' }}>
      <span className="label">Weight log</span>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Input type="number" value={kg} onChange={setKg} placeholder="kg" style={{ width: '80px' }} />
        <Input type="date" value={date} onChange={setDate} style={{ width: '148px' }} />
        <Button onClick={handleAdd}>Log</Button>
      </div>
      {entries.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No entries yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {entries.map((e, i) => {
            const prev = entries[i + 1]
            const delta = prev ? (e.kg - prev.kg).toFixed(1) : null
            return (
              <div key={e.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isoToDisplay(e.date)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="nums" style={{ fontWeight: 600 }}>{e.kg} kg</span>
                  {delta !== null && (
                    <span className="nums" style={{ fontSize: '11px', color: parseFloat(delta) <= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 500 }}>
                      {parseFloat(delta) > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                  <button onClick={() => deleteEntry(e.date)} style={{ color: 'var(--text-muted)', fontSize: '14px', transition: 'color var(--transition)' }}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function TrainingProgramEditor() {
  const { program, setDayName, addExercise, addSet, removeExercise } = useTrainingStore()
  const [openDay, setOpenDay] = useState(null)
  const [newExName, setNewExName] = useState('')
  const [newSets, setNewSets] = useState({})

  const handleAddExercise = (day) => {
    if (!newExName.trim()) return
    addExercise(day, newExName.trim())
    setNewExName('')
  }

  const handleAddSet = (day, exId) => {
    const key = `${day}-${exId}`
    const { reps = '', weight = '' } = newSets[key] || {}
    if (!reps || !weight) return
    addSet(day, exId, reps, weight)
    setNewSets(prev => ({ ...prev, [key]: { reps: '', weight: '' } }))
  }

  return (
    <Card style={{ marginBottom: '10px' }}>
      <span className="label">Training program</span>
      {DAYS.map(day => (
        <div key={day} style={{ marginBottom: '4px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setOpenDay(openDay === day ? null : day)}
            style={{
              width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between',
              background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontWeight: 500,
              transition: 'background var(--transition)',
            }}
          >
            <span>{day}{program[day].name ? ` — ${program[day].name}` : ''}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{openDay === day ? '▲' : '▼'}</span>
          </button>
          {openDay === day && (
            <div style={{ padding: '12px', background: 'var(--bg-card)' }}>
              <Input
                value={program[day].name}
                onChange={v => setDayName(day, v)}
                placeholder="Session name — e.g. Upper body"
                style={{ marginBottom: '10px' }}
              />
              {program[day].exercises.map(ex => {
                const key = `${day}-${ex.id}`
                const s = newSets[key] || { reps: '', weight: '' }
                return (
                  <div key={ex.id} style={{ marginBottom: '10px', padding: '10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{ex.name}</span>
                      <button onClick={() => removeExercise(day, ex.id)} style={{ color: 'var(--text-muted)', fontSize: '14px' }}>×</button>
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      {ex.sets.map((set, i) => (
                        <span key={i} className="nums" style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '8px' }}>
                          {set.reps}×{set.weight}kg
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Input type="number" value={s.reps} onChange={v => setNewSets(p => ({ ...p, [key]: { ...s, reps: v } }))} placeholder="reps" style={{ width: '64px' }} />
                      <Input type="number" value={s.weight} onChange={v => setNewSets(p => ({ ...p, [key]: { ...s, weight: v } }))} placeholder="kg" style={{ width: '64px' }} />
                      <Button onClick={() => handleAddSet(day, ex.id)} variant="ghost" style={{ fontSize: '11px' }}>+ Set</Button>
                    </div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <Input value={newExName} onChange={setNewExName} placeholder="Exercise name" style={{ flex: 1 }} />
                <Button onClick={() => handleAddExercise(day)} variant="secondary">Add</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </Card>
  )
}

function DailyTrainingLog() {
  const { program, logSession, getSessionForDate } = useTrainingStore()
  const today = todayISO()
  const d = new Date(today + 'T00:00:00')
  const dayLabel = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]
  const todayProgram = program[dayLabel]
  const logged = getSessionForDate(today)

  const [session, setSession] = useState(() => {
    if (logged) return logged.exercises
    return todayProgram.exercises.map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s })) }))
  })

  const updateSet = (exIdx, setIdx, field, value) => {
    setSession(prev => prev.map((ex, i) =>
      i !== exIdx ? ex : {
        ...ex,
        sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: parseFloat(value) || 0 }),
      }
    ))
  }

  return (
    <Card style={{ marginBottom: '10px' }}>
      <span className="label">
        Today's session — {dayLabel}{todayProgram.name ? ` · ${todayProgram.name}` : ''}
      </span>
      {session.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No exercises for today. Edit the program first.</p>
      ) : (
        session.map((ex, exIdx) => (
          <div key={ex.id} style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{ex.name}</div>
            {ex.sets.map((set, setIdx) => (
              <div key={setIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '5px' }}>
                <span className="nums" style={{ fontSize: '11px', color: 'var(--text-muted)', width: '40px' }}>Set {setIdx + 1}</span>
                <Input type="number" value={set.reps} onChange={v => updateSet(exIdx, setIdx, 'reps', v)} style={{ width: '64px' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>reps</span>
                <Input type="number" value={set.weight} onChange={v => updateSet(exIdx, setIdx, 'weight', v)} style={{ width: '64px' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kg</span>
              </div>
            ))}
          </div>
        ))
      )}
      {session.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <Button onClick={() => logSession(today, session)}>
            {logged ? '✓ Update session' : 'Log session'}
          </Button>
          {logged && <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 500 }}>Session logged</span>}
        </div>
      )}
    </Card>
  )
}

function TrainingHistory() {
  const { log } = useTrainingStore()
  if (log.length === 0) return null

  return (
    <Card style={{ marginBottom: '10px' }}>
      <span className="label">Session history</span>
      {log.map(session => (
        <details key={session.date} style={{ marginBottom: '6px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: '7px 0', borderBottom: '1px solid var(--border)', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
            <span>{isoToDisplay(session.date)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>▼</span>
          </summary>
          <div style={{ padding: '10px 0 4px' }}>
            {session.exercises.map(ex => (
              <div key={ex.id} style={{ marginBottom: '7px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>{ex.name}</div>
                <div className="nums" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {ex.sets.map((s, i) => `${s.reps}×${s.weight}kg`).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </Card>
  )
}

export function Consistency() {
  return (
    <div style={{ maxWidth: '960px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '24px' }}>Consistency</h1>
      <WeightLogSection />
      <DailyTrainingLog />
      <TrainingProgramEditor />
      <TrainingHistory />
    </div>
  )
}
