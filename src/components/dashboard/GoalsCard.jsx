import { useState, useEffect } from 'react'
import { useGoalsStore } from '../../store/useGoalsStore'
import { todayISO } from '../../lib/dateUtils'
import { Card } from '../ui/Card'
import { TabBar } from '../ui/TabBar'
import { Checkbox } from '../ui/Checkbox'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

const PERIODS = ['Daily', 'Weekly', 'Monthly', 'Yearly']
const SENECA_QUOTE = "If you don't know what port you are sailing to, no wind is favourable."

export function GoalsCard() {
  const [activeTab, setActiveTab] = useState('Daily')
  const [newTodo, setNewTodo] = useState('')
  const { goals, addTodo, toggleTodo, deleteTodo, setTitle, isCompleted, recordHistory } = useGoalsStore()

  const period = activeTab.toLowerCase()
  const { title, todos } = goals[period]
  const done = todos.filter(t => t.done).length
  const completed = isCompleted(period)

  useEffect(() => {
    const isNowComplete = isCompleted(period)
    recordHistory(period, todayISO(), isNowComplete)
  }, [goals[period].todos])

  const handleAdd = () => {
    if (!newTodo.trim()) return
    addTodo(period, newTodo.trim())
    setNewTodo('')
  }

  return (
    <Card style={{ outline: completed ? '1px solid var(--accent-green)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
            Goals
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '380px' }}>
            "{SENECA_QUOTE}"
          </div>
        </div>
        {todos.length > 0 && (
          <span style={{ fontSize: '11px', color: completed ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 600 }}>
            {done}/{todos.length}
          </span>
        )}
      </div>
      <TabBar tabs={PERIODS} active={activeTab} onChange={setActiveTab} />
      <Input
        value={title}
        onChange={v => setTitle(period, v)}
        placeholder="Period title (e.g. May 2026 Goals)"
        style={{ marginBottom: '10px', fontSize: '12px' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
        {todos.map(todo => (
          <div key={todo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Checkbox
              checked={todo.done}
              onChange={() => toggleTodo(period, todo.id)}
              label={todo.text}
            />
            <button
              onClick={() => deleteTodo(period, todo.id)}
              style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <Input
          value={newTodo}
          onChange={setNewTodo}
          placeholder="Add a goal..."
          style={{ flex: 1 }}
        />
        <Button onClick={handleAdd} variant="secondary">Add</Button>
      </div>
    </Card>
  )
}
