// Realistic dummy data shown when stores are empty
export const DUMMY_WEIGHT = [
  { date: '2026-04-08', kg: 84.2 },
  { date: '2026-04-09', kg: 84.0 },
  { date: '2026-04-10', kg: 84.1 },
  { date: '2026-04-11', kg: 83.7 },
  { date: '2026-04-12', kg: 83.9 },
  { date: '2026-04-13', kg: 83.8 },
  { date: '2026-04-14', kg: 83.9 },
  { date: '2026-04-15', kg: 83.6 },
  { date: '2026-04-16', kg: 83.5 },
  { date: '2026-04-17', kg: 83.4 },
  { date: '2026-04-18', kg: 83.6 },
  { date: '2026-04-19', kg: 83.3 },
  { date: '2026-04-20', kg: 83.1 },
  { date: '2026-04-21', kg: 83.2 },
  { date: '2026-04-22', kg: 83.0 },
  { date: '2026-04-23', kg: 82.8 },
  { date: '2026-04-24', kg: 83.0 },
  { date: '2026-04-25', kg: 82.7 },
  { date: '2026-04-26', kg: 83.3 },
  { date: '2026-04-27', kg: 82.9 },
  { date: '2026-04-28', kg: 82.6 },
  { date: '2026-04-29', kg: 82.4 },
  { date: '2026-04-30', kg: 82.5 },
  { date: '2026-05-01', kg: 82.2 },
  { date: '2026-05-02', kg: 82.4 },
  { date: '2026-05-03', kg: 82.1 },
  { date: '2026-05-04', kg: 82.0 },
  { date: '2026-05-05', kg: 82.7 },
  { date: '2026-05-06', kg: 82.4 },
  { date: '2026-05-07', kg: 82.1 },
  { date: '2026-05-08', kg: 81.9 },
  { date: '2026-05-09', kg: 82.0 },
  { date: '2026-05-10', kg: 81.7 },
  { date: '2026-05-11', kg: 81.5 },
  { date: '2026-05-12', kg: 81.6 },
  { date: '2026-05-13', kg: 81.3 },
  { date: '2026-05-14', kg: 81.1 },
  { date: '2026-05-15', kg: 81.2 },
  { date: '2026-05-16', kg: 80.9 },
]

export const DUMMY_TRAINED = new Set([
  // April – Mon Push A, Tue Pull A, Wed Legs, Thu Push B, Fri Pull B
  '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10', '2026-04-11',
  '2026-04-14', '2026-04-15', '2026-04-16', '2026-04-17', '2026-04-18',
  '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24', '2026-04-25',
  '2026-04-28', '2026-04-29', '2026-04-30',
  // May
  '2026-05-01', '2026-05-02',
  '2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08', '2026-05-09',
  '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-15',
])

export const DUMMY_GOALS = {
  daily:   { title: '', todos: [] },
  weekly:  { title: '', todos: [] },
  monthly: { title: '', todos: [] },
  yearly:  { title: '', todos: [] },
}

// ── Finance ────────────────────────────────────────────────────
let _fid = 1
function ft(date, type, amount, category, note) {
  return { id: `demo-${_fid++}`, date, type, amount, category, note }
}

