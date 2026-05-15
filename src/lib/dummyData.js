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
  '2026-04-07', '2026-04-09', '2026-04-11',
  '2026-04-14', '2026-04-16', '2026-04-18',
  '2026-04-21', '2026-04-23', '2026-04-25',
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

// ── Finance ────────────────────────────────────────────────────
let _fid = 1
function ft(date, type, amount, category, note) {
  return { id: `demo-${_fid++}`, date, type, amount, category, note }
}

export const DUMMY_FINANCE_TRANSACTIONS = [
  // March
  ft('2026-03-01', 'income',  2847.50, 'Other',         'Monthly salary'),
  ft('2026-03-03', 'expense',  850.00, 'Rent & Bills',  'Rent'),
  ft('2026-03-05', 'expense',   68.40, 'Food',          'Weekly groceries'),
  ft('2026-03-07', 'expense',   28.50, 'Transport',     'Monthly tram pass'),
  ft('2026-03-08', 'expense',   55.00, 'Gym',           'Gym membership'),
  ft('2026-03-10', 'expense',   42.20, 'Food',          'Supermarket run'),
  ft('2026-03-12', 'expense',   18.00, 'Other',         'Coffee & snacks'),
  ft('2026-03-15', 'expense',   74.80, 'Food',          'Meal prep supplies'),
  ft('2026-03-17', 'expense',   14.50, 'Transport',     'Taxi'),
  ft('2026-03-19', 'expense',   52.30, 'Food',          'Groceries'),
  ft('2026-03-22', 'expense',   89.00, 'Other',         'Running shoes'),
  ft('2026-03-24', 'expense',   36.90, 'Food',          'Grocery run'),
  ft('2026-03-26', 'expense',   45.00, 'Rent & Bills',  'Phone bill'),
  ft('2026-03-28', 'expense',   22.40, 'Food',          'Snacks & drinks'),
  ft('2026-03-30', 'expense',   31.00, 'Other',         'Supplements'),
  // April
  ft('2026-04-01', 'income',  2847.50, 'Other',         'Monthly salary'),
  ft('2026-04-03', 'expense',  850.00, 'Rent & Bills',  'Rent'),
  ft('2026-04-05', 'expense',   55.00, 'Gym',           'Gym membership'),
  ft('2026-04-06', 'expense',   63.20, 'Food',          'Groceries'),
  ft('2026-04-09', 'expense',   24.00, 'Transport',     'Train tickets'),
  ft('2026-04-11', 'expense',   48.60, 'Food',          'Weekly groceries'),
  ft('2026-04-13', 'expense',   35.00, 'Other',         'Tech accessories'),
  ft('2026-04-15', 'expense',   16.50, 'Transport',     'Uber'),
  ft('2026-04-17', 'expense',   57.40, 'Food',          'Meal prep'),
  ft('2026-04-19', 'expense',  120.00, 'Other',         'Clothes'),
  ft('2026-04-21', 'expense',   44.80, 'Food',          'Groceries'),
  ft('2026-04-24', 'expense',   45.00, 'Rent & Bills',  'Internet bill'),
  ft('2026-04-25', 'expense',   29.90, 'Food',          'Supermarket'),
  ft('2026-04-28', 'expense',   18.50, 'Transport',     'Bus passes'),
  ft('2026-04-29', 'expense',   41.20, 'Food',          'Groceries'),
  // May
  ft('2026-05-01', 'income',  2847.50, 'Other',         'Monthly salary'),
  ft('2026-05-03', 'expense',  850.00, 'Rent & Bills',  'Rent'),
  ft('2026-05-05', 'expense',   55.00, 'Gym',           'Gym membership'),
  ft('2026-05-06', 'expense',   71.30, 'Food',          'Weekly groceries'),
  ft('2026-05-08', 'expense',   22.00, 'Transport',     'Train'),
  ft('2026-05-10', 'expense',   49.60, 'Food',          'Supermarket'),
  ft('2026-05-12', 'expense',   18.00, 'Other',         'Books'),
  ft('2026-05-13', 'expense',   14.50, 'Transport',     'Taxi'),
  ft('2026-05-14', 'expense',   38.40, 'Food',          'Groceries'),
]

