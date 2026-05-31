import { Link } from 'react-router-dom'
import { useLifelongStore } from '../../store/useLifelongStore'
import { nodePct, treeAvgPct, isCategory } from '../../lib/lifelongProgress'
import { IconChevRight } from '../ui/Icons'

// Compact dashboard summary. The full tree (drill-in, editing) lives on /goals.
export function LifelongGoalsCard() {
  const nodes = useLifelongStore(s => s.nodes)
  const avg = treeAvgPct(nodes)
  const avgPct = avg != null ? Math.round(avg * 100) : null

  // Top pursuits by progress, capped — the dashboard stays a glance, not a list.
  const rows = nodes
    .map(n => ({ id: n.id, title: n.title, pct: nodePct(n), sub: isCategory(n) ? `${n.children.length} sub` : (n.kind || 'item') }))
    .slice(0, 4)

  return (
    <div className="card area-life">
      <div className="card-h">
        <h3>Lifelong Goals</h3>
        <span className="meta">
          {nodes.length} {nodes.length === 1 ? 'pursuit' : 'pursuits'}{avgPct != null ? ` · ${avgPct}%` : ''}
        </span>
      </div>

      {nodes.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 4px' }}>
          No pursuits yet.{' '}
          <Link to="/goals" className="btn ghost sm" style={{ padding: '2px 6px' }}>Open Goals</Link>
        </div>
      ) : (
        <>
          <div className="col" style={{ gap: 12 }}>
            {rows.map(r => (
              <div key={r.id}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{r.title}</span>
                  <span className="mono prog" style={{ '--p': r.pct != null ? Math.round(r.pct * 100) : 0, fontSize: 'var(--fs-num-sm)' }}>
                    {r.pct != null ? `${Math.round(r.pct * 100)}%` : '—'}
                  </span>
                </div>
                <div className="ll-bar" style={{ '--p': r.pct != null ? Math.round(r.pct * 100) : 0 }}><i style={{ width: `${r.pct != null ? Math.round(r.pct * 100) : 0}%` }} /></div>
              </div>
            ))}
          </div>

          <Link to="/goals" className="btn ghost sm" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
            Open all goals <IconChevRight size={13} />
          </Link>
        </>
      )}
    </div>
  )
}
