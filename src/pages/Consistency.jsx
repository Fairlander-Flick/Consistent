import { useState } from 'react'
import { useWeightStore } from '../store/useWeightStore'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { todayISO, isoToDisplay } from '../lib/dateUtils'

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

export function Consistency() {
  return (
    <div style={{ maxWidth: '960px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '20px' }}>Consistency</h1>
      <WeightLogSection />
    </div>
  )
}
