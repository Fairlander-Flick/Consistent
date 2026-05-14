import { create } from 'zustand'
import { loadData, saveData } from '../lib/storage'

const KEY = 'consistent:finance'

const DEFAULT = {
  categories: ['Gym', 'Food', 'Rent & Bills', 'Transport', 'Other'],
  transactions: [],
}

export const useFinanceStore = create((set, get) => ({
  ...loadData(KEY, DEFAULT),

  addTransaction: ({ date, amount, type, category, note }) => {
    const t = { id: Date.now().toString(), date, amount: parseFloat(amount), type, category, note: note || '' }
    const transactions = [t, ...get().transactions].sort((a, b) => b.date.localeCompare(a.date))
    const next = { categories: get().categories, transactions }
    saveData(KEY, next)
    set({ transactions })
  },

  deleteTransaction: (id) => {
    const transactions = get().transactions.filter(t => t.id !== id)
    saveData(KEY, { categories: get().categories, transactions })
    set({ transactions })
  },

  addCategory: (name) => {
    if (get().categories.includes(name)) return
    const categories = [...get().categories, name]
    saveData(KEY, { categories, transactions: get().transactions })
    set({ categories })
  },

  deleteCategory: (name) => {
    const categories = get().categories.filter(c => c !== name)
    saveData(KEY, { categories, transactions: get().transactions })
    set({ categories })
  },

  renameCategory: (oldName, newName) => {
    const categories = get().categories.map(c => c === oldName ? newName : c)
    const transactions = get().transactions.map(t =>
      t.category === oldName ? { ...t, category: newName } : t
    )
    saveData(KEY, { categories, transactions })
    set({ categories, transactions })
  },

  getMonthSummary: (year, month) => {
    const txs = get().transactions.filter(t => t.date.startsWith(`${year}-${String(month).padStart(2, '0')}`))
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expenses, balance: income - expenses, transactions: txs }
  },
}))