// ── Training program ───────────────────────────────────────────
function ex(id, name, sets) {
  return { id, name, sets }
}
function s(reps, weight) { return { reps, weight } }

export const DUMMY_TRAINING_PROGRAM = {
  Mon: { name: 'Push A', exercises: [
    ex('pa-1', 'Bench Press',      [s(5,100),s(5,100),s(5,100),s(5,100),s(5,100)]),
    ex('pa-2', 'Overhead Press',   [s(6,60), s(6,60), s(6,60), s(6,60)]),
    ex('pa-3', 'Incline DB Press', [s(10,32),s(10,32),s(10,30),s(8,30)]),
    ex('pa-4', 'Tricep Pushdown',  [s(12,35),s(12,35),s(12,35)]),
    ex('pa-5', 'Lateral Raise',    [s(15,12),s(15,12),s(15,12)]),
  ]},
  Tue: { name: 'Pull A', exercises: [
    ex('pla-1', 'Deadlift',       [s(5,140),s(5,140),s(5,140)]),
    ex('pla-2', 'Barbell Row',    [s(6,80), s(6,80), s(6,80), s(6,80)]),
    ex('pla-3', 'Lat Pulldown',   [s(10,65),s(10,65),s(10,62.5),s(8,62.5)]),
    ex('pla-4', 'Face Pull',      [s(15,25),s(15,25),s(15,25)]),
    ex('pla-5', 'Bicep Curl',     [s(12,16),s(12,16),s(10,16)]),
  ]},
  Wed: { name: 'Legs', exercises: [
    ex('lg-1', 'Back Squat',         [s(5,120),s(5,120),s(5,120),s(5,120)]),
    ex('lg-2', 'Leg Press',          [s(10,160),s(10,160),s(10,160),s(8,160)]),
    ex('lg-3', 'Romanian Deadlift',  [s(8,90), s(8,90), s(8,90)]),
    ex('lg-4', 'Leg Curl',           [s(12,55),s(12,55),s(12,55)]),
  ]},
  Thu: { name: 'Push B', exercises: [
    ex('pb-1', 'Close-grip Bench',   [s(6,90), s(6,90), s(6,90), s(6,90)]),
    ex('pb-2', 'DB Shoulder Press',  [s(10,28),s(10,28),s(10,28),s(8,28)]),
    ex('pb-3', 'Dips',               [s(10,0), s(10,0), s(8,0)]),
    ex('pb-4', 'Cable Fly',          [s(15,15),s(15,15),s(15,15)]),
  ]},
  Fri: { name: 'Pull B', exercises: [
    ex('plb-1', 'Rack Pull',     [s(5,160),s(5,160),s(5,160),s(5,160)]),
    ex('plb-2', 'DB Row',        [s(10,40),s(10,40),s(10,40),s(10,40)]),
    ex('plb-3', 'Cable Row',     [s(10,60),s(10,60),s(10,60)]),
    ex('plb-4', 'Hammer Curl',   [s(12,18),s(12,18),s(10,18)]),
  ]},
  Sat: { name: '', exercises: [] },
  Sun: { name: '', exercises: [] },
}

// ── Training log sessions ──────────────────────────────────────
// Push A dates (Mon): Apr 7, 14, 21, 28 · May 5, 11, 12
// Legs dates   (Wed): Apr 9, 16, 23, 30 · May 7
// Pull B dates (Fri): Apr 11, 18, 25    · May 2, 9

const PUSH_A_SESSIONS = [
  { date: '2026-04-07', bench: 97.5, ohp: 57.5, duration: 70 },
  { date: '2026-04-14', bench: 97.5, ohp: 57.5, duration: 72 },
  { date: '2026-04-21', bench: 100,  ohp: 60,   duration: 75 },
  { date: '2026-04-28', bench: 100,  ohp: 60,   duration: 78 },
  { date: '2026-05-05', bench: 102.5,ohp: 62.5, duration: 80 },
  { date: '2026-05-11', bench: 102.5,ohp: 62.5, duration: 75 },
  { date: '2026-05-12', bench: 105,  ohp: 65,   duration: 82 },
]

