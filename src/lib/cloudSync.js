import { supabase } from './supabase'

const KEY_MAP = {
  'consistent:weight':           'weight',
  'consistent:goals':            'goals',
  'consistent:goals-log':        'goals_log',
  'consistent:journal':          'journal',
  'consistent:finance':          'finance',
  'consistent:settings':         'settings',
  'consistent:schedule-done':    'schedule_done',
  'consistent:lifelong':         'lifelong',
}

// Set to true during pullAll so writes triggered by the pull don't re-push.
let _pulling = false

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

  _pulling = true
  for (const [lsKey, col] of Object.entries(KEY_MAP)) {
    if (data[col] != null) {
      localStorage.setItem(lsKey, JSON.stringify(data[col]))
    }
  }
  _pulling = false
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

// Debounced sync triggered on every saveData call. Fires 2s after the last write.
let _debounceTimer = null

export function scheduleSync() {
  if (_pulling) return
  if (_debounceTimer) clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) pushAll(data.session.user.id)
  }, 300)
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
