import { useState } from 'react'
import { useLifelongStore } from '../../store/useLifelongStore'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDeadline(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function DayPills({ activeDays, onToggle, editable = true }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {DAYS.map((d, i) => (
        <button
          key={d}
          onClick={editable ? () => onToggle(d) : undefined}
          disabled={!editable}
          style={{
            width: 20, height: 20, borderRadius: 4, padding: 0,
            background: activeDays.includes(d) ? 'rgba(74,222,128,.15)' : 'var(--faint)',
            border: `1px solid ${activeDays.includes(d) ? 'rgba(74,222,128,.4)' : 'var(--border)'}`,
            color: activeDays.includes(d) ? 'var(--accent)' : 'var(--muted)',
            fontSize: 8, fontFamily: 'var(--font-mono)',
            cursor: editable ? 'pointer' : 'default',
          }}
        >{DAY_LABELS[i]}</button>
      ))}
    </div>
  )
}

function GoalBlock({
  goal,
  addingStep, newStepTitle, newStepDays,
  onStartAddStep, onNewStepTitleChange, onToggleNewStepDay,
  onAddStep, onCancelAddStep,
  onToggleStepDay, onDeleteStep,
  onMarkDone, onDelete,
}) {
  const dl = formatDeadline(goal.deadline)

  return (
    <div style={{
      background: 'var(--faint)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '10px 12px',
      marginBottom: 8,
      opacity: goal.done ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: (goal.steps.length > 0 || addingStep) && !goal.done ? 8 : 0 }}>
        <div style={{
          flex: 1, fontWeight: 600, fontSize: 12,
          textDecoration: goal.done ? 'line-through' : 'none',
          color: 'var(--text)',
        }}>
          {goal.title}
        </div>
        {dl
          ? <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#fbbf24', flexShrink: 0 }}>{dl}</span>
          : <span style={{ fontSize: 9, color: 'var(--muted)', flexShrink: 0 }}>ongoing</span>
        }
        {!goal.done && (
          <>
            <button
              className="btn ghost sm"
              style={{ fontSize: 11, padding: '1px 6px', color: 'var(--accent)', flexShrink: 0 }}
              onClick={onMarkDone}
              title="Mark complete"
            >✓</button>
            <button
              className="btn ghost sm"
              style={{ fontSize: 14, padding: '1px 5px', color: 'var(--negative)', flexShrink: 0 }}
              onClick={onDelete}
              title="Delete goal"
            >×</button>
          </>
        )}
      </div>

      {!goal.done && goal.steps.map(step => (
        <div key={step.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          paddingTop: 6, borderTop: '1px solid var(--border)',
        }}>
          <div style={{ flex: 1, fontSize: 11, color: 'var(--text-mid)' }}>{step.title}</div>
          <DayPills activeDays={step.days} onToggle={(d) => onToggleStepDay(step, d)} />
          <button
            className="btn ghost sm"
            style={{ fontSize: 13, padding: '0 4px', color: 'var(--muted)', flexShrink: 0 }}
            onClick={() => onDeleteStep(step.id)}
            title="Delete step"
          >×</button>
        </div>
      ))}

      {!goal.done && (
        addingStep ? (
          <div style={{ paddingTop: 6, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
              <input
                className="input"
                placeholder="Step title..."
                value={newStepTitle}
                onChange={e => onNewStepTitleChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onAddStep()}
                autoFocus
                style={{ flex: 1 }}
              />
              <DayPills activeDays={newStepDays} onToggle={onToggleNewStepDay} />
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button className="btn ghost sm" onClick={onCancelAddStep}>Cancel</button>
              <button className="btn primary sm" onClick={onAddStep}>Add</button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              paddingTop: goal.steps.length > 0 ? 6 : 0,
              borderTop: goal.steps.length > 0 ? '1px solid var(--border)' : 'none',
              color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
            }}
            onClick={onStartAddStep}
          >
            <span style={{ color: 'var(--accent)', fontSize: 14, lineHeight: 1 }}>+</span>
            {' '}add step
          </div>
        )
      )}
    </div>
  )
}