export const DUMMY_FINANCE_TRANSACTIONS = [
  // ── March ──────────────────────────────────────────────────
  ft('2026-03-01', 'income',  2847.50, 'Other',        'Monthly salary'),
  ft('2026-03-02', 'expense',    3.80, 'Food',         'Coffee'),
  ft('2026-03-03', 'expense',  850.00, 'Rent & Bills', 'Rent'),
  ft('2026-03-04', 'expense',   11.50, 'Food',         'Lunch'),
  ft('2026-03-05', 'expense',   68.40, 'Food',         'Weekly groceries'),
  ft('2026-03-06', 'expense',    6.20, 'Food',         'Coffee & snack'),
  ft('2026-03-07', 'expense',   28.50, 'Transport',    'Monthly tram pass'),
  ft('2026-03-08', 'expense',   55.00, 'Gym',          'Gym membership'),
  ft('2026-03-09', 'expense',    9.80, 'Food',         'Lunch'),
  ft('2026-03-09', 'expense',    3.50, 'Food',         'Coffee'),
  ft('2026-03-10', 'expense',   42.20, 'Food',         'Supermarket run'),
  ft('2026-03-11', 'expense',   12.00, 'Food',         'Lunch'),
  ft('2026-03-12', 'expense',   18.00, 'Other',        'Coffee & snacks'),
  ft('2026-03-13', 'expense',    4.20, 'Food',         'Coffee'),
  ft('2026-03-14', 'expense',   28.40, 'Food',         'Groceries'),
  ft('2026-03-15', 'expense',   74.80, 'Food',         'Meal prep supplies'),
  ft('2026-03-16', 'expense',   10.50, 'Food',         'Lunch'),
  ft('2026-03-17', 'expense',   14.50, 'Transport',    'Taxi'),
  ft('2026-03-18', 'expense',    3.80, 'Food',         'Coffee'),
  ft('2026-03-19', 'expense',   52.30, 'Food',         'Groceries'),
  ft('2026-03-20', 'expense',   18.60, 'Food',         'Takeout'),
  ft('2026-03-21', 'expense',   11.20, 'Food',         'Lunch'),
  ft('2026-03-22', 'expense',   89.00, 'Other',        'Running shoes'),
  ft('2026-03-23', 'expense',    7.40, 'Food',         'Coffee & snack'),
  ft('2026-03-24', 'expense',   36.90, 'Food',         'Grocery run'),
  ft('2026-03-25', 'expense',   13.00, 'Food',         'Lunch'),
  ft('2026-03-26', 'expense',   45.00, 'Rent & Bills', 'Phone bill'),
  ft('2026-03-27', 'expense',    3.60, 'Food',         'Coffee'),
  ft('2026-03-28', 'expense',   22.40, 'Food',         'Snacks & drinks'),
  ft('2026-03-29', 'expense',   16.80, 'Food',         'Takeout'),
  ft('2026-03-30', 'expense',   31.00, 'Other',        'Supplements'),
  ft('2026-03-31', 'expense',    8.90, 'Food',         'Lunch'),

  // ── April ──────────────────────────────────────────────────
  ft('2026-04-01', 'income',  2847.50, 'Other',        'Monthly salary'),
  ft('2026-04-02', 'expense',    4.00, 'Food',         'Coffee'),
  ft('2026-04-03', 'expense',  850.00, 'Rent & Bills', 'Rent'),
  ft('2026-04-04', 'expense',   10.80, 'Food',         'Lunch'),
  ft('2026-04-05', 'expense',   55.00, 'Gym',          'Gym membership'),
  ft('2026-04-06', 'expense',   63.20, 'Food',         'Groceries'),
  ft('2026-04-07', 'expense',    3.60, 'Food',         'Coffee'),
  ft('2026-04-08', 'expense',   11.50, 'Food',         'Lunch'),
  ft('2026-04-09', 'expense',   24.00, 'Transport',    'Train tickets'),
  ft('2026-04-10', 'expense',    5.90, 'Food',         'Coffee & snack'),
  ft('2026-04-11', 'expense',   48.60, 'Food',         'Weekly groceries'),
  ft('2026-04-12', 'expense',    9.60, 'Food',         'Lunch'),
  ft('2026-04-13', 'expense',   35.00, 'Other',        'Tech accessories'),
  ft('2026-04-14', 'expense',    4.20, 'Food',         'Coffee'),
  ft('2026-04-15', 'expense',   16.50, 'Transport',    'Uber'),
  ft('2026-04-16', 'expense',   12.30, 'Food',         'Lunch'),
  ft('2026-04-17', 'expense',   57.40, 'Food',         'Meal prep'),
  ft('2026-04-18', 'expense',    3.80, 'Food',         'Coffee'),
  ft('2026-04-19', 'expense',  120.00, 'Other',        'Clothes'),
  ft('2026-04-20', 'expense',   10.40, 'Food',         'Lunch'),
  ft('2026-04-21', 'expense',   44.80, 'Food',         'Groceries'),
  ft('2026-04-22', 'expense',    6.80, 'Food',         'Coffee & pastry'),
  ft('2026-04-23', 'expense',   11.00, 'Food',         'Lunch'),
  ft('2026-04-24', 'expense',   45.00, 'Rent & Bills', 'Internet bill'),
  ft('2026-04-25', 'expense',   29.90, 'Food',         'Supermarket'),
  ft('2026-04-26', 'expense',    4.00, 'Food',         'Coffee'),
  ft('2026-04-27', 'expense',   12.80, 'Food',         'Lunch'),
  ft('2026-04-28', 'expense',   18.50, 'Transport',    'Bus passes'),
  ft('2026-04-29', 'expense',   41.20, 'Food',         'Groceries'),
  ft('2026-04-30', 'expense',    3.60, 'Food',         'Coffee'),

  // ── May ────────────────────────────────────────────────────
  ft('2026-05-01', 'income',  2847.50, 'Other',        'Monthly salary'),
  ft('2026-05-01', 'expense',   11.20, 'Food',         'Lunch'),
  ft('2026-05-02', 'expense',   13.40, 'Food',         'Lunch & coffee'),
  ft('2026-05-03', 'expense',  850.00, 'Rent & Bills', 'Rent'),
  ft('2026-05-03', 'expense',    3.90, 'Food',         'Coffee'),
  ft('2026-05-04', 'expense',    6.40, 'Food',         'Coffee & snack'),
  ft('2026-05-05', 'expense',   55.00, 'Gym',          'Gym membership'),
  ft('2026-05-05', 'expense',   28.50, 'Transport',    'Monthly tram pass'),
  ft('2026-05-06', 'expense',   71.30, 'Food',         'Weekly groceries'),
  ft('2026-05-07', 'expense',   13.00, 'Food',         'Lunch'),
  ft('2026-05-08', 'expense',   22.00, 'Transport',    'Train'),
  ft('2026-05-08', 'expense',    4.50, 'Food',         'Coffee'),
  ft('2026-05-09', 'expense',    4.20, 'Food',         'Coffee'),
  ft('2026-05-10', 'expense',   49.60, 'Food',         'Supermarket'),
  ft('2026-05-11', 'expense',   17.80, 'Food',         'Takeout'),
  ft('2026-05-12', 'expense',   18.00, 'Other',        'Books'),
  ft('2026-05-12', 'expense',    5.60, 'Food',         'Coffee & snack'),
  ft('2026-05-13', 'expense',   14.50, 'Transport',    'Taxi'),
  ft('2026-05-13', 'expense',   10.80, 'Food',         'Lunch'),
  ft('2026-05-14', 'expense',   38.40, 'Food',         'Groceries'),
  ft('2026-05-15', 'expense',    3.80, 'Food',         'Coffee'),
  ft('2026-05-15', 'expense',   31.00, 'Other',        'Supplements'),
  ft('2026-05-16', 'expense',   12.60, 'Food',         'Lunch'),
  ft('2026-05-16', 'expense',    4.10, 'Food',         'Coffee'),
]

