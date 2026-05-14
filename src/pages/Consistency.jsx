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
    <Card style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        Weight Log
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Input type="number" value={kg} onChange={setKg} placeholder="kg" style={{ width: '80px' }} />
        <Input type="date" value={date} onChange={setDate} style={{ width: '140px' }} />
        <Button onClick={handleAdd}>Log</Button>
      </div>
      {entries.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No entries yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {entries.map((e, i) => {
            const prev = entries[i + 1]
            const delta = prev ? (e.kg - prev.kg).toFixed(1) : null
            return (
              <div key={e.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{isoToDisplay(e.date)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600 }}>{e.kg} kg</span>
                  {delta !== null && (
                    <span style={{ fontSize: '11px', color: parseFloat(delta) <= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {parseFloat(delta) > 0 ? '↑' : '↓'}{Math.abs(delta)}
                    </span>
                  )}
                  <button onClick={() => deleteEntry(e.date)} style={{ color: 'var(--text-muted)', fontSize: '14px' }}>×</button>
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
    <Card style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        Training Program
      </div>
      {DAYS.map(day => (
        <div key={day} style={{ marginBottom: '6px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <button
            onClick={() => setOpenDay(openDay === day ? null : day)}
            style={{
              width: '100%', padding: '10px 12px', display: 'flex', justifyContent: 'space-between',
              background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', fontWeight: 500,
            }}
          >
            <span>{day} {program[day].name ? `— ${program[day].name}` : ''}</span>
            <span style={{ color: 'var(--text-muted)' }}>{openDay === day ? '▲' : '▼'}</span>
          </button>
          {openDay === day && (
            <div style={{ padding: '12px', background: 'var(--bg-card)' }}>
              <Input
                value={program[day].name}
                onChange={v => setDayName(day, v)}
                placeholder="Session name (e.g. Upper Body)"
                style={{ marginBottom: '10px' }}
              />
              {program[day].exercises.map(ex => {
                const key = `${day}-${ex.id}`
                const s = newSets[key] || { reps: '', weight: '' }
                return (
                  <div key={ex.id} style={{ marginBottom: '10px', padding: '8px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{ex.name}</span>
                      <button onClick={() => removeExercise(day, ex.id)} style={{ color: 'var(--text-muted)', fontSize: '14px' }}>×</button>
                    </div>
                    {ex.sets.map((set, i) => (
                      <span key={i} style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '8px' }}>
                        {set.reps}×{set.weight}kg
                      </span>
                    ))}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <Input type="number" value={s.reps} onChange={v => setNewSets(p => ({ ...p, [key]: { ...s, reps: v } }))} placeholder="reps" style={{ width: '60px' }} />
                      <Input type="number" value={s.weight} onChange={v => setNewSets(p => ({ ...p, [key]: { ...s, weight: v } }))} placeholder="kg" style={{ width: '60px' }} />
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
    return todayProgram.exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => ({ ...s })),
    }))
  })

  const updateSet = (exIdx, setIdx, field, value) => {
    setSession(prev => prev.map((ex, i) =>
      i !== exIdx ? ex : {
        ...ex,
        sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: parseFloat(value) || 0 }),
      }
    ))
  }

  const handleLog = () => {
    logSession(today, session)
  }

  return (
    <Card style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        Today's Session — {dayLabel} {todayProgram.name ? `(${todayProgram.name})` : ''}
      </div>
      {session.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No exercises for today. Edit the program first.</p>
      ) : (
        session.map((ex, exIdx) => (
          <div key={ex.id} style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>{ex.name}</div>
            {ex.sets.map((set, setIdx) => (
              <div key={setIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '40px' }}>Set {setIdx + 1}</span>
                <Input type="number" value={set.reps} onChange={v => updateSet(exIdx, setIdx, 'reps', v)} style={{ width: '60px' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>reps</span>
                <Input type="number" value={set.weight} onChange={v => updateSet(exIdx, setIdx, 'weight', v)} style={{ width: '60px' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kg</span>
              </div>
            ))}
          </div>
        ))
      )}
      {session.length > 0 && (
        <Button onClick={handleLog} style={{ marginTop: '8px' }}>
          {logged ? '✓ Update Session' : 'Log Session'}
        </Button>
      )}
      {logged && <span style={{ fontSize: '11px', color: 'var(--accent-green)', marginLeft: '10px' }}>Session logged</span>}
    </Card>
  )
}

function TrainingHistory() {
  const { log } = useTrainingStore()

  if (log.length === 0) return null

  return (
    <Card style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        Session History
      </div>
      {log.map(session => (
        <details key={session.date} style={{ marginBottom: '8px' }}>
          <summary style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            {isoToDisplay(session.date)}
          </summary>
          <div style={{ padding: '8px 0' }}>
            {session.exercises.map(ex => (
              <div key={ex.id} style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500 }}>{ex.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
      <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '20px' }}>Consistency</h1>
      <WeightLogSection />
      <DailyTrainingLog />
      <TrainingProgramEditor />
      <TrainingHistory />
    </div>
  )
}