const LEGS_SESSIONS = [
  { date: '2026-04-09', squat: 115, legPress: 155, duration: 65 },
  { date: '2026-04-16', squat: 117.5, legPress: 160, duration: 68 },
  { date: '2026-04-23', squat: 120,   legPress: 160, duration: 70 },
  { date: '2026-04-30', squat: 120,   legPress: 165, duration: 72 },
  { date: '2026-05-07', squat: 122.5, legPress: 165, duration: 75 },
]

const PULL_B_SESSIONS = [
  { date: '2026-04-11', rack: 155, dbRow: 38, duration: 60 },
  { date: '2026-04-18', rack: 157.5, dbRow: 38, duration: 62 },
  { date: '2026-04-25', rack: 160,   dbRow: 40, duration: 63 },
  { date: '2026-05-02', rack: 162.5, dbRow: 40, duration: 65 },
  { date: '2026-05-09', rack: 165,   dbRow: 42, duration: 67 },
]

export const DUMMY_TRAINING_LOG = [
  ...PUSH_A_SESSIONS.map(({ date, bench, ohp, duration }) => ({
    date,
    durationMinutes: duration,
    exercises: [
      { id: 'pa-1', name: 'Bench Press',      sets: [s(5,bench),s(5,bench),s(5,bench),s(5,bench),s(5,bench)] },
      { id: 'pa-2', name: 'Overhead Press',   sets: [s(6,ohp),s(6,ohp),s(6,ohp),s(6,ohp)] },
      { id: 'pa-3', name: 'Incline DB Press', sets: [s(10,32),s(10,32),s(10,30),s(8,30)] },
      { id: 'pa-4', name: 'Tricep Pushdown',  sets: [s(12,35),s(12,35),s(12,35)] },
      { id: 'pa-5', name: 'Lateral Raise',    sets: [s(15,12),s(15,12),s(15,12)] },
    ],
  })),
  ...LEGS_SESSIONS.map(({ date, squat, legPress, duration }) => ({
    date,
    durationMinutes: duration,
    exercises: [
      { id: 'lg-1', name: 'Back Squat',        sets: [s(5,squat),s(5,squat),s(5,squat),s(5,squat)] },
      { id: 'lg-2', name: 'Leg Press',         sets: [s(10,legPress),s(10,legPress),s(10,legPress),s(8,legPress)] },
      { id: 'lg-3', name: 'Romanian Deadlift', sets: [s(8,90),s(8,90),s(8,90)] },
      { id: 'lg-4', name: 'Leg Curl',          sets: [s(12,55),s(12,55),s(12,55)] },
    ],
  })),
  ...PULL_B_SESSIONS.map(({ date, rack, dbRow, duration }) => ({
    date,
    durationMinutes: duration,
    exercises: [
      { id: 'plb-1', name: 'Rack Pull',   sets: [s(5,rack),s(5,rack),s(5,rack),s(5,rack)] },
      { id: 'plb-2', name: 'DB Row',      sets: [s(10,dbRow),s(10,dbRow),s(10,dbRow),s(10,dbRow)] },
      { id: 'plb-3', name: 'Cable Row',   sets: [s(10,60),s(10,60),s(10,60)] },
      { id: 'plb-4', name: 'Hammer Curl', sets: [s(12,18),s(12,18),s(10,18)] },
    ],
  })),
].sort((a, b) => b.date.localeCompare(a.date))

// ── Schedule ───────────────────────────────────────────────────
let _sid = 1
function block(kind, label, start, end) {
  return { id: `sc-${_sid++}`, kind, label, start, end }
}

export const DUMMY_SCHEDULE = {
  recurring: {
    Mon: [block('work', 'Work', '09:00', '17:00'), block('other', 'Gym – Push A', '07:00', '08:30')],
    Tue: [block('work', 'Work', '09:00', '17:00'), block('class', 'German B2', '18:00', '19:30')],
    Wed: [block('work', 'Work', '09:00', '17:00'), block('other', 'Gym – Legs', '07:00', '08:30')],
    Thu: [block('work', 'Work', '09:00', '17:00'), block('class', 'German B2', '18:00', '19:30')],
    Fri: [block('work', 'Work', '09:00', '17:00'), block('other', 'Gym – Pull B', '07:00', '08:30')],
    Sat: [block('other', 'Grocery Shopping', '10:00', '11:30')],
    Sun: [],
  },
  oneoffs: [],
}
