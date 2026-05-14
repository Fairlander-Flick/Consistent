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
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
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
          maxWidth: '480px',
          width: '90%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {item.period}
            </div>
            <div style={{ fontWeight: 600 }}>{isoToDisplay(item.date)}</div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: '20px' }}>×</button>
        </div>
        {journalEntry?.todos?.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Journal</div>
            {journalEntry.todos.map(t => (
              <div key={t.id} style={{ marginBottom: '4px' }}>
                <Checkbox checked={t.done} onChange={() => {}} label={t.text} />
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: '12px', color: historyEntry?.completed ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          {historyEntry ? (historyEntry.completed ? '✓ Completed' : '✗ Not completed') : 'No record'}
        </div>
      </div>
    </div>
  )
}
