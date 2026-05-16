import { useRef, useState } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'
import {
  DUMMY_WEIGHT, DUMMY_TRAINED, DUMMY_GOALS,
  DUMMY_FINANCE_TRANSACTIONS, DUMMY_TRAINING_PROGRAM, DUMMY_TRAINING_LOG, DUMMY_SCHEDULE,
} from '../lib/dummyData'
import { STORE_KEYS, exportBackup, parseBackup, restoreBackup } from '../lib/backup'

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

function doGenerateSampleData() {
  localStorage.setItem('consistent:weight', JSON.stringify(DUMMY_WEIGHT))

  // Journal: one entry per training day + some rest days for a fuller grid
  const trainedDates = [...DUMMY_TRAINED]
  const scores = [7, 8, 8, 9, 7, 6, 8, 9, 7, 8, 6, 8, 9, 7, 8, 7, 9]
  const sleep   = [7.5, 8, 7, 6.5, 8, 7.5, 7, 8.5, 6.5, 7, 8, 7.5, 8, 7, 8, 6.5, 8]
  const journalEntries = trainedDates.map((date, i) => ({
    date,
    todos: [],
    feelings: null,
    score: scores[i % scores.length],
    sleepHours: sleep[i % sleep.length],
    nutrition: null,
    submitted: true,
  }))
  // Add a handful of rest-day entries to fill out the grid
  const restDays = [
    '2026-04-08','2026-04-10','2026-04-12','2026-04-13',
    '2026-04-15','2026-04-17','2026-04-19','2026-04-20',
    '2026-04-22','2026-04-24','2026-04-26','2026-04-27',
    '2026-04-29','2026-05-01','2026-05-03','2026-05-04',
    '2026-05-06','2026-05-08','2026-05-10','2026-05-13','2026-05-14',
  ]
  restDays.forEach((date, i) => {
    journalEntries.push({ date, todos: [], feelings: null, score: 5 + (i % 3), sleepHours: 7 + (i % 3) * 0.5, nutrition: null, submitted: true })
  })
  localStorage.setItem('consistent:journal', JSON.stringify(journalEntries))

  localStorage.setItem('consistent:goals', JSON.stringify(DUMMY_GOALS))

  localStorage.setItem('consistent:finance', JSON.stringify({
    categories: ['Gym', 'Food', 'Rent & Bills', 'Transport', 'Other'],
    transactions: DUMMY_FINANCE_TRANSACTIONS,
  }))

  localStorage.setItem('consistent:training-program', JSON.stringify(DUMMY_TRAINING_PROGRAM))
  localStorage.setItem('consistent:training-log', JSON.stringify(DUMMY_TRAINING_LOG))

  localStorage.setItem('consistent:schedule', JSON.stringify(DUMMY_SCHEDULE))

  window.location.reload()
}

function doDeleteAllData() {
  STORE_KEYS.forEach(k => localStorage.removeItem(k))
  window.location.reload()
}

export function Settings() {
  const {
    confirmGoalDelete, setConfirmGoalDelete,
    weightGoal, setWeightGoal,
  } = useSettingsStore()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [pendingRestore, setPendingRestore] = useState(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

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
        <div className="card-h"><h3>Data</h3></div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Generate sample data</div>
            <div className="setting-desc">Populates weight, journal, goals, finance, training program, training log, and schedule with example data.</div>
          </div>
          <button className="btn" onClick={doGenerateSampleData}>Generate</button>
        </div>
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
