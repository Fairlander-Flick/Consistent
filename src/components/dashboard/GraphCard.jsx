import { useState, useMemo, useRef, useEffect } from 'react'
import { useWeightStore } from '../../store/useWeightStore'
import { useFinanceStore } from '../../store/useFinanceStore'
import { useTrainingStore } from '../../store/useTrainingStore'
import { recurringForDay } from '../../lib/financeUtils'
import { RangeOverlay } from '../ui/Widgets'
import { DUMMY_WEIGHT } from '../../lib/dummyData'
import { useSettingsStore } from '../../store/useSettingsStore'
import { symbolFor } from '../../lib/currency'
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

function isoMinus(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function GraphCard() {
  const { entries: weightEntries } = useWeightStore()
  const { transactions, recurring } = useFinanceStore()
  const { log: trainingLog } = useTrainingStore()
  const { weightGoal, currency } = useSettingsStore()
  const weightMode = weightGoal === 'lose' ? 'weightLose' : weightGoal === 'gain' ? 'weightGain' : 'neutral'
  const curSym = symbolFor(currency)

  const [tab, setTab] = useState('weight')
  const [financeVis, setFinanceVis] = useState({ income: true, expense: true, balance: true })
  const [volumeVis, setVolumeVis] = useState({ volume: true, duration: true })
  const [range, setRange] = useState(null)   // { start: idx, end: idx }
  const [drag, setDrag] = useState(null)     // { mode: 'new'|'start'|'end', anchorIdx }
  const svgRef = useRef(null)

  function selectTab(t) { setTab(t); setRange(null) }

  // Escape key clears range
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setRange(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Data per tab ──────────────────────────────────────────
  const realWeight = useMemo(() => [...weightEntries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-28)
    .map(e => ({ date: e.date, value: e.kg })), [weightEntries])
  const weightIsSample = realWeight.length < 2
  const weightData = useMemo(
    () => weightIsSample ? DUMMY_WEIGHT.map(e => ({ date: e.date, value: e.kg })) : realWeight,
    [weightIsSample, realWeight]
  )

  const financeData = useMemo(() => {
    const cutoff = isoMinus(27)
    const days = Array.from({ length: 28 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (27 - i)); return dateKey(d)
    })
    const recent = transactions.filter(t => t.date >= cutoff)
    const income = days.map(date => {
      const txInc = recent.filter(t => t.date === date && t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const d = new Date(date + 'T00:00:00')
      const numDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      const recurDay = recurringForDay(recurring, d.getDate(), numDays)
      const recurInc = recurDay.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
      return txInc + recurInc
    })
    const expense = days.map(date => {
      const txExp = recent.filter(t => t.date === date && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const d = new Date(date + 'T00:00:00')
      const numDays = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      const recurDay = recurringForDay(recurring, d.getDate(), numDays)
      const recurExp = recurDay.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
      return txExp + recurExp
    })
    let running = 0
    const balance = days.map((_, i) => { running += income[i] - expense[i]; return running })
    return { days, income, expense, balance }
  }, [transactions, recurring])

  const volumeData = useMemo(() => {
    const sessions = [...trainingLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-12)
    const volume = sessions.map(s =>
      s.exercises.reduce((sum, ex) => sum + (ex.sets || []).reduce((ss, set) => ss + set.reps * set.weight, 0), 0)
    )
    const duration = sessions.map(s => s.durationMinutes ?? 0)
    const isReal = sessions.map(s => (s.exercises?.length ?? 0) > 0)
    const hasDuration = duration.some(d => d > 0)
    return { sessions, volume, duration, isReal, hasDuration }
  }, [trainingLog])

  // ── Pointer helpers ───────────────────────────────────────
  function getDataLength() {
    if (tab === 'weight') return weightData.length
    if (tab === 'finance') return financeData.days.length
    return volumeData.sessions.length
  }

  function clientXToIdx(clientX) {
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = ((clientX - rect.left) / rect.width) * SVG_W
    const clamped = Math.max(PAD.l, Math.min(SVG_W - PAD.r, svgX))
    const len = getDataLength()
    return Math.max(0, Math.min(len - 1, Math.round((clamped - PAD.l) / INNER_W * (len - 1))))
  }

  function getHandleMode(clientX) {
    if (!range) return 'new'
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = ((clientX - rect.left) / rect.width) * SVG_W
    const len = getDataLength()
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
    if (tab === 'weight') {
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
    }
    if (tab === 'finance') {
      const { income, expense, balance } = financeData
      const incomeSum = income.slice(range.start, range.end + 1).reduce((a, b) => a + b, 0)
      const expenseSum = expense.slice(range.start, range.end + 1).reduce((a, b) => a + b, 0)
      const balDelta = balance[range.end] - (range.start > 0 ? balance[range.start - 1] : 0)
      const lines = []
      if (financeVis.income) lines.push(`Income: +${incomeSum.toFixed(0)} ${curSym}`)
      if (financeVis.expense) lines.push(`Expense: -${expenseSum.toFixed(0)} ${curSym}`)
      if (financeVis.balance) lines.push({
        text: `Balance: ${balDelta >= 0 ? '+' : ''}${balDelta.toFixed(0)} ${curSym}`,
        tone: deltaTone(balDelta, 'finance'),
      })
      return lines
    }
    // volume — average excludes empty (0-exercise) sessions (audit #7)
    const volSlice = volumeData.volume.slice(range.start, range.end + 1)
    const durSlice = volumeData.duration.slice(range.start, range.end + 1)
    const realSlice = volumeData.isReal.slice(range.start, range.end + 1)
    const volSum = volSlice.reduce((a, b) => a + b, 0)
    const durSum = durSlice.reduce((a, b) => a + b, 0)
    const nReal = realSlice.filter(Boolean).length
    const avgVol = nReal ? volSum / nReal : 0
    const avgDur = nReal ? Math.round(durSum / nReal) : 0
    return [
      `Volume: ${volSum.toLocaleString()} kg`,
      `Duration: ${durSum} min`,
      `Avg: ${avgVol.toFixed(0)} kg · ${avgDur} min/session`,
    ]
  }, [range, tab, weightData, financeData, volumeData, financeVis, weightMode, curSym])

  // ── Headline ──────────────────────────────────────────────
  const headline = useMemo(() => {
    if (tab === 'weight') {
      const latest = weightData[weightData.length - 1]
      const prev = weightData[weightData.length - 2]
      const delta = latest && prev ? latest.value - prev.value : 0
      return { text: `${latest?.value.toFixed(1) ?? '—'} kg`, tone: deltaTone(delta, weightMode) }
    }
    if (tab === 'finance') {
      const net = financeData.balance[financeData.balance.length - 1] ?? 0
      return { text: `${net >= 0 ? '+' : ''}${net.toFixed(0)} ${curSym}`, tone: deltaTone(net, 'finance') }
    }
    const lastVol = volumeData.volume[volumeData.volume.length - 1] ?? 0
    const lastDur = volumeData.duration[volumeData.duration.length - 1] ?? 0
    return { text: `${lastVol.toLocaleString()} kg · ${lastDur} min`, tone: '' }
  }, [tab, weightData, financeData, volumeData, weightMode, curSym])

  // ── SVG path builders ─────────────────────────────────────
  function weightSVG() {
    const vals = weightData.map(d => d.value)
    const min = Math.min(...vals) - 0.4
    const max = Math.max(...vals) + 0.4
    const pts = weightData.map((d, i) => ({ x: xAt(i, weightData.length), y: yAt(d.value, min, max) }))
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const area = `${path} L ${pts[pts.length-1].x} ${PAD.t+INNER_H} L ${pts[0].x} ${PAD.t+INNER_H} Z`
    const ticks = [min, (min+max)/2, max]
    return (
      <g>
        <defs>
          <linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--text)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--text)" stopOpacity="0" />
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
        <path d={path} fill="none" stroke="var(--text)" strokeWidth="1.4" />
        {pts.map((p, i) => i === pts.length - 1 ? (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="var(--text)" opacity="0.2" />
            <circle cx={p.x} cy={p.y} r="2.5" fill="var(--text)" />
          </g>
        ) : null)}
      </g>
    )
  }

  function financeSVG() {
    const allVals = [
      ...(financeVis.income ? financeData.income : []),
      ...(financeVis.expense ? financeData.expense : []),
      ...(financeVis.balance ? financeData.balance : []),
      1,
    ]
    const min = Math.min(...allVals, 0)
    const max = Math.max(...allVals) * 1.1 || 1
    const len = financeData.days.length
    const series = [
      { key: 'income', color: 'var(--accent)', data: financeData.income },
      { key: 'expense', color: 'var(--negative)', data: financeData.expense },
      { key: 'balance', color: 'var(--text)', dash: '4 4', data: financeData.balance },
    ].filter(s => financeVis[s.key])

    return (
      <g>
        {[0, 0.5, 1].map((t, i) => {
          const v = min + (max - min) * t
          const y = yAt(v, min, max)
          return (
            <g key={i}>
              <line x1={PAD.l} y1={y} x2={SVG_W-PAD.r} y2={y} stroke="var(--border)" strokeDasharray="2 4" />
              <text x={4} y={y+3} fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted)">{Math.round(v)}</text>
            </g>
          )
        })}
        {series.map(s => {
          const path = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i, len).toFixed(1)} ${yAt(v, min, max).toFixed(1)}`).join(' ')
          return (
            <path key={s.key} d={path} fill="none" stroke={s.color}
                  strokeWidth="1.4" strokeDasharray={s.dash} />
          )
        })}
      </g>
    )
  }

  function volumeSVG() {
    const { volume, duration, sessions } = volumeData
    if (sessions.length === 0) return null
    const maxVol = Math.max(...volume, 1)
    const maxDur = Math.max(...duration, 1)
    const len = sessions.length
    const barW = Math.max(4, INNER_W / len * 0.55)

    return (
      <g>
        {volume.map((v, i) => {
          const norm = v / maxVol
          const bh = norm * INNER_H
          const bx = xAt(i, len) - barW / 2
          const by = PAD.t + INNER_H - bh
          return volumeVis.volume ? (
            <rect key={i} x={bx} y={by} width={barW} height={bh}
                  fill="rgba(74,222,128,0.45)" rx="2" />
          ) : null
        })}
        {volumeVis.duration && duration.length > 1 && (() => {
          const pts = duration.map((v, i) => ({
            x: xAt(i, len),
            y: PAD.t + (1 - v / maxDur) * INNER_H,
          }))
          const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
          return <path d={path} fill="none" stroke="var(--text)" strokeWidth="1.4" />
        })()}
      </g>
    )
  }

  // ── Render ────────────────────────────────────────────────
  const len = getDataLength()
  const rangeStartX = range ? xAt(range.start, len) : 0
  const rangeEndX = range ? xAt(range.end, len) : 0

  return (
    <div className="card area-weight">
      <div className="card-h">
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <h3>Graph</h3>
          {tab === 'weight' && weightIsSample && (
            <span className="chip" style={{ color: 'var(--muted)' }}>Sample data</span>
          )}
        </div>
        <div className="row" style={{ gap: 12 }}>
          <div className="tabs">
            <button className={tab === 'weight' ? 'active' : ''} onClick={() => selectTab('weight')}>Weight</button>
            <button className={tab === 'finance' ? 'active' : ''} onClick={() => selectTab('finance')}>Finance</button>
            <button className={tab === 'volume' ? 'active' : ''} onClick={() => selectTab('volume')}>Volume</button>
          </div>
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
        {tab === 'weight' && weightSVG()}
        {tab === 'finance' && financeSVG()}
        {tab === 'volume' && volumeSVG()}
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

      {/* Per-tab toggle pills */}
      {tab === 'finance' && (
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          {[
            { key: 'income', label: 'Income', color: 'var(--accent)' },
            { key: 'expense', label: 'Expense', color: 'var(--negative)' },
            { key: 'balance', label: 'Balance', color: 'var(--text)' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFinanceVis(p => ({ ...p, [key]: !p[key] }))}
              className="chip"
              style={{
                background: financeVis[key] ? 'var(--faint)' : 'transparent',
                color: financeVis[key] ? color : 'var(--muted)',
                border: `1px solid ${financeVis[key] ? 'var(--border-strong)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === 'volume' && (
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          {[
            { key: 'volume', label: 'Volume', color: 'var(--accent)' },
            ...(volumeData.hasDuration ? [{ key: 'duration', label: 'Duration', color: 'var(--text)' }] : []),
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setVolumeVis(p => ({ ...p, [key]: !p[key] }))}
              className="chip"
              style={{
                background: volumeVis[key] ? 'var(--faint)' : 'transparent',
                color: volumeVis[key] ? color : 'var(--muted)',
                border: `1px solid ${volumeVis[key] ? 'var(--border-strong)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
