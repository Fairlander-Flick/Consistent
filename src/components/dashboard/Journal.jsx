import { useState } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { Card } from '../ui/Card'
import { Checkbox } from '../ui/Checkbox'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function Journal() {
  const { getTodayEntry, addTodayTodo, toggleTodayTodo, deleteTodayTodo } = useJournalStore()
  const [text, setText] = useState('')

  const entry = getTodayEntry()

  const handleAdd = () => {
    if (!text.trim()) return
    addTodayTodo(text.trim())
    setText('')
  }

  return (
    <Card>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
        Today's Journal
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
        {entry.todos.length === 0 && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No notes yet. Add one below.</span>
        )}
        {entry.todos.map(todo => (
          <div key={todo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Checkbox
              checked={todo.done}
              onChange={() => toggleTodayTodo(todo.id)}
              label={todo.text}
            />
            <button
              onClick={() => deleteTodayTodo(todo.id)}
              style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <Input value={text} onChange={setText} placeholder="Add a note..." style={{ flex: 1 }} />
        <Button onClick={handleAdd} variant="secondary">Add</Button>
      </div>
    </Card>
  )
}
