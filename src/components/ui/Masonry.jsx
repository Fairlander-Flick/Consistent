import { Children, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// Order-aware JS masonry. Cards keep their source order (priority) but each one
// drops into whichever column is currently shortest, so the grid packs tight and
// a sparse card never leaves dead space below it. Columns are equal width, so an
// item's height is independent of which column it lands in — we can measure once
// and reflow freely.
//
// Re-layout triggers: container width change (column count) and any item growing
// or shrinking (tab switch, todo toggle) via a per-item ResizeObserver.

function sameAssignment(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

export function Masonry({ children, gap = 16, minColWidth = 360, className = '' }) {
  const items = Children.toArray(children)
  const n = items.length

  const containerRef = useRef(null)
  const itemEls = useRef([])
  const [cols, setCols] = useState(1)
  const [assign, setAssign] = useState([]) // column index per item

  // Column count from the container's own width (not the window) so it stays
  // correct inside any layout. One column once we drop below minColWidth.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const next = Math.max(1, Math.floor((w + gap) / (minColWidth + gap)))
      setCols(c => (c === next ? c : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [gap, minColWidth])

  // Shortest-column placement in source order.
  const reflow = useCallback(() => {
    const heights = new Array(cols).fill(0)
    const next = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      const el = itemEls.current[i]
      const h = el ? el.getBoundingClientRect().height : 0
      let m = 0
      for (let c = 1; c < cols; c++) if (heights[c] < heights[m]) m = c
      next[i] = m
      heights[m] += h + gap
    }
    setAssign(prev => (sameAssignment(prev, next) ? prev : next))
  }, [cols, n, gap])

  // Measure after every render; converges in one extra pass (widths are stable
  // across reflows, so heights don't change once placed). setState-in-effect is
  // the intended measure-then-place pattern for masonry — heights only exist
  // after layout, so placement can't be derived during render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => { reflow() })

  // Re-layout when any card's own height changes.
  useEffect(() => {
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(reflow)
    })
    for (let i = 0; i < n; i++) {
      const el = itemEls.current[i]
      if (el) ro.observe(el)
    }
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [reflow, n])

  const columns = Array.from({ length: cols }, () => [])
  items.forEach((child, i) => {
    const c = assign[i] != null && assign[i] < cols ? assign[i] : i % cols
    columns[c].push(
      <div key={i} ref={el => { itemEls.current[i] = el }} className="masonry-item">
        {child}
      </div>
    )
  })

  return (
    <div ref={containerRef} className={'masonry' + (className ? ' ' + className : '')} style={{ '--masonry-gap': gap + 'px' }}>
      {columns.map((col, c) => (
        <div key={c} className="masonry-col">{col}</div>
      ))}
    </div>
  )
}
