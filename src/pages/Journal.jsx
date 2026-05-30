import { useMemo } from 'react'
import { useJournalStore } from '../store/useJournalStore'
import { JournalTodayEditor } from '../components/journal/JournalTodayEditor'
import { moodForScore } from '../lib/journalMood'
import { todayISO } from '../lib/dateUtils'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const NUT_LABEL = { good: 'Good', mid: 'Okay', bad: 'Bad' }

function dateLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()} · ${DAY_SHORT[d.getDay()]}`
}

export function Journal() {
  const { getTodayEntry, submitToday, entries } = useJournalStore()
  const todayStr = todayISO()
  const entry = getTodayEntry()

  const past = useMemo(
    () => entries
      .filter(e => e.date !== todayStr && (e.submitted || e.score != null || e.sleepHours != null || e.feelings))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [entries, todayStr]
  )

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Journal</h1>
          <div className="sub" style={{ marginTop: 4 }}>How are you doing?</div>
        </div>
      </div>

      <div className="journal-grid">
        <div className="card">
          <div className="card-h">
            <h3>Today's entry</h3>
            <span className="meta">{dateLabel(todayStr)}</span>
          </div>
          <JournalTodayEditor key={entry.date} entry={entry} onSubmit={submitToday} />
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Past entries</h3>
            <span className="meta">{past.length}</span>
          </div>
          {past.length === 0 ? (
            <div style={{ padding: '24px 4px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              No past entries yet.
            </div>
          ) : (
            <div className="scroll" style={{ maxHeight: 520 }}>
              {past.map(e => {
                const mood = moodForScore(e.score)
                return (
                  <div key={e.date} className="jx-past">
                    <span className="jx-past-dot" style={{ background: mood ? mood.color : 'var(--faint)' }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="jx-past-head">
                        <span className="mono dim">{dateLabel(e.date)}</span>
                        <span className="jx-past-meta">
                          {mood ? mood.label : '—'}
                          {e.sleepHours != null ? ` · ${e.sleepHours}h` : ''}
                          {e.nutrition ? ` · ${NUT_LABEL[e.nutrition].toLowerCase()}` : ''}
                        </span>
                      </div>
                      {e.feelings && <div className="jx-past-text">{e.feelings}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
