const WEIGHT_PAD = { l: 28, r: 8, t: 12, b: 22 }

// ── SVG Weight chart ───────────────────────────────────────
export function WeightChart({ data, height = 170 }) {
  const w = 600
  const h = height
  const pad = WEIGHT_PAD
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