// ── Training program ───────────────────────────────────────────
function ex(id, name, sets) {
  return { id, name, sets }
}
function s(reps, weight) { return { reps, weight } }

export const DUMMY_TRAINING_PROGRAM = {
  Mon: { name: 'Push A', exercises: [
    { id: 'pa-1', name: 'Bench Press', type: 'strength',
      periodization: { trainingMax: 116, multipliers: [0.8193, 0.861, 0.9027], currentWeek: 1 },
      sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }, { reps: 5 }, { reps: 5 }] },
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
    { id: 'lg-1', name: 'Back Squat', type: 'strength',
      periodization: { trainingMax: 173.9, multipliers: [0.8193, 0.861, 0.9027], currentWeek: 2 },
      sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }, { reps: 5 }] },
    ex('lg-2', 'Leg Press',          [s(10,160),s(10,160),s(10,160),s(8,160)]),
    ex('lg-3', 'Romanian Deadlift',  [s(8,90), s(8,90), s(8,90)]),
    ex('lg-4', 'Leg Curl',           [s(12,55),s(12,55),s(12,55)]),
    { id: 'lg-5', name: 'Zone 2 Bike', type: 'cardio', durationMinutes: 20 },
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
const PUSH_A_SESSIONS = [
  { date: '2026-04-07', bench: 97.5,  ohp: 57.5, duration: 70 },
  { date: '2026-04-14', bench: 97.5,  ohp: 57.5, duration: 72 },
  { date: '2026-04-21', bench: 100,   ohp: 60,   duration: 75 },
  { date: '2026-04-28', bench: 100,   ohp: 60,   duration: 78 },
  { date: '2026-05-05', bench: 102.5, ohp: 62.5, duration: 80 },
  { date: '2026-05-11', bench: 102.5, ohp: 62.5, duration: 75 },
  { date: '2026-05-12', bench: 105,   ohp: 65,   duration: 82 },
]

