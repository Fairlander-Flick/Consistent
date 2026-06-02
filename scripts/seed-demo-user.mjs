// seed-demo-user.mjs — create (or refresh) a Supabase demo account with rich,
// realistic data so the app can be shown to someone without touching real data.
//
// Usage (from the `consistent/` folder):
//   node scripts/seed-demo-user.mjs
//   node scripts/seed-demo-user.mjs demo@consistent.app SuperSecret123
//
// Requirements:
//   - VITE_SUPABASE_URL must be readable from .env.local (it already is).
//   - The Supabase SERVICE ROLE key (admin) is required to create the auth user.
//     Provide it one of these ways (in priority order):
//       1. env var:           $env:SUPABASE_SERVICE_ROLE_KEY="..."  (PowerShell)
//       2. line in .env.local: SUPABASE_SERVICE_ROLE_KEY=...
//     Grab it from: Supabase Dashboard → Project Settings → API → service_role.
//     NEVER commit the service role key or ship it to the browser.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── env loading ──────────────────────────────────────────────
function loadEnvLocal() {
  const out = {}
  try {
    const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* no .env.local — fall back to process.env only */ }
  return out
}

const envFile = loadEnvLocal()
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envFile.VITE_SUPABASE_URL
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY

const EMAIL = process.argv[2] || 'demo@consistent.app'
const PASSWORD = process.argv[3] || 'ConsistentDemo123!'

