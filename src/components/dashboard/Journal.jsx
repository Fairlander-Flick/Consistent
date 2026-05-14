import { useState } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { Card } from '../ui/Card'
import { Checkbox } from '../ui/Checkbox'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { DUMMY_JOURNAL } from '../../lib/dummyData'

export function Journal() {
  const { getTodayEntry, addTodayTodo, toggleTodayTodo, deleteTodayTodo } = useJournalStore()
  const [text, setText] = useState('')

  const entry   = getTodayEntry()
  const hasData = entry.todos.length > 0
  const display = hasData ? entry.todos : DUMMY_JOURNAL

  const handleAdd = () => {
    if (!text.trim()) return
    addTodayTodo(text.trim())
    setText('')
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="label" style={{ marginBottom: 0 }}>Today's journal</span>
        {!hasData && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>sample data</span>
        )}
      </div>

      <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {display.map((todo, i) => (
          <div key={todo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <Checkbox
              checked={todo.done}
              onChange={() => hasData && toggleTodayTodo(todo.id)}
              label={todo.text}
            />
            {hasData && (
              <button
                onClick={() => deleteTodayTodo(todo.id)}
                style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1, padding: '0 4px', flexShrink: 0, transition: 'color var(--transition)' }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        <Input value={text} onChange={setText} placeholder="Add a note…" style={{ flex: 1 }} />
        <Button onClick={handleAdd} variant="secondary">Add</Button>
      </div>
    </Card>
  )
}
