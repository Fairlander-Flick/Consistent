import { useState, useMemo } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'
import { todayISO } from '../lib/dateUtils'
import { MultiLineChart } from '../components/ui/Widgets'
import {
  IconPlus, IconTrash, IconEdit, IconX, IconTarget,
  IconChevLeft, IconChevRight,
} from '../components/ui/Icons'

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CAT_PALETTE = ['#4ade80', '#22d3ee', '#818cf8', '#f59e0b', '#f472b6', '#fb923c', '#a78bfa', '#60a5fa', '#34d399', '#94a3b8', '#f87171']

function hashColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return CAT_PALETTE[h % CAT_PALETTE.length]
}

export function Finance() {
  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [showCats, setShowCats] = useState(false)
  const [filterCat, setFilterCat] = useState('all')

  const {
    categories, transactions,
    addTransaction, deleteTransaction,
    addCategory, deleteCategory, renameCategory,
  } = useFinanceStore()

  const monthKey = `${view.y}-${String(view.m + 1).padStart(2, '0')}`
  const monthTx = transactions.filter(t => t.date.startsWith(monthKey))
  const txFiltered = filterCat === 'all' ? monthTx : monthTx.filter(t => t.category === filterCat)

  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  const catBreakdown = useMemo(() => {
    const out = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      out[t.category] = (out[t.category] || 0) + t.amount
    })
    return Object.entries(out)
      .map(([name, amount]) => ({ name, amount, pct: expense ? amount / expense : 0, color: hashColor(name) }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthTx, expense])

  // 3-month series
  const series = useMemo(() => {
    const months = []
    for (let i = 2; i >= 0; i--) {
      const d = new Date(view.y, view.m - i, 1)
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: MONTHS_SHORT[d.getMonth()],
      })
    }
    const incArr = months.map(m => transactions.filter(t => t.date.startsWith(m.key) && t.type === 'income').reduce((s, t) => s + t.amount, 0))
    const expArr = months.map(m => transactions.filter(t => t.date.startsWith(m.key) && t.type === 'expense').reduce((s, t) => s + t.amount, 0))
    const balArr = incArr.map((v, i) => v - expArr[i])
    return {
      labels: months.map(m => m.label),
      data: [
        { label: 'Income',  color: '#4ade80', values: incArr },
        { label: 'Expense', color: '#f87171', values: expArr },
        { label: 'Balance', color: '#60a5fa', values: balArr },
      ],
    }
  }, [transactions, view])

  const goPrev = () => {
    if (view.m === 0) setView({ y: view.y - 1, m: 11 })
    else setView({ y: view.y, m: view.m - 1 })
  }
  const goNext = () => {
    if (view.m === 11) setView({ y: view.y + 1, m: 0 })
    else setView({ y: view.y, m: view.m + 1 })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Finance</h1>
          <div className="sub" style={{ marginTop: 4 }}>{MONTHS_FULL[view.m]} {view.y}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn icon" onClick={goPrev}><IconChevLeft size={14} /></button>
          <div className="mono" style={{ fontSize: 12, padding: '0 10px', minWidth: 110, textAlign: 'center', color: 'var(--text-mid)' }}>
            {MONTHS_SHORT[view.m]} {view.y}
          </div>
          <button className="btn icon" onClick={goNext}><IconChevRight size={14} /></button>
          <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }}></div>
          <button className="btn" onClick={() => setShowCats(true)}><IconTarget size={12} /> Categories</button>
          <AddTxButton categories={categories} onAdd={addTransaction} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <FinanceStat label="Income"   value={`€${income.toLocaleString()}`}   sub={`${monthTx.filter(t => t.type === 'income').length} entries`} positive />
        <FinanceStat label="Expenses" value={`€${expense.toLocaleString()}`}  sub={`${monthTx.filter(t => t.type === 'expense').length} entries`} negative />
        <FinanceStat label="Balance"  value={`${balance < 0 ? '−' : ''}€${Math.abs(balance).toLocaleString()}`} sub={balance >= 0 ? 'positive' : 'overspent'} positive={balance >= 0} negative={balance < 0} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-h">
          <h3>3-Month Comparison</h3>
          <div className="row" style={{ gap: 14, fontSize: 11, color: 'var(--muted)' }}>
            {series.data.map(s => (
              <span key={s.label} className="row" style={{ gap: 5 }}>
                <span style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }}></span>{s.label}
              </span>
            ))}
          </div>
        </div>
        <MultiLineChart months={series.labels} series={series.data} height={200} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-h">
            <h3>Category Breakdown</h3>
            <span className="meta">{catBreakdown.length} categories</span>
          </div>
          {catBreakdown.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              No expenses this month.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', background: 'var(--faint)', marginBottom: 16 }}>
                {catBreakdown.map(c => (
                  <div key={c.name} style={{ width: `${c.pct * 100}%`, background: c.color, transition: 'width 200ms' }} title={`${c.name} · €${c.amount}`}></div>
                ))}
              </div>
              <div className="col" style={{ gap: 6 }}>
                {catBreakdown.map(c => (
                  <div key={c.name} className="row between" style={{ padding: '4px 0' }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ width: 8, height: 8, background: c.color, borderRadius: 2 }}></span>
                      <span style={{ fontSize: 12 }}>{c.name}</span>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="mono dim" style={{ fontSize: 11 }}>{Math.round(c.pct * 100)}%</span>
                      <span className="mono" style={{ fontSize: 12, minWidth: 60, textAlign: 'right' }}>€{c.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <AddTxForm categories={categories} onAdd={addTransaction} />
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Transactions · {MONTHS_FULL[view.m]} {view.y}</h3>
          <div className="row" style={{ gap: 8 }}>
            <select className="select" style={{ width: 'auto', padding: '4px 28px 4px 10px', height: 28, fontSize: 11 }}
                    value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 160px 1fr 110px 24px', gap: 12, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
          <span>Date</span><span>Category</span><span>Note</span><span style={{ textAlign: 'right' }}>Amount</span><span></span>
        </div>
        {txFiltered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>No transactions for this filter.</div>
        )}
        {txFiltered.map(t => {
          const color = hashColor(t.category)
          return (
            <div key={t.id} className="list-row" style={{ gridTemplateColumns: '110px 160px 1fr 110px 24px' }}>
              <div className="mono dim">{t.date}</div>
              <div>
                <span className="chip" style={{ color, background: `color-mix(in oklab, ${color} 12%, var(--faint))` }}>
                  <span className="dot" style={{ background: color }}></span>{t.category}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{t.note}</div>
              <div className={'mono ' + (t.type === 'income' ? 'delta pos' : '')} style={{ textAlign: 'right', fontSize: 13 }}>
                {t.type === 'income' ? '+' : '−'}€{t.amount.toLocaleString()}
              </div>
              <button className="btn ghost icon" onClick={() => deleteTransaction(t.id)}>
                <IconTrash size={12} />
              </button>
            </div>
          )
        })}
      </div>

      {showCats && (
        <CategoriesModal
          categories={categories}
          onClose={() => setShowCats(false)}
          onAdd={addCategory}
          onDelete={deleteCategory}
          onRename={renameCategory}
        />
      )}
    </>
  )
}

function FinanceStat({ label, value, sub, positive, negative }) {
  const color = positive ? 'var(--accent)' : negative ? 'var(--negative)' : 'var(--text)'
  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div className="num num-lg" style={{ color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{sub}</div>
    </div>
  )
}

function AddTxButton({ categories, onAdd }) {
  return (
    <button className="btn primary" onClick={() => document.getElementById('add-tx-amount')?.focus()}>
      <IconPlus size={12} /> Add transaction
    </button>
  )
}

function AddTxForm({ categories, onAdd }) {
  const [form, setForm] = useState({
    amount: '',
    type: 'expense',
    category: categories[0] || '',
    date: todayISO(),
    note: '',
  })

  const handleAdd = () => {
    if (!form.amount || !form.category) return
    onAdd({ ...form, amount: parseFloat(form.amount) })
    setForm({ ...form, amount: '', note: '' })
  }

  return (
    <div className="card">
      <div className="card-h"><h3>Add Transaction</h3></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--muted)' }}>Amount (€)</label>
          <input
            id="add-tx-amount"
            className="input"
            placeholder="42.50"
            type="number"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            style={{ marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--muted)' }}>Type</label>
          <div className="tabs" style={{ marginTop: 4, width: '100%' }}>
            <button
              className={form.type === 'expense' ? 'active' : ''}
              style={{
                flex: 1,
                ...(form.type === 'expense' && { background: 'rgba(248,113,113,0.18)', color: '#f87171', borderColor: '#f87171' }),
              }}
              onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
            >Expense</button>
            <button
              className={form.type === 'income' ? 'active' : ''}
              style={{
                flex: 1,
                ...(form.type === 'income' && { background: 'rgba(74,222,128,0.18)', color: 'var(--accent)', borderColor: 'var(--accent)' }),
              }}
              onClick={() => setForm(f => ({ ...f, type: 'income' }))}
            >Income</button>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--muted)' }}>Category</label>
          <select className="select" style={{ marginTop: 4 }}
                  value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--muted)' }}>Date</label>
          <input className="input" type="date" value={form.date}
                 onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ marginTop: 4 }} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, color: 'var(--muted)' }}>Note</label>
          <input className="input" placeholder="Optional..." value={form.note}
                 onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ marginTop: 4 }} />
        </div>
        <button className="btn primary" onClick={handleAdd} style={{ gridColumn: '1 / -1', justifyContent: 'center' }}>
          <IconPlus size={12} /> Add transaction
        </button>
      </div>
    </div>
  )
}

