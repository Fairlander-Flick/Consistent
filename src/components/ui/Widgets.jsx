import { useState } from 'react'

// ── SVG Weight chart ───────────────────────────────────────
export function WeightChart({ data, height = 170 }) {
  const w = 600
  const h = height
  const pad = { l: 28, r: 8, t: 12, b: 22 }
  if (!data || data.length < 2) return null
  const vals = data.map(d => d.value)
  const min = Math.min(...vals) - 0.4
  const max = Math.max(...vals) + 0.4
  const range = max - min || 1
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const pts = data.map((d, i) => {
    const x = pad.l + (i / (data.length - 1)) * innerW
    const y = pad.t + (1 - (d.value - min) / range) * innerH
    return { x, y, d }
  })
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${path} L ${pts[pts.length - 1].x} ${pad.t + innerH} L ${pts[0].x} ${pad.t + innerH} Z`
  const ticks = 3
  const yTicks = Array.from({ length: ticks }, (_, i) => min + (range * i / (ticks - 1)))
  const xTicks = [0, Math.floor(pts.length / 2), pts.length - 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => {
        const y = pad.t + (1 - (v - min) / range) * innerH
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--border)" strokeDasharray="2 4" />
            <text x={4} y={y + 3} fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted)">{v.toFixed(1)}</text>
          </g>
        )
      })}
      <path d={area} fill="url(#wfill)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.4" />
      {pts.map((p, i) => (
        i === pts.length - 1 ? (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="var(--accent)" opacity="0.18" />
            <circle cx={p.x} cy={p.y} r="3" fill="var(--accent)" />
          </g>
        ) : null
      ))}
      {xTicks.map((i, k) => {
        const p = pts[i]
        const d = new Date(p.d.date)
        const label = d.toLocaleString('en', { month: 'short', day: 'numeric' })
        return (
          <text key={k} x={p.x} y={h - 6} fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted)"
                textAnchor={k === 0 ? 'start' : k === xTicks.length - 1 ? 'end' : 'middle'}>{label}</text>
        )
      })}
    </svg>
  )
}

// ── Multi-line finance chart ───────────────────────────────
export function MultiLineChart({ months, series, height = 200, currencySymbol = '€', labelInterval = 1, showDots = true }) {
  const w = 720
  const h = height
  const pad = { l: 44, r: 16, t: 16, b: 28 }
  const allVals = series.flatMap(s => s.values)
  const min = 0
  const max = Math.max(...allVals, 1) * 1.15
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const xAt = (i) => pad.l + (months.length === 1 ? innerW / 2 : (i / (months.length - 1)) * innerW)
  const yAt = (v) => pad.t + (1 - (v - min) / (max - min)) * innerH
  const ticks = [0, 0.5, 1].map(t => min + (max - min) * t)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      {ticks.map((v, i) => {
        const y = yAt(v)
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--border)" strokeDasharray="2 4" />
            <text x={6} y={y + 3} fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">{currencySymbol}{Math.round(v).toLocaleString()}</text>
          </g>
        )
      })}
      {months.map((m, i) => (
        (i % labelInterval === 0 || i === months.length - 1) && (
          <text key={i} x={xAt(i)} y={h - 8} fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)" textAnchor="middle">{m}</text>
        )
      ))}
      {series.map((s, idx) => {
        const path = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ')
        return (
          <g key={idx}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="1.6" />
            {showDots && s.values.map((v, i) => (
              <circle key={i} cx={xAt(i)} cy={yAt(v)} r="3" fill={s.color} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

// ── Contribution grid row ───────────────────────────────────
export function ContribRow({ label, count, cells, onCellClick }) {
  const [hover, setHover] = useState(null)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', alignItems: 'center', gap: 12, padding: '6px 0' }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap', overflow: 'hidden', position: 'relative' }}>
        {cells.map((c, i) => (
          <div key={i}
               className="cg-square"
               data-fill={c.level}
               data-today={c.today ? '1' : '0'}
               onMouseEnter={(e) => setHover({ c, x: e.currentTarget.offsetLeft, y: e.currentTarget.offsetTop })}
               onMouseLeave={() => setHover(null)}
               onClick={() => onCellClick?.(c)}
          />
        ))}
        {hover && (
          <div className="tt" style={{ left: hover.x, top: hover.y - 28 }}>{hover.c.tooltip}</div>
        )}
      </div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--text-mid)' }}>{count}</div>
    </div>
  )
}

// ── Weekly workout row (7 squares Mon-Sun) ──────────────────
export function WeeklyWorkout({ days, todayIdx }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
      {days.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
          <div style={{
            fontSize: 10,
            color: i === todayIdx ? 'var(--text)' : 'var(--muted)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: i === todayIdx ? 600 : 400,
          }}>{d.label}</div>
          <div style={{
            width: '100%', aspectRatio: '1 / 1', maxWidth: 36,
            borderRadius: 5,
            border: i === todayIdx ? '1.5px solid var(--text)' : '1px solid var(--border)',
            background: d.done ? (d.isRest ? 'var(--muted)' : 'var(--accent)') : 'transparent',
            display: 'grid', placeItems: 'center', position: 'relative',
            transition: 'all 180ms',
          }}>
            {d.done && !d.isRest && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="pop">
                <path d="M5 12l4 4L19 7"/>
              </svg>
            )}
            {d.done && d.isRest && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--card)" strokeWidth="3">
                <path d="M6 12h12"/>
              </svg>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Stat tile ──────────────────────────────────────────────
export function Stat({ label, value, sub, deltaPos, mono = true }) {
  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div className={mono ? 'num num-lg' : ''} style={{ color: deltaPos === true ? 'var(--accent)' : deltaPos === false ? 'var(--negative)' : 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  )
}

// ── Streak pill ────────────────────────────────────────────
export function StreakPill({ days, consistency }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div className="chip" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{days}</span> day streak
      </div>
      <div className="chip">
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>{consistency}%</span> this week
      </div>
    </div>
  )
}

// ── Range brush overlay (used by GraphCard) ─────────────────
export function RangeOverlay({ startX, endX, chartH, padT, padB, labelLines }) {
  const left = Math.min(startX, endX)
  const right = Math.max(startX, endX)
  const innerH = chartH - padT - padB
  const midY = padT + innerH / 2

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={left}
        y={padT}
        width={right - left}
        height={innerH}
        fill="var(--text)"
        fillOpacity="0.06"
      />
      <line x1={left} y1={padT} x2={left} y2={padT + innerH}
            stroke="var(--text)" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5" />
      <line x1={right} y1={padT} x2={right} y2={padT + innerH}
            stroke="var(--text)" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5" />
      <circle cx={left} cy={midY} r="4" fill="var(--text)" fillOpacity="0.7" />
      <circle cx={right} cy={midY} r="4" fill="var(--text)" fillOpacity="0.7" />
      {labelLines && labelLines.map((line, i) => {
        const text = typeof line === 'string' ? line : line.text
        const tone = typeof line === 'string' ? '' : line.tone
        const fill = tone === 'pos' ? 'var(--accent)' : tone === 'neg' ? 'var(--negative)' : 'var(--text)'
        return (
          <text
            key={i}
            x={left + 4}
            y={padT + 12 + i * 12}
            fill={fill}
            fontSize="9"
            fontFamily="var(--font-mono)"
            fillOpacity="0.9"
          >
            {text}
          </text>
        )
      })}
    </g>
  )
}
