import { supabase } from './supabase'

const KEY_MAP = {
  'consistent:weight':           'weight',
  'consistent:goals':            'goals',
  'consistent:goals-log':        'goals_log',
  'consistent:training-program': 'training_program',
  'consistent:training-log':     'training_log',
  'consistent:journal':          'journal',
  'consistent:finance':          'finance',
  'consistent:settings':         'settings',
  'consistent:schedule':         'schedule',
  'consistent:schedule-done':    'schedule_done',
}

// Returns true if a cloud row existed (data was written to localStorage).
export async function pullAll(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[cloudSync] pullAll error:', error.message)
    return false
  }
  if (!data) return false

  for (const [lsKey, col] of Object.entries(KEY_MAP)) {
    if (data[col] != null) {
      localStorage.setItem(lsKey, JSON.stringify(data[col]))
    }
  }
  return true
}

// Reads all known localStorage keys and upserts them to Supabase.
export async function pushAll(userId) {
  const row = { user_id: userId }

  for (const [lsKey, col] of Object.entries(KEY_MAP)) {
    const raw = localStorage.getItem(lsKey)
    if (raw !== null) {
      try { row[col] = JSON.parse(raw) } catch { /* skip malformed */ }
    }
  }

  const { error } = await supabase
    .from('user_data')
    .upsert(row, { onConflict: 'user_id' })

  if (error) console.error('[cloudSync] pushAll error:', error.message)
  return !error
}

let _interval = null
let _userId   = null

function onHide() {
  if (document.hidden && _userId) pushAll(_userId)
}

export function setupAutoSync(userId) {
  teardownAutoSync()
  _userId   = userId
  _interval = setInterval(() => pushAll(userId), 5 * 60 * 1000)
  document.addEventListener('visibilitychange', onHide)
}

export function teardownAutoSync() {
  if (_interval) clearInterval(_interval)
  _interval = null
  _userId   = null
  document.removeEventListener('visibilitychange', onHide)
}
