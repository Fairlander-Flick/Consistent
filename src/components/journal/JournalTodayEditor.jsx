import { useState } from 'react'
import { useJournalStore } from '../../store/useJournalStore'
import { MOODS, moodForScore } from '../../lib/journalMood'
import { toast } from '../../store/useToastStore'

const NUTRITION = [
  { value: 'good', label: 'Good', color: 'var(--accent)' },
  { value: 'mid',  label: 'Okay', color: '#facc15' },
  { value: 'bad',  label: 'Bad',  color: 'var(--negative)' },
]

// Compact "write today's journal" form. Mood (5 levels) replaces the old
// numeric score; everything autosaves to the store on change, and `onSubmit`
// marks the entry submitted.
export function JournalTodayEditor({ entry, onSubmit, submitLabel = 'Save entry' }) {
  const { setTodayScore, setTodaySleepHours, setTodayNutrition, setTodayFeelings } = useJournalStore()
  const [local, setLocal] = useState(() => ({
    score: entry.score,
    sleepHours: entry.sleepHours,
    nutrition: entry.nutrition,
    feelings: entry.feelings ?? '',
  }))

  const mood = moodForScore(local.score)

  const pickMood = (m) => { setLocal(p => ({ ...p, score: m.score })); setTodayScore(m.score) }
  const stepSleep = (d) => {
    const h = Math.max(0, Math.min(24, (local.sleepHours ?? 7) + d))
    setLocal(p => ({ ...p, sleepHours: h })); setTodaySleepHours(h)
  }
  const pickNut = (v) => {
    const n = local.nutrition === v ? null : v
    setLocal(p => ({ ...p, nutrition: n })); setTodayNutrition(n)
  }

  return (
    <>
      <div className="jx-lbl">How was today?</div>
      <div className="jm-row">
        {MOODS.map(m => (
          <button
            type="button"
            key={m.key}
            className={'jm' + (mood && mood.key === m.key ? ' on' : '')}
            style={{ '--c': m.color }}
            onClick={() => pickMood(m)}
          >
            <span className="jm-dot" />
            <span className="jm-l">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="jx-row">
        <div>
          <div className="jx-lbl">Sleep</div>
          <div className="stepper">
            <button type="button" onClick={() => stepSleep(-0.5)} aria-label="Decrease sleep">−</button>
            <span className="val">{local.sleepHours != null ? `${local.sleepHours}h` : '—'}</span>
            <button type="button" onClick={() => stepSleep(0.5)} aria-label="Increase sleep">+</button>
          </div>
        </div>
        <div>
          <div className="jx-lbl">Nutrition</div>
          <div className="jx-nut">
            {NUTRITION.map(n => (
              <button
                type="button"
                key={n.value}
                className={'jx-chip' + (local.nutrition === n.value ? ' on' : '')}
                style={{ '--c': n.color }}
                onClick={() => pickNut(n.value)}
              >{n.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="jx-lbl">How are you feeling?</div>
      <textarea
        className="input jx-ta"
        aria-label="How are you feeling?"
        placeholder="Write freely…"
        value={local.feelings}
        onChange={e => setLocal(p => ({ ...p, feelings: e.target.value }))}
        onBlur={e => setTodayFeelings(e.target.value)}
      />

      <div className="jx-foot">
        <button
          type="button"
          className="btn primary"
          onClick={() => { onSubmit(local); toast('Journal entry saved', { tone: 'success' }) }}
        >{submitLabel}</button>
      </div>
    </>
  )
}
