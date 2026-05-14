import { useGoalsStore } from '../../store/useGoalsStore'
import { useJournalStore } from '../../store/useJournalStore'
import { isoToDisplay } from '../../lib/dateUtils'
import { Checkbox } from '../ui/Checkbox'

export function ContributionModal({ item, onClose }) {
  const { goals, history } = useGoalsStore()
  const { entries } = useJournalStore()

  if (!item) return null

  const journalEntry = entries.find(e => e.date === item.date)
  const historyEntry = history.find(h => h.date === item.date && h.period === item.period)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '440px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span className="label" style={{ marginBottom: '4px' }}>{item.period}</span>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{isoToDisplay(item.date)}</div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1, padding: '2px 4px', transition: 'color var(--transition)' }}
          >
            ×
          </button>
        </div>

        {journalEntry?.todos?.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <span className="label" style={{ marginBottom: '8px' }}>Journal</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {journalEntry.todos.map(t => (
                <Checkbox key={t.id} checked={t.done} onChange={() => {}} label={t.text} />
              ))}
            </div>
          </div>
        )}

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: historyEntry?.completed ? 'var(--accent-green)' : 'var(--accent-red)',
        }}>
          {historyEntry
            ? (historyEntry.completed ? '✓ Completed' : '✗ Not completed')
            : 'No record for this date'}
        </div>
      </div>
    </div>
  )
}
