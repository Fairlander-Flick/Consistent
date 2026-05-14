import { useState } from 'react'
import { useGoalsStore } from '../../store/useGoalsStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { DUMMY_GOALS } from '../../lib/dummyData'

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly']

export function GoalsCard() {
  const { goals, toggleTodo, deleteTodo } = useGoalsStore()
  const { confirmGoalDelete, setConfirmGoalDelete } = useSettingsStore()
  const [period, setPeriod] = useState('daily')
  const [confirmTarget, setConfirmTarget] = useState(null) // { id, text }
  const [dontAsk, setDontAsk] = useState(false)

  const storeData = goals[period]
  const hasGoals = (storeData?.todos?.length ?? 0) > 0 || storeData?.title
  const goalSet = hasGoals ? storeData : DUMMY_GOALS[period]
  const goalTitle = goalSet?.title || ''
  const goalTasks = goalSet?.todos || []
  const goalDone = goalTasks.filter(t => t.done).length

  function handleDeleteClick(task) {
    if (!confirmGoalDelete) {
      if (hasGoals) deleteTodo(period, task.id)
      return
    }
    setDontAsk(false)
    setConfirmTarget(task)
  }

  function handleConfirmDelete() {
    if (dontAsk) setConfirmGoalDelete(false)
    if (hasGoals) deleteTodo(period, confirmTarget.id)
    setConfirmTarget(null)
  }

  return (
    <>
      <div className="card area-goals">
        <div className="card-h">
          <h3>Goals</h3>
          <div className="tabs">
            {PERIODS.map(t => (
              <button key={t} className={period === t ? 'active' : ''} onClick={() => setPeriod(t)}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="row between" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{goalTitle || '—'}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
            {goalDone} / {goalTasks.length} done
          </div>
        </div>

        <div className="col" style={{ gap: 0 }}>
          {goalTasks.slice(0, 6).map(t => (
            <div
              key={t.id}
              className={'todo' + (t.done ? ' done' : '')}
              onClick={() => hasGoals && toggleTodo(period, t.id)}
            >
              <div className="chk"></div>
              <div className="lbl">{t.text}</div>
              {hasGoals && (
                <div
                  className="x"
                  style={{ color: 'var(--negative)', fontSize: 16 }}
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(t) }}
                >
                  ×
                </div>
              )}
            </div>
          ))}
          {goalTasks.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 4px' }}>No goals yet.</div>
          )}
        </div>

        {goalTasks.length > 0 && (
          <div style={{ marginTop: 12, height: 3, background: 'var(--faint)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              width: `${(goalDone / goalTasks.length) * 100}%`,
              height: '100%',
              background: 'var(--accent)',
              transition: 'width 300ms',
            }} />
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmTarget && (
        <div className="modal-overlay" onClick={() => setConfirmTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h4>Delete goal?</h4>
            <p>
              You're about to remove{' '}
              <span className="highlight">{confirmTarget.text}</span>
              {' '}from your {period} goals.
            </p>
            <label className="dont-ask">
              <input
                type="checkbox"
                checked={dontAsk}
                onChange={e => setDontAsk(e.target.checked)}
              />
              Don't ask again (you can re-enable in Settings)
            </label>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setConfirmTarget(null)}>Cancel</button>
              <button
                className="btn primary"
                style={{ background: 'var(--negative)', borderColor: 'var(--negative)' }}
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