function CategoriesModal({ categories, onClose, onAdd, onDelete, onRename }) {
  const [newName, setNewName] = useState('')
  const [editingName, setEditingName] = useState(null)
  const [editValue, setEditValue] = useState('')

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'grid', placeItems: 'center',
      zIndex: 1000, backdropFilter: 'blur(2px)',
    }} onClick={onClose}>
      <div className="card" style={{ width: 480, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="card-h">
          <h3>Categories</h3>
          <button className="btn ghost icon" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div className="col" style={{ gap: 4 }}>
          {categories.map(c => (
            <div key={c} className="list-row" style={{ gridTemplateColumns: '24px 1fr 24px 24px', padding: '8px 4px' }}>
              <span style={{ width: 14, height: 14, background: hashColor(c), borderRadius: 3 }}></span>
              {editingName === c ? (
                <input
                  className="input"
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => {
                    if (editValue.trim() && editValue !== c) onRename(c, editValue.trim())
                    setEditingName(null)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.target.blur()
                    if (e.key === 'Escape') setEditingName(null)
                  }}
                  style={{ background: 'transparent', border: 0, padding: 0, height: 'auto', fontSize: 13 }}
                />
              ) : (
                <span style={{ fontSize: 13 }}>{c}</span>
              )}
              <button className="btn ghost icon" onClick={() => { setEditingName(c); setEditValue(c) }}>
                <IconEdit size={11} />
              </button>
              <button className="btn ghost icon" onClick={() => onDelete(c)}>
                <IconTrash size={11} />
              </button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <input
              className="input"
              placeholder="New category…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newName.trim()) {
                  onAdd(newName.trim())
                  setNewName('')
                }
              }}
              style={{ flex: 1 }}
            />
            <button className="btn" onClick={() => {
              if (newName.trim()) { onAdd(newName.trim()); setNewName('') }
            }}>
              <IconPlus size={12} /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
