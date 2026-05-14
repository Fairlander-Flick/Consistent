import { useState, useEffect } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { todayISO } from '../../lib/dateUtils'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export function JournalCard() {
  const { getTodayEntry, setTodayScore, setTodaySleepHours, setTodayNutrition, setTodayFeelings } = useJournalStore()
  const entry = getTodayEntry()
  const today = new Date()
  const dateLabel = `${MONTH_SHORT[today.getMonth()]} ${today.getDate()} · ${DAY_SHORT[today.getDay()]}`

  const [local, setLocal] = useState({
    score: entry.score,
    sleepHours: entry.sleepHours,
    nutrition: entry.nutrition,
    feelings: entry.feelings ?? '',
  })
  const [saved, setSaved] = useState(false)
  const [sleepEditing, setSleepEditing] = useState(false)

  // 800ms debounce auto-save
  useEffect(() => {
    const t = setTimeout(() => {
      if (local.score !== null) setTodayScore(local.score)
      if (local.sleepHours !== null) setTodaySleepHours(local.sleepHours)
      setTodayNutrition(local.nutrition)
      setTodayFeelings(local.feelings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 800)
    return () => clearTimeout(t)
  }, [local])

  const fillPct = local.score !== null ? ((local.score - 1) / 9) * 100 : 0

  return (
    <div className="card area-journal">
      <div className="card-h">
        <h3>Today's Journal</h3>
        <span className="meta">{dateLabel}</span>
      </div>

      {/* Metric strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {/* Score */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Score</div>
          <div className="num num-md" style={{ marginBottom: 8 }}>
            {local.score !== null ? local.score : '—'}
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}> / 10</span>
          </div>
          <input
            type="range"
            className="score-range"
            min="1"
            max="10"
            step="1"
            value={local.score ?? 5}
            onChange={e => setLocal(p => ({ ...p, score: parseInt(e.target.value) }))}
            onMouseDown={() => { if (local.score === null) setLocal(p => ({ ...p, score: 5 })) }}
            style={{ '--fill-pct': `${fillPct}%` }}
          />
        </div>

        {/* Sleep */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Sleep</div>
          {sleepEditing ? (
            <input
              type="number"
              className="input"
              min="0"
              max="24"
              step="0.5"
              value={local.sleepHours ?? ''}
              onChange={e => setLocal(p => ({ ...p, sleepHours: parseFloat(e.target.value) || null }))}
              onBlur={() => setSleepEditing(false)}
              autoFocus
              style={{ width: '100%', height: 32, padding: '4px 8px', fontSize: 16 }}
            />
          ) : (
            <div className="num num-md" style={{ cursor: 'pointer', marginBottom: 8 }} onClick={() => setSleepEditing(true)}>
              {local.sleepHours !== null ? local.sleepHours : '—'}
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}> h</span>
            </div>
          )}
          <div className="row" style={{ gap: 6 }}>
            <button
              className="btn sm"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setLocal(p => ({ ...p, sleepHours: Math.max(0, (p.sleepHours ?? 7) - 0.5) }))}
            >−</button>
            <button
              className="btn sm"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setLocal(p => ({ ...p, sleepHours: Math.min(24, (p.sleepHours ?? 7) + 0.5) }))}
            >+</button>
          </div>
        </div>

        {/* Nutrition */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Nutrition</div>
          <div className="col" style={{ gap: 6 }}>
            {[
              { value: 'good', label: '🟢 İyi',  bg: 'rgba(74,222,128,0.15)',  color: 'var(--accent)' },
              { value: 'mid',  label: '🟡 Orta', bg: 'rgba(250,204,21,0.15)',  color: '#facc15' },
              { value: 'bad',  label: '🔴 Kötü', bg: 'rgba(248,113,113,0.15)', color: 'var(--negative)' },
            ].map(({ value, label, bg, color }) => (
              <button
                key={value}
                onClick={() => setLocal(p => ({ ...p, nutrition: p.nutrition === value ? null : value }))}
                style={{
                  background: local.nutrition === value ? bg : 'transparent',
                  border: `1px solid ${local.nutrition === value ? color : 'var(--border)'}`,
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  color: local.nutrition === value ? color : 'var(--muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 120ms',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feelings textarea */}
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        How are you feeling today?
      </div>
      <textarea
        className="input"
        placeholder="Write freely…"
        value={local.feelings}
        onChange={e => setLocal(p => ({ ...p, feelings: e.target.value }))}
        style={{ minHeight: 110, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
      />

      {/* Save indicator */}
      <div style={{ textAlign: 'right', marginTop: 8, fontSize: 11, color: 'var(--muted)', minHeight: 16 }}>
        {saved && '● saved'}
      </div>
    </div>
  )
}
