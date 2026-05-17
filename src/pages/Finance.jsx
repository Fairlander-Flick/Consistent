import { useState, useMemo } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'
import { recurringMonthTotals, recurringForDay } from '../lib/financeUtils'
import { todayISO } from '../lib/dateUtils'
import { useMoney } from '../lib/useMoney'
import { MultiLineChart } from '../components/ui/Widgets'
import {
  IconPlus, IconTrash, IconEdit, IconX, IconTarget,
  IconChevLeft, IconChevRight,
} from '../components/ui/Icons'

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CAT_PALETTE = ['#4ade80', '#22d3ee', '#818cf8', '#f59e0b', '#f472b6', '#fb923c', '#a78bfa', '#60a5fa', '#34d399', '#94a3b8', '#f87171']

function hashColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return CAT_PALETTE[h % CAT_PALETTE.length]
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function dayLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()} · ${DAY_SHORT[d.getDay()]}`
}

export function Finance() {
  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [section, setSection] = useState('overview')
  const [showCats, setShowCats] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [txView, setTxView] = useState('daily')
  const [pendingDelete, setPendingDelete] = useState(null) // full tx object
  const [chartMode, setChartMode] = useState('monthly')

  const {
    categories, transactions, recurring, budgets,
    addTransaction, deleteTransaction,
    addCategory, deleteCategory, renameCategory, setBudget,
    addRecurring, updateRecurring, deleteRecurring,
  } = useFinanceStore()
  const { sym, fmt } = useMoney()

  const monthKey = `${view.y}-${String(view.m + 1).padStart(2, '0')}`
  const monthTx = useMemo(
    () => transactions.filter(t => t.date.startsWith(monthKey)),
    [transactions, monthKey]
  )
  const txFiltered = filterCat === 'all' ? monthTx : monthTx.filter(t => t.category === filterCat)

  const txIncome  = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const txExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const recur = recurringMonthTotals(recurring)
  const income  = txIncome  + recur.income
  const expense = txExpense + recur.expense
  const balance = income - expense

  const recurringIncome = recur.income
  const recurringExpense = recur.expense

  const catBreakdown = useMemo(() => {
    const out = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      out[t.category] = (out[t.category] || 0) + t.amount
    })
    recurring.filter(r => r.type === 'expense').forEach(r => {
      out[r.category] = (out[r.category] || 0) + r.amount
    })
    return Object.entries(out)
      .map(([name, amount]) => {
        const budget = budgets[name] ?? null
        return {
          name, amount,
          pct: expense ? amount / expense : 0,
          color: hashColor(name),
          budget,
          budgetPct: budget ? amount / budget : null,
          overBudget: budget ? amount > budget : false,
        }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [monthTx, expense, budgets, recurring])

  const txByDay = useMemo(() => {
    const days = {}
    txFiltered.forEach(t => {
      if (!days[t.date]) days[t.date] = []
      days[t.date].push(t)
    })
    return Object.entries(days)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, txs]) => {
        const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return { date, txs, inc, exp, net: inc - exp }
      })
  }, [txFiltered])

  const series = useMemo(() => {
    const months = []
    for (let i = 2; i >= 0; i--) {
      const d = new Date(view.y, view.m - i, 1)
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: MONTHS_SHORT[d.getMonth()],
      })
    }
    const recurTotals = recurringMonthTotals(recurring)
    const incArr = months.map(m => transactions.filter(t => t.date.startsWith(m.key) && t.type === 'income').reduce((s, t) => s + t.amount, 0) + recurTotals.income)
    const expArr = months.map(m => transactions.filter(t => t.date.startsWith(m.key) && t.type === 'expense').reduce((s, t) => s + t.amount, 0) + recurTotals.expense)
    const balArr = incArr.map((v, i) => v - expArr[i])
    return {
      labels: months.map(m => m.label),
      data: [
        { label: 'Income',  color: '#4ade80', values: incArr },
        { label: 'Expense', color: '#f87171', values: expArr },
        { label: 'Balance', color: '#60a5fa', values: balArr },
      ],
    }
  }, [transactions, view, recurring])

  const dailySeries = useMemo(() => {
    const numDays = new Date(view.y, view.m + 1, 0).getDate()
    const incArr = [], expArr = [], balArr = [], dayLabels = []
    for (let d = 1; d <= numDays; d++) {
      const dayKey = `${monthKey}-${String(d).padStart(2, '0')}`
      const dayTxs = monthTx.filter(t => t.date === dayKey)
      const recurDay = recurringForDay(recurring, d, numDays)
      const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
            + recurDay.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
      const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
            + recurDay.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
      dayLabels.push(String(d))
      incArr.push(inc)
      expArr.push(exp)
      balArr.push(inc - exp)
    }
    return {
      labels: dayLabels,
      data: [
        { label: 'Income',  color: '#4ade80', values: incArr },
        { label: 'Expense', color: '#f87171', values: expArr },
        { label: 'Balance', color: '#60a5fa', values: balArr },
      ],
    }
  }, [monthTx, monthKey, view, recurring])

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
          <div className="tabs">
            <button className={section === 'overview' ? 'active' : ''} onClick={() => setSection('overview')}>Overview</button>
            <button className={section === 'recurring' ? 'active' : ''} onClick={() => setSection('recurring')}>
              Recurring{recurring.length > 0 && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>({recurring.length})</span>}
            </button>
          </div>
          <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }}></div>
          <button className="btn" onClick={() => setShowCats(true)}><IconTarget size={12} /> Categories</button>
          {section === 'overview' && <AddTxButton />}
        </div>
      </div>

      {section === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            <FinanceStat label="Income"   value={fmt(income, { round: false })}   sub={`${monthTx.filter(t => t.type === 'income').length} entries`} positive />
            <FinanceStat label="Expenses" value={fmt(expense, { round: false })}  sub={`${monthTx.filter(t => t.type === 'expense').length} entries`} negative />
            <FinanceStat label="Balance"  value={fmt(balance, { round: false })} sub={balance >= 0 ? 'positive' : 'overspent'} positive={balance >= 0} negative={balance < 0} />
          </div>

          {recurring.length > 0 && (
            <div style={{
              marginBottom: 16, padding: '10px 16px',
              background: 'var(--faint)', border: '1px solid var(--border)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12,
            }}>
              <span style={{ color: 'var(--muted)' }}>Recurring this month</span>
              <div className="row" style={{ gap: 20 }}>
                {recurringIncome > 0 && (
                  <span className="row" style={{ gap: 6 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>{recurring.filter(r => r.type === 'income').length} income items</span>
                    <span className="mono delta pos">{fmt(recurringIncome, { signed: true, round: false })}</span>
                  </span>
                )}
                {recurringExpense > 0 && (
                  <span className="row" style={{ gap: 6 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>{recurring.filter(r => r.type === 'expense').length} expense items</span>
                    <span className="mono" style={{ color: 'var(--negative)' }}>−{sym}{recurringExpense.toLocaleString()}</span>
                  </span>
                )}
                <button className="btn ghost sm" style={{ fontSize: 11 }} onClick={() => setSection('recurring')}>
                  Manage →
                </button>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-h">
              <h3>{chartMode === 'monthly' ? '3-Month Comparison' : 'Daily Breakdown'}</h3>
              <div className="row" style={{ gap: 14 }}>
                <div className="row" style={{ gap: 14, fontSize: 11, color: 'var(--muted)' }}>
                  {(chartMode === 'monthly' ? series : dailySeries).data.map(s => (
                    <span key={s.label} className="row" style={{ gap: 5 }}>
                      <span style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }}></span>{s.label}
                    </span>
                  ))}
                </div>
                <div className="tabs" style={{ fontSize: 11 }}>
                  <button className={chartMode === 'monthly' ? 'active' : ''} onClick={() => setChartMode('monthly')}>Monthly</button>
                  <button className={chartMode === 'daily' ? 'active' : ''} onClick={() => setChartMode('daily')}>Daily</button>
                </div>
              </div>
            </div>
            <MultiLineChart
              months={chartMode === 'monthly' ? series.labels : dailySeries.labels}
              series={chartMode === 'monthly' ? series.data : dailySeries.data}
              height={200}
              currencySymbol={sym}
              labelInterval={chartMode === 'daily' ? 5 : 1}
              showDots={chartMode === 'monthly'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="card">
              <div className="card-h">
                <h3>Category Breakdown</h3>
                {catBreakdown.some(c => c.overBudget) ? (
                  <span className="meta" style={{ color: 'var(--negative)' }}>
                    {catBreakdown.filter(c => c.overBudget).length} over budget
                  </span>
                ) : (
                  <span className="meta">{catBreakdown.length} categories</span>
                )}
              </div>
              {catBreakdown.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                  No expenses this month.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', height: 12, borderRadius: 4, overflow: 'hidden', background: 'var(--faint)', marginBottom: 16 }}>
                    {catBreakdown.map(c => (
                      <div key={c.name} style={{ width: `${c.pct * 100}%`, background: c.color, transition: 'width 200ms' }} title={`${c.name} · ${sym}${c.amount}`}></div>
                    ))}
                  </div>
                  <div className="col" style={{ gap: 10 }}>
                    {catBreakdown.map(c => (
                      <div key={c.name}>
                        <div className="row between" style={{ padding: '2px 0' }}>
                          <div className="row" style={{ gap: 8 }}>
                            <span style={{ width: 8, height: 8, background: c.color, borderRadius: 2 }}></span>
                            <span style={{ fontSize: 12 }}>{c.name}</span>
                          </div>
                          <div className="row" style={{ gap: 8 }}>
                            <span className="mono dim" style={{ fontSize: 11 }}>{Math.round(c.pct * 100)}%</span>
                            <span className="mono" style={{ fontSize: 12, minWidth: 60, textAlign: 'right' }}>{sym}{c.amount}</span>
                          </div>
                        </div>
                        {c.budget != null && (
                          <div style={{ marginTop: 5 }}>
                            <div style={{ height: 4, borderRadius: 2, background: 'var(--faint)', overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.min(100, c.budgetPct * 100)}%`,
                                height: '100%',
                                background: c.overBudget ? 'var(--negative)' : 'var(--accent)',
                                transition: 'width 200ms',
                              }} />
                            </div>
                            <div className="mono" style={{
                              fontSize: 10, marginTop: 3,
                              color: c.overBudget ? 'var(--negative)' : 'var(--muted)',
                            }}>
                              {sym}{Math.round(c.amount)} / {sym}{c.budget.toLocaleString()} budget
                              {c.overBudget && ` · ${sym}${Math.round(c.amount - c.budget).toLocaleString()} over`}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <AddTxForm categories={categories} onAdd={addTransaction} />
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-h">
              <h3>Transactions · {MONTHS_FULL[view.m]} {view.y}</h3>
              <div className="row" style={{ gap: 8 }}>
                <div className="tabs">
                  <button className={txView === 'daily' ? 'active' : ''} onClick={() => setTxView('daily')}>Daily</button>
                  <button className={txView === 'list' ? 'active' : ''} onClick={() => setTxView('list')}>List</button>
                </div>
                <select className="select" style={{ width: 'auto', padding: '4px 28px 4px 10px', height: 28, fontSize: 11 }}
                        value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  <option value="all">All categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {txFiltered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>No transactions for this filter.</div>
            )}

            {txFiltered.length > 0 && txView === 'list' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 160px 1fr 110px 24px', gap: 12, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>Date</span><span>Category</span><span>Note</span><span style={{ textAlign: 'right' }}>Amount</span><span></span>
                </div>
                {txFiltered.map(t => <TxRow key={t.id} t={t} sym={sym} pending={pendingDelete?.id === t.id} onPend={() => setPendingDelete(t)} onCancelPend={() => setPendingDelete(null)} />)}
              </>
            )}

            {txFiltered.length > 0 && txView === 'daily' && txByDay.map(day => (
              <div key={day.date}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0 6px', borderBottom: '1px solid var(--border)',
                  marginTop: 4,
                }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-mid)', fontWeight: 600 }}>
                    {dayLabel(day.date)}
                  </span>
                  <div className="row" style={{ gap: 12 }}>
                    {day.inc > 0 && <span className="mono delta pos" style={{ fontSize: 11 }}>+{sym}{day.inc.toLocaleString()}</span>}
                    {day.exp > 0 && <span className="mono" style={{ fontSize: 11, color: 'var(--negative)' }}>−{sym}{day.exp.toLocaleString()}</span>}
                    {day.inc > 0 && day.exp > 0 && (
                      <span className={'mono ' + (day.net >= 0 ? 'delta pos' : '')} style={{ fontSize: 11, color: day.net < 0 ? 'var(--negative)' : undefined }}>
                        net {day.net >= 0 ? '+' : '−'}{sym}{Math.abs(day.net).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {day.txs.map(t => <TxRow key={t.id} t={t} sym={sym} hideDate pending={pendingDelete?.id === t.id} onPend={() => setPendingDelete(t)} onCancelPend={() => setPendingDelete(null)} />)}
              </div>
            ))}

            {pendingDelete && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0 0', borderTop: '1px solid var(--border)',
                marginTop: 8, gap: 12,
              }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Delete <span style={{ color: pendingDelete.type === 'income' ? 'var(--accent)' : 'var(--negative)', fontFamily: 'var(--font-mono)' }}>
                    {pendingDelete.type === 'income' ? '+' : '−'}{sym}{pendingDelete.amount.toLocaleString()}
                  </span>
                  {pendingDelete.note ? <span style={{ color: 'var(--text-mid)' }}> · {pendingDelete.note}</span> : null}?
                </span>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn ghost sm" onClick={() => setPendingDelete(null)}>Cancel</button>
                  <button
                    className="btn sm"
                    style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--negative)', borderColor: 'rgba(248,113,113,0.4)' }}
                    onClick={() => { deleteTransaction(pendingDelete.id); setPendingDelete(null) }}
                  >Delete</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {section === 'recurring' && (
        <RecurringSection
          year={view.y}
          month={view.m}
          categories={categories}
          recurring={recurring}
          onAdd={addRecurring}
          onUpdate={updateRecurring}
          onDelete={deleteRecurring}
        />
      )}

      {showCats && (
        <CategoriesModal
          categories={categories}
          budgets={budgets}
          onClose={() => setShowCats(false)}
          onAdd={addCategory}
          onDelete={deleteCategory}
          onRename={renameCategory}
          onSetBudget={setBudget}
        />
      )}
    </>
  )
}

