import { WeightChart } from '../components/dashboard/WeightChart'
import { WeeklyRing } from '../components/dashboard/WeeklyRing'
import { GoalsCard } from '../components/dashboard/GoalsCard'
import { ContributionGrid } from '../components/dashboard/ContributionGrid'
import { Journal } from '../components/dashboard/Journal'

export function Dashboard() {
  return (
    <div style={{ maxWidth: '960px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '20px' }}>
        Dashboard
      </h1>

      {/* Row 1: Weight + Weekly — 2 equal columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <WeightChart />
        <WeeklyRing />
      </div>

      {/* Row 2: Goals — full width */}
      <div style={{ marginBottom: '12px' }}>
        <GoalsCard />
      </div>

      {/* Row 3: Contribution Grid — full width */}
      <div style={{ marginBottom: '12px' }}>
        <ContributionGrid />
      </div>

      {/* Row 4: Journal — full width */}
      <Journal />

      <style>{`
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
