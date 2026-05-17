import { useState } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { useDashboard } from '../../lib/DashboardContext'
import { todayISO } from '../../lib/dateUtils'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const NUTRITION = [
  { value: 'good', label: '🟢 Good', bg: 'rgba(74,222,128,0.15)',  color: 'var(--accent)' },
  { value: 'mid',  label: '🟡 Okay', bg: 'rgba(250,204,21,0.15)',  color: '#facc15' },
  { value: 'bad',  label: '🔴 Bad',  bg: 'rgba(248,113,113,0.15)', color: 'var(--negative)' },
]
const NUTRITION_LABEL = Object.fromEntries(NUTRITION.map(n => [n.value, n.label]))

function dateLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()} · ${DAY_SHORT[d.getDay()]}`
}

function ReadOnlyView({ entry, label }) {
  return (
    <div className="card area-journal">
      <div className="card-h">
        <h3>Journal</h3>
        <span className="meta">{label}</span>
      </div>
      {!entry ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No journal entry for this day.
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Score</div>
              <div className="num num-md">{entry.score ?? '—'}<span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}> / 10</span></div>
            </div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Sleep</div>
              <div className="num num-md">{entry.sleepHours ?? '—'}<span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}> h</span></div>
            </div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Nutrition</div>
              <div style={{ fontSize: 13 }}>{entry.nutrition ? NUTRITION_LABEL[entry.nutrition] : '—'}</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            How you felt
          </div>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
            padding: 12, minHeight: 90, fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--text-mid)', whiteSpace: 'pre-wrap',
          }}>
            {entry.feelings || <span style={{ color: 'var(--muted)' }}>—</span>}
          </div>
        </>
      )}
    </div>
  )
}

function TodayEditor({ entry, label, submitToday }) {
  const { setTodayScore, setTodaySleepHours, setTodayNutrition, setTodayFeelings } = useJournalStore()
  const [local, setLocal] = useState(() => ({
    score: entry.score,
    sleepHours: entry.sleepHours,
    nutrition: entry.nutrition,
    feelings: entry.feelings ?? '',
  }))
  const [sleepEditing, setSleepEditing] = useState(false)
  const fillPct = local.score !== null ? ((local.score - 1) / 9) * 100 : 0

  return (
    <div className="card area-journal">
      <div className="card-h">
        <h3>Today's Journal</h3>
        <span className="meta">{label}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Score</div>
          <div className="num num-md" style={{ marginBottom: 8 }}>
            {local.score !== null ? local.score : '—'}
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}> / 10</span>
          </div>
          <input
            type="range" className="score-range" min="1" max="10" step="1"
            value={local.score ?? 5}
            onChange={e => {
              const score = parseInt(e.target.value)
              setLocal(p => ({ ...p, score }))
              setTodayScore(score)
            }}
            onMouseDown={() => { if (local.score === null) setLocal(p => ({ ...p, score: 5 })) }}
            style={{ '--fill-pct': `${fillPct}%` }}
          />
        </div>

        <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Sleep</div>
          {sleepEditing ? (
            <input
              type="number" className="input" min="0" max="24" step="0.5"
              value={local.sleepHours ?? ''}
              onChange={e => setLocal(p => ({ ...p, sleepHours: parseFloat(e.target.value) || null }))}
              onBlur={() => {
                setSleepEditing(false)
                setTodaySleepHours(local.sleepHours)
              }}
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
            <button className="btn sm" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => {
                      const h = Math.max(0, (local.sleepHours ?? 7) - 0.5)
                      setLocal(p => ({ ...p, sleepHours: h }))
                      setTodaySleepHours(h)
                    }}>−</button>
            <button className="btn sm" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => {
                      const h = Math.min(24, (local.sleepHours ?? 7) + 0.5)
                      setLocal(p => ({ ...p, sleepHours: h }))
                      setTodaySleepHours(h)
                    }}>+</button>
          </div>
        </div>

        <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Nutrition</div>
          <div className="col" style={{ gap: 6 }}>
            {NUTRITION.map(({ value, label: lbl, bg, color }) => (
              <button
                key={value}
                onClick={() => {
                  const next = local.nutrition === value ? null : value
                  setLocal(p => ({ ...p, nutrition: next }))
                  setTodayNutrition(next)
                }}
                style={{
                  background: local.nutrition === value ? bg : 'transparent',
                  border: `1px solid ${local.nutrition === value ? color : 'var(--border)'}`,
                  borderRadius: 4, padding: '4px 8px', fontSize: 11,
                  color: local.nutrition === value ? color : 'var(--muted)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 120ms',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        How are you feeling today?
      </div>
      <textarea
        className="input" placeholder="Write freely…"
        value={local.feelings}
        onChange={e => setLocal(p => ({ ...p, feelings: e.target.value }))}
        onBlur={e => setTodayFeelings(e.target.value)}
        style={{ minHeight: 110, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
      />

      <div style={{ textAlign: 'right', marginTop: 12 }}>
        <button className="btn primary" onClick={() => submitToday(local)}>Submit</button>
      </div>
    </div>
  )
}

export function JournalCard() {
  const { entries, getTodayEntry, submitToday, editToday } = useJournalStore()
  const { viewDate } = useDashboard()
  const todayStr = todayISO()
  const isViewingPast = viewDate !== todayStr

  const entry = getTodayEntry()
  const submitted = !!entry.submitted
  const today = new Date()
  const label = `${MONTH_SHORT[today.getMonth()]} ${today.getDate()} · ${DAY_SHORT[today.getDay()]}`

  if (isViewingPast) {
    const pastEntry = entries.find(e => e.date === viewDate) ?? null
    return <ReadOnlyView entry={pastEntry} label={dateLabel(viewDate)} />
  }

  if (submitted) {
    return (
      <div className="card area-journal">
        <div className="card-h">
          <h3>Today's Journal</h3>
          <span className="meta">{label}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Score</div>
            <div className="num num-md">{entry.score ?? '—'}<span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}> / 10</span></div>
          </div>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Sleep</div>
            <div className="num num-md">{entry.sleepHours ?? '—'}<span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}> h</span></div>
          </div>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Nutrition</div>
            <div style={{ fontSize: 13 }}>{entry.nutrition ? NUTRITION_LABEL[entry.nutrition] : '—'}</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          How you felt today
        </div>
        <div style={{
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
          padding: 12, minHeight: 90, fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--text-mid)', whiteSpace: 'pre-wrap',
        }}>
          {entry.feelings || <span style={{ color: 'var(--muted)' }}>—</span>}
        </div>
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <button className="btn" onClick={() => editToday()}>Edit today</button>
        </div>
      </div>
    )
  }

  return <TodayEditor key={entry.date} entry={entry} label={label} submitToday={submitToday} />
}
