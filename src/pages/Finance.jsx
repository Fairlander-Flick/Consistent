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
  const { categories, transactions, addTransaction, deleteTransaction, addCategory, deleteCategory, renameCategory, getMonthSummary } = useFinanceStore()

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

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>Finance</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={prevMonth} style={{ color: 'var(--text-muted)', fontSize: '18px' }}>‹</button>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{monthLabel}</span>
          <button onClick={nextMonth} style={{ color: 'var(--text-muted)', fontSize: '18px' }}>›</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Income', value: income, color: 'var(--accent-green)' },
          { label: 'Expenses', value: expenses, color: 'var(--accent-red)' },
          { label: 'Balance', value: balance, color: balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color, letterSpacing: '-0.5px' }}>{fmt(value)}</div>
          </Card>
        ))}
      </div>

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <Card style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>By Category</div>
          {catBreakdown.map(({ cat, total }) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px' }}>{cat}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((total / expenses) * 100, 100)}%`, background: 'var(--accent-red)', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '72px', textAlign: 'right' }}>{fmt(total)}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Add transaction */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Add Transaction</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <Input type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} style={{ width: '140px' }} />
          <Input type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="Amount €" style={{ width: '100px' }} />
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '6px 8px', fontSize: '13px' }}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '6px 8px', fontSize: '13px' }}
          >
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <Input value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="Note (optional)" style={{ flex: 1, minWidth: '120px' }} />
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </Card>

      {/* Transaction list */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transactions</div>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '4px 8px', fontSize: '12px' }}
          >
            <option>All</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No transactions this month.</p>
        ) : (
          filtered.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.date}</span>
                <Badge>{t.category}</Badge>
                {t.note && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.note}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 600, color: t.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
                <button onClick={() => deleteTransaction(t.id)} style={{ color: 'var(--text-muted)', fontSize: '14px' }}>×</button>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Category management */}
      <Card>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Categories</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {categories.map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '3px 10px' }}>
              <span style={{ fontSize: '12px' }}>{c}</span>
              <button onClick={() => deleteCategory(c)} style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Input value={newCat} onChange={setNewCat} placeholder="New category..." style={{ flex: 1 }} />
          <Button onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat('') } }} variant="secondary">Add</Button>
        </div>
      </Card>
    </div>
  )
}
