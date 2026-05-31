import { useRef, useState } from 'react'
import { Modal, useTabPill } from '../components/ui/transitions'
import { useSettingsStore } from '../store/useSettingsStore'
import { STORE_KEYS, exportBackup, parseBackup, restoreBackup } from '../lib/backup'
import { useAuthStore } from '../store/useAuthStore'
import { pushAll } from '../lib/cloudSync'

function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input type="checkbox" aria-label={label} checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  )
}

const WEIGHT_GOALS = [
  { value: 'lose', label: 'Lose' },
  { value: 'gain', label: 'Gain' },
  { value: null, label: 'No preference' },
]


function doDeleteAllData() {
  STORE_KEYS.forEach(k => localStorage.removeItem(k))
  window.location.reload()
}

export function Settings() {
  const {
    confirmGoalDelete, setConfirmGoalDelete,
    weightGoal, setWeightGoal,
    weightTarget, setWeightTarget,
    reminderEnabled, setReminderEnabled,
    reminderTime, setReminderTime,
  } = useSettingsStore()

  const user = useAuthStore(s => s.user)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | done | error

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [pendingRestore, setPendingRestore] = useState(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)
  const weightTabRef = useRef(null)
  useTabPill(weightTabRef)

  const notifSupported = typeof window !== 'undefined' && 'Notification' in window
  const [notifPerm, setNotifPerm] = useState(notifSupported ? Notification.permission : 'unsupported')

  async function handlePushToCloud() {
    if (!user?.id) return
    setSyncStatus('syncing')
    const ok = await pushAll(user.id)
    setSyncStatus(ok ? 'done' : 'error')
    setTimeout(() => setSyncStatus('idle'), 3000)
  }

  async function toggleReminder(on) {
    if (!on) { setReminderEnabled(false); return }
    if (!notifSupported) return
    let perm = Notification.permission
    if (perm === 'default') perm = await Notification.requestPermission()
    setNotifPerm(perm)
    if (perm === 'granted') setReminderEnabled(true)
  }

  function handleFilePicked(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setImportError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = parseBackup(String(reader.result))
        const keyCount = STORE_KEYS.filter(k => Object.prototype.hasOwnProperty.call(data, k)).length
        if (keyCount === 0) {
          setImportError('Backup contains no recognizable data.')
          return
        }
        setPendingRestore({ data, keyCount, name: file.name })
      } catch (err) {
        setImportError(err.message || 'Could not read backup file.')
      }
    }
    reader.onerror = () => setImportError('Could not read the selected file.')
    reader.readAsText(file)
  }

  async function confirmRestore() {
    restoreBackup(pendingRestore.data)
    if (user?.id) await pushAll(user.id)
    window.location.reload()
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <div className="sub" style={{ marginTop: 4 }}>App preferences</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-h"><h3>Weight goal</h3></div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Direction</div>
            <div className="setting-desc">Controls how weight changes are colored on the dashboard graph.</div>
          </div>
          <div className="tabs" ref={weightTabRef}>
            {WEIGHT_GOALS.map(g => (
              <button
                type="button"
                key={String(g.value)}
                className={weightGoal === g.value ? 'active' : ''}
                onClick={() => setWeightGoal(g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Target weight</div>
            <div className="setting-desc">Shows goal progress and a projected ETA on the Weight log. Leave empty for none.</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <input
              type="number"
              className="input mono"
              aria-label="Target weight in kilograms"
              min="1"
              step="0.1"
              placeholder="—"
              defaultValue={weightTarget ?? ''}
              onBlur={e => setWeightTarget(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
              style={{ width: 90, textAlign: 'right' }}
            />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>kg</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <div className="card-h"><h3>Confirmations</h3></div>
        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Confirm before deleting a goal</div>
            <div className="setting-desc">Shows a dialog before removing a goal item.</div>
          </div>
          <Toggle checked={confirmGoalDelete} onChange={setConfirmGoalDelete} label="Confirm before deleting a goal" />
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <div className="card-h"><h3>Reminders</h3></div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Daily journal reminder</div>
            <div className="setting-desc">
              {notifSupported
                ? 'Sends a notification if you haven’t logged your journal yet. Fires only while the app is open in a tab.'
                : 'Your browser does not support notifications.'}
            </div>
            {notifPerm === 'denied' && (
              <div className="setting-desc" style={{ color: 'var(--negative)' }}>
                Notifications are blocked in your browser settings. Unblock them to enable this.
              </div>
            )}
          </div>
          <Toggle
            checked={reminderEnabled && notifPerm === 'granted'}
            onChange={toggleReminder}
          />
        </div>
        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Reminder time</div>
            <div className="setting-desc">When the daily reminder should fire.</div>
          </div>
          <input
            type="time"
            className="input"
            aria-label="Reminder time"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            disabled={!reminderEnabled}
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <div className="card-h"><h3>Backup</h3></div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Export backup</div>
            <div className="setting-desc">Download all your data as a single JSON file you can keep or move to another device.</div>
          </div>
          <button type="button" className="btn" onClick={() => exportBackup()}>Export</button>
        </div>
        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Import backup</div>
            <div className="setting-desc">Restore from a previously exported file. This overwrites the data contained in the file.</div>
            {importError && (
              <div className="setting-desc" style={{ color: 'var(--negative)' }}>{importError}</div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Choose backup file to import"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFilePicked}
          />
          <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>Import</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <div className="card-h"><h3>Cloud sync</h3></div>
        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Push to cloud</div>
            <div className="setting-desc">
              Manually upload all your local data to Supabase right now. Useful when switching to a new device.
            </div>
            {syncStatus === 'done' && (
              <div className="setting-desc" style={{ color: 'var(--accent)' }}>Synced successfully.</div>
            )}
            {syncStatus === 'error' && (
              <div className="setting-desc" style={{ color: 'var(--negative)' }}>Sync failed, check your connection.</div>
            )}
          </div>
          <button
            type="button"
            className="btn"
            disabled={syncStatus === 'syncing'}
            onClick={handlePushToCloud}
          >
            {syncStatus === 'syncing' ? 'Syncing…' : 'Push now'}
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <div className="card-h"><h3>Data</h3></div>
        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Delete all data</div>
            <div className="setting-desc">Permanently clears all stored entries. Settings are kept.</div>
          </div>
          <button
            type="button"
            className="btn"
            style={{ borderColor: 'var(--negative)', color: 'var(--negative)' }}
            onClick={() => { setDeleteInput(''); setDeleteOpen(true) }}
          >
            Delete all
          </button>
        </div>
      </div>

      {deleteOpen && (
        <Modal onClose={() => setDeleteOpen(false)} width={400}>
          {close => (
            <>
              <h4>Delete all data?</h4>
              <p>This will permanently remove all weight, journal, and goals data. This cannot be undone.</p>
              <p style={{ marginBottom: 8 }}>
                Please type <span className="highlight">Fairlander</span> to confirm.
              </p>
              <input
                className="input"
                aria-label="Type Fairlander to confirm deletion"
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 16 }}
                placeholder="Fairlander"
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
              />
              <div className="modal-footer">
                <button type="button" className="btn ghost" onClick={close}>Cancel</button>
                <button
                  type="button"
                  className="btn primary"
                  style={{
                    background: deleteInput === 'Fairlander' ? 'var(--negative)' : 'var(--faint)',
                    borderColor: deleteInput === 'Fairlander' ? 'var(--negative)' : 'var(--border)',
                    color: deleteInput === 'Fairlander' ? '#fff' : 'var(--muted)',
                    cursor: deleteInput === 'Fairlander' ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => deleteInput === 'Fairlander' && doDeleteAllData()}
                >
                  Delete everything
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {pendingRestore && (
        <Modal onClose={() => setPendingRestore(null)} width={400}>
          {close => (
            <>
              <h4>Restore this backup?</h4>
              <p>
                <span className="highlight" style={{ background: 'var(--faint)', color: 'var(--text)' }}>{pendingRestore.name}</span> will
                overwrite {pendingRestore.keyCount} data {pendingRestore.keyCount === 1 ? 'store' : 'stores'} with
                their contents from the file. This cannot be undone.
              </p>
              <div className="modal-footer">
                <button type="button" className="btn ghost" onClick={close}>Cancel</button>
                <button type="button" className="btn primary" onClick={confirmRestore}>Restore &amp; reload</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}
