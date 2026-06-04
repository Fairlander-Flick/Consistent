import { scheduleSync } from './cloudSync'
import { isReadOnly } from './demoMode'

export function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

export function saveData(key, value) {
  // Read-only (demo) account: never persist or sync — keep the data immutable.
  if (isReadOnly()) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
    scheduleSync()
  } catch (e) {
    console.error('[storage] saveData failed:', e)
  }
}
