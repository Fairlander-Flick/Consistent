import { WeightChart } from '../components/dashboard/WeightChart'
import { WeeklyRing } from '../components/dashboard/WeeklyRing'
import { GoalsCard } from '../components/dashboard/GoalsCard'
import { ContributionGrid } from '../components/dashboard/ContributionGrid'
import { Journal } from '../components/dashboard/Journal'

const DAY   = new Date().toLocaleDateString('en', { weekday: 'long' })
const DATE  = new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })

export function Dashboard() {
  return (
    <div style={{ maxWidth: '960px' }}>

      {/* ── Page header ── */}
      <div className="anim" style={{ '--d': '0ms', marginBottom: '28px' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
          {DAY}
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {DATE}
        </h1>
      </div>

      {/* ── Row 1: Weight (3/5) + Weekly (2/5) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: '10px',
        marginBottom: '10px',
      }} className="row-1">
        <div className="anim" style={{ '--d': '60ms' }}>
          <WeightChart />
        </div>
        <div className="anim" style={{ '--d': '120ms' }}>
          <WeeklyRing />
        </div>
      </div>

      {/* ── Row 2: Goals (full) ── */}
      <div className="anim" style={{ '--d': '180ms', marginBottom: '10px' }}>
        <GoalsCard />
      </div>

      {/* ── Row 3: Contribution (full) ── */}
      <div className="anim" style={{ '--d': '240ms', marginBottom: '10px' }}>
        <ContributionGrid />
      </div>

      {/* ── Row 4: Journal (full) ── */}
      <div className="anim" style={{ '--d': '300ms' }}>
        <Journal />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .row-1 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
