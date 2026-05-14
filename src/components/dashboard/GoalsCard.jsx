import { useState, useEffect } from 'react'
import { useGoalsStore } from '../../store/useGoalsStore'
import { todayISO } from '../../lib/dateUtils'
import { Card } from '../ui/Card'
import { TabBar } from '../ui/TabBar'
import { Checkbox } from '../ui/Checkbox'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { DUMMY_GOALS } from '../../lib/dummyData'

const PERIODS = ['Daily', 'Weekly', 'Monthly', 'Yearly']
const SENECA = "No wind is favourable if you don't know your port."

export function GoalsCard() {
  const [activeTab, setActiveTab] = useState('Daily')
  const [newTodo, setNewTodo] = useState('')
  const { goals, addTodo, toggleTodo, deleteTodo, setTitle, isCompleted, recordHistory } = useGoalsStore()

  const period     = activeTab.toLowerCase()
  const storeData  = goals[period]
  const hasData    = storeData.todos.length > 0 || storeData.title

  const { title, todos } = hasData ? storeData : (DUMMY_GOALS[period] ?? storeData)

  const done       = todos.filter(t => t.done).length
  const total      = todos.length
  const pct        = total > 0 ? (done / total) * 100 : 0
  const completed  = total > 0 && done === total

  useEffect(() => {
    if (hasData) recordHistory(period, todayISO(), isCompleted(period))
  }, [storeData.todos])

  const handleAdd = () => {
    if (!newTodo.trim()) return
    addTodo(period, newTodo.trim())
    setNewTodo('')
  }

  return (
    <Card style={{ outline: completed ? '1px solid rgba(35,194,106,0.35)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
        <span className="label" style={{ marginBottom: '3px' }}>Goals</span>
        {total > 0 && (
          <span className="nums" style={{
            fontSize: '11px',
            color: completed ? 'var(--accent-green)' : 'var(--text-muted)',
            fontWeight: 600,
          }}>
            {done}/{total}
          </span>
        )}
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px', lineHeight: 1.5 }}>
        "{SENECA}"
      </p>

      <TabBar tabs={PERIODS} active={activeTab} onChange={setActiveTab} />

      {/* Period title */}
      {hasData ? (
        <Input
          value={title}
          onChange={v => setTitle(period, v)}
          placeholder="Period title — e.g. May 2026"
          style={{ marginBottom: '12px', fontSize: '12px' }}
        />
      ) : (
        <div style={{
          fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
          padding: '7px 0', marginBottom: '4px',
        }}>
          {title}
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="progress-track" style={{ marginBottom: '12px' }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* Todo list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {todos.length === 0 && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No goals yet. Add one below.</span>
        )}
        {todos.map(todo => (
          <div key={todo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            {hasData ? (
              <Checkbox
                checked={todo.done}
                onChange={() => toggleTodo(period, todo.id)}
                label={todo.text}
              />
            ) : (
              <Checkbox checked={todo.done} onChange={() => {}} label={todo.text} />
            )}
            {hasData && (
              <button
                onClick={() => deleteTodo(period, todo.id)}
                style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1, padding: '0 4px', flexShrink: 0, transition: 'color var(--transition)' }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <Input value={newTodo} onChange={setNewTodo} placeholder="Add a goal…" style={{ flex: 1 }} />
        <Button onClick={handleAdd} variant="secondary">Add</Button>
      </div>
    </Card>
  )
}
