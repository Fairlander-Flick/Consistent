import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:finance'

const DEFAULT = {
  categories: ['Gym', 'Food', 'Rent & Bills', 'Transport', 'Other'],
  transactions: [],
  recurring: [],
  budgets: {},
}

function persist(get) {
  const { categories, transactions, recurring, budgets } = get()
  saveData(KEY, { categories, transactions, recurring, budgets })
}

export const useFinanceStore = create((set, get) => {
  const stored = loadData(KEY, DEFAULT)
  return {
    categories: stored.categories ?? DEFAULT.categories,
    transactions: stored.transactions ?? DEFAULT.transactions,
    recurring: stored.recurring ?? [],
    budgets: stored.budgets ?? {},

    addTransaction: ({ date, amount, type, category, note }) => {
      const t = { id: Date.now().toString(), date, amount: parseFloat(amount), type, category, note: note || '' }
      const transactions = [t, ...get().transactions].sort((a, b) => b.date.localeCompare(a.date))
      set({ transactions })
      persist(get)
    },

    deleteTransaction: (id) => {
      const transactions = get().transactions.filter(t => t.id !== id)
      set({ transactions })
      persist(get)
    },

    addCategory: (name) => {
      if (get().categories.includes(name)) return
      const categories = [...get().categories, name]
      set({ categories })
      persist(get)
    },

    deleteCategory: (name) => {
      const categories = get().categories.filter(c => c !== name)
      const budgets = { ...get().budgets }
      delete budgets[name]
      set({ categories, budgets })
      persist(get)
    },

    renameCategory: (oldName, newName) => {
      const categories = get().categories.map(c => c === oldName ? newName : c)
      const transactions = get().transactions.map(t =>
        t.category === oldName ? { ...t, category: newName } : t
      )
      const recurring = get().recurring.map(r =>
        r.category === oldName ? { ...r, category: newName } : r
      )
      const budgets = { ...get().budgets }
      if (oldName in budgets) {
        budgets[newName] = budgets[oldName]
        delete budgets[oldName]
      }
      set({ categories, transactions, recurring, budgets })
      persist(get)
    },

    // amount <= 0 or falsy removes the budget for that category.
    setBudget: (category, amount) => {
      const value = parseFloat(amount)
      const budgets = { ...get().budgets }
      if (!value || value <= 0) {
        delete budgets[category]
      } else {
        budgets[category] = value
      }
      set({ budgets })
      persist(get)
    },

    addRecurring: ({ type, amount, category, note, dayOfMonth }) => {
      const item = {
        id: Date.now().toString(),
        type,
        amount: parseFloat(amount),
        category,
        note: note || '',
        dayOfMonth: Math.min(31, Math.max(1, parseInt(dayOfMonth) || 1)),
      }
      const recurring = [...get().recurring, item]
      set({ recurring })
      persist(get)
    },

    updateRecurring: (id, patch) => {
      const recurring = get().recurring.map(r => r.id !== id ? r : {
        ...r, ...patch,
        amount: parseFloat(patch.amount ?? r.amount),
        dayOfMonth: Math.min(31, Math.max(1, parseInt(patch.dayOfMonth ?? r.dayOfMonth) || 1)),
      })
      set({ recurring })
      persist(get)
    },

    deleteRecurring: (id) => {
      const recurring = get().recurring.filter(r => r.id !== id)
      set({ recurring })
      persist(get)
    },

    getMonthSummary: (year, month) => {
      const txs = get().transactions.filter(t => t.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { income, expenses, balance: income - expenses, transactions: txs }
    },
  }
})
