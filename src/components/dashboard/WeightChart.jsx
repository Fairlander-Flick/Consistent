import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'
import { useWeightStore } from '../../store/useWeightStore'
import { Card } from '../ui/Card'
import { DUMMY_WEIGHT } from '../../lib/dummyData'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '7px 11px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '2px', fontSize: '11px' }}>{payload[0]?.payload?.date}</div>
      <div className="nums" style={{ color: 'var(--text)', fontWeight: 600 }}>{payload[0]?.value} kg</div>
    </div>
  )
}

export function WeightChart() {
  const { entries } = useWeightStore()
  const hasData = entries.length > 0
  const raw = hasData
    ? [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
    : DUMMY_WEIGHT

  const latest = raw[raw.length - 1]
  const prev   = raw[raw.length - 2]
  const delta  = prev ? (latest.kg - prev.kg).toFixed(1) : null
  const isDown = parseFloat(delta) <= 0

  const minKg = Math.min(...raw.map(e => e.kg))
  const maxKg = Math.max(...raw.map(e => e.kg))

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="label" style={{ marginBottom: 0 }}>Body weight</span>
        {delta !== null && (
          <span className="nums" style={{
            background: isDown ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
            color: isDown ? 'var(--accent-green)' : 'var(--accent-red)',
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '5px',
          }}>
            {isDown ? '↓' : '↑'} {Math.abs(parseFloat(delta)).toFixed(1)} kg
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', margin: '10px 0 16px' }}>
        <span className="metric-hero">{latest.kg}</span>
        <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 400 }}>kg</span>
        {!hasData && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px', fontStyle: 'italic' }}>sample data</span>
        )}
      </div>

      <div style={{ height: '88px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={raw} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[minKg - 0.5, maxKg + 0.5]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="kg"
              stroke="var(--accent-green)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: 'var(--accent-green)', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {raw[0]?.date?.slice(5).replace('-', '/')}
        </span>
        <span className="nums" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {(maxKg - minKg).toFixed(1)} kg range
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {raw[raw.length - 1]?.date?.slice(5).replace('-', '/')}
        </span>
      </div>
    </Card>
  )
}