export function LifelongGoalsCard() {
  const { goals, addGoal, deleteGoal, markGoalDone, addStep, updateStep, deleteStep } = useLifelongStore()

  const [addingGoal, setAddingGoal] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalDeadline, setNewGoalDeadline] = useState('')

  const [addingStepFor, setAddingStepFor] = useState(null)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepDays, setNewStepDays] = useState([])

  const [confirmDelete, setConfirmDelete] = useState(null)

  function handleAddGoal() {
    const title = newGoalTitle.trim()
    if (!title) return
    addGoal(title, newGoalDeadline || null)
    setNewGoalTitle('')
    setNewGoalDeadline('')
    setAddingGoal(false)
  }

  function handleAddStep(goalId) {
    const title = newStepTitle.trim()
    if (!title) return
    addStep(goalId, title, newStepDays)
    setNewStepTitle('')
    setNewStepDays([])
    setAddingStepFor(null)
  }

  function toggleNewStepDay(day) {
    setNewStepDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function toggleStepDay(goalId, step, day) {
    const next = step.days.includes(day)
      ? step.days.filter(d => d !== day)
      : [...step.days, day]
    updateStep(goalId, step.id, { days: next })
  }

  return (
    <div className="card">
      <div className="card-h">
        <h3>Lifelong Goals</h3>
        <button
          className="btn icon"
          style={{ color: 'var(--accent)', fontSize: 20, lineHeight: 1, padding: '0 4px' }}
          onClick={() => setAddingGoal(v => !v)}
          title="Add goal"
        >+</button>
      </div>

      {addingGoal && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          marginBottom: 12, padding: '8px 10px',
          background: 'var(--faint)', borderRadius: 6, border: '1px solid var(--border)',
        }}>
          <input
            className="input"
            placeholder="Goal title..."
            value={newGoalTitle}
            onChange={e => setNewGoalTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <input
            className="input"
            type="date"
            placeholder="Deadline (optional)"
            value={newGoalDeadline}
            onChange={e => setNewGoalDeadline(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn ghost sm" onClick={() => setAddingGoal(false)}>Cancel</button>
            <button className="btn primary sm" onClick={handleAddGoal}>Add</button>
          </div>
        </div>
      )}

      {goals.length === 0 && !addingGoal && (
        <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 4px' }}>
          No goals yet.{' '}
          <button className="btn ghost sm" style={{ padding: '2px 6px' }} onClick={() => setAddingGoal(true)}>
            Add one
          </button>
        </div>
      )}

      {goals.map(goal => (
        <GoalBlock
          key={goal.id}
          goal={goal}
          addingStep={addingStepFor === goal.id}
          newStepTitle={newStepTitle}
          newStepDays={newStepDays}
          onStartAddStep={() => {
            setAddingStepFor(goal.id)
            setNewStepTitle('')
            setNewStepDays([])
          }}
          onNewStepTitleChange={setNewStepTitle}
          onToggleNewStepDay={toggleNewStepDay}
          onAddStep={() => handleAddStep(goal.id)}
          onCancelAddStep={() => setAddingStepFor(null)}
          onToggleStepDay={(step, day) => toggleStepDay(goal.id, step, day)}
          onDeleteStep={(stepId) => deleteStep(goal.id, stepId)}
          onMarkDone={() => markGoalDone(goal.id)}
          onDelete={() => setConfirmDelete(goal.id)}
        />
      ))}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ width: 300 }} onClick={e => e.stopPropagation()}>
            <h4>Delete this goal?</h4>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>All steps will be removed.</p>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: 'var(--negative)', color: '#fff' }}
                onClick={() => { deleteGoal(confirmDelete); setConfirmDelete(null) }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
