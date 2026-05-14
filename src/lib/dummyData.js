// Realistic dummy data shown when stores are empty
export const DUMMY_WEIGHT = [
  { date: '2026-04-08', kg: 84.2 },
  { date: '2026-04-11', kg: 83.7 },
  { date: '2026-04-14', kg: 83.9 },
  { date: '2026-04-17', kg: 83.4 },
  { date: '2026-04-20', kg: 83.1 },
  { date: '2026-04-23', kg: 82.8 },
  { date: '2026-04-26', kg: 83.3 },
  { date: '2026-04-29', kg: 82.6 },
  { date: '2026-05-02', kg: 82.2 },
  { date: '2026-05-05', kg: 82.7 },
  { date: '2026-05-08', kg: 81.9 },
  { date: '2026-05-11', kg: 81.5 },
  { date: '2026-05-14', kg: 81.1 },
]

export const DUMMY_TRAINED = new Set([
  '2026-04-28', '2026-04-30',
  '2026-05-02', '2026-05-05', '2026-05-07',
  '2026-05-09', '2026-05-11', '2026-05-12',
])

export const DUMMY_GOALS = {
  daily: {
    title: 'Wednesday, May 14',
    todos: [
      { id: 'd1', text: 'Morning training — push day', done: true },
      { id: 'd2', text: '2.5 L water', done: true },
      { id: 'd3', text: 'Read — Meditations (30 min)', done: false },
      { id: 'd4', text: 'No processed food', done: false },
    ],
  },
  weekly: {
    title: 'Week 20',
    todos: [
      { id: 'w1', text: 'Train 5 days', done: false },
      { id: 'w2', text: 'Meal prep Sunday', done: true },
      { id: 'w3', text: 'Review expenses', done: false },
    ],
  },
  monthly: {
    title: 'May 2026',
    todos: [
      { id: 'm1', text: 'Drop below 80 kg', done: false },
      { id: 'm2', text: 'Read 3 books', done: false },
      { id: 'm3', text: 'No missed training weeks', done: false },
    ],
  },
  yearly: {
    title: '2026',
    todos: [
      { id: 'y1', text: 'First powerlifting competition', done: false },
      { id: 'y2', text: '6-month emergency fund', done: false },
    ],
  },
}

export const DUMMY_JOURNAL = [
  { id: 'j1', text: 'New PR on bench — 102.5 kg × 3', done: false },
  { id: 'j2', text: 'Prep lunches for tomorrow', done: false },
  { id: 'j3', text: 'Follow up on the apartment listing', done: true },
]

export const DUMMY_FINANCE = {
  income: 2847.50,
  expenses: 1623.18,
  balance: 1224.32,
}
