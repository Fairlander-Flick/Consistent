import { useSettingsStore } from '../store/useSettingsStore'

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

export function Settings() {
  const {
    confirmGoalDelete, setConfirmGoalDelete,
    weightGoal, setWeightGoal,
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
        <div>
          <div className="setting-row">
            <div>
              <div className="setting-label">Confirm before deleting a goal</div>
              <div className="setting-desc">Shows a dialog before removing a goal item.</div>
            </div>
            <Toggle checked={confirmGoalDelete} onChange={setConfirmGoalDelete} />
          </div>
        </div>
      </div>
    </>
  )
}
