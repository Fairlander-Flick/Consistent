import { useState, useMemo } from 'react'
import { useWeightStore } from '../store/useWeightStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { todayISO, isoToDisplay } from '../lib/dateUtils'
import { weightProgress } from '../lib/weightGoal'
import { WeightChart } from '../components/ui/Widgets'
import { IconPlus, IconTrash } from '../components/ui/Icons'

export function Consistency() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Consistency</h1>
          <div className="sub" style={{ marginTop: 4 }}>Log weight</div>
        </div>
      </div>

      <WeightSection />
    </>
  )
}

// ── Weight section ──────────────────────────────────────────
function WeightSection() {
  const { entries, addEntry, deleteEntry } = useWeightStore()
  const weightTarget = useSettingsStore(s => s.weightTarget)
  const [val, setVal] = useState('')
  const [date, setDate] = useState(() => todayISO())

  const goal = useMemo(() => weightProgress(entries, weightTarget), [entries, weightTarget])

  const sorted = useMemo(() => entries.toSorted((a, b) => a.date.localeCompare(b.date)), [entries])
  const chartData = sorted.length >= 2
    ? sorted.map(e => ({ date: e.date, value: e.kg }))
    : null

  const stats = useMemo(() => {
    if (sorted.length < 2) return null
    const last = sorted[sorted.length - 1].kg
    const first = sorted[0].kg
    const vals = sorted.map(e => e.kg)
    return {
      current: last,
      total: last - first,
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

  const cells = stats ? [
    { label: 'Current', value: `${stats.current.toFixed(1)} kg` },
    { label: 'Total Δ', value: `${stats.total > 0 ? '+' : ''}${stats.total.toFixed(1)} kg`,
      color: stats.total < 0 ? 'var(--accent)' : stats.total > 0 ? 'var(--negative)' : undefined },
    { label: 'Min', value: `${stats.min.toFixed(1)} kg` },
    { label: 'Max', value: `${stats.max.toFixed(1)} kg` },
    { label: 'Entries', value: String(sorted.length) },
  ] : []

  return (
    <div className="col gap-4">
      {stats && (
        <div className="stat-strip">
          {cells.map((c, i) => (
            <div key={c.label} className="stat-cell" style={{ borderLeft: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <div className="stat-l">{c.label}</div>
              <div className="num num-md" style={{ marginTop: 4, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 16, alignItems: 'start' }}>
        <div className="col gap-4">
          <div className="card">
            <div className="card-h">
              <h3>Weight Trend</h3>
              <span className="meta">{sorted.length} entries</span>
            </div>
            {chartData ? (
              <WeightChart data={chartData} height={210} />
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                Log at least two entries to see a trend.
              </div>
            )}
          </div>

          {goal && (
            <div className="card">
              <div className="card-h">
                <h3>Goal</h3>
                <span className="meta">{goal.target.toFixed(1)} kg</span>
              </div>
              {goal.reached ? (
                <div style={{ padding: '6px 0', textAlign: 'center' }}>
                  <div className="num num-md" style={{ color: 'var(--accent)' }}>Reached</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    You're at your {goal.target.toFixed(1)} kg target.
                  </div>
                </div>
              ) : goal.overshot ? (
                <div style={{ padding: '6px 0', textAlign: 'center' }}>
                  <div className="num num-md" style={{ color: 'var(--accent)' }}>Overshot</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    Passed your {goal.target.toFixed(1)} kg target, now {goal.current.toFixed(1)} kg.
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
                      height: '100%', background: 'var(--accent)', transition: 'width 240ms',
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

        <div className="col gap-4">
          <div className="card">
            <div className="card-h"><h3>Add Entry</h3></div>
            <div className="row" style={{ gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 84 }}>
                <label htmlFor="weight-kg" style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Weight (kg)</label>
                <input id="weight-kg" className="input" placeholder="77.4" value={val}
                       onChange={e => setVal(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                       style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label htmlFor="weight-date" style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Date</label>
                <input id="weight-date" className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%' }} />
              </div>
              <button type="button" className="btn primary" onClick={handleAdd} style={{ height: 36 }}>
                <IconPlus size={12} /> Log
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <h3>History</h3>
              <span className="meta">recent first</span>
            </div>
            {reversed.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>No entries yet.</div>
            ) : (
              <div className="scroll" style={{ maxHeight: 360 }}>
                {reversed.map((w, i) => {
                  const prev = reversed[i + 1]
                  const delta = prev ? w.kg - prev.kg : 0
                  return (
                    <div key={w.date} className="list-row" style={{ gridTemplateColumns: '92px 1fr auto auto' }}>
                      <div className="mono dim">{w.date}</div>
                      <div className="num" style={{ fontSize: 14 }}>
                        {w.kg.toFixed(1)} <span className="dim" style={{ fontSize: 10 }}>kg</span>
                      </div>
                      <div className={'delta ' + (delta < 0 ? 'pos' : delta > 0 ? 'neg' : '')}>
                        {prev ? `${delta < 0 ? '↓' : delta > 0 ? '↑' : '—'} ${Math.abs(delta).toFixed(1)}` : '—'}
                      </div>
                      <button type="button" className="btn ghost icon" onClick={() => deleteEntry(w.date)} aria-label="Delete entry">
                        <IconTrash size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

