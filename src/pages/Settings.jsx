import { useRef, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import { STORE_KEYS, exportBackup, parseBackup, restoreBackup } from '../lib/backup'
import { parseIcs, summarizeImport } from '../lib/icsImport'
import { useScheduleStore } from '../store/useScheduleStore'
import { CURRENCIES } from '../lib/currency'

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
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
    confirmTxDelete, setConfirmTxDelete,
    weightGoal, setWeightGoal,
    weightTarget, setWeightTarget,
    currency, setCurrency,
    reminderEnabled, setReminderEnabled,
    reminderTime, setReminderTime,
  } = useSettingsStore()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [pendingRestore, setPendingRestore] = useState(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

  const importEvents = useScheduleStore(s => s.importEvents)
  const icsInputRef = useRef(null)
  const [pendingIcs, setPendingIcs] = useState(null) // { events, summary, name }
  const [icsError, setIcsError] = useState('')
  const [icsReplace, setIcsReplace] = useState(false)
  const [icsResult, setIcsResult] = useState(null) // { added, skipped }

  const notifSupported = typeof window !== 'undefined' && 'Notification' in window
  const [notifPerm, setNotifPerm] = useState(notifSupported ? Notification.permission : 'unsupported')

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

  function confirmRestore() {
    restoreBackup(pendingRestore.data)
    window.location.reload()
  }

  function handleIcsPicked(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setIcsError('')
    setIcsResult(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const events = parseIcs(String(reader.result))
        if (events.length === 0) {
          setIcsError('No usable events found in this file. Make sure it is an .ics export with timed events.')
          return
        }
        setPendingIcs({ events, summary: summarizeImport(events), name: file.name })
      } catch (err) {
        setIcsError(err.message || 'Could not parse calendar file.')
      }
    }
    reader.onerror = () => setIcsError('Could not read the selected file.')
    reader.readAsText(file)
  }

  function confirmIcsImport() {
    const result = importEvents(pendingIcs.events, { replace: icsReplace })
    setIcsResult(result)
    setPendingIcs(null)
    setIcsReplace(false)
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
          <div className="tabs">
            {WEIGHT_GOALS.map(g => (
              <button
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
        <div className="setting-row">
          <div>
            <div className="setting-label">Confirm before deleting a goal</div>
            <div className="setting-desc">Shows a dialog before removing a goal item.</div>
          </div>
          <Toggle checked={confirmGoalDelete} onChange={setConfirmGoalDelete} />
        </div>
        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Confirm before deleting a transaction</div>
            <div className="setting-desc">Shows a dialog before removing a finance transaction.</div>
          </div>
          <Toggle checked={confirmTxDelete} onChange={setConfirmTxDelete} />
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <div className="card-h"><h3>Currency</h3></div>
        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Display currency</div>
            <div className="setting-desc">Symbol used across Finance and the dashboard. Amounts are not converted.</div>
          </div>
          <select
            className="select"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            style={{ width: 'auto' }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
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
                Notifications are blocked in your browser settings — unblock them to enable this.
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
          <button className="btn" onClick={() => exportBackup()}>Export</button>
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
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFilePicked}
          />
          <button className="btn" onClick={() => fileInputRef.current?.click()}>Import</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, marginTop: 16 }}>
        <div className="card-h"><h3>Import calendar</h3></div>
        <div className="setting-row" style={{ borderBottom: 0 }}>
          <div>
            <div className="setting-label">Import from .ics file</div>
            <div className="setting-desc">
              Export your calendar from Google Calendar (⚙ Settings → Import &amp; export → Export),
              unzip, then pick the .ics file here. Weekly-repeating events become recurring blocks;
              everything else is added as one-offs.
            </div>
            {icsError && (
              <div className="setting-desc" style={{ color: 'var(--negative)' }}>{icsError}</div>
            )}
            {icsResult && (
              <div className="setting-desc" style={{ color: 'var(--accent)' }}>
                Imported {icsResult.added} event{icsResult.added === 1 ? '' : 's'}
                {icsResult.skipped > 0 && ` · skipped ${icsResult.skipped} duplicate${icsResult.skipped === 1 ? '' : 's'}`}.
              </div>
            )}
          </div>
          <input
            ref={icsInputRef}
            type="file"
            accept=".ics,text/calendar"
            style={{ display: 'none' }}
            onChange={handleIcsPicked}
          />
          <button className="btn" onClick={() => icsInputRef.current?.click()}>Import</button>
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
            className="btn"
            style={{ borderColor: 'var(--negative)', color: 'var(--negative)' }}
            onClick={() => { setDeleteInput(''); setDeleteOpen(true) }}
          >
            Delete all
          </button>
        </div>
      </div>

      {deleteOpen && (
        <div className="modal-overlay" onClick={() => setDeleteOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h4>Delete all data?</h4>
            <p>This will permanently remove all weight, journal, goals, training, and finance data. This cannot be undone.</p>
            <p style={{ marginBottom: 8 }}>
              Please type <span className="highlight">Fairlander</span> to confirm.
            </p>
            <input
              className="input"
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 16 }}
              placeholder="Fairlander"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
            />
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button
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
          </div>
        </div>
      )}

      {pendingIcs && (
        <div className="modal-overlay" onClick={() => setPendingIcs(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h4>Import this calendar?</h4>
            <p>
              <span className="highlight" style={{ background: 'var(--faint)', color: 'var(--text)' }}>{pendingIcs.name}</span> contains{' '}
              <strong>{pendingIcs.summary.total}</strong> timed event{pendingIcs.summary.total === 1 ? '' : 's'}:
            </p>
            <ul style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px 18px', padding: 0 }}>
              <li>{pendingIcs.summary.recurring} recurring (weekly)</li>
              <li>{pendingIcs.summary.oneoff} one-off</li>
              <li>{pendingIcs.summary.byKind.work} work · {pendingIcs.summary.byKind.class} class · {pendingIcs.summary.byKind.oneoff} other</li>
            </ul>
            <label className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 16, fontSize: 13 }}>
              <input type="checkbox" checked={icsReplace} onChange={e => setIcsReplace(e.target.checked)} />
              <span>Replace existing schedule (otherwise merge &amp; skip duplicates)</span>
            </label>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setPendingIcs(null)}>Cancel</button>
              <button className="btn primary" onClick={confirmIcsImport}>Import</button>
            </div>
          </div>
        </div>
      )}

      {pendingRestore && (
        <div className="modal-overlay" onClick={() => setPendingRestore(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h4>Restore this backup?</h4>
            <p>
              <span className="highlight" style={{ background: 'var(--faint)', color: 'var(--text)' }}>{pendingRestore.name}</span> will
              overwrite {pendingRestore.keyCount} data {pendingRestore.keyCount === 1 ? 'store' : 'stores'} with
              their contents from the file. This cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setPendingRestore(null)}>Cancel</button>
              <button className="btn primary" onClick={confirmRestore}>Restore &amp; reload</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
