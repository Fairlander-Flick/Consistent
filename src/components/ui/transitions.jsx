/* eslint-disable react-refresh/only-export-components */
// React adapters for the transitions-dev library. The CSS lives in tokens.css
// (the t-* classes + :root tokens); these components/hooks own the small JS
// orchestration (reflow replays, open/close cleanup timers) the snippets need.
// This module intentionally co-locates a few hooks/utils with the components
// that use them; fast-refresh of this file is disabled above as a result.
import { useState, useEffect, useRef, useCallback } from 'react'

// Read a millisecond CSS custom property off :root, with a fallback.
export function readMs(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))
  return Number.isFinite(v) ? v : fallback
}

// ── Modal shell (06) ────────────────────────────────────────
// Animates in on mount and plays the close scale-down before unmounting.
// Render-prop children receive `close` so footer buttons animate out too.
export function Modal({ onClose, width, className = '', children }) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const r = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(r)
  }, [])

  const close = useCallback(() => {
    if (closing) return
    setOpen(false)
    setClosing(true)
    setTimeout(() => onClose?.(), readMs('--modal-close-dur', 150))
  }, [onClose, closing])

  const state = (open ? ' is-open' : '') + (closing ? ' is-closing' : '')
  return (
    <div className={'modal-overlay' + state} onClick={close}>
      <div
        className={`modal t-modal ${className}` + state}
        style={width ? { width } : undefined}
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {typeof children === 'function' ? children(close) : children}
      </div>
    </div>
  )
}