// ── Transaction row ─────────────────────────────────────────

function TxRow({ t, sym, pending, hideDate, onPend, onCancelPend }) {
  const color = hashColor(t.category)
  return (
    <div
      className="list-row"
      style={{
        gridTemplateColumns: hideDate ? '160px 1fr 110px 24px' : '110px 160px 1fr 110px 24px',
        background: pending ? 'rgba(248,113,113,0.06)' : undefined,
        transition: 'background 120ms',
      }}
    >
      {!hideDate && <div className="mono dim">{t.date}</div>}
      <div>
        <span className="chip" style={{ color, background: `color-mix(in oklab, ${color} 12%, var(--faint))` }}>
          <span className="dot" style={{ background: color }}></span>{t.category}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{t.note}</div>
      <div className={'mono ' + (t.type === 'income' ? 'delta pos' : '')} style={{ textAlign: 'right', fontSize: 13 }}>
        {t.type === 'income' ? '+' : '−'}{sym}{t.amount.toLocaleString()}
      </div>
      <button
        className="btn ghost icon"
        style={pending ? { color: 'var(--negative)' } : {}}
        onClick={pending ? onCancelPend : onPend}
        title={pending ? 'Cancel' : 'Delete'}
      >
        <IconTrash size={12} />
      </button>
    </div>
  )
}

