import { describe, it, expect } from 'vitest'
import { recurringMonthTotals } from './financeUtils'

const RECURRING = [
  { id: '1', type: 'income',  amount: 2000, category: 'Salary', dayOfMonth: 1 },
  { id: '2', type: 'expense', amount: 800,  category: 'Rent & Bills', dayOfMonth: 1 },
  { id: '3', type: 'expense', amount: 50,   category: 'Gym', dayOfMonth: 15 },
]

describe('recurringMonthTotals', () => {
  it('returns zero totals for empty recurring', () => {
    const r = recurringMonthTotals([])
    expect(r.income).toBe(0)
    expect(r.expense).toBe(0)
  })

  it('sums income and expense separately', () => {
    const r = recurringMonthTotals(RECURRING)
    expect(r.income).toBe(2000)
    expect(r.expense).toBe(850)
  })

  it('returns items array for category breakdown', () => {
    const r = recurringMonthTotals(RECURRING)
    expect(r.items).toHaveLength(3)
    expect(r.items[0]).toMatchObject({ type: 'income', amount: 2000, category: 'Salary' })
  })
})