if (!SUPABASE_URL) {
  console.error('✗ VITE_SUPABASE_URL not found (.env.local or env).')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error(
    '✗ Service role key missing. Set SUPABASE_SERVICE_ROLE_KEY as an env var,\n' +
    '  or add a SUPABASE_SERVICE_ROLE_KEY=... line to .env.local.\n' +
    '  Find it in Supabase Dashboard → Project Settings → API → service_role.'
  )
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── date helpers (mirror src/lib/dateUtils.js) ───────────────
const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const today = new Date()
const todayISO = iso(today)
function daysAgo(n) {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return iso(d)
}
// Monday-start week, matches getWeekStart()
function weekStartISO() {
  const d = new Date(today)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return iso(d)
}
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ── lifelong tree node factory (full shape, matches newNode) ──
let _seq = 0
function node({
  id, title, kind = null, unit = null, total = null, current = 0,
  logs = [], checklist = [], done = false, perWeek = null, days = [],
  deadline = null, collapsed = false, children = [],
}) {
  return {
    id: id || `demo-${(_seq++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title, kind, children,
    unit, total, current, logs,
    checklist, done, perWeek, days, deadline, collapsed,
  }
}

// progressive logs trending toward `current`
function rampLogs(spanDays, from, to, steps) {
  const out = []
  for (let i = 0; i < steps; i++) {
    const frac = i / (steps - 1)
    const value = Math.round(from + (to - from) * frac)
    out.push({ date: daysAgo(Math.round(spanDays * (1 - frac))), value })
  }
  return out
}

// ── lifelong: nested life-areas tree ─────────────────────────
const lifelong = [
  node({
    title: 'Health & Fitness', collapsed: false, children: [
      node({
        id: 'll-run', title: 'Run a half marathon', kind: 'habit',
        perWeek: 4, days: ['Mon', 'Wed', 'Fri', 'Sat'], deadline: daysAgo(-90),
      }),
      node({
        title: 'Strength', children: [
          node({
            id: 'll-bench', title: 'Bench press 100kg', kind: 'custom', unit: 'kg',
            total: 100, current: 82, days: ['Tue', 'Fri'],
            logs: rampLogs(70, 70, 82, 7),
          }),
          node({
            id: 'll-pullup', title: 'Pull-ups ×15 unbroken', kind: 'custom', unit: 'reps',
            total: 15, current: 9, logs: rampLogs(60, 4, 9, 6),
          }),
        ],
      }),
      node({
        id: 'll-meditate', title: 'Meditate daily', kind: 'habit',
        perWeek: 7, days: [...WEEKDAYS],
      }),
    ],
  }),
  node({
    title: 'Learning', children: [
      node({
        title: 'Read 12 books in 2026', children: [
          node({
            title: 'Atomic Habits', kind: 'book', unit: 'pages',
            total: 320, current: 320, logs: rampLogs(50, 40, 320, 8),
          }),
          node({
            id: 'll-deepwork', title: 'Deep Work', kind: 'book', unit: 'pages',
            total: 296, current: 148, days: ['Sun'], logs: rampLogs(25, 20, 148, 6),
          }),
          node({
            title: 'Thinking, Fast and Slow', kind: 'book', unit: 'pages',
            total: 499, current: 64, logs: rampLogs(14, 0, 64, 4),
          }),
        ],
      }),
      node({
        id: 'll-spanish', title: 'Learn Spanish', kind: 'habit',
        perWeek: 5, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      }),
      node({
        title: 'Finish Advanced React course', kind: 'playlist',
        total: 42, current: 28, logs: rampLogs(40, 6, 28, 6),
      }),
    ],
  }),
  node({
    title: 'Career', children: [
      node({ title: 'Redesign portfolio site', kind: 'task', done: false, deadline: daysAgo(-21) }),
      node({
        title: 'Launch side project', kind: 'checklist', checklist: [
          { id: 'c1', text: 'Validate the idea with 5 people', done: true },
          { id: 'c2', text: 'Build MVP', done: true },
          { id: 'c3', text: 'Set up landing page', done: false },
          { id: 'c4', text: 'Ship to Product Hunt', done: false },
        ],
      }),
      node({
        id: 'll-ship', title: 'Ship something every week', kind: 'habit',
        perWeek: 1, days: ['Fri'],
      }),
    ],
  }),
  node({
    title: 'Personal', collapsed: false, children: [
      node({ title: 'Plan Japan trip (spring)', kind: 'task', done: true }),
      node({
        title: 'Declutter the apartment', kind: 'checklist', checklist: [
          { id: 'd1', text: 'Wardrobe', done: true },
          { id: 'd2', text: 'Desk + cables', done: true },
          { id: 'd3', text: 'Garage', done: false },
        ],
      }),
      node({
        id: 'll-journal', title: 'Journal every evening', kind: 'habit',
        perWeek: 7, days: [...WEEKDAYS],
      }),
    ],
  }),
]

// ── schedule_done: mark some scheduled lifelong steps done on recent days ──
const scheduleDone = {}
function markDone(dayOffset, ids) {
  const date = daysAgo(dayOffset)
  scheduleDone[date] = {}
  for (const id of ids) scheduleDone[date][`lifelong|${id}`] = true
}
markDone(0, ['ll-meditate', 'll-journal'])
markDone(1, ['ll-run', 'll-meditate', 'll-spanish', 'll-journal'])
markDone(2, ['ll-meditate', 'll-spanish', 'll-journal'])
markDone(3, ['ll-run', 'll-meditate', 'll-journal'])

// ── weight: ~60 days trending 84.0 → ~79.2 with noise ────────
const weight = []
{
  const start = 84.0, end = 79.2, span = 60
  let prev = start
  for (let d = span; d >= 0; d -= (Math.random() < 0.35 ? 2 : 1)) {
    const frac = 1 - d / span
    const base = start + (end - start) * frac
    const noise = (Math.random() - 0.5) * 0.6
    prev = Math.round((base + noise) * 10) / 10
    weight.push({ date: daysAgo(d), kg: prev })
  }
}

// ── settings ─────────────────────────────────────────────────
const settings = {
  theme: 'dark',
  confirmGoalDelete: true,
  weightGoal: 'lose',
  weightTarget: 78,
  reminderEnabled: true,
  reminderTime: '20:00',
}

// ── goals: current periods (dates MUST match or they get wiped) ──
const goals = {
  dailyDate: todayISO,
  weeklyDate: weekStartISO(),
  monthlyDate: todayISO.slice(0, 7),
  yearlyDate: todayISO.slice(0, 4),
  daily: {
    title: "Today's focus",
    todos: [
      { id: 'g1', text: 'Ship the demo build', done: true },
      { id: 'g2', text: 'Morning run — 6km', done: true },
      { id: 'g3', text: 'Read 20 pages of Deep Work', done: false },
      { id: 'g4', text: 'Inbox to zero', done: false },
    ],
  },
  weekly: {
    title: 'This week',
    todos: [
      { id: 'w1', text: 'Bench session ×2', done: true },
      { id: 'w2', text: 'Finish React module 6', done: false },
      { id: 'w3', text: 'Call the family on Sunday', done: false },
    ],
  },
  monthly: {
    title: 'June focus',
    todos: [
      { id: 'm1', text: 'Hit 79kg', done: false },
      { id: 'm2', text: 'Launch side-project landing page', done: false },
    ],
  },
  yearly: {
    title: '2026',
    todos: [
      { id: 'y1', text: 'Run a half marathon', done: false },
      { id: 'y2', text: 'Read 12 books', done: false },
      { id: 'y3', text: 'Reach conversational Spanish', done: false },
    ],
  },
}

// ── goals_log: a couple of archived past periods ─────────────
const goalsLog = {
  daily: {
    [daysAgo(1)]: {
      title: 'Yesterday',
      todos: [
        { id: 'p1', text: 'Leg day', done: true },
        { id: 'p2', text: 'Write weekly review', done: true },
      ],
    },
  },
  weekly: {},
  monthly: {},
  yearly: {},
}

// ── journal: ~30 days of submitted entries ───────────────────
const MOOD_SCORES = [2, 4, 6, 8, 10]
const NUT = ['good', 'good', 'mid', 'good', 'bad', 'mid']
const FEELINGS = [
  'Solid day. Training felt strong and work flowed.',
  'A bit tired but pushed through the run.',
  'Great focus this morning, faded in the afternoon.',
  'Slept badly, low energy, still showed up.',
  'Calm and steady. Good balance today.',
  'Stressful deadline but handled it well.',
  'Rest day — recovered and read a lot.',
  'Felt unmotivated early, momentum came after the workout.',
  '', '',
]
const journal = []
for (let d = 29; d >= 0; d--) {
  if (Math.random() < 0.18 && d !== 0) continue // miss a few days
  const score = MOOD_SCORES[Math.min(4, Math.floor(2 + Math.random() * 3))]
  journal.push({
    date: daysAgo(d),
    feelings: FEELINGS[Math.floor(Math.random() * FEELINGS.length)],
    score,
    sleepHours: Math.round((6 + Math.random() * 2.5) * 2) / 2,
    nutrition: NUT[Math.floor(Math.random() * NUT.length)],
    submitted: true,
  })
}

// ── assemble the row ─────────────────────────────────────────
const dataRow = {
  weight,
  goals,
  goals_log: goalsLog,
  journal,
  settings,
  schedule_done: scheduleDone,
  lifelong,
}

// ── find-or-create the auth user ─────────────────────────────
async function findUserByEmail(email) {
  // page through admin users (small projects: one page is plenty)
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit
    if (data.users.length < 1000) break
  }
  return null
}

async function main() {
  console.log(`→ Supabase: ${SUPABASE_URL}`)
  let user = await findUserByEmail(EMAIL)

  if (user) {
    console.log(`• User already exists (${EMAIL}) — refreshing password + data.`)
    await admin.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
    })
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { demo: true, display_name: 'Demo User' },
    })
    if (error) { console.error('✗ createUser failed:', error.message); process.exit(1) }
    user = data.user
    console.log(`• Created user ${EMAIL}`)
  }

  const { error: upErr } = await admin
    .from('user_data')
    .upsert({ user_id: user.id, ...dataRow }, { onConflict: 'user_id' })
  if (upErr) { console.error('✗ upsert user_data failed:', upErr.message); process.exit(1) }

  console.log('\n✓ Demo account ready')
  console.log('  ──────────────────────────────')
  console.log(`  Email:    ${EMAIL}`)
  console.log(`  Password: ${PASSWORD}`)
  console.log('  ──────────────────────────────')
  console.log(`  weight:       ${weight.length} entries`)
  console.log(`  journal:      ${journal.length} entries`)
  console.log(`  lifelong:     ${lifelong.length} root areas (nested tree)`)
  console.log(`  goals:        daily/weekly/monthly/yearly populated`)
  console.log('\n  Log in at the app login screen with the email/password above.')
}

main().catch((e) => { console.error('✗ Unexpected error:', e); process.exit(1) })