// ── Text states swap (04) ───────────────────────────────────
// Swaps text in place when `children` changes: old exits up + blurs, new
// enters from below. className stays constant so React never clobbers the
// imperative animation classes during the re-render.
export function TextSwap({ children, className = '' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(children)
  const prev = useRef(children)

  useEffect(() => {
    if (children === prev.current) return
    const el = ref.current
    if (!el) { prev.current = children; setShown(children); return }
    el.classList.add('is-exit')
    const t = setTimeout(() => {
      prev.current = children
      setShown(children)
      const e = ref.current
      if (e) {
        e.classList.remove('is-exit')
        e.classList.add('is-enter-start')
        void e.offsetHeight // reflow so the return transitions
        e.classList.remove('is-enter-start')
      }
    }, readMs('--text-swap-dur', 150))
    return () => clearTimeout(t)
  }, [children])

  return <span ref={ref} className={'t-text-swap ' + className}>{shown}</span>
}

// ── Number pop-in (02) ──────────────────────────────────────
// Each character re-enters with a blurred slide whenever `value` changes; the
// last two characters stagger so decimals/percent feel alive.
export function PopNumber({ value, className = '', style }) {
  const ref = useRef(null)
  const prev = useRef(String(value))
  const str = String(value)

  useEffect(() => {
    if (str === prev.current) return
    prev.current = str
    const g = ref.current
    if (!g) return
    g.classList.remove('is-animating')
    void g.offsetHeight // reflow so the keyframes restart
    g.classList.add('is-animating')
  }, [str])

  const chars = str.split('')
  return (
    <span ref={ref} className={'t-digit-group ' + className} style={style}>
      {chars.map((ch, i) => {
        const stagger = i === chars.length - 2 ? '1' : i === chars.length - 1 ? '2' : undefined
        return <span key={i} className="t-digit" data-stagger={stagger}>{ch}</span>
      })}
    </span>
  )
}

// ── Content swap ────────────────────────────────────────────
// Crossfades a region when `swapKey` changes (e.g. a pill/segment toggle that
// swaps what's displayed). Re-keys the inner div so its content remounts and
// eases in via the .t-swap-in animation, instead of snapping instantly.
export function Swap({ swapKey, className = '', children, ...rest }) {
  return <div key={swapKey} className={'t-swap-in ' + className} {...rest}>{children}</div>
}

// ── Icon swap (09) ──────────────────────────────────────────
// Two icons stacked in one slot; `state` ("a" | "b") cross-fades them.
export function IconSwap({ state, a, b, className = '' }) {
  return (
    <span className={'t-icon-swap ' + className} data-state={state}>
      <span className="t-icon" data-icon="a">{a}</span>
      <span className="t-icon" data-icon="b">{b}</span>
    </span>
  )
}

// ── Success check (10) ──────────────────────────────────────
// Draws a checkmark with fade + rotate + bob when mounted (or when `play`
// flips true). Measures its own path so the stroke-draw is exact.
export function SuccessCheck({ size = 16, className = '', style }) {
  const ref = useRef(null)
  useEffect(() => {
    const wrap = ref.current
    if (!wrap) return
    const path = wrap.querySelector('svg path')
    if (path) {
      const len = Math.ceil(path.getTotalLength()) + 1
      path.style.strokeDasharray = String(len)
      path.style.strokeDashoffset = String(len)
    }
    wrap.setAttribute('data-state', 'out')
    void wrap.offsetWidth // reflow so the appear restarts cleanly
    wrap.setAttribute('data-state', 'in')
  }, [])
  return (
    <span ref={ref} className={'t-success-check ' + className} data-state="out" aria-hidden="true" style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l4 4L19 7" />
      </svg>
    </span>
  )
}

// ── Error state shake (12) ──────────────────────────────────
// Returns refs for the wrapper (owns the message) and the shaking element
// (owns the border), plus a trigger that shakes, shows the message, and
// auto-reverts after the hold. Wrapper/message are optional.
export function useShake() {
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const timers = useRef({})

  const trigger = useCallback(() => {
    const wrap = wrapRef.current
    const input = inputRef.current
    if (!input) return
    if (wrap) wrap.classList.add('is-error')
    input.classList.add('is-error')

    input.classList.remove('is-shaking')
    void input.offsetWidth // reflow so the shake replays
    input.classList.add('is-shaking')

    const shakeMs = readMs('--shake-dur-a', 80) * 2 + readMs('--shake-dur-b', 60) * 2
    clearTimeout(timers.current.shake)
    timers.current.shake = setTimeout(() => input.classList.remove('is-shaking'), shakeMs + 20)

    clearTimeout(timers.current.revert)
    timers.current.revert = setTimeout(() => {
      if (wrap) wrap.classList.remove('is-error')
      input.classList.remove('is-error')
    }, shakeMs + readMs('--revert-hold', 3000))
  }, [])

  const clear = useCallback(() => {
    clearTimeout(timers.current.revert)
    wrapRef.current?.classList.remove('is-error')
    inputRef.current?.classList.remove('is-error')
  }, [])

  useEffect(() => () => { clearTimeout(timers.current.shake); clearTimeout(timers.current.revert) }, [])

  return { wrapRef, inputRef, trigger, clear }
}

// ── Avatar / pill group hover (11) ──────────────────────────
// Attach to a container ref; every `.t-avatar` child gets the distance-falloff
// lift on hover and a bouncy spring back on leave. Re-binds each render so it
// tracks changing children. Pass a deps array to limit re-binds.
export function useHoverSpring(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const cs = getComputedStyle(document.documentElement)
    const num = (n, fb) => { const v = parseFloat(cs.getPropertyValue(n)); return Number.isFinite(v) ? v : fb }
    const ease = (n, fb) => cs.getPropertyValue(n).trim() || fb
    const items = Array.from(root.querySelectorAll('.t-avatar'))

    const set = (activeIdx, phase) => {
      const lift = num('--avatar-lift', -4)
      const falloff = num('--avatar-falloff', 0.45)
      const scale = num('--avatar-scale', 1.05)
      const tf = phase === 'out'
        ? ease('--avatar-ease-out', 'cubic-bezier(0.34, 3.85, 0.64, 1)')
        : ease('--avatar-ease-in', 'cubic-bezier(0.22, 1, 0.36, 1)')
      items.forEach((el, i) => {
        el.style.transitionTimingFunction = tf
        if (activeIdx == null) {
          el.style.setProperty('--shift', '0px')
          el.style.setProperty('--scale-active', '1')
          return
        }
        const d = Math.abs(i - activeIdx)
        el.style.setProperty('--shift', (lift * Math.pow(falloff, d)).toFixed(3) + 'px')
        el.style.setProperty('--scale-active', i === activeIdx ? String(scale) : '1')
      })
    }

    const enters = items.map((el, i) => {
      const h = () => set(i, 'in')
      el.addEventListener('mouseenter', h)
      return [el, h]
    })
    const leave = () => set(null, 'out')
    root.addEventListener('mouseleave', leave)
    return () => {
      enters.forEach(([el, h]) => el.removeEventListener('mouseenter', h))
      root.removeEventListener('mouseleave', leave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ── Sliding tab pill ────────────────────────────────────────
// Attach to a `.tabs` container ref. Injects a single `.tab-pill` element that
// slides + resizes to sit under whichever child carries `.active`, so the
// indicator glides between tabs instead of snapping background from button to
// button. Tracks `.active` via a MutationObserver (works regardless of how the
// active state is wired) and repositions on resize / font load. The initial
// placement is jumpless (no transition); subsequent moves animate.
export function useTabPill(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let pill = root.querySelector(':scope > .tab-pill')
    if (!pill) {
      pill = document.createElement('div')
      pill.className = 'tab-pill'
      pill.setAttribute('aria-hidden', 'true')
      root.insertBefore(pill, root.firstChild)
    }

    const move = (animate) => {
      const active = root.querySelector(':scope > .active, :scope > button.active')
      if (!active) { pill.style.opacity = '0'; return }
      if (!animate) pill.style.transition = 'none'
      pill.style.top = active.offsetTop + 'px'
      pill.style.height = active.offsetHeight + 'px'
      pill.style.width = active.offsetWidth + 'px'
      pill.style.transform = `translateX(${active.offsetLeft}px)`
      pill.style.opacity = '1'
      if (!animate) { void pill.offsetWidth; pill.style.transition = '' }
    }

    move(false)
    // Re-place once webfonts settle (tab widths shift as Inter/Grotesk load).
    document.fonts?.ready.then(() => move(false)).catch(() => {})

    const mo = new MutationObserver(() => move(true))
    mo.observe(root, { attributes: true, subtree: true, attributeFilter: ['class'] })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => move(false)) : null
    ro?.observe(root)

    return () => { mo.disconnect(); ro?.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