// ── Recurring section ───────────────────────────────────────

function RecurringSection({ year, month, categories, recurring, onAdd, onUpdate, onDelete }) {
  const { sym, fmt } = useMoney()
  const [form, setForm] = useState({
    type: 'expense', amount: '', category: categories[0] || '', note: '', dayOfMonth: 1,
  })
  const [editing, setEditing] = useState(null) // { id, type, amount, category, note, dayOfMonth }
  const [hoveredDay, setHoveredDay] = useState(null)

  const totalIncome = recurring.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = recurring.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const net = totalIncome - totalExpense

  const numDays = daysInMonth(year, month)
  const dayItems = (day) => recurring.filter(r => r.dayOfMonth === day || (r.dayOfMonth > numDays && day === numDays))

  const handleAdd = () => {
    if (!form.amount || !form.category) return
    onAdd(form)
    setForm({ type: 'expense', amount: '', category: categories[0] || '', note: '', dayOfMonth: 1 })
  }

  const openEdit = (r) => setEditing({ ...r, amount: String(r.amount), dayOfMonth: String(r.dayOfMonth) })

  const saveEdit = () => {
    if (!editing.amount || !editing.category) return
    onUpdate(editing.id, editing)
    setEditing(null)
  }

  const sorted = [...recurring].sort((a, b) => a.dayOfMonth - b.dayOfMonth)

  return (
    <div className="col gap-4">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <FinanceStat
          label="Monthly income"
          value={fmt(totalIncome, { round: false })}
          sub={`${recurring.filter(r => r.type === 'income').length} recurring items`}
          positive
        />
        <FinanceStat
          label="Monthly expenses"
          value={fmt(totalExpense, { round: false })}
          sub={`${recurring.filter(r => r.type === 'expense').length} recurring items`}
          negative
        />
        <FinanceStat
          label="Net recurring"
          value={fmt(net, { round: false })}
          sub="per month"
          positive={net >= 0}
          negative={net < 0}
        />
      </div>

      {/* Monthly timeline */}
      <div className="card">
        <div className="card-h">
          <h3>Monthly Timeline</h3>
          <span className="meta">{MONTHS_FULL[month]} {year} · {numDays} days</span>
        </div>

        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', position: 'relative' }}>
          {Array.from({ length: numDays }, (_, i) => {
            const day = i + 1
            const items = dayItems(day)
            const hasInc = items.some(r => r.type === 'income')
            const hasExp = items.some(r => r.type === 'expense')
            const isHovered = hoveredDay === day
            return (
              <div
                key={day}
                onMouseEnter={() => items.length > 0 && setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  width: 32, minHeight: 48,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '5px 0 6px',
                  borderRadius: 5,
                  background: items.length > 0 ? 'var(--faint)' : 'transparent',
                  border: `1px solid ${isHovered ? 'var(--border-strong)' : items.length > 0 ? 'var(--border)' : 'transparent'}`,
                  cursor: items.length > 0 ? 'default' : 'default',
                  position: 'relative',
                  transition: 'border-color 80ms',
                }}
              >
                <span style={{ fontSize: 9, color: items.length > 0 ? 'var(--text-mid)' : 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  {day}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {hasInc && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />}
                  {hasExp && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--negative)' }} />}
                </div>

                {isHovered && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                    marginBottom: 6, zIndex: 20,
                    background: 'var(--card)', border: '1px solid var(--border-strong)',
                    borderRadius: 6, padding: '8px 10px',
                    minWidth: 160, whiteSpace: 'nowrap',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    pointerEvents: 'none',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Day {day}
                    </div>
                    {items.map(r => (
                      <div key={r.id} className="row between" style={{ gap: 12, fontSize: 11, padding: '2px 0' }}>
                        <span style={{ color: 'var(--text-mid)' }}>{r.note || r.category}</span>
                        <span style={{ color: r.type === 'income' ? 'var(--accent)' : 'var(--negative)', fontFamily: 'var(--font-mono)' }}>
                          {r.type === 'income' ? '+' : '−'}{sym}{r.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: 'var(--muted)' }}>
          <span className="row" style={{ gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />Income
          </span>
          <span className="row" style={{ gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--negative)' }} />Expense
          </span>
          <span style={{ marginLeft: 'auto' }}>Hover a day to see details</span>
        </div>
      </div>

      {/* List + Add form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="card-h">
            <h3>Recurring Items</h3>
            <span className="meta">{recurring.length} items</span>
          </div>
          {recurring.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              No recurring items yet. Add your first one →
            </div>
          )}
          {sorted.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '48px 140px 1fr 90px 48px 48px', gap: 10, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0 6px', borderBottom: '1px solid var(--border)' }}>
              <span>Day</span><span>Category</span><span>Note</span><span style={{ textAlign: 'right' }}>Amount</span><span></span><span></span>
            </div>
          )}
          {sorted.map(r => {
            const color = hashColor(r.category)
            return (
              <div key={r.id} className="list-row" style={{ gridTemplateColumns: '48px 140px 1fr 90px 48px 48px' }}>
                <div className="mono" style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                  {r.dayOfMonth}
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>th</span>
                </div>
                <div>
                  <span className="chip" style={{ color, background: `color-mix(in oklab, ${color} 12%, var(--faint))` }}>
                    <span className="dot" style={{ background: color }}></span>{r.category}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>{r.note}</div>
                <div
                  className="mono"
                  style={{ textAlign: 'right', fontSize: 13, color: r.type === 'income' ? 'var(--accent)' : 'var(--negative)' }}
                >
                  {r.type === 'income' ? '+' : '−'}{sym}{r.amount.toLocaleString()}
                </div>
                <button className="btn ghost icon" title="Edit" onClick={() => openEdit(r)}>
                  <IconEdit size={12} />
                </button>
                <button className="btn ghost icon" title="Delete" onClick={() => onDelete(r.id)}>
                  <IconTrash size={12} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Add form */}
        <div className="card">
          <div className="card-h"><h3>Add Recurring</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)' }}>Amount ({sym})</label>
              <input className="input" placeholder="500" type="number" min="0" value={form.amount}
                     onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ marginTop: 4 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)' }}>Day of month</label>
              <input className="input" type="number" min="1" max="31" placeholder="1" value={form.dayOfMonth}
                     onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))} style={{ marginTop: 4 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: 'var(--muted)' }}>Type</label>
              <div className="tabs" style={{ marginTop: 4, width: '100%' }}>
                <button
                  className={form.type === 'expense' ? 'active' : ''}
                  style={{ flex: 1, ...(form.type === 'expense' && { background: 'rgba(248,113,113,0.18)', color: '#f87171', borderColor: '#f87171' }) }}
                  onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
                >Expense</button>
                <button
                  className={form.type === 'income' ? 'active' : ''}
                  style={{ flex: 1, ...(form.type === 'income' && { background: 'rgba(74,222,128,0.18)', color: 'var(--accent)', borderColor: 'var(--accent)' }) }}
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
              <label style={{ fontSize: 11, color: 'var(--muted)' }}>Note</label>
              <input className="input" placeholder="e.g. Rent, Salary…" value={form.note}
                     onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ marginTop: 4 }} />
            </div>
            <button className="btn primary" onClick={handleAdd} style={{ gridColumn: '1 / -1', justifyContent: 'center' }}>
              <IconPlus size={12} /> Add recurring item
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" style={{ width: 360 }} onClick={e => e.stopPropagation()}>
            <h4>Edit Recurring Item</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Amount ({sym})</label>
                <input className="input" type="number" min="0" value={editing.amount}
                       onChange={e => setEditing(p => ({ ...p, amount: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Day of month</label>
                <input className="input" type="number" min="1" max="31" value={editing.dayOfMonth}
                       onChange={e => setEditing(p => ({ ...p, dayOfMonth: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Type</label>
                <div className="tabs" style={{ marginTop: 4, width: '100%' }}>
                  <button
                    className={editing.type === 'expense' ? 'active' : ''}
                    style={{ flex: 1, ...(editing.type === 'expense' && { background: 'rgba(248,113,113,0.18)', color: '#f87171', borderColor: '#f87171' }) }}
                    onClick={() => setEditing(p => ({ ...p, type: 'expense' }))}
                  >Expense</button>
                  <button
                    className={editing.type === 'income' ? 'active' : ''}
                    style={{ flex: 1, ...(editing.type === 'income' && { background: 'rgba(74,222,128,0.18)', color: 'var(--accent)', borderColor: 'var(--accent)' }) }}
                    onClick={() => setEditing(p => ({ ...p, type: 'income' }))}
                  >Income</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Category</label>
                <select className="select" style={{ marginTop: 4 }}
                        value={editing.category} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>Note</label>
                <input className="input" value={editing.note}
                       onChange={e => setEditing(p => ({ ...p, note: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared components ───────────────────────────────────────

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

function AddTxButton() {
  return (
    <button className="btn primary" onClick={() => document.getElementById('add-tx-amount')?.focus()}>
      <IconPlus size={12} /> Add transaction
    </button>
  )
}

function AddTxForm({ categories, onAdd }) {
  const { sym } = useMoney()
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
          <label style={{ fontSize: 11, color: 'var(--muted)' }}>Amount ({sym})</label>
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

function CategoriesModal({ categories, budgets, onClose, onAdd, onDelete, onRename, onSetBudget }) {
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
          <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 110px 24px 24px', gap: 12, fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 4px 4px' }}>
            <span></span><span>Category</span><span>Monthly budget</span><span></span><span></span>
          </div>
          {categories.map(c => (
            <div key={c} className="list-row" style={{ gridTemplateColumns: '24px 1fr 110px 24px 24px', padding: '8px 4px' }}>
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
              <input
                className="input mono"
                type="number"
                min="0"
                step="10"
                placeholder="—"
                defaultValue={budgets[c] ?? ''}
                onBlur={e => {
                  const v = e.target.value
                  if (String(budgets[c] ?? '') !== v) onSetBudget(c, v)
                }}
                onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
                style={{ height: 26, padding: '2px 8px', fontSize: 12, textAlign: 'right' }}
              />
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
