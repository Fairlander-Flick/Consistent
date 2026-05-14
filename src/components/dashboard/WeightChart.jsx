import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { useWeightStore } from '../../store/useWeightStore'
import { Card } from '../ui/Card'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '6px 10px',
      fontSize: '12px',
    }}>
      <div style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ color: 'var(--text)', fontWeight: 600 }}>{payload[0].value} kg</div>
    </div>
  )
}

export function WeightChart() {
  const { entries } = useWeightStore()
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)

  const delta = sorted.length >= 2
    ? (sorted[sorted.length - 1].kg - sorted[sorted.length - 2].kg).toFixed(1)
    : null

  const latest = sorted[sorted.length - 1]

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Weight</div>
          {latest ? (
            <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-1px' }}>
              {latest.kg} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>kg</span>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No entries yet</div>
          )}
        </div>
        {delta !== null && (
          <span style={{
            background: parseFloat(delta) <= 0 ? 'var(--accent-green-dim)' : '#4f1d1d',
            color: parseFloat(delta) <= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '20px',
          }}>
            {parseFloat(delta) > 0 ? '↑' : '↓'} {Math.abs(delta)} kg
          </span>
        )}
      </div>
      {sorted.length > 1 ? (
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={sorted} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="kg"
              stroke="var(--accent-green)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: 'var(--accent-green)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Add entries on the Consistency page</span>
        </div>
      )}
    </Card>
  )
}
