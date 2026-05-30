import { useNavigate } from 'react-router-dom'
import { useJournalStore } from '../../store/useJournalStore'
import { useDashboard } from '../../lib/DashboardContext'
import { todayISO } from '../../lib/dateUtils'
import { moodForScore } from '../../lib/journalMood'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const NUT_LABEL = { good: 'Good', mid: 'Okay', bad: 'Bad' }

function dateLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()} · ${DAY_SHORT[d.getDay()]}`
}

export function JournalCard() {
  const navigate = useNavigate()
  const { getTodayEntry, entries } = useJournalStore()
  const { viewDate } = useDashboard()
  const todayStr = todayISO()
  const isViewingPast = viewDate !== todayStr

  const entry = isViewingPast ? (entries.find(e => e.date === viewDate) ?? null) : getTodayEntry()
  const hasContent = !!entry && (entry.score != null || entry.sleepHours != null || entry.feelings)
  const mood = hasContent ? moodForScore(entry.score) : null
  const label = dateLabel(isViewingPast ? viewDate : todayStr)

  return (
    <div className="card area-journal">
      <div className="card-h">
        <h3>Journal</h3>
        <span className="meta">{label}</span>
      </div>

      {hasContent ? (
        <div className="col" style={{ gap: 10 }}>
          <div className="jx-summary">
            {mood && (
              <span className="jx-mood">
                <span className="jx-mood-dot" style={{ background: mood.color }} />{mood.label}
              </span>
            )}
            {entry.sleepHours != null && <><span className="dim">·</span><span>{entry.sleepHours}h sleep</span></>}
            {entry.nutrition && <><span className="dim">·</span><span>{NUT_LABEL[entry.nutrition].toLowerCase()}</span></>}
          </div>
          {entry.feelings && <div className="jx-quote">{entry.feelings}</div>}
          {!isViewingPast && (
            <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/journal')}>
              Open journal →
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '20px 0', textAlign: 'center', minHeight: 96,
        }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {isViewingPast ? 'No journal entry for this day.' : 'No journal entry yet today.'}
          </div>
          {!isViewingPast && (
            <button className="btn primary" onClick={() => navigate('/journal')}>Log now</button>
          )}
        </div>
      )}
    </div>
  )
}
