import { useState } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

function fmt(n) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

export function Finance() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const { categories, transactions, addTransaction, deleteTransaction, addCategory, deleteCategory, getMonthSummary } = useFinanceStore()

  const { income, expenses, balance, transactions: monthTxs } = getMonthSummary(year, month)

  const [form, setForm] = useState({ date: today.toISOString().slice(0, 10), amount: '', type: 'expense', category: categories[0] || '', note: '' })
  const [filterCat, setFilterCat] = useState('All')
  const [newCat, setNewCat] = useState('')

  const monthLabel = new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleAdd = () => {
    if (!form.amount || !form.category) return
    addTransaction(form)
    setForm(f => ({ ...f, amount: '', note: '' }))
  }

  const filtered = filterCat === 'All' ? monthTxs : monthTxs.filter(t => t.category === filterCat)

  const catBreakdown = categories.map(cat => ({
    cat,
    total: monthTxs.filter(t => t.category === cat && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  })).filter(x => x.total > 0)

  const selectStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    padding: '7px 10px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color var(--transition)',
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px' }}>Finance</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={prevMonth} style={{ color: 'var(--text-muted)', fontSize: '18px', padding: '2px 6px', borderRadius: '6px', transition: 'color var(--transition)' }}>‹</button>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)', minWidth: '120px', textAlign: 'center' }}>{monthLabel}</span>
          <button onClick={nextMonth} style={{ color: 'var(--text-muted)', fontSize: '18px', padding: '2px 6px', borderRadius: '6px', transition: 'color var(--transition)' }}>›</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {[
          { label: 'Income', value: income, color: 'var(--accent-green)' },
          { label: 'Expenses', value: expenses, color: 'var(--accent-red)' },
          { label: 'Balance', value: balance, color: balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <span className="label">{label}</span>
            <div className="nums" style={{ fontSize: '20px', fontWeight: 700, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{fmt(value)}</div>
          </Card>
        ))}
      </div>

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <Card style={{ marginBottom: '10px' }}>
          <span className="label">By category</span>
          {catBreakdown.map(({ cat, total }) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{cat}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '80px', height: '3px', borderRadius: '2px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((total / expenses) * 100, 100)}%`, background: 'var(--accent-red)', borderRadius: '2px' }} />
                </div>
                <span className="nums" style={{ fontSize: '12px', color: 'var(--text-muted)', width: '76px', textAlign: 'right' }}>{fmt(total)}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Add transaction */}
      <Card style={{ marginBottom: '10px' }}>
        <span className="label">Add transaction</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Input type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} style={{ width: '148px' }} />
          <Input type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="Amount €" style={{ width: '108px' }} />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={selectStyle}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={selectStyle}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <Input value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="Note (optional)" style={{ flex: 1, minWidth: '120px' }} />
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </Card>

      {/* Transaction list */}
      <Card style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span className="label" style={{ marginBottom: 0 }}>Transactions</span>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...selectStyle, padding: '4px 8px', fontSize: '12px' }}>
            <option>All</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No transactions this month.</p>
        ) : (
          filtered.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="nums" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.date}</span>
                <Badge>{t.category}</Badge>
                {t.note && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.note}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="nums" style={{ fontWeight: 600, color: t.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                </span>
                <button onClick={() => deleteTransaction(t.id)} style={{ color: 'var(--text-muted)', fontSize: '14px', transition: 'color var(--transition)' }}>×</button>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Category management */}
      <Card>
        <span className="label">Categories</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {categories.map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-elevated)', borderRadius: '6px', padding: '4px 10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{c}</span>
              <button onClick={() => deleteCategory(c)} style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1, marginLeft: '2px', transition: 'color var(--transition)' }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Input value={newCat} onChange={setNewCat} placeholder="New category…" style={{ flex: 1 }} />
          <Button onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat('') } }} variant="secondary">Add</Button>
        </div>
      </Card>
    </div>
  )
}
