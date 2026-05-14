import { useSettingsStore } from '../store/useSettingsStore'

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  )
}

export function Settings() {
  const {
    confirmGoalDelete, setConfirmGoalDelete,
    confirmTxDelete, setConfirmTxDelete,
    confirmJournalDelete, setConfirmJournalDelete,
  } = useSettingsStore()

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <div className="sub" style={{ marginTop: 4 }}>App preferences</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-h"><h3>Confirmations</h3></div>
        <div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Confirm before deleting a goal</div>
              <div className="setting-desc">Shows a dialog before removing a goal item.</div>
            </div>
            <Toggle checked={confirmGoalDelete} onChange={setConfirmGoalDelete} />
          </div>

          <div className="setting-row">
            <div>
              <div className="setting-label">Confirm before deleting a transaction</div>
              <div className="setting-desc" style={{ color: 'var(--muted)' }}>
                Not yet wired — coming in a future update.
              </div>
            </div>
            <Toggle checked={confirmTxDelete} onChange={setConfirmTxDelete} />
          </div>

          <div className="setting-row">
            <div>
              <div className="setting-label">Confirm before deleting a journal entry</div>
              <div className="setting-desc" style={{ color: 'var(--muted)' }}>
                Not yet wired — coming in a future update.
              </div>
            </div>
            <Toggle checked={confirmJournalDelete} onChange={setConfirmJournalDelete} />
          </div>
        </div>
      </div>
    </>
  )
}