const PULL_A_SESSIONS = [
  { date: '2026-04-08', dead: 135,  row: 77.5, duration: 68 },
  { date: '2026-04-15', dead: 137.5,row: 77.5, duration: 70 },
  { date: '2026-04-22', dead: 140,  row: 80,   duration: 72 },
  { date: '2026-04-29', dead: 140,  row: 80,   duration: 74 },
  { date: '2026-05-06', dead: 142.5,row: 82.5, duration: 76 },
  { date: '2026-05-13', dead: 145,  row: 82.5, duration: 78 },
]

const LEGS_SESSIONS = [
  { date: '2026-04-09', squat: 115,   legPress: 155, duration: 65 },
  { date: '2026-04-16', squat: 117.5, legPress: 160, duration: 68 },
  { date: '2026-04-23', squat: 120,   legPress: 160, duration: 70 },
  { date: '2026-04-30', squat: 120,   legPress: 165, duration: 72 },
  { date: '2026-05-07', squat: 122.5, legPress: 165, duration: 75 },
]

const PUSH_B_SESSIONS = [
  { date: '2026-04-10', cgb: 87.5, dbp: 26, duration: 62 },
  { date: '2026-04-17', cgb: 87.5, dbp: 26, duration: 64 },
  { date: '2026-04-24', cgb: 90,   dbp: 28, duration: 66 },
  { date: '2026-05-01', cgb: 90,   dbp: 28, duration: 68 },
  { date: '2026-05-08', cgb: 92.5, dbp: 30, duration: 70 },
  { date: '2026-05-15', cgb: 92.5, dbp: 30, duration: 68 },
]

const PULL_B_SESSIONS = [
  { date: '2026-04-11', rack: 155,   dbRow: 38, duration: 60 },
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
  ...PULL_A_SESSIONS.map(({ date, dead, row, duration }) => ({
    date,
    durationMinutes: duration,
    exercises: [
      { id: 'pla-1', name: 'Deadlift',     sets: [s(5,dead),s(5,dead),s(5,dead)] },
      { id: 'pla-2', name: 'Barbell Row',  sets: [s(6,row),s(6,row),s(6,row),s(6,row)] },
      { id: 'pla-3', name: 'Lat Pulldown', sets: [s(10,65),s(10,65),s(10,62.5),s(8,62.5)] },
      { id: 'pla-4', name: 'Face Pull',    sets: [s(15,25),s(15,25),s(15,25)] },
      { id: 'pla-5', name: 'Bicep Curl',   sets: [s(12,16),s(12,16),s(10,16)] },
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
  ...PUSH_B_SESSIONS.map(({ date, cgb, dbp, duration }) => ({
    date,
    durationMinutes: duration,
    exercises: [
      { id: 'pb-1', name: 'Close-grip Bench',  sets: [s(6,cgb),s(6,cgb),s(6,cgb),s(6,cgb)] },
      { id: 'pb-2', name: 'DB Shoulder Press', sets: [s(10,dbp),s(10,dbp),s(10,dbp),s(8,dbp)] },
      { id: 'pb-3', name: 'Dips',              sets: [s(10,0),s(10,0),s(8,0)] },
      { id: 'pb-4', name: 'Cable Fly',         sets: [s(15,15),s(15,15),s(15,15)] },
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
