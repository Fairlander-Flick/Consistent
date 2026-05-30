import { useState, useMemo, useRef, useEffect } from 'react'
import { useWeightStore } from '../../store/useWeightStore'
import { RangeOverlay } from '../ui/Widgets'
import { useSettingsStore } from '../../store/useSettingsStore'
import { deltaTone } from '../../lib/deltaTone'

const SVG_W = 600
const SVG_H = 200
const PAD = { l: 32, r: 8, t: 16, b: 24 }
const INNER_W = SVG_W - PAD.l - PAD.r
const INNER_H = SVG_H - PAD.t - PAD.b

function xAt(idx, len) {
  return PAD.l + (idx / Math.max(len - 1, 1)) * INNER_W
}
function yAt(val, min, max) {
  return PAD.t + (1 - (val - min) / (max - min || 1)) * INNER_H
}

export function GraphCard() {
  const { entries: weightEntries } = useWeightStore()
  const { weightGoal } = useSettingsStore()
  const weightMode = weightGoal === 'lose' ? 'weightLose' : weightGoal === 'gain' ? 'weightGain' : 'neutral'

  const [range, setRange] = useState(null)   // { start: idx, end: idx }
  const [drag, setDrag] = useState(null)     // { mode: 'new'|'start'|'end', anchorIdx }
  const svgRef = useRef(null)

  // Escape key clears range
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setRange(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Data ──────────────────────────────────────────────────
  const weightData = useMemo(() => weightEntries
    .toSorted((a, b) => a.date.localeCompare(b.date))
    .slice(-28)
    .map(e => ({ date: e.date, value: e.kg })), [weightEntries])

  // ── Pointer helpers ───────────────────────────────────────
  function clientXToIdx(clientX) {
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = ((clientX - rect.left) / rect.width) * SVG_W
    const clamped = Math.max(PAD.l, Math.min(SVG_W - PAD.r, svgX))
    const len = weightData.length
    return Math.max(0, Math.min(len - 1, Math.round((clamped - PAD.l) / INNER_W * (len - 1))))
  }

  function getHandleMode(clientX) {
    if (!range) return 'new'
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = ((clientX - rect.left) / rect.width) * SVG_W
    const len = weightData.length
    const startSvgX = xAt(range.start, len)
    const endSvgX = xAt(range.end, len)
    const HIT = 10
    if (Math.abs(svgX - startSvgX) < HIT) return 'start'
    if (Math.abs(svgX - endSvgX) < HIT) return 'end'
    return 'new'
  }

  function onPointerDown(e) {
    const idx = clientXToIdx(e.clientX)
    const mode = getHandleMode(e.clientX)
    e.currentTarget.setPointerCapture(e.pointerId)
    if (mode === 'start') {
      setDrag({ mode: 'start', anchorIdx: range.end })
    } else if (mode === 'end') {
      setDrag({ mode: 'end', anchorIdx: range.start })
    } else {
      setRange({ start: idx, end: idx })
      setDrag({ mode: 'new', anchorIdx: idx })
    }
  }

  function onPointerMove(e) {
    if (!drag) return
    const idx = clientXToIdx(e.clientX)
    setRange({ start: Math.min(drag.anchorIdx, idx), end: Math.max(drag.anchorIdx, idx) })
  }

  function onPointerUp() { setDrag(null) }

  // ── Range label lines ─────────────────────────────────────
  const labelLines = useMemo(() => {
    if (!range) return null
    const start = weightData[range.start]
    const end = weightData[range.end]
    if (!start || !end) return null
    const delta = end.value - start.value
    const pct = start.value ? ((delta / start.value) * 100).toFixed(1) : '0.0'
    return [
      `${start.value.toFixed(1)} → ${end.value.toFixed(1)} kg`,
      {
        text: `Δ ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg (${delta >= 0 ? '+' : ''}${pct}%)`,
        tone: deltaTone(delta, weightMode),
      },
    ]
  }, [range, weightData, weightMode])

  // ── Headline ──────────────────────────────────────────────
  const headline = useMemo(() => {
    const latest = weightData[weightData.length - 1]
    const prev = weightData[weightData.length - 2]
    const delta = latest && prev ? latest.value - prev.value : 0
    return { text: `${latest?.value.toFixed(1) ?? '—'} kg`, tone: deltaTone(delta, weightMode) }
  }, [weightData, weightMode])

  // ── SVG path builder ──────────────────────────────────────
  function weightSVG() {
    if (weightData.length === 0) {
      return (
        <g>
          <text x={SVG_W / 2} y={SVG_H / 2 - 6} fontSize="12"
                fill="var(--muted)" textAnchor="middle">
            No weight logged yet
          </text>
          <text x={SVG_W / 2} y={SVG_H / 2 + 12} fontSize="10"
                fill="var(--muted)" textAnchor="middle" fontFamily="var(--font-mono)">
            Add an entry in Consistency → Weight log
          </text>
        </g>
      )
    }
    if (weightData.length === 1) {
      const only = weightData[0]
      return (
        <g>
          <circle cx={SVG_W / 2} cy={SVG_H / 2} r="3" fill="var(--text)" />
          <text x={SVG_W / 2} y={SVG_H / 2 - 12} fontSize="11"
                fill="var(--text)" textAnchor="middle">
            {only.value.toFixed(1)} kg
          </text>
          <text x={SVG_W / 2} y={SVG_H / 2 + 22} fontSize="10"
                fill="var(--muted)" textAnchor="middle">
            Need ≥ 2 entries to draw trend
          </text>
        </g>
      )
    }
    const vals = weightData.map(d => d.value)
    const min = Math.min(...vals) - 0.4
    const max = Math.max(...vals) + 0.4
    const pts = weightData.map((d, i) => ({ x: xAt(i, weightData.length), y: yAt(d.value, min, max) }))
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const area = `${path} L ${pts[pts.length-1].x} ${PAD.t+INNER_H} L ${pts[0].x} ${PAD.t+INNER_H} Z`
    const overallDelta = weightData[weightData.length - 1].value - weightData[0].value
    const tone = deltaTone(overallDelta, weightMode)
    const lineColor = tone === 'pos' ? 'var(--accent)'
                    : tone === 'neg' ? 'var(--negative)'
                    : 'var(--text)'
    const ticks = [min, (min+max)/2, max]
    return (
      <g>
        <defs>
          <linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.14" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v, i) => {
          const y = yAt(v, min, max)
          return (
            <g key={i}>
              <line x1={PAD.l} y1={y} x2={SVG_W - PAD.r} y2={y} stroke="var(--border)" strokeDasharray="2 4" />
              <text x={4} y={y + 3} fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted)">{v.toFixed(1)}</text>
            </g>
          )
        })}
        <path d={area} fill="url(#gfill)" />
        <path d={path} fill="none" stroke={lineColor} strokeWidth="1.4" />
        {pts.map((p, i) => i === pts.length - 1 ? (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={lineColor} opacity="0.2" />
            <circle cx={p.x} cy={p.y} r="2.5" fill={lineColor} />
          </g>
        ) : null)}
      </g>
    )
  }

  // ── Render ────────────────────────────────────────────────
  const len = weightData.length
  const rangeStartX = range ? xAt(range.start, len) : 0
  const rangeEndX = range ? xAt(range.end, len) : 0

  return (
    <div className="card area-weight">
      <div className="card-h">
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <h3>Weight</h3>
        </div>
        <div className="row" style={{ gap: 12 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>↔ drag to select</span>
          <span className={`num num-md ${headline.tone ? 'delta ' + headline.tone : ''}`}>
            {headline.text}
          </span>
        </div>
      </div>

      {/* Chart SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block', cursor: drag ? 'ew-resize' : 'crosshair' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {weightSVG()}
        {range && (
          <RangeOverlay
            startX={rangeStartX}
            endX={rangeEndX}
            chartH={SVG_H}
            padT={PAD.t}
            padB={PAD.b}
            labelLines={labelLines}
          />
        )}
      </svg>
    </div>
  )
}
